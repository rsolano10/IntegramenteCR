// Privileged account-management actions for the clinic/admin role:
// inviting an account (family, participant, or clinic staff), resending a
// pending confirmation, correcting a wrong email before first login,
// changing a role, and deleting an account. These all need the Auth Admin
// API (service role), which must never reach the browser bundle — this
// function is the one place that key is used.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

type Relation = "familiar_admin" | "participante";
type AppRole = "familiar" | "paciente" | "profesional";
const roleForRelation: Record<Relation, "familiar" | "paciente"> = {
  familiar_admin: "familiar",
  participante: "paciente",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);

  // Scoped to the caller's own JWT — used only to verify who's calling and
  // that they're profesional, via RLS's "self read" policy on profiles.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);

  const { data: callerProfile } = await userClient.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "profesional") return json({ error: "Solo el equipo clínico puede hacer esto." }, 403);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }

  try {
    if (payload.action === "invite") return await handleInvite(admin, user.id, payload);
    if (payload.action === "resend") return await handleResend(admin, payload);
    if (payload.action === "update_email") return await handleUpdateEmail(admin, payload);
    if (payload.action === "update_role") return await handleUpdateRole(admin, user.id, payload);
    if (payload.action === "delete_user") return await handleDeleteUser(admin, user.id, payload);
    return json({ error: "Acción desconocida." }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Error inesperado." }, 500);
  }
});

async function handleInvite(admin: ReturnType<typeof createClient>, profesionalId: string, payload: Record<string, unknown>) {
  const email = String(payload.email ?? "").trim().toLowerCase();
  const nombre = String(payload.nombre ?? "").trim();
  if (!email || !nombre) return json({ error: "Faltan datos: correo y nombre son obligatorios." }, 400);

  // Clinic staff accounts aren't linked to any patient at all.
  if (payload.accountType === "profesional") {
    const especialidad = String(payload.especialidad ?? "").trim() || null;
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role: "profesional", nombre, especialidad },
      redirectTo: `${SITE_URL}/completar-cuenta`,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ profileId: invited.user.id, patientId: null });
  }

  const relation = payload.relation as Relation;
  if (!roleForRelation[relation]) return json({ error: "Tipo de cuenta inválido." }, 400);

  // The patient is now fully optional: "sin paciente todavía" links later
  // from Pacientes. Validate the "new patient" case up front, but don't
  // create anything yet — invite first, since that's the step most likely
  // to fail (rate limits), and a failed invite shouldn't leave an orphaned
  // patient row.
  const patientMode: "existing" | "new" | "none" = payload.patientId ? "existing" : payload.patientNombre ? "new" : "none";
  const newPatientNombre = patientMode === "new" ? String(payload.patientNombre ?? "").trim() : null;
  if (patientMode === "new" && !newPatientNombre) return json({ error: "Falta el nombre del paciente." }, 400);

  const role = roleForRelation[relation];
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, nombre },
    redirectTo: `${SITE_URL}/completar-cuenta`,
  });
  if (inviteError) return json({ error: inviteError.message }, 400);

  if (patientMode === "none") return json({ profileId: invited.user.id, patientId: null });

  let patientId = payload.patientId ? String(payload.patientId) : null;
  if (!patientId) {
    const { data: patient, error: patientError } = await admin
      .from("patients")
      .insert({
        nombre: newPatientNombre,
        edad: payload.patientEdad ? String(payload.patientEdad) : null,
        modalidad: payload.modalidad ?? "orientado",
      })
      .select()
      .single();
    if (patientError) {
      return json({ error: `Invitación enviada, pero no pudimos crear el paciente: ${patientError.message}` }, 400);
    }
    patientId = patient.id;
  }

  const links = [{ patient_id: patientId, profile_id: invited.user.id, relation }];
  const { data: existingProfesionalLink } = await admin
    .from("patient_links")
    .select("patient_id")
    .eq("patient_id", patientId)
    .eq("profile_id", profesionalId)
    .eq("relation", "profesional_asignado")
    .maybeSingle();
  if (!existingProfesionalLink) links.push({ patient_id: patientId, profile_id: profesionalId, relation: "profesional_asignado" as const });

  const { error: linkError } = await admin.from("patient_links").insert(links);
  if (linkError) return json({ error: linkError.message }, 400);

  return json({ profileId: invited.user.id, patientId });
}

