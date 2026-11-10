import { test } from "node:test";
import assert from "node:assert/strict";
import { claveRoseton, roseton } from "./roseton.ts";

const base = { petalos: 8, anillos: 2, forma: "gota" as const, colores: ["#E2582A", "#f4d096", "#3f6a70", "#F6F1E4"] };

test("rosetón: puro, con un trazo por anillo más el centro", () => {
  assert.deepEqual(roseton(base), roseton(base));
  const f = roseton(base);
  assert.equal(f.length, 2 + 2);
  // 8 pétalos por anillo: 8 subtrazos cerrados.
  assert.equal(f[0].d.match(/Z/g)?.length, 8);
  assert.ok(f.every((x) => !x.d.includes("NaN")));
});

test("rosetón: cada parámetro cambia el dibujo; límites respetados", () => {
  const d = (p: Partial<typeof base> & { desfase?: boolean; puntos?: boolean }) => JSON.stringify(roseton({ ...base, ...p }));
  const ref = d({});
  for (const cambio of [{ petalos: 9 }, { anillos: 3 }, { forma: "punta" as const }, { forma: "redonda" as const }, { desfase: true }, { puntos: true }]) assert.notEqual(d(cambio), ref);
  assert.equal(roseton({ ...base, petalos: 40 })[0].d.match(/Z/g)?.length, 16);
  assert.notEqual(claveRoseton(base), claveRoseton({ ...base, desfase: true }));
});
