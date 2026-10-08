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

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Same look as the auth emails in supabase/templates/ (Resend sends both),
// so every message from IntegraMente reads as one voice.
function brandedEmail(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  const button = cta
    ? `<tr><td style="padding:24px 36px 8px 36px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:#1f3338;"><a href="${cta.url}" style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${cta.label}</a></td></tr></table></td></tr>`
    : "";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f4e9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f4e9;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 8px 20px 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#1f3338;">Integra<em style="color:#3f6a70;">Mente</em> <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a8b8e;">&nbsp;en Casa</span></td></tr>
<tr><td style="background:#ffffff;border:1px solid #e4dfc7;border-radius:24px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:8px;background:#6a969c;line-height:8px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:36px 36px 8px 36px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#1f3338;">${title}</td></tr>
<tr><td style="padding:12px 36px 0 36px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#4a5b5f;">${bodyHtml}</td></tr>
${button}
<tr><td style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>
</table></td></tr>
<tr><td style="padding:24px 16px 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#7a8b8e;text-align:center;">¿Dudas? Escribinos a <a href="mailto:info@integramente.com" style="color:#3f6a70;">info@integramente.com</a> o llamanos al +506 8343 5772.<br>IntegraMente en Casa · Costa Rica</td></tr>
</table></td></tr></table></body></html>`;
}

function quoteBlock(text: string): string {
  return `<div style="margin:18px 0 0 0;padding:16px 18px;background:#fbf7ea;border-left:4px solid #6a969c;border-radius:12px;white-space:pre-wrap;color:#1f3338;">${escapeHtml(text)}</div>`;
}

// WhatsApp, same Cloud API call as whatsapp-notify-tick. Until the Meta
// token and approved templates exist (see the WhatsApp memory/README),
// this reports "not_configured" and the caller just carries on — email and
// the in-app chat still deliver the message.
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_TEMPLATE_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "es";
const TEMPLATE_PROGRAMA_LISTO = Deno.env.get("WHATSAPP_TEMPLATE_PROGRAMA_LISTO") ?? "im_programa_listo";
const TEMPLATE_SOLICITUD_REVISADA = Deno.env.get("WHATSAPP_TEMPLATE_SOLICITUD_REVISADA") ?? "im_solicitud_revisada";

async function sendWhatsappTemplate(to: string, templateName: string, bodyParams: string[]): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return { ok: false, error: "not_configured" };
  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: WHATSAPP_TEMPLATE_LANG },
        components: [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }],
      },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
  return { ok: true, messageId: data?.messages?.[0]?.id };
}

// WhatsApp template variables can't contain newlines or runs of spaces.
function waParam(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 900);
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
// starter password instead of an invite link — they're standing right there
// to confirm the email and pick a real password immediately after, via
// must_change_password (see RouteGuard). Same underlying patients/
// patient_links wiring as the invite-link path, just a different way of
// getting the account itself into existence.
//
// SECURITY FIX: this used to be one hardcoded constant ("integramentecr")
// shared by every assisted-onboarding account ever created, shown back to
// the admin in plaintext — a known, constant credential for the whole
// patient population until each person individually changed it. Generated
// fresh per account instead; the fixed "Im"/"25" bookends guarantee it
// satisfies the project's letters+digits password policy regardless of
// what the random slice happens to contain.
function generateProvisionalPassword(): string {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `Im${random}25`;
}

async function createAccount(
  admin: ReturnType<typeof createClient>,
  email: string,
  metadata: Record<string, unknown>,
  genericPassword: boolean,
): Promise<{ user: { id: string } | null; error: { message: string } | null; warning?: string; provisionalPassword?: string }> {
  if (!genericPassword) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: metadata, redirectTo: `${SITE_URL}/completar-cuenta` });
    return { user: data?.user ?? null, error };
  }
  const provisionalPassword = generateProvisionalPassword();
  const { data, error } = await admin.auth.admin.createUser({ email, password: provisionalPassword, email_confirm: false, user_metadata: metadata });
  if (error) return { user: null, error };
  await admin.from("profiles").update({ must_change_password: true }).eq("id", data.user.id);
  const { error: resendError } = await admin.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${SITE_URL}/confirmar-correo` } });
  return {
    user: data.user,
    error: null,
    provisionalPassword,
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
  // notify_risk_alert: a family/participant just raised a risk alert
  // (enviar_alerta_riesgo) — email the whole clinical team. Authorization
  // and anti-spam are re-derived server-side in the handler.
  if (payload.action === "notify_risk_alert") {
    if (callerProfile?.role !== "familiar" && callerProfile?.role !== "paciente") {
      return json({ error: "No autorizado." }, 403);
    }
    try {
      return await handleNotifyRiskAlert(admin, user.id, payload);
    } catch (err) {
      console.error(err);
      return json({ error: err instanceof Error ? err.message : "Error inesperado." }, 500);
    }
  }

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
    if (payload.action === "permanently_delete_user") return await handlePermanentlyDeleteUser(admin, user.id, payload);
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
  const whatsappPhone = String(payload.whatsappPhone ?? "").trim() || null;
  if (!email || !nombre) return json({ error: "Faltan datos: correo y nombre son obligatorios." }, 400);

  // Clinic staff accounts aren't linked to any patient at all.
  if (payload.accountType === "profesional") {
    const especialidad = String(payload.especialidad ?? "").trim() || null;
    const { user: invitedUser, error, warning, provisionalPassword } = await createAccount(
      admin,
      email,
      { role: "profesional", nombre, especialidad, whatsapp_phone: whatsappPhone },
      genericPassword,
    );
    if (error || !invitedUser) return json({ error: error?.message ?? "No pudimos crear la cuenta." }, 400);
    return json({ profileId: invitedUser.id, patientId: null, warning, provisionalPassword });
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
  const {
    user: invited,
    error: inviteError,
    warning: createWarning,
    provisionalPassword,
  } = await createAccount(admin, email, { role, nombre, whatsapp_phone: whatsappPhone }, genericPassword);
  if (inviteError || !invited) return json({ error: inviteError?.message ?? "No pudimos crear la cuenta." }, 400);

  if (patientMode === "none") return json({ profileId: invited.id, patientId: null, warning: createWarning, provisionalPassword });

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
      return json(
        { error: `Invitación enviada, pero no pudimos crear el paciente: ${patientError.message}`, provisionalPassword },
        400,
      );
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

  return json({ profileId: invited.id, patientId, warning: createWarning, provisionalPassword });
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
      options: { emailRedirectTo: `${SITE_URL}/confirmar-correo` },
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
      options: { emailRedirectTo: `${SITE_URL}/confirmar-correo` },
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

// Manual, deliberate hard delete — the real "borrar de la base de datos"
// counterpart to handleDeleteUser's soft deactivation. Only allowed once an
// account is ALREADY inactive (checked server-side, not just hidden client-
// side) — this is a cleanup tool for accounts everyone already agreed
// shouldn't be around, not a shortcut around the deactivate-first flow.
// Safe now in a way it wasn't when handleDeleteUser's comment was written:
// mensajes.autor_id/audit_log.autor_id/plans.created_by all got "on delete
// set null" in 20260820100000_platform_admin.sql, and patient_links/
// profiles both cascade — deleting the auth user cleans up every row that
// pointed at them without leaving orphaned FKs.
async function handlePermanentlyDeleteUser(admin: ReturnType<typeof createClient>, callerId: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta el usuario." }, 400);
  if (userId === callerId) return json({ error: "No podés eliminar tu propia cuenta." }, 400);

  const { data: profile } = await admin.from("profiles").select("is_active, nombre").eq("id", userId).maybeSingle();
  if (!profile) return json({ error: "No encontramos esa cuenta." }, 404);
  if (profile.is_active) return json({ error: "Solo se puede eliminar por completo una cuenta ya desactivada." }, 400);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, message: `${profile.nombre} fue eliminado permanentemente.` });
}

