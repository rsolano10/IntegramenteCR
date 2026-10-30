import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluarAsignacion, gruposDeLaSemana, type PerfilRecursos, type RecursoAsignable } from "./reglasRecursos";

const ger = (n: number, extra: Partial<RecursoAsignable> = {}): RecursoAsignable => ({
  codigo: `GER-${String(n).padStart(3, "0")}`,
  modulo: "gerontogimnasia",
  niveles_cognitivos: ["preventivo", "dcl", "leve", "moderada", "avanzada"],
  niveles_motores: n === 1 || n === 2 || n === 10 ? ["verde", "amarillo", "rojo"] : ["verde", "amarillo"],
  permite_doble_tarea: false,
  requiere_supervision: n === 9 ? "ayuda_fisica_entrenada" : null,
  ...extra,
});

const pre = (codigo: string, extra: Partial<RecursoAsignable> = {}): RecursoAsignable => ({
  codigo,
  modulo: "nutricion",
  niveles_cognitivos: ["preventivo", "dcl", "leve", "moderada", "avanzada"],
  niveles_motores: null,
  ...extra,
});

const perfil = (p: Partial<PerfilRecursos> = {}): PerfilRecursos => ({ etapas: ["dcl"], ruta: "verde", ...p });
const permitido = (r: ReturnType<typeof evaluarAsignacion>) => r.permitido;

test("ruta roja: solo GER-001, GER-002 y GER-010", () => {
  const rojo = perfil({ ruta: "rojo" });
  for (let n = 1; n <= 10; n++) {
    const esperado = n === 1 || n === 2 || n === 10;
    assert.equal(permitido(evaluarAsignacion(ger(n), rojo, {})), esperado, `GER-${n}`);
  }
});

test("GER-003 a GER-008 en verde y amarillo", () => {
  for (const ruta of ["verde", "amarillo"] as const) {
    for (let n = 3; n <= 8; n++) assert.ok(permitido(evaluarAsignacion(ger(n), perfil({ ruta }))), `GER-${n} ${ruta}`);
  }
});

test("GER-009 solo con ayuda física entrenada", () => {
  assert.equal(permitido(evaluarAsignacion(ger(9), perfil({ supervision: "guia_verbal" }))), false);
  assert.equal(permitido(evaluarAsignacion(ger(9), perfil({ supervision: null }))), false);
  assert.ok(permitido(evaluarAsignacion(ger(9), perfil({ supervision: "ayuda_fisica_entrenada" }))));
  assert.equal(permitido(evaluarAsignacion(ger(9), perfil({ ruta: "rojo", supervision: "ayuda_fisica_entrenada" }))), false);
});

test("doble tarea: nunca por defecto y nunca en demencia avanzada", () => {
  for (const n of [4, 5, 6, 7, 9]) {
    assert.equal(permitido(evaluarAsignacion(ger(n), perfil({ supervision: "ayuda_fisica_entrenada" }), { dobleTarea: true })), false, `GER-${n}`);
  }
  const conDoble = ger(1, { permite_doble_tarea: true });
  assert.ok(permitido(evaluarAsignacion(conDoble, perfil(), { dobleTarea: true })));
  assert.equal(permitido(evaluarAsignacion(conDoble, perfil({ etapas: ["avanzada"] }), { dobleTarea: true, conIndicacionIndividual: true })), false);
});

test("demencia avanzada: GER solo con pauta individual, salvo la introducción", () => {
  const avanzada = perfil({ etapas: ["avanzada"], ruta: "rojo" });
  assert.equal(permitido(evaluarAsignacion(ger(1), avanzada)), false);
  assert.ok(permitido(evaluarAsignacion(ger(1), avanzada, { conIndicacionIndividual: true })));
  assert.ok(permitido(evaluarAsignacion(ger(10), avanzada)));
});

test("ruta sin dato se trata como amarillo", () => {
  assert.ok(permitido(evaluarAsignacion(ger(3), perfil({ ruta: null }))));
});

test("estado bloqueado impide asignar; en revisión no", () => {
  assert.equal(permitido(evaluarAsignacion(pre("PRE-002", { estado_clinico: "bloqueado" }), perfil())), false);
  assert.ok(permitido(evaluarAsignacion(pre("PRE-002", { estado_clinico: "en_revision" }), perfil())));
});

