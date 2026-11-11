import { barajar, type Azar } from "./azar";
import { PAQUETES, type DibujoProducto, type GrupoBanco } from "./bancos/clasificar";
import { enRango, type DefActividad } from "./contrato";

// «Cada cosa en su lugar»: tocar un elemento y después el grupo donde va.

export interface ConfigClasificarObjetos {
  paquete: string;
  grupos: number;
  elementosPorEjercicio: number;
  mostrarAyuda: boolean;
  semilla?: number;
}

export interface EjercicioClasificar {
  grupos: GrupoBanco[];
  elementos: { texto: string; validos: string[]; dibujo?: DibujoProducto }[];
  // Un elemento ya ubicado en cada grupo, como ejemplo (si hay ayuda).
  ejemplos: { texto: string; grupo: string }[];
}

export function generarClasificar(c: ConfigClasificarObjetos, azar: Azar): EjercicioClasificar {
  const paquete = PAQUETES.find((p) => p.id === c.paquete) ?? PAQUETES[0];
  const grupos = barajar(paquete.grupos, azar).slice(0, c.grupos);
  const ids = new Set(grupos.map((g) => g.id));
  const candidatos = barajar(paquete.elementos, azar)
    .map((e) => ({ texto: e.texto, validos: e.grupos.filter((g) => ids.has(g)), ...(e.dibujo ? { dibujo: e.dibujo } : {}) }))
    .filter((e) => e.validos.length > 0);
  const usados = new Set<string>();
  const tomar = (e: { texto: string }) => usados.add(e.texto);

  // Ejemplos: uno por grupo, de un solo grupo (sin ambigüedad).
  const ejemplos: EjercicioClasificar["ejemplos"] = [];
  if (c.mostrarAyuda)
    for (const g of grupos) {
      const e = candidatos.find((x) => !usados.has(x.texto) && x.validos.length === 1 && x.validos[0] === g.id);
      if (e) {
        tomar(e);
        ejemplos.push({ texto: e.texto, grupo: g.id });
      }
    }
  // Al menos uno por grupo y el resto al azar.
  const elementos: EjercicioClasificar["elementos"] = [];
  for (const g of grupos) {
    const e = candidatos.find((x) => !usados.has(x.texto) && x.validos.includes(g.id));
    if (e) {
      tomar(e);
      elementos.push(e);
    }
  }
  for (const e of candidatos) {
    if (elementos.length >= c.elementosPorEjercicio) break;
    if (!usados.has(e.texto)) {
      tomar(e);
      elementos.push(e);
    }
  }
  return { grupos, elementos: barajar(elementos, azar), ejemplos };
}

export const esGrupoValido = (e: { validos: string[] }, grupo: string) => e.validos.includes(grupo);

export const clasificarObjetos: DefActividad<ConfigClasificarObjetos, EjercicioClasificar> = {
  tipo: "clasificar-objetos",
  version: 1,
  nombre: "La feria",
  area: "Funciones ejecutivas",
  funcion: "Razonamiento (categorización)",
  porNivel: {
    suave: { paquete: "feria", grupos: 2, elementosPorEjercicio: 4, mostrarAyuda: true },
    medio: { paquete: "feria", grupos: 3, elementosPorEjercicio: 8, mostrarAyuda: false },
    retador: { paquete: "feria", grupos: 4, elementosPorEjercicio: 12, mostrarAyuda: false },
  },
  campos: [
    { clave: "paquete", tipo: "opcion", etiqueta: "Contenido", opciones: PAQUETES.map((p) => ({ valor: p.id, etiqueta: p.nombre })) },
    { clave: "grupos", tipo: "numero", etiqueta: "Grupos", min: 2, max: 4 },
    { clave: "elementosPorEjercicio", tipo: "numero", etiqueta: "Elementos por ejercicio", min: 4, max: 12 },
    { clave: "mostrarAyuda", tipo: "booleano", etiqueta: "Mostrar un ejemplo ya ubicado en cada grupo" },
  ],
  validar(c) {
    const e: string[] = [];
    const paquete = PAQUETES.find((p) => p.id === c.paquete);
    if (!paquete) e.push("Elegí un contenido de la lista.");
    enRango(e, c.grupos, 2, 4, "Grupos");
    enRango(e, c.elementosPorEjercicio, 4, 12, "Elementos por ejercicio");
    if (paquete) {
      // Peor caso: los grupos más chicos.
      const tamanos = paquete.grupos.map((g) => paquete.elementos.filter((x) => x.grupos.includes(g.id)).length).sort((a, b) => a - b);
      const disponibles = tamanos.slice(0, c.grupos).reduce((s, x) => s + x, 0);
      if (c.elementosPorEjercicio + (c.mostrarAyuda ? c.grupos : 0) > disponibles) e.push(`Con ${c.grupos} grupos de «${paquete.nombre}» alcanzan hasta ${disponibles - (c.mostrarAyuda ? c.grupos : 0)} elementos.`);
    }
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarClasificar(c, azar)),
  consigna: () => "Ayudá a acomodar el tramo: tocá cada producto y después el canasto donde va.",
};
