import { test } from "node:test";
import assert from "node:assert/strict";
import { crearAzar } from "./azar.ts";
import { NIVELES, resolverConfig, type ExtrasInteractiva } from "./contrato.ts";
import { ACTIVIDADES, prepararSesion } from "./registro.ts";
import { esGrupoValido, generarClasificar, clasificarObjetos } from "./clasificarObjetos.ts";
import { alcanzable, colones, combinacion, generarPago, pagoExacto, revisarPago } from "./pagoExacto.ts";
import { esSiguienteValida, generarPasos, generarSecuencia, ordenarSecuencia, siguienteCorrecta } from "./ordenar.ts";
import { formarPalabra, generarPalabra, palabraFormada, prefijoCorrecto } from "./formarPalabra.ts";
import { continuar, estadoParejas, generarParejas, parejas, parejasCompletas, voltear } from "./parejas.ts";
import { generarPosiciones, revisarPosiciones } from "./recordarPosiciones.ts";
import { generarIguales, indicesObjetivo, revisarIguales } from "./encontrarIguales.ts";
import { generarContar, revisarConteo } from "./contarPorTipo.ts";
import { generarPregunta, momentoCR, orientacionHoy, parteDelDia } from "./orientacionHoy.ts";
import { esInteractivo } from "../clasificarNumeros.ts";

const ex = (tipo: string, extra: Partial<ExtrasInteractiva> = {}): ExtrasInteractiva => ({ modo: "interactiva", tipo, ...extra });
// Martes 10 de noviembre de 2026, 9 a. m. en Costa Rica (15:00 UTC).
const AHORA = new Date("2026-11-10T15:00:00Z");

// ─── Transversal ───

test("cada tipo del registro está completo y su configuración por defecto valida en los tres niveles", () => {
  const tipos = new Set<string>();
  for (const def of ACTIVIDADES) {
    assert.ok(def.tipo && def.nombre && def.area && def.funcion && def.version >= 1, def.tipo);
    assert.ok(!tipos.has(def.tipo), `tipo repetido: ${def.tipo}`);
    tipos.add(def.tipo);
    for (const campo of def.campos) for (const n of NIVELES) assert.ok(campo.clave in def.porNivel[n], `${def.tipo}: ${campo.clave} sin valor en ${n}`);
    for (const nivel of NIVELES) {
      const config = def.porNivel[nivel];
      assert.deepEqual(def.validar(config), [], `${def.tipo} ${nivel}`);
      const s = prepararSesion(ex(def.tipo, { nivel }), 1, AHORA);
      assert.ok(s.ok, `${def.tipo} ${nivel}`);
      if (s.ok) assert.ok(s.ejercicios.length >= 1);
      assert.ok(def.consigna(config).length > 10);
    }
  }
  assert.equal(ACTIVIDADES.length, 10);
});

test("misma semilla, mismos ejercicios; otra semilla, otros", () => {
  for (const def of ACTIVIDADES) {
    if (def.tipo === "orientacion-hoy") continue; // depende del momento, no del azar
    const a = prepararSesion(ex(def.tipo, { nivel: "medio" }), 42, AHORA);
    const b = prepararSesion(ex(def.tipo, { nivel: "medio" }), 42, AHORA);
    const c = prepararSesion(ex(def.tipo, { nivel: "medio" }), 7, AHORA);
    assert.ok(a.ok && b.ok && c.ok);
    assert.deepEqual(a.ejercicios, b.ejercicios, def.tipo);
    assert.notDeepEqual(a.ejercicios, c.ejercicios, def.tipo);
  }
});

test("config.semilla fija la sesión aunque cambie la semilla de afuera", () => {
  const a = prepararSesion(ex("parejas", { config: { semilla: 5 } }), 1);
  const b = prepararSesion(ex("parejas", { config: { semilla: 5 } }), 2);
  assert.ok(a.ok && b.ok);
  assert.deepEqual(a.ejercicios, b.ejercicios);
});

