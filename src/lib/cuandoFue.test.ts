import { test } from "node:test";
import assert from "node:assert/strict";
import { cuandoFue } from "./cuandoFue";

// Costa Rica es UTC-6 todo el año.
const ahora = new Date("2026-11-16T20:00:00Z"); // lunes 16, 2:00 p.m.

test("cuandoFue: hoy, ayer y otro día, con a.m./p.m.", () => {
  assert.equal(cuandoFue("2026-11-16T19:27:00Z", ahora), "hoy a las 1:27 p.m.");
  assert.equal(cuandoFue("2026-11-16T14:05:00Z", ahora), "hoy a las 8:05 a.m.");
  assert.equal(cuandoFue("2026-11-15T18:00:00Z", ahora), "ayer a las 12:00 p.m.");
  assert.match(cuandoFue("2026-11-11T15:00:00Z", ahora), /^el miércoles 11 a las 9:00 a\.m\.$/);
});
