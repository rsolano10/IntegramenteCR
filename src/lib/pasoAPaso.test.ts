import { test } from "node:test";
import assert from "node:assert/strict";
import { guiaDeTarea, parsearActividad } from "./pasoAPaso";
import type { PlanTask } from "./mockData";

const GER_005 = `Prepará una baranda fija; silla para descansar. Mostrale un movimiento a la vez y permití que pare cuando lo prefiera.
Podés ver el video o demostrarle estas consignas:
1. Sostenete con ambas manos en el apoyo.
2. Despegá un pie apenas del suelo.
3. Apóyelo y cambiá de lado.`;

test("gerontogimnasia: preparación aparte, una consigna numerada por paso", () => {
  const g = parsearActividad(GER_005);
  assert.match(g.prepara!, /^Prepará una baranda fija/);
  assert.deepEqual(g.notas, ["Podés ver el video o demostrarle estas consignas:"]);
  assert.deepEqual(
    g.pasos.map((p) => p.texto),
    ["Sostenete con ambas manos en el apoyo.", "Despegá un pie apenas del suelo.", "Apóyelo y cambiá de lado."],
  );
});

const PRE_004 = `Esta semana, te proponemos incluir pescado en un almuerzo o una cena de tu familiar.
Si usás una lata:
• Compará el sodio entre productos.
• Escurrí el líquido.
También podés ofrecer pescado fresco bien cocido.`;

test("nutrición: un paso por párrafo y las viñetas con su párrafo", () => {
  const g = parsearActividad(PRE_004);
  assert.equal(g.prepara, null);
  assert.equal(g.pasos.length, 3);
  assert.equal(g.pasos[1].texto, "Si usás una lata:");
  assert.deepEqual(g.pasos[1].lista, ["Compará el sodio entre productos.", "Escurrí el líquido."]);
  assert.equal(g.pasos[2].texto, "También podés ofrecer pescado fresco bien cocido.");
});

const tarea = (t: Partial<PlanTask>) => ({ id: "x", hora: "", titulo: "x", tipo: "actividad", estado: "pendiente", ...t }) as PlanTask;

test("prioridad: pasos sueltos, después «Tu actividad», después la descripción", () => {
  assert.deepEqual(guiaDeTarea(tarea({ pasos: ["a", "b"], actividad: GER_005 })).pasos.map((p) => p.texto), ["a", "b"]);
  assert.equal(guiaDeTarea(tarea({ actividad: GER_005 })).pasos.length, 3);
  assert.deepEqual(guiaDeTarea(tarea({ detalle: "Conversen." })).pasos, [{ texto: "Conversen." }]);
  assert.deepEqual(guiaDeTarea(tarea({})).pasos, []);
});

test("materiales como preparación cuando no hay «Prepará…»", () => {
  assert.equal(guiaDeTarea(tarea({ pasos: ["a"], materiales: "Fotos del barrio" })).prepara, "Fotos del barrio");
});