test("cantidad de ejercicios: 5 por defecto, entre 3 y 10", () => {
  const n = (e?: number) => {
    const s = prepararSesion(ex("parejas", { ejercicios: e }), 1);
    return s.ok ? s.ejercicios.length : -1;
  };
  assert.equal(n(), 5);
  assert.equal(n(1), 3);
  assert.equal(n(50), 10);
  assert.equal(n(7), 7);
});

test("tipo inexistente o configuración inválida: errores, nunca excepción", () => {
  assert.equal(prepararSesion(ex("no-existe"), 1).ok, false);
  const s = prepararSesion(ex("parejas", { config: { pares: 40 } }), 1);
  assert.equal(s.ok, false);
  if (!s.ok) assert.match(s.errores[0], /entre 3 y 8/);
  assert.equal(prepararSesion(ex("pago-exacto", { config: { denominaciones: [] } }), 1).ok, false);
});

test("la clínica pisa campo por campo; las claves desconocidas se ignoran", () => {
  const c = resolverConfig(parejas, ex("parejas", { nivel: "retador", config: { pares: 4, inventado: 1 } }));
  assert.equal(c.pares, 4);
  assert.equal(c.numerarReverso, false);
  assert.ok(!("inventado" in c));
});

test("las actividades nuevas se marcan como interactivas", () => {
  assert.ok(esInteractivo(ex("parejas")));
  assert.ok(esInteractivo({ modo: "clasificar" }));
  assert.ok(!esInteractivo({ modo: "tabla" }));
});

// ─── Cada cosa en su lugar ───

test("clasificar: respeta grupos y cantidad, al menos uno por grupo, ejemplos aparte", () => {
  for (let s = 1; s < 40; s++) {
    const c = { ...clasificarObjetos.porNivel.retador, paquete: ["cocina", "casa", "reciclaje", "categorias"][s % 4] };
    const ej = generarClasificar(c, crearAzar(s));
    assert.equal(ej.grupos.length, 4);
    assert.equal(ej.elementos.length, 12);
    for (const g of ej.grupos) assert.ok(ej.elementos.some((e) => esGrupoValido(e, g.id)));
    assert.ok(ej.elementos.every((e) => e.validos.length > 0));
    assert.equal(new Set(ej.elementos.map((e) => e.texto)).size, 12);
  }
  const suave = generarClasificar(clasificarObjetos.porNivel.suave, crearAzar(3));
  assert.equal(suave.ejemplos.length, 2);
  assert.ok(suave.ejemplos.every((x) => !suave.elementos.some((e) => e.texto === x.texto)));
});

test("clasificar: un elemento puede tener más de un grupo válido", () => {
  assert.ok(esGrupoValido({ validos: ["refri", "alacena"] }, "alacena"));
  assert.ok(clasificarObjetos.validar({ paquete: "cocina", grupos: 2, elementosPorEjercicio: 12, mostrarAyuda: true }).length > 0);
});

// ─── Pagar justo ───

test("pago: el monto siempre es alcanzable, múltiplo y en rango", () => {
  for (const nivel of NIVELES)
    for (let s = 1; s < 40; s++) {
      const c = pagoExacto.porNivel[nivel];
      const ej = generarPago(c, crearAzar(s));
      assert.ok(ej.monto >= c.montoMin && ej.monto <= c.montoMax);
      assert.equal(ej.monto % c.multiploDe, 0);
      const comb = combinacion(ej.monto, ej.denominaciones);
      assert.ok(comb && comb.reduce((a, b) => a + b, 0) === ej.monto);
    }
});

test("pago: cualquier combinación que sume vale; la dirección del error", () => {
  assert.equal(revisarPago(1350, [500, 500, 100, 100, 100, 50]), "justo");
  assert.equal(revisarPago(1350, [1000, 100, 100, 100, 50]), "justo");
  assert.equal(revisarPago(1350, [1000]), "falta");
  assert.equal(revisarPago(1350, [2000]), "sobra");
  assert.equal(alcanzable(150, [100, 500]), false);
  assert.equal(colones(1350), "₡1 350");
  assert.equal(colones(500), "₡500");
  assert.ok(pagoExacto.validar({ montoMin: 150, montoMax: 150, denominaciones: [100], multiploDe: 50, mostrarSuma: true }).length > 0);
});

