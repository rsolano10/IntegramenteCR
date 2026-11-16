import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIONES, LISTA_GUIONES, ayudaDeEtapa, escenasVisibles, guionDe, opcionDe, opcionesSegun, palabras, plantilla, puedeSeguir, textoPrincipal, LIBRE } from "./index.ts";
import { NOMBRES_ICONOS } from "./iconos.ts";
import type { Escena, Guion } from "./tipos.ts";

const guiones = Object.entries(GUIONES);

// Todos los textos visibles de un guion, para revisarlos juntos.
function textos(g: Guion): string[] {
  const out = [g.frase, g.cuidado ?? "", ...g.etiquetas, ...g.ayuda, ...Object.values(g.ayudaPorEtapa ?? {})];
  for (const e of g.escenas) {
    for (const v of Object.values(e)) if (typeof v === "string") out.push(v);
    if ("otras" in e && e.otras) out.push(...e.otras);
    if ("recordatorios" in e) out.push(...e.recordatorios);
    if ("items" in e) out.push(...(Array.isArray(e.items) ? e.items : Object.values(e.items).flat()).map((i) => i.texto));
    if ("opciones" in e) out.push(...e.opciones.map((o) => o.texto));
    if ("sugerencias" in e) out.push(...(Array.isArray(e.sugerencias) ? e.sugerencias : Object.values(e.sugerencias).flat()).map((o) => o.texto));
  }
  return out.filter(Boolean);
}

function iconos(g: Guion): string[] {
  const out: string[] = [g.icono];
  for (const e of g.escenas) {
    if ("icono" in e && e.icono) out.push(e.icono);
    if ("items" in e) out.push(...(Array.isArray(e.items) ? e.items : Object.values(e.items).flat()).map((i) => i.icono));
    if ("opciones" in e) out.push(...e.opciones.map((o) => o.icono));
    if ("sugerencias" in e) out.push(...(Array.isArray(e.sugerencias) ? e.sugerencias : Object.values(e.sugerencias).flat()).map((o) => o.icono));
  }
  return out;
}

const claveDe = (e: Escena) => (e.tipo === "elegir" || e.tipo === "lista" || e.tipo === "ordenar" || e.tipo === "mision" ? e.clave : null);

test("sesiones: cada guion está registrado con su código", () => {
  for (const [codigo, g] of guiones) {
    assert.equal(g.codigo, codigo);
    assert.equal(guionDe(codigo), g);
  }
  assert.equal(Object.keys(GUIONES).length, LISTA_GUIONES.length, "códigos repetidos en la lista");
  assert.equal(guionDe("NO-EXISTE"), null);
  assert.equal(guionDe(null), null);
});

test("sesiones: empiezan y terminan bien", () => {
  for (const [codigo, g] of guiones) {
    assert.equal(g.escenas.at(-1)?.tipo, "cierre", `${codigo} termina en cierre`);
    if (g.ejercicio) assert.equal(g.escenas[0].tipo, "seguridad", `${codigo}: un ejercicio empieza por «Cuándo parar»`);
    assert.ok(g.escenas.length >= 4 && g.escenas.length <= 12, `${codigo}: entre 4 y 12 escenas`);
  }
});

test("sesiones: presupuesto de palabras (una idea por pantalla)", () => {
  for (const [codigo, g] of guiones) {
    assert.ok(palabras(g.frase) <= 16, `${codigo}: frase de portada`);
    for (const e of g.escenas) {
      const t = textoPrincipal(e);
      const tope = e.tipo === "leer" ? 55 : 16;
      assert.ok(palabras(t) <= tope, `${codigo} ${e.tipo}: «${t}» tiene ${palabras(t)} palabras`);
      if ("titulo" in e) assert.ok(palabras(e.titulo) <= 7, `${codigo}: título «${e.titulo}»`);
      if ("nota" in e && e.nota) assert.ok(palabras(e.nota) <= 22, `${codigo}: nota «${e.nota}»`);
      if ("opciones" in e) for (const o of e.opciones) assert.ok(palabras(o.texto) <= 6, `${codigo}: opción «${o.texto}»`);
      if (e.tipo === "cuidados" || e.tipo === "preparar") for (const i of e.items) assert.ok(palabras(i.texto) <= 18, `${codigo}: «${i.texto}»`);
    }
  }
});

test("sesiones: voseo, sin usted ni tú", () => {
  for (const [codigo, g] of guiones)
    for (const t of textos(g)) {
      assert.doesNotMatch(t, /\busted(es)?\b|\btú\b|\btienes\b|\bpuedes\b/i, `${codigo}: «${t}»`);
      assert.doesNotMatch(t, /\s—\s/, `${codigo}: sin rayas «${t}»`);
    }
});

test("sesiones: los dibujos existen", () => {
  for (const [codigo, g] of guiones) for (const i of iconos(g)) assert.ok((NOMBRES_ICONOS as readonly string[]).includes(i), `${codigo}: dibujo «${i}»`);
});

