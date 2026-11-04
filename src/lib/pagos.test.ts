import { test } from "node:test";
import assert from "node:assert/strict";
import { mensajeCompra, whatsappProvider } from "./pagos";

test("el mensaje de compra lleva el nombre y el plan", () => {
  assert.equal(mensajeCompra({ nombreCuenta: "Ana", nombrePaciente: "Rosa", programa: "autoguiado" }), "Hola, soy Ana. Quiero activar el programa Autoguiado para Rosa en IntegraMente en Casa.");
  assert.equal(mensajeCompra({ nombreCuenta: "Ana", nombrePaciente: "Ana", programa: "autoguiado" }), "Hola, soy Ana. Quiero activar el programa Autoguiado en IntegraMente en Casa.");
});

test("WhatsApp abre wa.me con el mensaje codificado", async () => {
  const r = await whatsappProvider.iniciarCompra({ nombreCuenta: "Ana", programa: "autoguiado" });
  assert.equal(r.externo, true);
  assert.match(r.url, /^https:\/\/wa\.me\/\d+\?text=Hola%2C%20soy%20Ana/);
});
