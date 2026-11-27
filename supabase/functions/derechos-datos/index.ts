// Derechos de la Ley 8968 sin trabajo manual del equipo.
//   - La persona (con su sesión): {accion: "programar" | "cancelar"} la
//     eliminación de sus datos; le llega un correo de constancia.
//   - pg_cron (cada hora, con x-cron-secret): {accion: "tick"} ejecuta las
//     eliminaciones cuya fecha llegó, bloquea la cuenta en Auth y avisa por
//     correo.
// Los correos de derechos siempre salen (no dependen del interruptor de
// correos de Administración): son constancias legales.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://test.integramentecr.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CR", { timeZone: "America/Costa_Rica", weekday: "long", day: "numeric", month: "long", year: "numeric" });

function correo(titulo: string, cuerpo: string, cta?: { label: string; url: string }) {
  const boton = cta
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
<tr><td style="padding:36px 36px 8px 36px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#1f3338;">${titulo}</td></tr>
<tr><td style="padding:12px 36px 0 36px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#4a5b5f;">${cuerpo}</td></tr>
${boton}
<tr><td style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>
</table></td></tr>
<tr><td style="padding:24px 16px 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#7a8b8e;text-align:center;">¿Dudas? Escribinos a <a href="mailto:programas.integramente@gmail.com" style="color:#3f6a70;">programas.integramente@gmail.com</a> o llamanos al +506 8343 5772.<br>IntegraMente en Casa · Costa Rica</td></tr>
</table></td></tr></table></body></html>`;
}

async function enviar(para: string, asunto: string, html: string) {
  if (!RESEND_API_KEY || !para) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "IntegraMente en Casa <no-responder@integramentecr.com>", to: [para], subject: asunto, html }),
    });
  } catch {
    // Un correo que no sale no deshace la acción (ya quedó registrada).
  }
}

const QUE_SE_BORRA =
  "las conversaciones y la memoria de Clara y del asistente, tu número de WhatsApp y el registro de avisos. También retiramos los permisos opcionales y cerramos tu cuenta. El expediente de salud (cuestionario, planes, registros y notas del equipo) se conserva bloqueado el plazo que exige la ley y después se elimina.";

async function tick() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: vencidas } = await admin
    .from("solicitudes_datos")
    .select("id, profile_id, nombre")
    .eq("tipo", "eliminacion")
    .eq("estado", "pendiente")
    .eq("automatica", true)
    .lte("ejecutar_el", new Date().toISOString());
  let hechas = 0;
  for (const s of vencidas ?? []) {
    // El correo antes de cerrar la cuenta.
    const { data: u } = await admin.auth.admin.getUserById(s.profile_id);
    const { data: id, error } = await admin.rpc("ejecutar_eliminacion", { p_id: s.id });
    if (error || !id) continue;
    await admin.auth.admin.updateUserById(s.profile_id, { ban_duration: "876000h" });
    hechas++;
    if (u?.user?.email) {
      await enviar(
        u.user.email,
        "Eliminamos tus datos de IntegraMente",
        correo("Listo, eliminamos tus datos", `<p>Hola${s.nombre ? ` ${s.nombre.split(" ")[0]}` : ""}:</p><p>Como pediste, borramos ${QUE_SE_BORRA}</p><p>Gracias por haber sido parte del programa.</p>`),
      );
    }
  }
  return { ok: true, hechas };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let accion = "";
  try {
    accion = String((await req.json())?.accion ?? "");
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }

  if (accion === "tick") {
    if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) return json({ error: "No autorizado." }, 401);
    return json(await tick());
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: who } = await userClient.auth.getUser();
  if (!who?.user) return json({ error: "No autenticado." }, 401);
  const email = who.user.email ?? "";

  if (accion === "programar") {
    const { data: cuando, error } = await userClient.rpc("programar_eliminacion");
    if (error) return json({ error: error.message }, 400);
    await enviar(
      email,
      "Programaste la eliminación de tus datos",
      correo(
        "Programaste la eliminación de tus datos",
        `<p>El <strong>${fecha(cuando as string)}</strong> vamos a borrar ${QUE_SE_BORRA}</p><p>Hasta ese día todo sigue igual y podés cancelarlo desde <strong>Mis datos y permisos</strong>. Si no fuiste vos, entrá y cancelalo.</p>`,
        { label: "Revisar o cancelar", url: `${SITE_URL}/app/mis-datos` },
      ),
    );
    return json({ ok: true, ejecutar_el: cuando });
  }

  if (accion === "cancelar") {
    const { error } = await userClient.rpc("cancelar_eliminacion");
    if (error) return json({ error: error.message }, 400);
    await enviar(email, "Cancelaste la eliminación de tus datos", correo("Cancelaste la eliminación", "<p>No vamos a borrar nada. Tu cuenta y tus datos siguen como estaban.</p>"));
    return json({ ok: true });
  }

  return json({ error: "Acción desconocida." }, 400);
});
