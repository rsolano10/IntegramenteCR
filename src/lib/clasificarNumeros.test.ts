import { test } from "node:test";
import assert from "node:assert/strict";
import { cajaCorrecta, estadoInicial, generarNumeros, normalizarConfig, numerosDeRonda, reducirJuego, type EstadoJuego } from "./clasificarNumeros.ts";

const config = normalizarConfig({ modo: "clasificar", referencia: 40, numeros: [24, 42, 48, 20, 39, 49, 13, 47], rango: { min: 10, max: 50 }, rondas: 3, mezclar: false });

// Azar determinista para las pruebas.
function semilla(s: number) {
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test("cada número va a la caja de su regla", () => {
  assert.equal(cajaCorrecta(24, config), 0);
  assert.equal(cajaCorrecta(42, config), 1);
  assert.equal(cajaCorrecta(40, config), -1);
  const parImpar = normalizarConfig({ modo: "clasificar", cajas: [{ etiqueta: "Pares", regla: "par" }, { etiqueta: "Impares", regla: "impar" }] });
  assert.equal(cajaCorrecta(8, parImpar), 0);
  assert.equal(cajaCorrecta(7, parImpar), 1);
});

test("genera números distintos, sin la referencia, en el rango y con 2+ por caja", () => {
  for (let s = 1; s < 60; s++) {
    const n = generarNumeros(config, semilla(s));
    assert.equal(n.length, 8);
    assert.equal(new Set(n).size, 8);
    assert.ok(!n.includes(40));
    assert.ok(n.every((x) => x >= 10 && x <= 50));
    assert.ok(n.filter((x) => x < 40).length >= 2);
    assert.ok(n.filter((x) => x > 40).length >= 2);
  }
});

test("la lista fija se usa solo en la primera ronda", () => {
  assert.deepEqual(numerosDeRonda(config, 0), [24, 42, 48, 20, 39, 49, 13, 47]);
  assert.notDeepEqual(numerosDeRonda(config, 1, semilla(3)), [24, 42, 48, 20, 39, 49, 13, 47]);
});

const jugar = (e: EstadoJuego, ...acciones: Parameters<typeof reducirJuego>[1][]) => acciones.reduce((s, a) => reducirJuego(s, a, config, semilla(7)), e);

test("un error devuelve la tarjeta y no la marca como clasificada", () => {
  let e = jugar(estadoInicial(config), { tipo: "empezar" }, { tipo: "seleccionar", tarjeta: 6 }, { tipo: "soltar", caja: 1 }); // 13 en «mayores»
  assert.deepEqual(e.error, { tarjeta: 6, caja: 1 });
  assert.equal(e.clasificados[6], undefined);
  // Mientras se muestra el error no se puede jugar otra tarjeta.
  assert.equal(jugar(e, { tipo: "seleccionar", tarjeta: 0 }).seleccion, null);
  e = jugar(e, { tipo: "devolver" });
  assert.equal(e.error, null);
  e = jugar(e, { tipo: "seleccionar", tarjeta: 6 }, { tipo: "soltar", caja: 0 });
  assert.equal(e.clasificados[6], 0);
  assert.equal(e.errores, 1);
});

test("termina la ronda al clasificar todo y la sesión en la última", () => {
  let e = jugar(estadoInicial(config), { tipo: "empezar" });
  e.numeros.forEach((n, i) => (e = jugar(e, { tipo: "soltar", tarjeta: i, caja: n < 40 ? 0 : 1 })));
  assert.equal(e.rondaTerminada, true);
  e = jugar(e, { tipo: "siguiente" });
  assert.equal(e.ronda, 1);
  assert.deepEqual(e.clasificados, {});
  e = jugar(e, { tipo: "saltar" });
  assert.equal(e.ronda, 2);
  assert.equal(e.rondasSaltadas, 1);
  e.numeros.forEach((n, i) => (e = jugar(e, { tipo: "soltar", tarjeta: i, caja: n < 40 ? 0 : 1 })));
  assert.equal(e.fase, "fin");
  assert.equal(e.rondasCompletas, 2);
});

test("la pausa conserva el estado", () => {
  let e = jugar(estadoInicial(config), { tipo: "empezar" }, { tipo: "soltar", tarjeta: 0, caja: 0 });
  e = jugar(e, { tipo: "pausar" });
  assert.equal(e.fase, "pausa");
  assert.equal(jugar(e, { tipo: "soltar", tarjeta: 1, caja: 1 }).clasificados[1], undefined); // en pausa no se juega
  e = jugar(e, { tipo: "continuar" });
  assert.equal(e.fase, "juego");
  assert.equal(e.clasificados[0], 0);
});
