import { barajar, elegir, entero, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «El corral»: un corral de finca con dos portones. Un rótulo dice cómo se
// acomodan los animales («Por animal», «Por color», «Por tamaño»). La
// persona manda cada animal al portón que le toca. Después de unos
// animales el rótulo cambia de regla, y se sigue con la nueva. El cambio
// nunca es una sorpresa: siempre está escrito en el rótulo.

export type Criterio = "animal" | "color" | "tamano";
export type Especie = "gallina" | "chompipe" | "ternero" | "cerdo";
export type Color = "cafe" | "blanco";
export type Tamano = "grande" | "pequeno";

export interface Animal {
  especie: Especie;
  color: Color;
  tamano: Tamano;
}

export interface Tramo {
  criterio: Criterio;
  animales: Animal[];
}

export interface EjercicioCorral {
  // Las dos especies de esta vez (portón izquierdo y derecho cuando la
  // regla es «por animal»).
  especies: [Especie, Especie];
  tramos: Tramo[];
}

export interface ConfigCorral {
  animalesPorRegla: number;
  cambios: number;
  avisarCambio: boolean;
  criterios: Criterio[];
  semilla?: number;
}

export const NOMBRE_ESPECIE: Record<Especie, { uno: string; varios: string }> = {
  gallina: { uno: "gallina", varios: "Gallinas" },
  chompipe: { uno: "chompipe", varios: "Chompipes" },
  ternero: { uno: "ternero", varios: "Terneros" },
  cerdo: { uno: "cerdo", varios: "Cerdos" },
};

export const ROTULO: Record<Criterio, string> = { animal: "Por animal", color: "Por color", tamano: "Por tamaño" };

// Qué dice cada portón con cada regla (0 = izquierdo, 1 = derecho).
export function portones(c: Criterio, especies: [Especie, Especie]): [string, string] {
  if (c === "animal") return [NOMBRE_ESPECIE[especies[0]].varios, NOMBRE_ESPECIE[especies[1]].varios];
  if (c === "color") return ["Los cafés", "Los blancos"];
  return ["Los grandes", "Los pequeños"];
}

// A qué portón va un animal según la regla.
export function porton(a: Animal, c: Criterio, especies: [Especie, Especie]): 0 | 1 {
  if (c === "animal") return a.especie === especies[0] ? 0 : 1;
  if (c === "color") return a.color === "cafe" ? 0 : 1;
  return a.tamano === "grande" ? 0 : 1;
}

const PARES: [Especie, Especie][] = [
  ["gallina", "cerdo"],
  ["chompipe", "ternero"],
  ["gallina", "ternero"],
  ["cerdo", "chompipe"],
];

const CRITERIOS = [
  { valor: "animal", etiqueta: "Por animal" },
  { valor: "color", etiqueta: "Por color" },
  { valor: "tamano", etiqueta: "Por tamaño" },
];

function animalAlAzar(especies: [Especie, Especie], azar: Azar): Animal {
  return { especie: especies[entero(azar, 0, 1)], color: azar() < 0.5 ? "cafe" : "blanco", tamano: azar() < 0.5 ? "grande" : "pequeno" };
}

export function generarCorral(c: ConfigCorral, azar: Azar): EjercicioCorral {
  const especies = elegir(PARES, azar);
  const criterios = c.criterios.length >= 2 ? c.criterios : (["animal", "color"] as Criterio[]);
  // La secuencia de reglas: nunca dos veces seguidas la misma.
  const reglas: Criterio[] = [elegir(criterios, azar)];
  for (let k = 0; k < c.cambios; k++) reglas.push(elegir(criterios.filter((x) => x !== reglas[k]), azar));
  const tramos = reglas.map((criterio, k) => {
    for (let intento = 0; ; intento++) {
      const animales = Array.from({ length: c.animalesPorRegla }, () => animalAlAzar(especies, azar));
      const destinos = animales.map((a) => porton(a, criterio, especies));
      // Que vayan animales a los dos portones…
      const usaLosDos = destinos.includes(0) && destinos.includes(1);
      // …y que, después de un cambio, al menos uno vaya distinto que con la regla anterior.
      const anterior = k > 0 ? reglas[k - 1] : null;
      const cambiaAlgo = !anterior || animales.some((a) => porton(a, anterior, especies) !== porton(a, criterio, especies));
      if ((usaLosDos && cambiaAlgo) || intento > 200) return { criterio, animales: barajar(animales, azar) };
    }
  });
  return { especies, tramos };
}

export const corral: DefActividad<ConfigCorral, EjercicioCorral> = {
  tipo: "corral",
  version: 1,
  nombre: "El corral",
  area: "Funciones ejecutivas",
  funcion: "Flexibilidad cognitiva (cambio de regla)",
  porNivel: {
    suave: { animalesPorRegla: 4, cambios: 1, avisarCambio: true, criterios: ["animal", "color"] },
    medio: { animalesPorRegla: 4, cambios: 2, avisarCambio: true, criterios: ["animal", "color"] },
    retador: { animalesPorRegla: 5, cambios: 3, avisarCambio: false, criterios: ["animal", "color", "tamano"] },
  },
  campos: [
    { clave: "animalesPorRegla", tipo: "numero", etiqueta: "Animales antes de cada cambio", min: 3, max: 6 },
    { clave: "cambios", tipo: "numero", etiqueta: "Cambios de regla", min: 1, max: 3 },
    { clave: "avisarCambio", tipo: "booleano", etiqueta: "Anunciar el cambio con un mensaje y en voz alta (si no, solo cambia el rótulo)" },
    { clave: "criterios", tipo: "multiple", etiqueta: "Reglas posibles", opciones: CRITERIOS },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.animalesPorRegla, 3, 6, "Animales antes de cada cambio");
    enRango(e, c.cambios, 1, 3, "Cambios de regla");
    if (!Array.isArray(c.criterios) || c.criterios.filter((x) => CRITERIOS.some((k) => k.valor === x)).length < 2) e.push("Elegí al menos dos reglas para que pueda cambiar.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarCorral(c, azar)),
  consigna: () => "En la finca: mirá el rótulo y mandá cada animal al portón que le toca. Cuando el rótulo cambie, seguí la regla nueva.",
  resumen: (c) =>
    `${c.cambios} ${c.cambios === 1 ? "cambio" : "cambios"} de regla, cada ${c.animalesPorRegla} animales; reglas: ${c.criterios.map((x) => ROTULO[x].toLowerCase()).join(", ")}${c.avisarCambio ? "; el cambio se anuncia" : "; el cambio solo se ve en el rótulo"}.`,
};