test("alergias registradas excluyen; sin dato no", () => {
  const pescado = pre("PRE-004", { alergenos: ["pescado"] });
  assert.equal(permitido(evaluarAsignacion(pescado, perfil({ nutricion: { alergias: { pescado: true } } }))), false);
  assert.ok(permitido(evaluarAsignacion(pescado, perfil({ nutricion: { alergias: { pescado: false } } }))));
  assert.ok(permitido(evaluarAsignacion(pescado, perfil({ nutricion: {} }))));
  assert.ok(permitido(evaluarAsignacion(pescado, perfil({ nutricion: null }))));
  const leche = pre("PRE-048", { alergenos: ["huevo", "leche"] });
  assert.equal(permitido(evaluarAsignacion(leche, perfil({ nutricion: { alergias: { leche: true } } }))), false);
  assert.equal(permitido(evaluarAsignacion(leche, perfil({ nutricion: { alergias: { huevo: true } } }))), false);
});

test("disfagia sin textura prescrita excluye; con textura no", () => {
  const nueces = pre("PRE-006", { exclusiones: ["disfagia_sin_textura"] });
  assert.equal(permitido(evaluarAsignacion(nueces, perfil({ nutricion: { disfagia: true } }))), false);
  assert.ok(permitido(evaluarAsignacion(nueces, perfil({ nutricion: { disfagia: true, textura_prescrita: "picada fina" } }))));
  assert.ok(permitido(evaluarAsignacion(nueces, perfil({ nutricion: { disfagia: false } }))));
});

test("riesgo de desnutrición: no automático, sí con indicación individual", () => {
  const azucar = pre("PRE-009", { exclusiones: ["desnutricion"] });
  assert.equal(permitido(evaluarAsignacion(azucar, perfil({ nutricion: { desnutricion: true } }))), false);
  assert.ok(permitido(evaluarAsignacion(azucar, perfil({ nutricion: { desnutricion: true } }), { conIndicacionIndividual: true })));
});

test("audiencia: PRE-046 solo demencia", () => {
  const pre046 = pre("PRE-046", { niveles_cognitivos: ["leve", "moderada", "avanzada"] });
  assert.equal(permitido(evaluarAsignacion(pre046, perfil({ etapas: ["preventivo"] }))), false);
  assert.ok(permitido(evaluarAsignacion(pre046, perfil({ etapas: ["moderada"] }))));
});

test("rotación semanal: un recurso por grupo por semana", () => {
  const p004 = pre("PRE-004", { grupo_rotacion: "pescado" });
  const p037 = pre("PRE-037", { grupo_rotacion: "pescado" });
  const p005 = pre("PRE-005", { grupo_rotacion: "hojas_verdes" });
  const semana = gruposDeLaSemana([p004, { grupo_rotacion: null }]);
  assert.deepEqual(semana, ["pescado"]);
  assert.equal(permitido(evaluarAsignacion(p037, perfil(), { gruposSemana: semana })), false);
  assert.ok(permitido(evaluarAsignacion(p005, perfil(), { gruposSemana: semana })));
  assert.ok(permitido(evaluarAsignacion(p037, perfil(), { gruposSemana: [] })));
});

test("los seis grupos de rotación se excluyen entre sí", () => {
  const grupos: Record<string, string[]> = {
    pescado: ["PRE-004", "PRE-037", "PRE-044"],
    hojas_verdes: ["PRE-005", "PRE-042"],
    aceite: ["PRE-012", "PRE-039"],
    hidratacion: ["PRE-003", "PRE-027"],
    ritmo_comer: ["PRE-023", "PRE-046"],
    desayuno_proteico: ["PRE-022", "PRE-048"],
  };
  for (const [grupo, codigos] of Object.entries(grupos)) {
    for (const c of codigos.slice(1)) {
      const r = pre(c, { grupo_rotacion: grupo, niveles_cognitivos: null });
      assert.equal(permitido(evaluarAsignacion(r, perfil(), { gruposSemana: [grupo] })), false, `${c} con ${grupo}`);
    }
  }
});
