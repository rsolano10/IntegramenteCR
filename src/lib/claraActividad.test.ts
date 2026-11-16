import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIONES, escenasVisibles, resumenPasos } from "./sesiones";
import { codigosEnTexto, contextoParaClara, contextoParaElegir, describirEscena, sinCodigos } from "./claraActividad";

const g = GUIONES["COG-012"];

test("el contexto de un paso dice la actividad, el paso y la pantalla", () => {
  const escenas = escenasVisibles(g, {});
  const e = escenas[1];
  const txt = contextoParaClara({ titulo: "¿Qué necesitamos llevar?", codigo: "COG-012", modulo: "cognicion", guion: g, escena: e, paso: { n: 2, de: escenas.length }, quien: "familia", nombrePaciente: "Rosa" });
  assert.match(txt, /«¿Qué necesitamos llevar\?» \(COG-012\), categoría Atención y memoria/);
  assert.match(txt, new RegExp(`pantalla 2 de ${escenas.length}`));
  assert.match(txt, /acompaña a Rosa/);
  assert.ok(txt.includes(describirEscena(e, g, {})));
});

test("al participante se le habla simple, y nunca se nombran etapas", () => {
  const txt = contextoParaClara({ titulo: "X", guion: g, escena: null, quien: "participante", ayudaEtapa: ["Ofrecé dos opciones."] });
  assert.match(txt, /persona mayor/);
  assert.match(txt, /No nombres etapas, diagnósticos ni puntajes/);
  assert.doesNotMatch(txt, /deterioro cognitivo|demencia|preventivo|semáforo/i);
});

test("en el tablero, el contexto trae cómo va a ser", () => {
  const txt = contextoParaClara({ titulo: "X", pasos: resumenPasos(g, false), quien: "familia" });
  assert.match(txt, /antes de empezar\. Así va a ser: 1\)/);
});

test("todas las escenas de todos los guiones se pueden describir", () => {
  for (const guion of Object.values(GUIONES)) for (const e of guion.escenas) assert.ok(describirEscena(e, guion, {}).length > 10, `${guion.codigo} ${e.tipo}`);
});

test("elegir: Clara recibe la lista con códigos y la app los lee de la respuesta", () => {
  const txt = contextoParaElegir([{ codigo: "COG-012", titulo: "¿Qué necesitamos llevar?", modulo: "cognicion", duracion: "5–10 min", deQue: "Imaginar una salida." }], "Rosa");
  assert.match(txt, /\[COG-012\] ¿Qué necesitamos llevar\? · Atención y memoria · 5–10 min · Imaginar una salida\./);
  assert.match(txt, /acompaña a Rosa/);
  const r = "Les recomiendo «Pelota y categorías» [MOV-003] para moverse y «¿Qué necesitamos llevar?» [COG-012], que es tranquila. Y de nuevo [MOV-003].";
  assert.deepEqual(codigosEnTexto(r), ["MOV-003", "COG-012"]);
  assert.equal(sinCodigos(r), "Les recomiendo «Pelota y categorías» para moverse y «¿Qué necesitamos llevar?», que es tranquila. Y de nuevo.");
});