// ─── Ordenar ───

test("paso a paso: subconjunto en orden, intercambiables aceptados", () => {
  const [ej] = generarPasos({ rutinas: ["cafe"], pasos: 7 }, 1, crearAzar(2));
  assert.equal(ej.tarjetas.length, 7);
  const porOrden = (o: number) => ej.tarjetas.find((t) => t.orden === o)!.id;
  // «Poner a hervir el agua» y «Poner la bolsita» (0 y 1) en cualquier orden.
  assert.ok(esSiguienteValida(ej, [], porOrden(0)));
  assert.ok(esSiguienteValida(ej, [], porOrden(1)));
  assert.ok(!esSiguienteValida(ej, [], porOrden(2)));
  assert.ok(esSiguienteValida(ej, [porOrden(1)], porOrden(0)));
  assert.equal(siguienteCorrecta(ej, [porOrden(0)]), porOrden(1));
  for (let s = 1; s < 30; s++) {
    const [e3] = generarPasos({ rutinas: [], pasos: 3 }, 1, crearAzar(s));
    assert.equal(e3.tarjetas.length, 3);
    assert.notDeepEqual(
      e3.tarjetas.map((t) => t.orden),
      [0, 1, 2],
    );
  }
});

test("en orden: números distintos, en rango y desordenados; palabras en orden alfabético", () => {
  for (let s = 1; s < 30; s++) {
    const ej = generarSecuencia(ordenarSecuencia.porNivel.retador, crearAzar(s));
    const vals = ej.tarjetas.map((t) => Number(t.texto));
    assert.equal(new Set(vals).size, 9);
    assert.ok(vals.every((v) => v >= 1 && v <= 1000));
    const ordenados = [...ej.tarjetas].sort((a, b) => a.orden - b.orden).map((t) => Number(t.texto));
    assert.deepEqual(ordenados, [...ordenados].sort((a, b) => a - b));
  }
  const pal = generarSecuencia({ ...ordenarSecuencia.porNivel.medio, contenido: "palabras", cantidad: 5, palabras: ["Rosa", "ana", "Bernardo", "Zoila", "mario"] }, crearAzar(1));
  assert.deepEqual(
    [...pal.tarjetas].sort((a, b) => a.orden - b.orden).map((t) => t.texto),
    ["ana", "Bernardo", "mario", "Rosa", "Zoila"],
  );
  const desc = generarSecuencia({ ...ordenarSecuencia.porNivel.suave, sentido: "descendente" }, crearAzar(1));
  const d = [...desc.tarjetas].sort((a, b) => a.orden - b.orden).map((t) => Number(t.texto));
  assert.deepEqual(d, [...d].sort((a, b) => b - a));
  const misma = generarSecuencia({ ...ordenarSecuencia.porNivel.medio, contenido: "palabras", cantidad: 5, mismaInicial: true }, crearAzar(4));
  assert.equal(new Set(misma.tarjetas.map((t) => t.texto[0].toUpperCase())).size, 1);
});

// ─── Armá la palabra ───

test("palabra: largo en rango, primera letra puesta en suave, tildes y ñ como una letra", () => {
  const s = prepararSesion(ex("formar-palabra", { nivel: "suave", ejercicios: 10 }), 3);
  assert.ok(s.ok);
  for (const ej of s.ejercicios as ReturnType<typeof generarPalabra>[]) {
    assert.ok(ej.objetivo.length >= 3 && ej.objetivo.length <= 4);
    assert.equal(ej.fijas, 1);
    assert.equal(ej.fichas[0].letra, ej.objetivo[0]);
    assert.ok(ej.pista);
  }
  const pina = generarPalabra("piña", null, formarPalabra.porNivel.medio, crearAzar(1), []);
  assert.deepEqual(pina.objetivo, ["p", "i", "ñ", "a"]);
  assert.ok(palabraFormada(pina, ["P", "I", "Ñ", "A"]));
  assert.equal(prefijoCorrecto(pina.objetivo, ["p", "i", "a"]), 2);
});