test("sesiones: cada referencia apunta a una respuesta anterior", () => {
  for (const [codigo, g] of guiones) {
    const vistas = new Set<string>();
    const claves: string[] = [];
    for (const e of g.escenas) {
      const refs: string[] = [];
      if (e.si) refs.push(e.si.clave);
      if ((e.tipo === "lista" || e.tipo === "ordenar") && e.segun) refs.push(e.segun);
      if (e.tipo === "repaso") refs.push(...e.partes.map((p) => p.clave));
      for (const t of Object.values(e)) if (typeof t === "string") for (const m of t.matchAll(/\{(\w+)\}/g)) refs.push(m[1]);
      for (const r of refs) assert.ok(vistas.has(r), `${codigo} ${e.tipo}: «${r}» no se respondió antes`);
      const c = claveDe(e);
      if (c) {
        vistas.add(c);
        claves.push(c);
      }
    }
    assert.equal(new Set(claves).size, claves.length, `${codigo}: claves repetidas`);
  }
});

test("sesiones: las sugerencias cubren cada opción elegida", () => {
  for (const [codigo, g] of guiones)
    for (const e of g.escenas) {
      if (e.tipo !== "lista" && e.tipo !== "ordenar") continue;
      const x = e.tipo === "lista" ? e.sugerencias : e.items;
      if (Array.isArray(x)) continue;
      const elegir = g.escenas.find((s) => s.tipo === "elegir" && s.clave === e.segun);
      assert.ok(elegir && elegir.tipo === "elegir", `${codigo}: «segun» apunta a un elegir`);
      for (const o of elegir.opciones) assert.ok(x[o.id]?.length, `${codigo}: faltan sugerencias para «${o.id}»`);
      if (elegir.libre) assert.ok(x.otra?.length, `${codigo}: faltan sugerencias para «otra»`);
      for (const lista of Object.values(x)) assert.equal(new Set(lista.map((o) => o.id)).size, lista.length, `${codigo}: ids repetidos`);
    }
});

test("sesiones: plantillas y respuestas de COG-005", () => {
  const g = GUIONES["COG-005"];
  const decir = g.escenas.find((e) => e.tipo === "decir")!;
  assert.equal(decir.tipo, "decir");
  if (decir.tipo !== "decir") return;
  assert.equal(plantilla(decir.frase, g, { salida: "parque" }), "Pensemos que vamos a ir al parque. ¿Qué prepararíamos antes de salir?");
  assert.equal(plantilla(decir.frase, g, { salida: "otra", salida_texto: "ver el partido" }), "Pensemos que vamos a ver el partido. ¿Qué prepararíamos antes de salir?");
  // Sin respuesta (vista previa): la primera opción, nunca la llave suelta.
  assert.doesNotMatch(plantilla(decir.frase, g, {}), /\{/);

  const elegir = g.escenas[0];
  assert.equal(puedeSeguir(elegir, {}), false);
  assert.equal(puedeSeguir(elegir, { salida: "otra" }), false);
  assert.equal(puedeSeguir(elegir, { salida: "otra", salida_texto: "  " }), false);
  assert.equal(puedeSeguir(elegir, { salida: "otra", salida_texto: "la playa" }), true);

  const lista = g.escenas.find((e) => e.tipo === "lista")!;
  if (lista.tipo !== "lista") return;
  assert.ok(opcionesSegun(lista.sugerencias, lista.segun, { salida: "cita" }).some((o) => o.id === "cedula"));
  assert.ok(opcionesSegun(lista.sugerencias, lista.segun, { salida: "otra" }).length > 0);
  assert.equal(puedeSeguir(lista, { llevar: [] }), false);
  assert.equal(puedeSeguir(lista, { llevar: [`${LIBRE}Un paraguas`] }), true);
  assert.equal(opcionDe(g, "llevar", `${LIBRE}Un paraguas`, {})?.texto, "Un paraguas");
  assert.equal(opcionDe(g, "llevar", "cedula", {})?.texto, "La cédula");
});

test("sesiones: escenas condicionadas", () => {
  const g: Guion = {
    codigo: "X",
    revisado: false,
    frase: "x",
    icono: "estrella",
    etiquetas: [],
    ayuda: [],
    escenas: [
      { tipo: "elegir", clave: "a", titulo: "A", opciones: [{ id: "si", texto: "Sí", icono: "bien" }, { id: "no", texto: "No", icono: "molestia" }] },
      { tipo: "consigna", titulo: "Solo si", texto: "Solo si", si: { clave: "a", es: ["si"] } },
      { tipo: "cierre", texto: "Fin" },
    ],
  };
  assert.equal(escenasVisibles(g, {}).length, 2);
  assert.equal(escenasVisibles(g, { a: "no" }).length, 2);
  assert.equal(escenasVisibles(g, { a: "si" }).length, 3);
});

test("sesiones: ayuda por etapa", () => {
  const g = GUIONES["COG-005"];
  assert.deepEqual(
    ayudaDeEtapa(g, ["moderada"]).map((a) => a.etapa),
    ["moderada"],
  );
  // La clínica (sin etapa) ve todas, en orden.
  assert.deepEqual(
    ayudaDeEtapa(g, []).map((a) => a.etapa),
    ["preventivo", "dcl", "leve", "moderada"],
  );
  assert.deepEqual(ayudaDeEtapa(GUIONES["GER-003"], ["leve"]), []);
});
