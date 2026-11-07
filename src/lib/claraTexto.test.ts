import { test } from "node:test";
import assert from "node:assert/strict";
import { bloquesDeTexto, destinosEnTexto, trozosDeLinea } from "./claraTexto.ts";

test("arma párrafos, listas numeradas y viñetas", () => {
  const b = bloquesDeTexto("Para registrar:\n\n1. Tocá Empezar.\n2. Seguí los pasos.\n\nTambién:\n- Desde Ver detalle\n• Desde el recordatorio\n\n¿Algo más?");
  assert.deepEqual(
    b.map((x) => x.tipo),
    ["parrafo", "numerada", "parrafo", "lista", "parrafo"],
  );
  assert.deepEqual((b[1] as { items: string[] }).items, ["Tocá Empezar.", "Seguí los pasos."]);
  assert.equal((b[3] as { items: string[] }).items.length, 2);
});

test("destaca lo que va entre comillas o asteriscos, sin las comillas", () => {
  const t = trozosDeLinea('Tocá "Empezar" y después «Siguiente» o **Registrar**.');
  assert.deepEqual(
    t.filter((x) => x.destacado).map((x) => x.texto),
    ["Empezar", "Siguiente", "Registrar"],
  );
  assert.equal(t.map((x) => x.texto).join(""), "Tocá Empezar y después Siguiente o Registrar.");
});

test("ofrece ir a las pantallas que Clara nombra", () => {
  assert.deepEqual(destinosEnTexto('En la pestaña "Mi semana" ves todos los días.'), ["semana"]);
  assert.deepEqual(destinosEnTexto("Abrí el menú y tocá Calendario en tu teléfono."), ["calendario"]);
  assert.deepEqual(destinosEnTexto("Usá el botón SOS o mirá Mi semana."), ["semana", "emergencia"]);
  assert.deepEqual(destinosEnTexto("Escribile al equipo por WhatsApp al +506 8346 4703."), ["whatsapp"]);
  assert.deepEqual(destinosEnTexto("Activá los Recordatorios por WhatsApp en Mi cuenta."), ["cuenta"]);
  assert.deepEqual(destinosEnTexto("Tocá «Activar mi programa» y después evaluar la semana."), ["activar", "evaluar"]);
  assert.deepEqual(destinosEnTexto("Tocá Activar mi programa: eso abre WhatsApp con el mensaje."), ["activar"]);
  assert.deepEqual(destinosEnTexto("Hoy es un buen día para empezar."), []);
});
