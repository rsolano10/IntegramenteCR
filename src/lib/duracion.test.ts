import { test } from "node:test";
import assert from "node:assert/strict";
import { duracionCorta } from "./duracion";

test("duracionCorta deja los formatos parejos", () => {
  assert.equal(duracionCorta("10-15 min"), "10 a 15 min");
  assert.equal(duracionCorta("De 3 a 8 minutos."), "3 a 8 min");
  assert.equal(duracionCorta("5–10 minutos, ajustables al interés y tolerancia."), "5 a 10 min");
  assert.equal(duracionCorta("15 min"), "15 min");
  assert.equal(duracionCorta(null), null);
  assert.equal(duracionCorta("Lo que dure la conversación"), null);
});
