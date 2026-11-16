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

test("avance: un «No se hizo» no es día completo ni fracaso", () => {
  assert.equal(mensajeDelDia({ hechas: 2, pendientes: 0, total: 2 }, "familia", "Rosa").titulo, "¡Día completo!");
  assert.equal(mensajeDelDia({ hechas: 1, pendientes: 0, total: 2 }, "familia", "Rosa").titulo, "Listo por hoy");
  assert.equal(mensajeDelDia({ hechas: 0, pendientes: 2, total: 2 }, "familia", "Rosa").titulo, "2 actividades para hoy con Rosa");
  assert.equal(mensajeDelDia({ hechas: 1, pendientes: 1, total: 3 }, "familia", null).titulo, "Falta solo una");
  assert.equal(mensajeDelDia({ hechas: 0, pendientes: 1, total: 1 }, "participante", "Rosa").titulo, "Hoy toca 1 actividad");
});
