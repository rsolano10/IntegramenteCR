import { test } from "node:test";
import assert from "node:assert/strict";
import { fusionarResumen, hmacHex, verificarFirmaElevenLabs, MAX_RESUMEN } from "../../supabase/functions/_shared/claraMemoria.ts";

const fecha = new Date("2026-11-09T15:00:00Z");

test("fusiona con lo más reciente primero y fechado", () => {
  const r = fusionarResumen("2026-11-01: Preguntó por el calendario.", "Quiso saber cómo activar el programa.", fecha);
  assert.equal(r, "2026-11-09: Quiso saber cómo activar el programa.\n2026-11-01: Preguntó por el calendario.");
});

test("sin memoria previa (o «ninguno») queda solo lo nuevo", () => {
  assert.equal(fusionarResumen("ninguno", "Primera conversación.", fecha), "2026-11-09: Primera conversación.");
  assert.equal(fusionarResumen(null, "  Hola   mundo. ", fecha), "2026-11-09: Hola mundo.");
});

test("nunca pasa del máximo y descarta lo más viejo", () => {
  let mem = "";
  for (let i = 0; i < 40; i++) mem = fusionarResumen(mem, `Conversación número ${i} sobre la app y sus actividades de la semana.`, fecha);
  assert.ok(mem.length <= MAX_RESUMEN);
  assert.ok(mem.startsWith("2026-11-09: Conversación número 39"));
  assert.ok(!mem.includes("número 0 "));
});

test("un resumen nuevo muy largo se recorta sin cortar palabras", () => {
  const r = fusionarResumen("", "palabra ".repeat(400), fecha);
  assert.ok(r.length <= MAX_RESUMEN + 1);
  assert.ok(r.endsWith("…"));
});

test("verifica la firma del webhook de ElevenLabs", async () => {
  const cuerpo = JSON.stringify({ type: "post_call_transcription", data: { conversation_id: "c1" } });
  const t = 1_800_000_000;
  const firma = await hmacHex("secreto-de-prueba", `${t}.${cuerpo}`);
  assert.equal(await verificarFirmaElevenLabs(`t=${t},v0=${firma}`, cuerpo, "secreto-de-prueba", t + 10), true);
  // Cuerpo alterado, secreto equivocado, firma vieja o encabezado ausente: rechazado.
  assert.equal(await verificarFirmaElevenLabs(`t=${t},v0=${firma}`, cuerpo + " ", "secreto-de-prueba", t + 10), false);
  assert.equal(await verificarFirmaElevenLabs(`t=${t},v0=${firma}`, cuerpo, "otro", t + 10), false);
  assert.equal(await verificarFirmaElevenLabs(`t=${t},v0=${firma}`, cuerpo, "secreto-de-prueba", t + 3600), false);
  assert.equal(await verificarFirmaElevenLabs(null, cuerpo, "secreto-de-prueba", t), false);
});
