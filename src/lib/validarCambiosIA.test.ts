import { test } from "node:test";
import assert from "node:assert/strict";
import { maxCambiosPermitidos, validarCambiosIA, type TareaIA } from "../../supabase/functions/_shared/validarCambiosIA.ts";

const tareas: TareaIA[] = [
  { id: "t1", dia_idx: 0, titulo: "A", modulo: "cognicion", permitido: true, candidatos: [{ id: "r9", titulo: "Z" }] },
  { id: "t2", dia_idx: 1, titulo: "B", modulo: "gerontogimnasia", permitido: false, motivo: "ruta", candidatos: [{ id: "g1", titulo: "G" }] },
  { id: "t3", dia_idx: 2, titulo: "C", modulo: "nutricion", permitido: true, candidatos: [] },
  { id: "t4", dia_idx: 3, titulo: "D", modulo: "cognicion", permitido: true, candidatos: [] },
];

test("límite: 30% de 4 tareas = 1 cambio", () => {
  assert.equal(maxCambiosPermitidos(4, 30), 1);
  assert.equal(maxCambiosPermitidos(10, 30), 3);
});

test("acepta un reemplazo de candidato y uno obligatorio por seguridad", () => {
  const r = validarCambiosIA(
    { cambios: [
      { tarea_id: "t1", accion: "reemplazar", recurso_id: "r9", justificacion: "Le gusta la música." },
      { tarea_id: "t2", accion: "reemplazar", recurso_id: "g1", justificacion: "Ruta física roja." },
    ] },
    tareas,
    30,
  );
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.cambios.map((c) => c.obligatorio), [false, true]);
});

test("rechaza recursos fuera del catálogo permitido", () => {
  const r = validarCambiosIA({ cambios: [{ tarea_id: "t1", accion: "reemplazar", recurso_id: "inventado", justificacion: "x" }] }, tareas, 30);
  assert.equal(r.ok, false);
});

test("rechaza pasarse del límite", () => {
  const r = validarCambiosIA(
    { cambios: [
      { tarea_id: "t1", accion: "reemplazar", recurso_id: "r9", justificacion: "x" },
      { tarea_id: "t3", accion: "mover", dia_idx: 5, justificacion: "y" },
    ] },
    tareas,
    30,
  );
  assert.equal(r.ok, false);
});

test("rechaza mover una tarea no permitida, días inválidos, duplicados y texto libre", () => {
  assert.equal(validarCambiosIA({ cambios: [{ tarea_id: "t2", accion: "mover", dia_idx: 4, justificacion: "x" }] }, tareas, 100).ok, false);
  assert.equal(validarCambiosIA({ cambios: [{ tarea_id: "t3", accion: "mover", dia_idx: 9, justificacion: "x" }] }, tareas, 100).ok, false);
  assert.equal(
    validarCambiosIA({ cambios: [
      { tarea_id: "t3", accion: "mover", dia_idx: 4, justificacion: "x" },
      { tarea_id: "t3", accion: "mover", dia_idx: 5, justificacion: "x" },
    ] }, tareas, 100).ok,
    false,
  );
  assert.equal(validarCambiosIA("cambiá todo", tareas, 100).ok, false);
  assert.equal(validarCambiosIA({ cambios: [{ tarea_id: "t3", accion: "mover", dia_idx: 4, justificacion: "" }] }, tareas, 100).ok, false);
});

test("sin cambios es válido", () => {
  assert.deepEqual(validarCambiosIA({ cambios: [] }, tareas, 30), { ok: true, cambios: [] });
});