// Rejecting a pending patient during evaluation: the patient record (never
// accepted, so nothing else depends on it) is removed, and the linked
// family account is notified by email with the clinic's message. Finding
// the email requires the Auth Admin API — patient_links only stores a
// profile id, and profiles never stores email — so this has to live here.
async function handleRejectPatient(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const patientId = String(payload.patientId ?? "");
  const mensaje = String(payload.mensaje ?? "").trim();
  if (!patientId || !mensaje) return json({ error: "Falta el mensaje para la familia." }, 400);

  const { data: patient } = await admin.from("patients").select("nombre").eq("id", patientId).maybeSingle();
  const patientNombre = patient?.nombre ?? "tu solicitud";

  const { data: links } = await admin
    .from("patient_links")
    .select("profile_id")
    .eq("patient_id", patientId)
    .in("relation", ["familiar_admin", "participante"]);
  const profileIds = [...new Set((links ?? []).map((l) => l.profile_id as string))];

  // Read every contact BEFORE deleting — the patient row (and its links)
  // go away below.
  const contacts: { email: string | null; phone: string | null; nombre: string }[] = [];
  for (const profileId of profileIds) {
    const [{ data: found }, { data: prof }] = await Promise.all([
      admin.auth.admin.getUserById(profileId),
      admin.from("profiles").select("nombre, whatsapp_phone, whatsapp_notifications_enabled").eq("id", profileId).maybeSingle(),
    ]);
    contacts.push({
      email: found?.user?.email ?? null,
      phone: prof?.whatsapp_notifications_enabled ? (prof?.whatsapp_phone ?? null) : null,
      nombre: (prof?.nombre ?? "").split(" ")[0],
    });
  }

  const { error: deleteError } = await admin.from("patients").delete().eq("id", patientId);
  if (deleteError) return json({ error: deleteError.message }, 400);

  // Shown in-app the next time they log in (Consent.tsx) — otherwise a
  // patient-less account just lands on a blank new-signup flow.
  if (profileIds.length > 0) {
    await admin
      .from("solicitudes_rechazadas")
      .insert(profileIds.map((profile_id) => ({ profile_id, patient_nombre: patientNombre, mensaje })));
  }

  if (contacts.length === 0) {
    return json({ ok: true, warning: "La solicitud se rechazó, pero no encontramos una cuenta vinculada para avisarle por correo." });
  }

  const canales = new Set<string>(["la app"]);
  const fallos: string[] = [];
  for (const c of contacts) {
    if (c.email) {
      const html = brandedEmail(
        "Sobre tu solicitud",
        `<p style="margin:0 0 14px 0;">Hola${c.nombre ? `, ${escapeHtml(c.nombre)}` : ""}.</p>
         <p style="margin:0;">Gracias por confiar en IntegraMente en Casa. Revisamos con cuidado la información de <strong style="color:#1f3338;">${escapeHtml(patientNombre)}</strong> y, por ahora, el programa en casa no es la mejor opción. Te dejamos el mensaje del equipo clínico:</p>
         ${quoteBlock(mensaje)}
         <p style="margin:18px 0 0 0;">Si tenés preguntas o querés conversar otras alternativas, respondé a este correo o llamanos.</p>`,
      );
      const err = await sendMail(c.email, "Sobre tu solicitud en IntegraMente en Casa", html);
      if (err) fallos.push(err);
      else canales.add("correo");
    }
    if (c.phone) {
      const wa = await sendWhatsappTemplate(c.phone, TEMPLATE_SOLICITUD_REVISADA, [waParam(patientNombre), waParam(mensaje)]);
      if (wa.ok) canales.add("WhatsApp");
    }
  }

  if (!canales.has("correo")) {
    return json({
      ok: true,
      warning: `Solicitud rechazada. La familia verá tu mensaje al entrar a la app, pero no pudimos enviarle el correo${fallos[0] ? `: ${fallos[0]}` : "."}`,
    });
  }
  return json({ ok: true, message: `Solicitud de ${patientNombre} rechazada — se le avisó a la familia por ${[...canales].join(", ")}.` });
}

