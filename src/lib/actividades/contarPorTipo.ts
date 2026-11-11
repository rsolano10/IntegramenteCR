import { barajar, entero, type Azar } from "./azar";
import { ESCENAS, type FiguraBanco } from "./bancos/figuras";
import { enRango, type DefActividad } from "./contrato";

// «¿Cuántos hay?»: una escena con cosas de 2 a 4 tipos; debajo, un contador
// por tipo con botones grandes de menos y más. «Listo» revisa.

export interface ConfigContarPorTipo {
  tipos: number;
  maxPorTipo: number;
  banco: keyof typeof ESCENAS;
  agrupados: boolean;
  tamanoVariado: boolean;
  semilla?: number;
}

export interface EjercicioContar {
  tipos: (FiguraBanco & { cantidad: number })[];
  // En el orden en que se dibujan.
  items: { tipo: string; grande: boolean }[];
}

export function generarContar(c: ConfigContarPorTipo, azar: Azar): EjercicioContar {
  const tipos = barajar(ESCENAS[c.banco], azar)
    .slice(0, c.tipos)
    .map((t) => ({ ...t, cantidad: entero(azar, 1, c.maxPorTipo) }));
  const items = tipos.flatMap((t) => Array.from({ length: t.cantidad }, () => ({ tipo: t.id, grande: c.tamanoVariado ? azar() < 0.5 : true })));
  return { tipos, items: c.agrupados ? items : barajar(items, azar) };
}

// El primer tipo cuyo conteo no coincide (o null si todo está bien).
export function revisarConteo(ej: EjercicioContar, conteos: Record<string, number>): FiguraBanco | null {
  return ej.tipos.find((t) => (conteos[t.id] ?? 0) !== t.cantidad) ?? null;
}

export const contarPorTipo: DefActividad<ConfigContarPorTipo, EjercicioContar> = {
  tipo: "contar-por-tipo",
  version: 1,
  nombre: "El canasto",
  area: "Atención",
  funcion: "Atención selectiva",
  porNivel: {
    suave: { tipos: 2, maxPorTipo: 4, banco: "canasto", agrupados: true, tamanoVariado: false },
    medio: { tipos: 3, maxPorTipo: 6, banco: "canasto", agrupados: false, tamanoVariado: false },
    retador: { tipos: 4, maxPorTipo: 9, banco: "canasto", agrupados: false, tamanoVariado: true },
  },
  campos: [
    {
      clave: "banco",
      tipo: "opcion",
      etiqueta: "Escena",
      opciones: [
        { valor: "canasto", etiqueta: "El canasto (frutas de acá)" },
        { valor: "mesa", etiqueta: "La mesa servida (cubiertos, platos, vasos)" },
        { valor: "frutas", etiqueta: "Frutas" },
        { valor: "figuras", etiqueta: "Figuras" },
      ],
    },
    { clave: "tipos", tipo: "numero", etiqueta: "Tipos de cosas", min: 2, max: 4 },
    { clave: "maxPorTipo", tipo: "numero", etiqueta: "Máximo de cada tipo", min: 2, max: 9 },
    { clave: "agrupados", tipo: "booleano", etiqueta: "Mostrar cada tipo junto (más fácil)" },
    { clave: "tamanoVariado", tipo: "booleano", etiqueta: "Tamaños distintos (más difícil)" },
  ],
  validar(c) {
    const e: string[] = [];
    if (!ESCENAS[c.banco]) e.push("Elegí una escena.");
    enRango(e, c.tipos, 2, 4, "Los tipos de cosas");
    enRango(e, c.maxPorTipo, 2, 9, "El máximo de cada tipo");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarContar(c, azar)),
  consigna: () => "Se volcó el canasto. Contá cuántas frutas hay de cada una con − y + y después tocá «Listo».",
  resumen: (c) => `${c.tipos} frutas distintas, hasta ${c.maxPorTipo} de cada una${c.agrupados ? ", agrupadas" : ", mezcladas"}.`,
};
