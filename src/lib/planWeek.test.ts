import { test } from "node:test";
import assert from "node:assert/strict";
import { cuandoEsElDia, diaConFecha } from "./planWeek.ts";

// Miércoles 18 de noviembre de 2026, 10:00 en Costa Rica (16:00 UTC).
const ahora = new Date("2026-11-18T16:00:00Z");

test("cuandoEsElDia: con el inicio del plan, por fecha real", () => {
  // Plan de domingo 15 a sábado 21.
  const inicio = "2026-11-15T06:00:00Z";
  assert.equal(cuandoEsElDia("Lunes", inicio, ahora).tiempo, "pasado");
  assert.equal(cuandoEsElDia("Miércoles", inicio, ahora).tiempo, "hoy");
  assert.equal(cuandoEsElDia("Viernes", inicio, ahora).tiempo, "futuro");
  const viernes = cuandoEsElDia("Viernes", inicio, ahora);
  assert.equal(diaConFecha("Viernes", viernes.fecha), "el viernes 20 de noviembre");
});

test("cuandoEsElDia: un plan que empieza a mitad de semana termina el domingo siguiente", () => {
  // Empieza el martes 17: martes a domingo 22. El domingo es futuro aunque
  // en la semana de domingo a sábado vaya primero.
  const inicio = "2026-11-17T06:00:00Z";
  const domingo = cuandoEsElDia("Domingo", inicio, ahora);
  assert.equal(domingo.tiempo, "futuro");
  assert.equal(diaConFecha("Domingo", domingo.fecha), "el domingo 22 de noviembre");
});

test("cuandoEsElDia: sin inicio del plan, por el orden de la semana", () => {
  assert.equal(cuandoEsElDia("Lunes", null, ahora).tiempo, "pasado");
  assert.equal(cuandoEsElDia("Sábado", null, ahora).tiempo, "futuro");
  assert.equal(diaConFecha("Sábado", null), "el sábado");
});
