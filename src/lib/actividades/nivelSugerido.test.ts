import { test } from "node:test";
import assert from "node:assert/strict";
import { nivelPorDefecto, nivelPorEtapa, sugerenciaNivel, type SesionJuego } from "./nivelSugerido.ts";

const s = (orden: number, nivel: SesionJuego["nivel"], dificultad: SesionJuego["dificultad"], resourceId = "feria"): SesionJuego => ({ resourceId, nivel, dificultad, orden });

test("nivel por etapa: manda la más comprometida", () => {
  assert.equal(nivelPorEtapa(["preventivo"]), "retador");
  assert.equal(nivelPorEtapa(["dcl"]), "medio");
  assert.equal(nivelPorEtapa(["dcl", "leve"]), "suave");
  assert.equal(nivelPorEtapa(["moderada"]), "suave");
  assert.equal(nivelPorEtapa([]), null);
  assert.equal(nivelPorEtapa(null), null);
});

test("nivel por defecto: último asignado, después la etapa, después el recurso", () => {
  const h = [s(1, "suave", null), s(2, "medio", null)];
  assert.deepEqual(nivelPorDefecto({ resourceId: "feria", historial: h, etapas: ["preventivo"], delRecurso: "suave" }), { nivel: "medio", origen: "ultimo" });
  assert.deepEqual(nivelPorDefecto({ resourceId: "otro", historial: h, etapas: ["preventivo"], delRecurso: "suave" }), { nivel: "retador", origen: "etapa" });
  assert.deepEqual(nivelPorDefecto({ resourceId: "otro", historial: h, etapas: [], delRecurso: "medio" }), { nivel: "medio", origen: "recurso" });
});

test("sugerencia: dos veces fácil sube, dos veces difícil baja", () => {
  assert.equal(sugerenciaNivel("feria", [s(1, "suave", "facil"), s(2, "suave", "facil")])?.nivel, "medio");
  assert.equal(sugerenciaNivel("feria", [s(1, "medio", "dificil"), s(2, "medio", "dificil")])?.nivel, "suave");
  // En el tope no hay a dónde subir.
  assert.equal(sugerenciaNivel("feria", [s(1, "retador", "facil"), s(2, "retador", "facil")]), null);
  // Distinto nivel o distinta percepción: nada.
  assert.equal(sugerenciaNivel("feria", [s(1, "suave", "facil"), s(2, "medio", "facil")]), null);
  assert.equal(sugerenciaNivel("feria", [s(1, "suave", "facil"), s(2, "suave", "justo")]), null);
  // Las sin respuesta no cuentan; solo las dos últimas con respuesta.
  assert.equal(sugerenciaNivel("feria", [s(1, "suave", "dificil"), s(2, "suave", "facil"), s(3, "suave", null), s(4, "suave", "facil")])?.direccion, "subir");
  assert.equal(sugerenciaNivel("feria", [s(1, "suave", "facil")]), null);
});