test("palabra: acepta otra palabra del banco con las mismas letras y usa la lista propia", () => {
  const ej = generarPalabra("amor", null, formarPalabra.porNivel.medio, crearAzar(1), ["roma", "ramo", "mesa"]);
  assert.ok(palabraFormada(ej, ["r", "a", "m", "o"]));
  assert.ok(!palabraFormada(ej, ["m", "a", "r", "o"]));
  const s = prepararSesion(ex("formar-palabra", { config: { palabras: ["Lucía", "Tito"] } }), 1);
  assert.ok(s.ok);
  if (s.ok) assert.ok((s.ejercicios as { objetivo: string[] }[]).every((e) => ["Lucía", "Tito"].includes(e.objetivo.join(""))));
  assert.ok(formarPalabra.validar({ ...formarPalabra.porNivel.suave, palabras: ["dos palabras"] }).length > 0);
});

// ─── Parejas ───

test("parejas: cada pareja tiene dos cartas; no se voltean solas", () => {
  const ej = generarParejas(parejas.porNivel.retador, crearAzar(9));
  assert.equal(ej.cartas.length, 16);
  for (let k = 0; k < 8; k++) assert.equal(ej.cartas.filter((c) => c.pareja === k).length, 2);
  const a = ej.cartas[0];
  const par = ej.cartas.find((c) => c.id !== a.id && c.pareja === a.pareja)!;
  const otra = ej.cartas.find((c) => c.pareja !== a.pareja)!;
  let e = estadoParejas();
  e = voltear(ej, e, a.id).estado;
  const r = voltear(ej, e, otra.id);
  assert.equal(r.resultado, "distintas");
  assert.equal(r.estado.esperando, true);
  // Mientras esperan «Continuar», no se puede voltear otra.
  assert.equal(voltear(ej, r.estado, par.id).resultado, "nada");
  e = continuar(r.estado);
  assert.deepEqual(e.volteadas, []);
  e = voltear(ej, voltear(ej, e, a.id).estado, par.id).estado;
  assert.deepEqual(e.encontradas.sort(), [a.id, par.id].sort());
  assert.ok(!parejasCompletas(ej, e));
  const ip = generarParejas({ ...parejas.porNivel.suave, contenido: "icono-palabra" }, crearAzar(1));
  for (let k = 0; k < 3; k++) assert.deepEqual(ip.cartas.filter((c) => c.pareja === k).map((c) => c.cara.tipo).sort(), ["icono", "palabra"]);
});

// ─── Ventanas encendidas ───

test("ventanas: encendidas distintas dentro de la grilla; reintento conserva aciertos", () => {
  for (let s = 1; s < 30; s++) {
    const ej = generarPosiciones({ filas: 4, columnas: 4, encendidas: 6, permitirVerDeNuevo: false }, crearAzar(s));
    assert.equal(new Set(ej.encendidas).size, 6);
    assert.ok(ej.encendidas.every((i) => i >= 0 && i < 16));
  }
  const ej = { filas: 2, columnas: 3, encendidas: [1, 4] };
  assert.ok(revisarPosiciones(ej, [4, 1]).correcto);
  const r = revisarPosiciones(ej, [1, 2]);
  assert.deepEqual(r, { correcto: false, aciertos: [1], sobran: [2], faltan: 1 });
});

// ─── Buscá los iguales ───

