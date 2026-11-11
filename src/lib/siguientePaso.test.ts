import { test } from "node:test";
import assert from "node:assert/strict";
import { enVista, siguientePaso } from "./siguientePaso.ts";
import type { FilaCuenta } from "./cuentas.ts";

const AHORA = new Date("2026-11-11T12:00:00Z").getTime();
const p = (x: Partial<Parameters<typeof siguientePaso>[0]> = {}) => ({ plan_status: "asignado" as const, needs_review: false, needs_assignment: false, posible_duplicado_de: null, posible_duplicado_nombre: null, ...x });
const f = (x: Partial<FilaCuenta>): FilaCuenta =>
  ({ profile_id: "u", nombre: "Ana", email: null, telefono: null, role: "familiar", estado: "activa", estado_desde: null, registrado_en: "", patient_id: "p", paciente_nombre: "Rosa", paciente_edad: "70", modalidad: null, demo_fin: null, ultima_actividad: null, requiere_contacto: false, requiere_contacto_nota: null, rechazo_motivo: null, pagada_desde: null, posible_duplicado: false, telefono_duplicado: false, semana_gratis_solicitada: false, ...x }) as FilaCuenta;

test("aprobar va antes que todo lo demás", () => {
  const paso = siguientePaso(p({ plan_status: "pendiente", needs_review: true }), f({ estado: "pendiente_aprobacion", estado_desde: "2026-11-10T10:00:00Z" }), AHORA);
  assert.equal(paso?.tipo, "aprobar");
  assert.equal(paso?.porque, "Completó el cuestionario ayer");
  assert.equal(siguientePaso(p(), f({ estado: "pendiente_aprobacion", requiere_contacto: true }), AHORA)?.porque, "Requiere contacto antes de aprobar");
});

test("semana gratis: solo pide cobrar cuando termina pronto o ya terminó, y no si ya pagó", () => {
  assert.equal(siguientePaso(p(), f({ estado: "en_demo", demo_fin: "2026-11-12T12:00:00Z" }), AHORA)?.porque, "La semana gratis termina mañana");
  assert.equal(siguientePaso(p(), f({ estado: "en_demo", demo_fin: "2026-11-16T12:00:00Z" }), AHORA), null);
  assert.equal(siguientePaso(p(), f({ estado: "demo_finalizada", demo_fin: "2026-11-08T12:00:00Z" }), AHORA)?.tipo, "pagar");
  assert.equal(siguientePaso(p(), f({ estado: "demo_finalizada", pagada_desde: "2026-11-09" }), AHORA), null);
});

test("lo clínico en orden: evaluar, revisar, asignar; inactiva al final; al día = null", () => {
  assert.equal(siguientePaso(p({ plan_status: "pendiente", needs_review: true }), f({}), AHORA)?.tipo, "evaluar");
  assert.equal(siguientePaso(p({ needs_review: true, needs_assignment: true }), f({}), AHORA)?.tipo, "revisar");
  assert.equal(siguientePaso(p({ needs_assignment: true }), f({ estado: "inactiva" }), AHORA)?.tipo, "asignar");
  assert.equal(siguientePaso(p(), f({ estado: "inactiva", ultima_actividad: "2026-10-01T12:00:00Z" }), AHORA)?.porque, "Sin actividad hace 41 días");
  assert.equal(siguientePaso(p(), f({}), AHORA), null);
  assert.equal(siguientePaso(p({ posible_duplicado_de: "x", posible_duplicado_nombre: "Rosa J." }), undefined, AHORA)?.tipo, "duplicado");
});

test("vistas", () => {
  const paso = siguientePaso(p({ needs_review: true }), f({}), AHORA);
  assert.ok(enVista("accion", paso, undefined) && enVista("revisar", paso, undefined) && enVista("todas", null, undefined));
  assert.ok(!enVista("accion", null, undefined));
  assert.ok(enVista("inactivas", null, f({ estado: "inactiva" })));
});
