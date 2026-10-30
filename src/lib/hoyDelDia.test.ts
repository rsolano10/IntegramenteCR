import { test } from "node:test";
import assert from "node:assert/strict";
import { minutosDe, ordenarDelDia, estaRegistrada } from "./hoyDelDia";
import type { PlanTask } from "./mockData";

test("minutosDe entiende 24 h y a.m./p.m.", () => {
  assert.equal(minutosDe("17:00"), 17 * 60);
  assert.equal(minutosDe("9:05 a.m."), 9 * 60 + 5);
  assert.equal(minutosDe("5:00 p.m."), 17 * 60);
  assert.equal(minutosDe("12:00 p.m."), 12 * 60);
  assert.equal(minutosDe("12:30 a.m."), 30);
  assert.equal(minutosDe("después del almuerzo"), null);
  assert.equal(minutosDe(""), null);
});

const t = (id: string, hora: string, estado: PlanTask["estado"] = "pendiente") => ({ id, hora, titulo: id, tipo: "actividad", estado }) as PlanTask;

test("ordenarDelDia: por hora y lo que no tiene hora al final", () => {
  const orden = ordenarDelDia([t("c", "sin hora"), t("b", "3:00 p.m."), t("a", "8:00 a.m.")]).map((x) => x.id);
  assert.deepEqual(orden, ["a", "b", "c"]);
});

test("estaRegistrada: cualquier resultado registrado", () => {
  assert.ok(estaRegistrada(t("a", "", "realizado")));
  assert.ok(estaRegistrada(t("a", "", "parcial")));
  assert.ok(estaRegistrada(t("a", "", "no")));
  assert.equal(estaRegistrada(t("a", "", "pendiente")), false);
});