test("iguales: cantidad exacta de objetivos; parecido alto usa la misma familia", () => {
  for (const contenido of ["figuras", "letras", "numeros"] as const)
    for (let s = 1; s < 30; s++) {
      const ej = generarIguales({ contenido, total: 20, objetivos: 6, parecido: "alto" }, crearAzar(s));
      assert.equal(ej.celdas.length, 20);
      assert.equal(indicesObjetivo(ej).length, 6);
    }
  const ej = generarIguales({ contenido: "letras", total: 12, objetivos: 4, parecido: "alto" }, crearAzar(2));
  const objetivo = indicesObjetivo(ej);
  assert.ok(revisarIguales(ej, objetivo).correcto);
  const r = revisarIguales(ej, [...objetivo.slice(1), ej.celdas.findIndex((x) => x !== ej.modelo)]);
  assert.equal(r.faltan.length, 1);
  assert.equal(r.sobran.length, 1);
});

// ─── ¿Cuántos hay? ───

test("contar: cantidades entre 1 y el máximo; señala el primer tipo a revisar", () => {
  for (let s = 1; s < 30; s++) {
    const ej = generarContar({ tipos: 4, maxPorTipo: 9, banco: "mesa", agrupados: false, tamanoVariado: true }, crearAzar(s));
    assert.equal(ej.tipos.length, 4);
    for (const t of ej.tipos) {
      assert.ok(t.cantidad >= 1 && t.cantidad <= 9);
      assert.equal(ej.items.filter((i) => i.tipo === t.id).length, t.cantidad);
    }
  }
  const ej = generarContar({ tipos: 2, maxPorTipo: 4, banco: "frutas", agrupados: true, tamanoVariado: false }, crearAzar(1));
  const bien = Object.fromEntries(ej.tipos.map((t) => [t.id, t.cantidad]));
  assert.equal(revisarConteo(ej, bien), null);
  assert.equal(revisarConteo(ej, { ...bien, [ej.tipos[1].id]: 0 })?.id, ej.tipos[1].id);
  // Agrupados: cada tipo junto.
  assert.deepEqual(
    ej.items.map((i) => i.tipo),
    ej.tipos.flatMap((t) => Array(t.cantidad).fill(t.id)),
  );
});

// ─── El día de hoy ───

test("orientación: usa la hora de Costa Rica, no la del navegador", () => {
  // 3 a. m. UTC del miércoles = 9 p. m. del martes en Costa Rica.
  const m = momentoCR(new Date("2026-11-11T03:00:00Z"));
  assert.equal(m.diaSemana, 2);
  assert.equal(m.hora, 21);
  assert.equal(parteDelDia(m.hora), 2);
  assert.equal(parteDelDia(9), 0);
  assert.equal(parteDelDia(14), 1);
});

test("orientación: respuestas correctas, opciones sin repetir y con la correcta", () => {
  const c = orientacionHoy.porNivel.retador;
  const az = crearAzar(1);
  const r = Object.fromEntries(c.preguntas.map((p) => [p, generarPregunta(p, c, AHORA, az)]));
  assert.equal(r["dia-semana"].correcta, "martes");
  assert.equal(r.ayer.correcta, "lunes");
  assert.equal(r.manana.correcta, "miércoles");
  assert.equal(r.mes.correcta, "noviembre");
  assert.equal(r.anio.correcta, "2026");
  assert.equal(r["parte-dia"].correcta, "la mañana");
  assert.equal(r.epoca.correcta, "la época lluviosa (invierno)");
  for (const ej of Object.values(r)) {
    assert.ok(ej.opciones.includes(ej.correcta));
    assert.equal(new Set(ej.opciones).size, ej.opciones.length);
  }
  assert.equal(r["dia-semana"].opciones.length, 4);
  // Cercanos: los días de al lado.
  assert.ok(r["dia-semana"].opciones.includes("lunes") && r["dia-semana"].opciones.includes("miércoles"));
  const dic = generarPregunta("epoca", c, new Date("2026-12-15T15:00:00Z"), az);
  assert.equal(dic.correcta, "la época seca (verano)");
  const s = prepararSesion(ex("orientacion-hoy", { nivel: "suave", ejercicios: 9 }), 1, AHORA);
  assert.ok(s.ok && s.ejercicios.length === 2);
});