// Notifies every linked family/participant account by email once the clinic
// accepts a patient and assigns their first (or next) plan — the RPC that
// actually assigns the plan is a plain SQL function with no HTTP access, so
// this is called separately right after it succeeds.
async function handleNotifyPlanAssigned(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const patientId = String(payload.patientId ?? "");
  const mensaje = String(payload.mensaje ?? "").trim();
  const primeraVez = payload.primeraVez !== false;
  if (!patientId) return json({ error: "Falta el paciente." }, 400);

  const { data: patient } = await admin.from("patients").select("nombre").eq("id", patientId).maybeSingle();
  const patientNombre = patient?.nombre ?? "tu familiar";

  const { data: links } = await admin
    .from("patient_links")
    .select("profile_id")
    .eq("patient_id", patientId)
    .in("relation", ["familiar_admin", "participante"]);

  const profileIds = [...new Set((links ?? []).map((l) => l.profile_id as string))];
  if (profileIds.length === 0) {
    return json({ ok: true, warning: "El plan se asignó, pero no encontramos cuentas vinculadas para avisar." });
  }

  const canales = new Set<string>(["chat de la app"]);
  const failures: string[] = [];
  for (const profileId of profileIds) {
    const [{ data: found }, { data: prof }] = await Promise.all([
      admin.auth.admin.getUserById(profileId),
      admin.from("profiles").select("nombre, whatsapp_phone, whatsapp_notifications_enabled").eq("id", profileId).maybeSingle(),
    ]);
    const email = found?.user?.email;
    const nombre = (prof?.nombre ?? "").split(" ")[0];
    if (email) {
      const html = brandedEmail(
        primeraVez ? `El programa de ${escapeHtml(patientNombre)} está listo` : "Ya está lista la próxima semana",
        `<p style="margin:0 0 14px 0;">Hola${nombre ? `, ${escapeHtml(nombre)}` : ""}.</p>
         <p style="margin:0;">${
           primeraVez
             ? `Nuestro equipo clínico revisó el perfil de <strong style="color:#1f3338;">${escapeHtml(patientNombre)}</strong> y armó su programa personalizado. Desde hoy vas a ver las actividades de cada día en la app.`
             : `Ya preparamos las actividades de la próxima semana para <strong style="color:#1f3338;">${escapeHtml(patientNombre)}</strong>, tomando en cuenta cómo les fue.`
         }</p>
         ${mensaje ? `<p style="margin:18px 0 0 0;">Un mensaje de tu profesional:</p>${quoteBlock(mensaje)}` : ""}`,
        { label: primeraVez ? "Ver el programa" : "Ver la semana", url: `${SITE_URL}/app/login` },
      );
      const mailError = await sendMail(
        email,
        primeraVez ? `El programa de ${patientNombre} está listo · IntegraMente en Casa` : "Ya está lista la próxima semana · IntegraMente en Casa",
        html,
      );
      if (mailError) failures.push(mailError);
      else canales.add("correo");
    }
    const phone = prof?.whatsapp_notifications_enabled ? prof?.whatsapp_phone : null;
    if (phone) {
      const wa = await sendWhatsappTemplate(phone, TEMPLATE_PROGRAMA_LISTO, [waParam(nombre || "Hola"), waParam(patientNombre), waParam(mensaje || "Ya podés ver las actividades en la app.")]);
      if (wa.ok) canales.add("WhatsApp");
      await admin.from("notifications_log").insert({
        patient_id: patientId,
        profile_id: profileId,
        tipo: "programa_listo",
        scheduled_for: new Date().toISOString(),
        sent_at: wa.ok ? new Date().toISOString() : null,
        whatsapp_message_id: wa.messageId ?? null,
        status: wa.ok ? "sent" : wa.error === "not_configured" ? "skipped_not_configured" : "failed",
        error: wa.error ?? null,
      });
    }
  }

  if (failures.length > 0 && !canales.has("correo")) {
    return json({ ok: true, canales: [...canales], warning: `El plan se asignó, pero no pudimos enviar el correo de aviso: ${failures[0]}` });
  }
  return json({ ok: true, canales: [...canales] });
}