async function handleResend(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta el usuario." }, 400);

  const { data: found, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !found.user) return json({ error: "No encontramos esa cuenta." }, 404);
  const target = found.user;
  if (target.email_confirmed_at) return json({ error: "Esa cuenta ya confirmó su correo." }, 400);
  if (!target.email) return json({ error: "Esa cuenta no tiene correo." }, 400);

  if (target.invited_at) {
    const { error } = await admin.auth.admin.inviteUserByEmail(target.email, {
      data: target.user_metadata,
      redirectTo: `${SITE_URL}/completar-cuenta`,
    });
    if (error) return json({ error: error.message }, 400);
  } else {
    const { error } = await admin.auth.resend({
      type: "signup",
      email: target.email,
      options: { emailRedirectTo: `${SITE_URL}/app/login` },
    });
    if (error) return json({ error: error.message }, 400);
  }
  return json({ ok: true });
}

async function handleUpdateEmail(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  const newEmail = String(payload.newEmail ?? "").trim().toLowerCase();
  if (!userId || !newEmail) return json({ error: "Faltan datos." }, 400);

  const { data: found, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !found.user) return json({ error: "No encontramos esa cuenta." }, 404);
  const target = found.user;
  if (target.email_confirmed_at) return json({ error: "Esa cuenta ya confirmó su correo — no se puede corregir así." }, 400);

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { email: newEmail, email_confirm: false });
  if (updateError) return json({ error: updateError.message }, 400);

  // The email itself is already corrected at this point — that's the part
  // that actually matters. If sending the follow-up invite/confirmation
  // hits a transient problem (e.g. the default email rate limit), don't
  // report the whole action as failed; the clinic can just hit "Reenviar"
  // again once the limit clears.
  let warning: string | undefined;
  if (target.invited_at) {
    const { error } = await admin.auth.admin.inviteUserByEmail(newEmail, {
      data: target.user_metadata,
      redirectTo: `${SITE_URL}/completar-cuenta`,
    });
    if (error) warning = `Correo corregido, pero no pudimos reenviar la invitación ahora: ${error.message}`;
  } else {
    const { error } = await admin.auth.resend({
      type: "signup",
      email: newEmail,
      options: { emailRedirectTo: `${SITE_URL}/app/login` },
    });
    if (error) warning = `Correo corregido, pero no pudimos reenviar la confirmación ahora: ${error.message}`;
  }
  return json({ ok: true, warning });
}

async function handleUpdateRole(admin: ReturnType<typeof createClient>, callerId: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  const role = payload.role as AppRole;
  if (!userId || !["familiar", "paciente", "profesional"].includes(role)) {
    return json({ error: "Datos inválidos." }, 400);
  }
  // Blocks self-demotion, which would otherwise be able to lock the
  // caller out of the admin screens with no other profesional to fix it.
  if (userId === callerId) return json({ error: "No podés cambiar tu propio rol desde acá." }, 400);

  const { data: found, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !found.user) return json({ error: "No encontramos esa cuenta." }, 404);

  const especialidad = payload.especialidad !== undefined ? String(payload.especialidad ?? "").trim() || null : undefined;
  const profileUpdate: Record<string, unknown> = { role };
  if (especialidad !== undefined) profileUpdate.especialidad = especialidad;

  const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", userId);
  if (profileError) return json({ error: profileError.message }, 400);

  // Kept in sync deliberately: handleResend replays target.user_metadata
  // into a fresh invite, which would otherwise re-stamp a stale role the
  // next time this account gets re-invited before confirming.
  const nextMetadata = { ...found.user.user_metadata, role, ...(especialidad !== undefined ? { especialidad } : {}) };
  const { error: metaError } = await admin.auth.admin.updateUserById(userId, { user_metadata: nextMetadata });
  if (metaError) {
    return json({ ok: true, warning: `Rol actualizado, pero no pudimos sincronizar los metadatos: ${metaError.message}` });
  }

  // Deliberately does not touch patient_links — a role change can leave a
  // link with a now-mismatched relation (e.g. a former paciente who was
  // "participante" and is now familiar). Surfaced as a warning so the
  // clinic fixes the link explicitly from Pacientes, instead of this
  // silently rewriting relationship data.
  const { data: links } = await admin.from("patient_links").select("patient_id").eq("profile_id", userId);
  if (links && links.length > 0) {
    return json({ ok: true, warning: "Rol actualizado. Esta cuenta sigue vinculada a paciente(s) — revisá los vínculos en Pacientes si ya no corresponden." });
  }
  return json({ ok: true });
}

async function handleDeleteUser(admin: ReturnType<typeof createClient>, callerId: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta el usuario." }, 400);
  if (userId === callerId) return json({ error: "No podés borrar tu propia cuenta desde acá." }, 400);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
}
