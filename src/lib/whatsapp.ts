// WhatsApp es el único canal con el equipo clínico: la app no tiene chat
// familia ↔ clínica. Todo "hablar con un profesional" abre WhatsApp con el
// mensaje ya escrito. Módulo liviano: lo usan el home y la app.

// Número del equipo en formato internacional sin "+" (para wa.me).
export const WHATSAPP_EQUIPO = "50683464703";
export const WHATSAPP_EQUIPO_VISIBLE = "+506 8346 4703";

export function waLink(numero: string, texto?: string): string {
  const n = numero.replace(/\D/g, "");
  return texto ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : `https://wa.me/${n}`;
}

// Link al WhatsApp del equipo. Con `paciente`, el mensaje arranca diciendo
// de quién se trata, para que el equipo ubique el caso sin preguntar.
export function waEquipo(texto?: string, paciente?: string): string {
  const intro = paciente ? `Hola, les escribo por ${paciente}.` : "Hola, les escribo desde la app de IntegraMente.";
  return waLink(WHATSAPP_EQUIPO, texto ? `${intro} ${texto}` : intro);
}