const ALERTA_ETIQUETA: Record<string, string> = {
  ideacion: "Posible riesgo de autolesión",
  maltrato: "Sospecha de maltrato o abandono",
  caida: "Caída",
  cambio: "Cambio repentino de salud",
  extravio: "Riesgo de extravío",
};

async function handleNotifyRiskAlert(admin: ReturnType<typeof createClient>, callerId: string, payload: Record<string, unknown>) {
  const alertaId = String(payload.alertaId ?? "");
  if (!alertaId) return json({ error: "Falta el aviso." }, 400);

  const { data: alerta } = await admin
    .from("alertas_riesgo")
    .select("id, patient_id, tipo, automatica, created_at, correo_enviado_at")
    .eq("id", alertaId)
    .maybeSingle();
  if (!alerta) return json({ error: "Aviso no encontrado." }, 404);

  // The caller must be linked to this patient as family/participant.
  const { data: link } = await admin
    .from("patient_links")
    .select("profile_id")
    .eq("patient_id", alerta.patient_id)
    .eq("profile_id", callerId)
    .in("relation", ["familiar_admin", "participante"])
    .maybeSingle();
  if (!link) return json({ error: "No autorizado." }, 403);

  // One email per alert, ever — claimed atomically so a double tap can't
  // race two sends.
  const { data: claimed } = await admin
    .from("alertas_riesgo")
    .update({ correo_enviado_at: new Date().toISOString() })
    .eq("id", alertaId)
    .is("correo_enviado_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return json({ ok: true, skipped: true });

  const [{ data: patient }, { data: caller }, { data: staff }] = await Promise.all([
    admin.from("patients").select("nombre").eq("id", alerta.patient_id).maybeSingle(),
    admin.from("profiles").select("nombre").eq("id", callerId).maybeSingle(),
    admin.from("profiles").select("id").eq("role", "profesional").eq("is_active", true),
  ]);
  const etiqueta = ALERTA_ETIQUETA[alerta.tipo as string] ?? "Aviso de riesgo";
  const patientNombre = patient?.nombre ?? "un paciente";
  const hora = new Date(alerta.created_at as string).toLocaleString("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "medium", timeStyle: "short" });

  const html = brandedEmail(
    `⚠ ${escapeHtml(etiqueta)}`,
    `<p style="margin:0 0 14px 0;"><strong style="color:#1f3338;">${escapeHtml(caller?.nombre ?? "La familia")}</strong> envió un aviso de riesgo desde la app${alerta.automatica ? " (aviso automático)" : ""}.</p>
     <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#fbefeb;border:1px solid #e3b7aa;border-radius:12px;">
       <tr><td style="padding:16px 18px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#8c3f2a;">
         <strong>Paciente:</strong> ${escapeHtml(patientNombre)}<br><strong>Situación:</strong> ${escapeHtml(etiqueta)}<br><strong>Enviado:</strong> ${escapeHtml(hora)}
       </td></tr>
     </table>
     <p style="margin:18px 0 0 0;">Contactá a la familia lo antes posible y marcá el aviso como atendido en el panel.</p>`,
    { label: "Abrir el paciente", url: `${SITE_URL}/app/profesional/paciente/${alerta.patient_id}?tab=mensajes` },
  );

  let sent = 0;
  for (const s of staff ?? []) {
    const { data: found } = await admin.auth.admin.getUserById(s.id as string);
    const email = found?.user?.email;
    if (!email) continue;
    const err = await sendMail(email, `⚠ Aviso de riesgo: ${etiqueta} — ${patientNombre}`, html);
    if (!err) sent++;
  }
  return json({ ok: true, sent });
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
