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
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Custom-content mail (rejection notices, etc.) — Auth's SMTP config (also
// Resend, see supabase/config.toml) only covers Supabase's own auth
// templates, not arbitrary app text, so this calls Resend's HTTP API
// directly. Returns an error string on failure instead of throwing, since a
// failed notification email shouldn't undo the (already-committed) decision
// it's reporting.
async function sendMail(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) return "El envío de correos no está configurado.";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "IntegraMente en Casa <no-responder@integramentecr.com>", to, subject, html }),
  });
  if (!res.ok) return `No pudimos enviar el correo (${res.status}).`;
  return null;
}

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

// Fase 7: accounts the clinic creates in person (assisted onboarding) get a
// shared starter password instead of an invite link — they're standing
// right there to confirm the email and pick a real password immediately
// after, via must_change_password (see RouteGuard). Same underlying
// patients/patient_links wiring as the invite-link path, just a different
// way of getting the account itself into existence.
const GENERIC_PASSWORD = "integramentecr";

async function createAccount(
  admin: ReturnType<typeof createClient>,
  email: string,
  metadata: Record<string, unknown>,
  genericPassword: boolean,
): Promise<{ user: { id: string } | null; error: { message: string } | null; warning?: string }> {
  if (!genericPassword) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: metadata, redirectTo: `${SITE_URL}/completar-cuenta` });
    return { user: data?.user ?? null, error };
  }
  const { data, error } = await admin.auth.admin.createUser({ email, password: GENERIC_PASSWORD, email_confirm: false, user_metadata: metadata });
  if (error) return { user: null, error };
  await admin.from("profiles").update({ must_change_password: true }).eq("id", data.user.id);
  const { error: resendError } = await admin.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${SITE_URL}/app/login` } });
  return {
    user: data.user,
    error: null,
    warning: resendError ? `Cuenta creada, pero no pudimos enviar el correo de confirmación: ${resendError.message}` : undefined,
  };
}

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

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }

  // invite_counterpart is the one action a familiar/paciente caller can take
  // themselves (inviting their own missing familiar/participante) — every
  // other action stays profesional-only, checked here before dispatch.
  if (payload.action === "invite_counterpart") {
    if (callerProfile?.role !== "familiar" && callerProfile?.role !== "paciente") {
      return json({ error: "No autorizado." }, 403);
    }
    try {
      return await handleInviteCounterpart(admin, user.id, callerProfile.role, payload);
    } catch (err) {
      console.error(err);
      return json({ error: err instanceof Error ? err.message : "Error inesperado." }, 500);
    }
  }

  if (callerProfile?.role !== "profesional") return json({ error: "Solo el equipo clínico puede hacer esto." }, 403);

  try {
    if (payload.action === "invite") return await handleInvite(admin, user.id, payload);
    if (payload.action === "resend") return await handleResend(admin, payload);
    if (payload.action === "update_email") return await handleUpdateEmail(admin, payload);
    if (payload.action === "update_role") return await handleUpdateRole(admin, user.id, payload);
    if (payload.action === "delete_user") return await handleDeleteUser(admin, user.id, payload);
    if (payload.action === "reactivate_user") return await handleReactivateUser(admin, payload);
    if (payload.action === "reject_patient") return await handleRejectPatient(admin, payload);
    if (payload.action === "notify_plan_assigned") return await handleNotifyPlanAssigned(admin, payload);
    return json({ error: "Acción desconocida." }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Error inesperado." }, 500);
  }
});

async function handleInvite(admin: ReturnType<typeof createClient>, profesionalId: string, payload: Record<string, unknown>) {
  const email = String(payload.email ?? "").trim().toLowerCase();
  const nombre = String(payload.nombre ?? "").trim();
  const genericPassword = payload.genericPassword === true;
  if (!email || !nombre) return json({ error: "Faltan datos: correo y nombre son obligatorios." }, 400);

  // Clinic staff accounts aren't linked to any patient at all.
  if (payload.accountType === "profesional") {
    const especialidad = String(payload.especialidad ?? "").trim() || null;
    const { user: invitedUser, error, warning } = await createAccount(admin, email, { role: "profesional", nombre, especialidad }, genericPassword);
    if (error || !invitedUser) return json({ error: error?.message ?? "No pudimos crear la cuenta." }, 400);
    return json({ profileId: invitedUser.id, patientId: null, warning });
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
  const { user: invited, error: inviteError, warning: createWarning } = await createAccount(admin, email, { role, nombre }, genericPassword);
  if (inviteError || !invited) return json({ error: inviteError?.message ?? "No pudimos crear la cuenta." }, 400);

  if (patientMode === "none") return json({ profileId: invited.id, patientId: null, warning: createWarning });

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

  const links = [{ patient_id: patientId, profile_id: invited.id, relation }];
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

  return json({ profileId: invited.id, patientId, warning: createWarning });
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

// Deactivates rather than deletes (integramente_flujos_interaccion_usuarios.md
// §6: "Desactivación (no eliminación)... para preservar el historial de
// auditoría intacto") — also sidesteps a real FK issue: mensajes.autor_id
// and audit_log.autor_id reference profiles(id) with no cascade/set-null,
// so a hard delete on any account that ever sent a message or generated an
// audit entry used to fail outright. `ban_duration` blocks new sign-ins at
// the Auth level; `is_active = false` is what the rest of the app reads.
async function handleDeleteUser(admin: ReturnType<typeof createClient>, callerId: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta el usuario." }, 400);
  if (userId === callerId) return json({ error: "No podés desactivar tu propia cuenta desde acá." }, 400);

  const { error: banError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  if (banError) return json({ error: banError.message }, 400);
  const { error: profileError } = await admin.from("profiles").update({ is_active: false }).eq("id", userId);
  if (profileError) return json({ error: profileError.message }, 400);
  return json({ ok: true });
}

async function handleReactivateUser(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta el usuario." }, 400);

  const { error: unbanError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (unbanError) return json({ error: unbanError.message }, 400);
  const { error: profileError } = await admin.from("profiles").update({ is_active: true }).eq("id", userId);
  if (profileError) return json({ error: profileError.message }, 400);
  return json({ ok: true });
}

// Rejecting a pending patient during evaluation: the patient record (never
// accepted, so nothing else depends on it) is removed, and the linked
// family account is notified by email with the clinic's message. Finding
// the email requires the Auth Admin API — patient_links only stores a
// profile id, and profiles never stores email — so this has to live here.
async function handleRejectPatient(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const patientId = String(payload.patientId ?? "");
  const mensaje = String(payload.mensaje ?? "").trim();
  if (!patientId || !mensaje) return json({ error: "Faltan datos." }, 400);

  const { data: patient } = await admin.from("patients").select("nombre").eq("id", patientId).maybeSingle();
  const patientNombre = patient?.nombre ?? "tu solicitud";

  const { data: links } = await admin
    .from("patient_links")
    .select("profile_id")
    .eq("patient_id", patientId)
    .eq("relation", "familiar_admin");
  const familiarProfileId = links?.[0]?.profile_id as string | undefined;

  let email: string | null = null;
  if (familiarProfileId) {
    const { data: found } = await admin.auth.admin.getUserById(familiarProfileId);
    email = found?.user?.email ?? null;
  }

  const { error: deleteError } = await admin.from("patients").delete().eq("id", patientId);
  if (deleteError) return json({ error: deleteError.message }, 400);

  if (!email) {
    return json({ ok: true, warning: "El paciente se rechazó, pero no encontramos un correo de familiar para notificar." });
  }

  const html = `
    <p>Hola,</p>
    <p>Sobre la solicitud de <strong>${patientNombre}</strong> en IntegraMente en Casa, el equipo clínico decidió no continuar en este momento:</p>
    <p style="white-space: pre-wrap;">${mensaje.replace(/</g, "&lt;")}</p>
    <p>Si tenés preguntas, podés responder a este correo.</p>
    <p>— Equipo IntegraMente en Casa</p>
  `;
  const mailError = await sendMail(email, "Sobre tu solicitud en IntegraMente en Casa", html);
  if (mailError) {
    return json({ ok: true, warning: `El paciente se rechazó, pero no pudimos enviar el correo de aviso: ${mailError}` });
  }
  return json({ ok: true, message: `${patientNombre} fue rechazado y se le avisó a la familia por correo.` });
}

// Notifies every linked family/participant account by email once the clinic
// accepts a patient and assigns their first (or next) plan — the RPC that
// actually assigns the plan is a plain SQL function with no HTTP access, so
// this is called separately right after it succeeds.
async function handleNotifyPlanAssigned(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const patientId = String(payload.patientId ?? "");
  if (!patientId) return json({ error: "Falta el paciente." }, 400);

  const { data: patient } = await admin.from("patients").select("nombre").eq("id", patientId).maybeSingle();
  const patientNombre = patient?.nombre ?? "tu perfil";

  const { data: links } = await admin
    .from("patient_links")
    .select("profile_id")
    .eq("patient_id", patientId)
    .in("relation", ["familiar_admin", "participante"]);

  const profileIds = [...new Set((links ?? []).map((l) => l.profile_id as string))];
  if (profileIds.length === 0) {
    return json({ ok: true, warning: "El plan se asignó, pero no encontramos cuentas vinculadas para notificar." });
  }

  const failures: string[] = [];
  for (const profileId of profileIds) {
    const { data: found } = await admin.auth.admin.getUserById(profileId);
    const email = found?.user?.email;
    if (!email) continue;
    const html = `
      <p>Hola,</p>
      <p>Ya revisamos el perfil de <strong>${patientNombre}</strong> en IntegraMente en Casa y armamos su programa de esta semana.</p>
      <p>Ya podés ingresar a la plataforma con tu correo y contraseña.</p>
      <p><a href="${SITE_URL}/app/login">Ingresar a IntegraMente en Casa</a></p>
      <p>— Equipo IntegraMente en Casa</p>
    `;
    const mailError = await sendMail(email, "Ya podés ingresar a IntegraMente en Casa", html);
    if (mailError) failures.push(mailError);
  }

  if (failures.length > 0) {
    return json({ ok: true, warning: `El plan se asignó, pero no pudimos enviar algún correo de aviso: ${failures[0]}` });
  }
  return json({ ok: true });
}

// Self-service counterpart invite: a familiar_admin can invite the missing
// participante for their own patient (and vice versa) — the one privileged
// action a non-profesional caller is allowed to trigger here. Authorization
// is entirely re-derived from patient_links, never trusted from the client.
async function handleInviteCounterpart(
  admin: ReturnType<typeof createClient>,
  callerId: string,
  callerRole: "familiar" | "paciente",
  payload: Record<string, unknown>,
) {
  const patientId = String(payload.patientId ?? "");
  const email = String(payload.email ?? "").trim().toLowerCase();
  const nombre = String(payload.nombre ?? "").trim();
  if (!patientId || !email || !nombre) return json({ error: "Faltan datos." }, 400);

  const callerRelation: Relation = callerRole === "familiar" ? "familiar_admin" : "participante";
  const targetRelation: Relation = callerRole === "familiar" ? "participante" : "familiar_admin";

  const { data: callerLink } = await admin
    .from("patient_links")
    .select("patient_id")
    .eq("patient_id", patientId)
    .eq("profile_id", callerId)
    .eq("relation", callerRelation)
    .maybeSingle();
  if (!callerLink) return json({ error: "No autorizado para este paciente." }, 403);

  const { data: existingTarget } = await admin
    .from("patient_links")
    .select("patient_id")
    .eq("patient_id", patientId)
    .eq("relation", targetRelation)
    .maybeSingle();
  if (existingTarget) return json({ error: "Ya hay una cuenta vinculada con ese rol para este paciente." }, 400);

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role: roleForRelation[targetRelation], nombre },
    redirectTo: `${SITE_URL}/completar-cuenta`,
  });
  if (inviteError) return json({ error: inviteError.message }, 400);

  const { error: linkError } = await admin
    .from("patient_links")
    .insert({ patient_id: patientId, profile_id: invited.user.id, relation: targetRelation });
  if (linkError) return json({ error: linkError.message }, 400);

  return json({ ok: true });
}
