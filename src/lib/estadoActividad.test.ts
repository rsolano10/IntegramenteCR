import { test } from "node:test";
import assert from "node:assert/strict";
import { ETIQUETA_ESTADO, contarHechas, estaRegistrada } from "./estadoActividad";

test("un solo vocabulario: Hecha / En parte / No se hizo", () => {
  assert.equal(ETIQUETA_ESTADO.realizado, "Hecha");
  assert.equal(ETIQUETA_ESTADO.parcial, "En parte");
  assert.equal(ETIQUETA_ESTADO.no, "No se hizo");
  assert.equal(ETIQUETA_ESTADO.pendiente, undefined);
});

test("el anillo cuenta las hechas; un «No» queda registrado pero no hecho", () => {
  const dia = [{ estado: "realizado" }, { estado: "parcial" }, { estado: "no" }, { estado: "pendiente" }];
  assert.equal(contarHechas(dia), 2);
  assert.equal(dia.filter(estaRegistrada).length, 3);
});
