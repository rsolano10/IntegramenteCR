// Memoria de Clara: funciones puras compartidas por las funciones
// clara-session / clara-post-call y probadas en src/lib/claraMemoria.test.ts.

export const MAX_RESUMEN = 1000;
export const SIN_MEMORIA = "ninguno";

// Fusiona el resumen de la conversación nueva con lo que ya se recordaba:
// lo más reciente primero, fechado, y se recorta lo más viejo para no pasar
// de MAX_RESUMEN caracteres (cortando en un límite de entrada o de oración,
// nunca a mitad de palabra).
export function fusionarResumen(previo: string | null | undefined, nuevo: string, fecha: Date, max = MAX_RESUMEN): string {
  const limpio = (t: string) => t.replace(/\s+/g, " ").trim();
  const n = limpio(nuevo);
  const p = previo && previo.trim() !== SIN_MEMORIA ? previo.trim() : "";
  if (!n) return p.slice(0, max);
  const dia = fecha.toISOString().slice(0, 10);
  let entrada = `${dia}: ${n}`;
  if (entrada.length > max) entrada = recortar(entrada, max);
  const junto = p ? `${entrada}\n${p}` : entrada;
  return junto.length <= max ? junto : recortar(junto, max);
}

function recortar(texto: string, max: number): string {
  const corte = texto.slice(0, max);
  // Preferir terminar en una entrada completa; si no, en una oración; si no, en una palabra.
  const finEntrada = corte.lastIndexOf("\n");
  if (finEntrada > max * 0.5) return corte.slice(0, finEntrada).trimEnd();
  const finOracion = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf(".\n"));
  if (finOracion > max * 0.5) return corte.slice(0, finOracion + 1).trimEnd();
  const finPalabra = corte.lastIndexOf(" ");
  return (finPalabra > 0 ? corte.slice(0, finPalabra) : corte).trimEnd() + "…";
}

// Firma del webhook de ElevenLabs. Encabezado `ElevenLabs-Signature` con la
// forma `t=<timestamp>,v0=<hex>`, donde hex = HMAC-SHA256(secreto,
// `${t}.${cuerpo}`). Se rechazan firmas de más de `toleranciaSeg` segundos
// (repeticiones de un webhook viejo).
export async function verificarFirmaElevenLabs(
  encabezado: string | null,
  cuerpo: string,
  secreto: string,
  ahoraSeg = Math.floor(Date.now() / 1000),
  toleranciaSeg = 30 * 60,
): Promise<boolean> {
  if (!encabezado || !secreto) return false;
  const partes = Object.fromEntries(
    encabezado.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(partes.t);
  const firma = partes.v0;
  if (!t || !firma || Math.abs(ahoraSeg - t) > toleranciaSeg) return false;
  const esperada = await hmacHex(secreto, `${t}.${cuerpo}`);
  return iguales(esperada, firma);
}

export async function hmacHex(secreto: string, mensaje: string): Promise<string> {
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(mensaje));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Comparación en tiempo constante (no revela cuántos caracteres coinciden).
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
