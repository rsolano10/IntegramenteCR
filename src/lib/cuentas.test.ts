import { test } from "node:test";
import assert from "node:assert/strict";
import { validacionesCuenta } from "./cuentas";

const base = { telefono: "+50688887777", paciente_edad: "78", paciente_nombre: "Rosa", telefono_duplicado: false, posible_duplicado: false };

test("datos completos: sin validaciones", () => {
  assert.deepEqual(validacionesCuenta(base, {}), []);
});

test("faltantes, edad fuera de rango y duplicados", () => {
  const v = validacionesCuenta({ ...base, telefono: null, paciente_edad: "7", telefono_duplicado: true, posible_duplicado: true }, {});
  assert.deepEqual(v, ["No dejó teléfono.", "Edad fuera de rango (7).", "Teléfono repetido en otra cuenta.", "Posible paciente duplicado (mismo nombre y edad)."]);
  assert.deepEqual(validacionesCuenta({ ...base, paciente_edad: "" }, {}), ["Falta la edad."]);
});

test("el teléfono del cuestionario cuenta como teléfono", () => {
  assert.deepEqual(validacionesCuenta({ ...base, telefono: null }, { whatsapp_telefono: "8888 7777" }), []);
});
