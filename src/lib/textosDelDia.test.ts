import { test } from "node:test";
import assert from "node:assert/strict";
import { cierreDelDia, mensajeDelDia } from "./textosDelDia";

const manana = (cantidad: number) => ({ dia: "Martes", cantidad, esManana: true });

test("cierre: singular y plural concuerdan", () => {
  assert.equal(cierreDelDia(0, manana(1), "familia").detalle, "A descansar. Mañana hay 1 actividad nueva.");
  assert.equal(cierreDelDia(0, manana(3), "familia").detalle, "A descansar. Mañana hay 3 actividades nuevas.");
  assert.equal(cierreDelDia(2, manana(1), "familia").detalle, "Mañana les espera 1 actividad nueva.");
  assert.equal(cierreDelDia(2, manana(3), "familia").detalle, "Mañana les esperan 3 actividades nuevas.");
});

test("cierre: al participante se le habla de vos", () => {
  assert.equal(cierreDelDia(1, manana(1), "participante").detalle, "Mañana te espera 1 actividad nueva.");
  assert.equal(cierreDelDia(1, { dia: "Jueves", cantidad: 2, esManana: false }, "participante").detalle, "El jueves te esperan 2 actividades nuevas.");
});

test("avance: con todo registrado, dice lo que pasó (sin celebrar dos veces)", () => {
  assert.deepEqual(mensajeDelDia({ hechas: 2, pendientes: 0, total: 2, enteras: 1, enParte: 1 }, "familia", "Rosa"), { titulo: "Registraron las 2 actividades de hoy", detalle: "1 hecha y 1 en parte." });
  assert.deepEqual(mensajeDelDia({ hechas: 2, pendientes: 0, total: 2, enteras: 2 }, "familia", "Rosa"), { titulo: "Registraron las 2 actividades de hoy", detalle: "Las 2 hechas." });
  assert.equal(mensajeDelDia({ hechas: 1, pendientes: 0, total: 3, enteras: 1, no: 2 }, "familia", null).detalle, "1 hecha y 2 que no se hicieron.");
  assert.equal(mensajeDelDia({ hechas: 1, pendientes: 0, total: 1, enteras: 1 }, "participante", null).titulo, "Registraste la actividad de hoy");
  assert.equal(mensajeDelDia({ hechas: 0, pendientes: 2, total: 2 }, "familia", "Rosa").titulo, "2 actividades para hoy");
  assert.equal(mensajeDelDia({ hechas: 1, pendientes: 1, total: 3 }, "familia", null).titulo, "Falta solo una");
  assert.equal(mensajeDelDia({ hechas: 0, pendientes: 1, total: 1 }, "participante", "Rosa").titulo, "Hoy toca 1 actividad");
});
