// Hook de envío de correos de Supabase Auth (Authentication → Hooks →
// Send Email). Reemplaza al SMTP para TODOS los correos de Auth y los manda
// por la API de Resend con:
//   - el mismo HTML de supabase/templates/*.html (plantillas.ts, generado),
//   - una versión en texto plano (multipart: mejora la entregabilidad y
//     sirve a clientes que no muestran HTML),
//   - remitente fijo y Reply-To al correo de contacto.
// No lleva enlace de baja: son correos transaccionales que la persona pidió
// (confirmar, recuperar contraseña), no envíos masivos.
//
// Activación (una vez, en el Dashboard): Authentication → Hooks → Send Email
// → HTTPS → https://<proyecto>.supabase.co/functions/v1/auth-email, generar
// el secreto y guardarlo con
//   supabase secrets set SEND_EMAIL_HOOK_SECRET='v1,whsec_…'
// Mientras el hook no esté activo, Auth sigue usando el SMTP con las mismas
// plantillas: nada se rompe.
import { Webhook } from "npm:standardwebhooks@1.0.0";
import { plantillas } from "./plantillas.ts";
import { aTexto, renderizar } from "./render.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace("v1,whsec_", "");
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://test.integramentecr.com").replace(/\/$/, "");
const REMITENTE = "IntegraMente en Casa <no-responder@integramentecr.com>";
const RESPONDER_A = "info@integramente.com";

interface HookPayload {
  user: { email: string; new_email?: string; user_metadata?: Record<string, unknown> };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const PLANTILLA_POR_TIPO: Record<string, string> = {
  signup: "confirmation",
  recovery: "recovery",
  invite: "invite",
  magiclink: "magic_link",
  email_change: "email_change",
  email_change_new: "email_change",
  reauthentication: "reauthentication",
};

// Versión en texto plano escrita a mano para el correo principal (el de
// confirmación); el resto se deriva del HTML.
function textoConfirmacion(nombre: string, enlace: string): string {
  return [
    nombre ? `¡Hola, ${nombre}!` : "¡Hola!",
    "",
    "Qué alegría que empieces. Confirmá tu correo y pasás directo a la evaluación inicial: unos 10 minutos para preparar tu plan personalizado.",
    "",
    "Confirmar mi correo y empezar:",
    enlace,
    "",
    `Mirá el video de bienvenida: ${SITE_URL}/#video-introduccion`,
    "",
    "El enlace funciona una vez y vence en una hora. Si no creaste una cuenta en IntegraMente en Casa, podés ignorar este correo.",
    "",
    "IntegraMente en Casa · Costa Rica · info@integramente.com · +506 8343 5772",
  ].join("\n");
}

async function enviar(para: string, asunto: string, html: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: REMITENTE, to: [para], reply_to: RESPONDER_A, subject: asunto, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function armar(tipo: string, para: string, tokenHash: string, token: string, p: HookPayload) {
  const nombrePlantilla = PLANTILLA_POR_TIPO[tipo];
  const plantilla = nombrePlantilla ? plantillas[nombrePlantilla] : undefined;
  if (!plantilla) throw new Error(`Tipo de correo sin plantilla: ${tipo}`);
  const redirectTo = p.email_data.redirect_to || SITE_URL;
  const authUrl = p.email_data.site_url.replace(/\/$/, "");
  const verifyType = tipo === "email_change_new" ? "email_change" : tipo;
  const vars = {
    SiteURL: SITE_URL,
    RedirectTo: redirectTo,
    TokenHash: tokenHash,
    Token: token,
    Email: p.user.email,
    NewEmail: p.user.new_email ?? "",
    ConfirmationURL: `${authUrl}/verify?token=${tokenHash}&type=${verifyType}&redirect_to=${encodeURIComponent(redirectTo)}`,
  };
  const data = p.user.user_metadata ?? {};
  const html = renderizar(plantilla.html, vars, data);
  const text =
    nombrePlantilla === "confirmation"
      ? textoConfirmacion(String(data.nombre ?? ""), `${redirectTo}?token_hash=${tokenHash}&type=email`)
      : aTexto(html);
  return { para, asunto: plantilla.asunto, html, text };
}

Deno.serve(async (req) => {
  const raw = await req.text();
  let payload: HookPayload;
  try {
    payload = new Webhook(HOOK_SECRET).verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return new Response(JSON.stringify({ error: { http_code: 401, message: "Firma inválida" } }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const d = payload.email_data;
    const correos = [];
    if (d.email_action_type === "email_change" && d.token_hash_new) {
      // Cambio de correo con doble confirmación. Supabase documenta los
      // nombres cruzados: token_hash_new va al correo actual y token_hash
      // al nuevo.
      correos.push(armar("email_change", payload.user.email, d.token_hash_new, d.token_new ?? "", payload));
      if (payload.user.new_email) correos.push(armar("email_change_new", payload.user.new_email, d.token_hash, d.token, payload));
    } else {
      const para = d.email_action_type === "email_change" && payload.user.new_email ? payload.user.new_email : payload.user.email;
      correos.push(armar(d.email_action_type, para, d.token_hash, d.token, payload));
    }
    for (const c of correos) await enviar(c.para, c.asunto, c.html, c.text);
    return new Response("{}", { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("auth-email", e);
    return new Response(JSON.stringify({ error: { http_code: 500, message: String(e) } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
