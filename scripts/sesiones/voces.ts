// Voces de la sesión guiada.
//
//   npx tsx scripts/sesiones/voces.ts            → cuenta textos y caracteres (no gasta nada)
//   npx tsx scripts/sesiones/voces.ts --generar  → los genera con la función «voz»
//
// La función «voz» guarda cada audio por el hash del texto: generar acá solo
// adelanta lo que se generaría la primera vez que alguien toca «Escuchar».
// Para generar hace falta una sesión iniciada: VOZ_TOKEN (el access token de
// una cuenta de la clínica), VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
// La clave de ElevenLabs nunca pasa por acá: la usa la función.
import { LISTA_GUIONES, textosDeVoz } from "../../src/lib/sesiones/index.ts";

const textos = [...new Set(LISTA_GUIONES.flatMap((g) => textosDeVoz(g).map((t) => t.replace(/•/g, "").replace(/\s+/g, " ").trim())))].filter(Boolean);
const caracteres = textos.reduce((n, t) => n + t.length, 0);
console.log(`${LISTA_GUIONES.length} guiones · ${textos.length} textos distintos · ${caracteres.toLocaleString("es-CR")} caracteres`);
console.log("Los títulos de cada recurso se leen en la portada y se generan la primera vez que alguien los escucha.");

if (process.argv.includes("--generar")) {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const token = process.env.VOZ_TOKEN;
  if (!url || !anon || !token) {
    console.error("Faltan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o VOZ_TOKEN.");
    process.exit(1);
  }
  let ok = 0;
  let fallas = 0;
  for (const [i, texto] of textos.entries()) {
    const r = await fetch(`${url}/functions/v1/voz`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (r.status === 503) {
      console.error("La función no tiene la clave de ElevenLabs configurada.");
      process.exit(1);
    }
    if (r.ok) ok++;
    else fallas++;
    await r.arrayBuffer().catch(() => null);
    if ((i + 1) % 25 === 0) console.log(`${i + 1} de ${textos.length}…`);
  }
  console.log(`Listo: ${ok} generadas o ya guardadas, ${fallas} con error.`);
}
