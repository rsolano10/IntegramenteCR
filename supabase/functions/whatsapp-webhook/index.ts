// Webhook de WhatsApp Cloud API (Meta). Es la "URL de devolución de llamada"
// configurada en App Dashboard → WhatsApp → Configuración. Meta la llama
// directamente, sin JWT de Supabase: se despliega con --no-verify-jwt.
//
// - GET: verificación de la suscripción. Meta manda hub.mode=subscribe,
//   hub.verify_token y hub.challenge; si el token coincide con
//   WHATSAPP_WEBHOOK_VERIFY_TOKEN se responde el challenge tal cual.
// - POST: notificaciones. Se valida la firma X-Hub-Signature-256 con
//   WHATSAPP_APP_SECRET (si está configurado) y se guarda:
//     · estados de los recordatorios enviados (delivered/read/failed) en
//       notifications_log, por whatsapp_message_id;
//     · mensajes entrantes de las familias en whatsapp_inbound.
//   Siempre responde 200 rápido: cualquier otro código hace que Meta
//   reintente hasta 7 días, y los reintentos llegan duplicados (por eso
//   los inserts son idempotentes por id del mensaje).
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function firmaValida(body: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET) return true; // Sin el App Secret todavía no se puede validar: se acepta y se avisa en los logs.
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  const esperado = Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
  const recibido = header.slice("sha256=".length);
  // Comparación de tiempo constante.
  if (recibido.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= esperado.charCodeAt(i) ^ recibido.charCodeAt(i);
  return diff === 0;
}

interface Estado {
  id: string;
  status: "sent" | "delivered" | "read" | "failed" | string;
  timestamp: string;
  errors?: { code: number; title?: string; message?: string; error_data?: { details?: string } }[];
}

interface Mensaje {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string; payload?: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
}

// Texto legible de un mensaje entrante; los adjuntos quedan como "[tipo]".
function textoDe(m: Mensaje): string | null {
  if (m.text?.body) return m.text.body;
  if (m.button?.text) return m.button.text;
  if (m.interactive?.button_reply?.title) return m.interactive.button_reply.title;
  if (m.interactive?.list_reply?.title) return m.interactive.list_reply.title;
  return null;
}

const ORDEN_ESTADO: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

async function guardarEstado(e: Estado) {
  const cuando = new Date(Number(e.timestamp) * 1000).toISOString();
  const { data: fila } = await admin
    .from("notifications_log")
    .select("id, delivery_status")
    .eq("whatsapp_message_id", e.id)
    .maybeSingle();
  if (!fila) return; // No es un recordatorio de la app (por ejemplo, un mensaje de prueba).
  // Los webhooks pueden llegar desordenados: nunca retroceder (read → delivered).
  if (fila.delivery_status && (ORDEN_ESTADO[fila.delivery_status] ?? 0) >= (ORDEN_ESTADO[e.status] ?? 0)) return;
  const cambios: Record<string, unknown> = { delivery_status: e.status };
  if (e.status === "delivered") cambios.delivered_at = cuando;
  if (e.status === "read") cambios.read_at = cuando;
  if (e.status === "failed") {
    const err = e.errors?.[0];
    cambios.delivery_error = err ? `${err.code} ${err.title ?? ""} ${err.error_data?.details ?? ""}`.trim() : "failed";
  }
  await admin.from("notifications_log").update(cambios).eq("id", fila.id);
}

async function guardarMensaje(m: Mensaje, nombre: string | undefined, phoneNumberId: string | undefined) {
  await admin.from("whatsapp_inbound").upsert(
    {
      whatsapp_message_id: m.id,
      from_wa_id: m.from,
      profile_name: nombre ?? null,
      tipo: m.type,
      texto: textoDe(m),
      phone_number_id: phoneNumberId ?? null,
      received_at: new Date(Number(m.timestamp) * 1000).toISOString(),
      raw: m,
    },
    { onConflict: "whatsapp_message_id", ignoreDuplicates: true },
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await req.text();
  if (!(await firmaValida(body, req.headers.get("x-hub-signature-256")))) {
    console.warn("whatsapp-webhook: firma inválida, se descarta");
    return new Response("Invalid signature", { status: 401 });
  }
  if (!APP_SECRET) console.warn("whatsapp-webhook: WHATSAPP_APP_SECRET no configurado, firma sin validar");

  try {
    const payload = JSON.parse(body);
    if (payload.object !== "whatsapp_business_account") return new Response("ok");
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        if (change.field !== "messages") {
          // Otros campos (calidad de plantillas, alertas de la cuenta): solo quedan en los logs por ahora.
          console.log("whatsapp-webhook:", change.field, JSON.stringify(value));
          continue;
        }
        const phoneNumberId = value.metadata?.phone_number_id;
        for (const e of (value.statuses ?? []) as Estado[]) await guardarEstado(e);
        const contactos = (value.contacts ?? []) as { wa_id: string; profile?: { name?: string } }[];
        for (const m of (value.messages ?? []) as Mensaje[]) {
          const nombre = contactos.find((c) => c.wa_id === m.from)?.profile?.name;
          await guardarMensaje(m, nombre, phoneNumberId);
        }
      }
    }
  } catch (err) {
    // Se registra y se responde 200 igual: un payload que no podemos procesar
    // no se arregla con reintentos.
    console.error("whatsapp-webhook: error procesando", err);
  }
  return new Response("ok");
});
