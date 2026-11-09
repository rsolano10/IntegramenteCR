import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularResumen, titularSemana, type TareaResumen } from "./resumenSemana.ts";

const t = (dia: string, estado: string, modulo: string | null = "cognicion"): TareaResumen => ({ titulo: `${dia}-${estado}`, estado, dia, modulo });

test("cuenta hechas, con ayuda, días activos y la mejor racha", () => {
  const r = calcularResumen([
    t("Domingo", "realizado"),
    t("Lunes", "parcial", "nutricion"),
    t("Martes", "no"),
    t("Miércoles", "realizado"),
    t("Jueves", "realizado", "gerontogimnasia"),
    t("Viernes", "realizado"),
    t("Sábado", "futuro"),
  ]);
  assert.equal(r.total, 6);
  assert.equal(r.hechas, 4);
  assert.equal(r.conAyuda, 1);
  assert.equal(r.logradas, 5);
  assert.equal(r.diasActivos, 5);
  assert.equal(r.racha, 3); // miércoles a viernes
  assert.deepEqual(r.porArea[0], { modulo: "cognicion", hechas: 3, total: 4 });
});

test("semana vacía o sin nada hecho no rompe", () => {
  const r = calcularResumen([]);
  assert.equal(r.pct, 0);
  assert.equal(r.racha, 0);
  assert.equal(calcularResumen([t("Lunes", "no")]).diasActivos, 0);
});

test("el titular celebra y nunca castiga", () => {
  assert.equal(titularSemana(1).titulo, "¡Semana redonda!");
  assert.equal(titularSemana(0.7).titulo, "¡Qué buena semana!");
  assert.equal(titularSemana(0.4).titulo, "Cada paso cuenta");
  assert.equal(titularSemana(0.1).titulo, "Un buen comienzo");
  assert.equal(titularSemana(0).titulo, "Una semana para retomar");
});
