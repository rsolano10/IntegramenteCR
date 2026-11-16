import { barajar, crearAzar, elegir, type Azar } from "./azar";
import { DIAS, type ReglaOrden } from "./bancos/agenda";
import { enRango, type DefActividad } from "./contrato";

// «La pizarra de la cocina»: las tarjetas con las tareas del día y la
// pizarra con las franjas (mañana, tarde y noche, o por hora). La persona
// toca una tarjeta y después la franja donde la haría. «Listo» revisa las
// reglas: lo que tiene hora fija en su hora, lo que va antes de algo antes,
// y (por hora) una cosa por franja. Cualquier día que cumpla las reglas
// vale: nunca hay una única respuesta.

export type Franjas = "momentos" | "horas";

export interface ConfigAgenda {
  tareas: number;
  conHoraFija: number;
  restricciones: number;
  franjas: Franjas;
  semilla?: number;
}

export interface TareaAgenda {
  id: string;
  texto: string;
  hora: number | null; // solo las que muestran hora fija
}

export interface EjercicioAgenda {
  dia: string;
  titulo: string;
  franjas: Franjas;
  tareas: TareaAgenda[];
  reglas: ReglaOrden[];
}

export const MOMENTOS = ["Mañana", "Tarde", "Noche"];
export const HORAS = [7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19];

export const etiquetaHora = (h: number) => `${h <= 12 ? h : h - 12}:00 ${h < 12 ? "a. m." : "p. m."}`;
export const momentoDeHora = (h: number) => (h < 12 ? 0 : h < 18 ? 1 : 2);

export const franjasDe = (f: Franjas) => (f === "momentos" ? MOMENTOS : HORAS.map(etiquetaHora));

// La franja que le toca a una hora fija (índice en las franjas).
export function franjaFija(h: number, f: Franjas): number {
  return f === "momentos" ? momentoDeHora(h) : HORAS.indexOf(h);
}

export interface Problema {
  tipo: "falta" | "hora" | "orden" | "cruce";
  tarea: string;
  texto: string;
  regla?: ReglaOrden;
}

// Revisa una organización: tarea → franja (índice) o sin poner.
export function revisarAgenda(ej: EjercicioAgenda, ubicacion: Record<string, number | undefined>): Problema[] {
  const out: Problema[] = [];
  for (const t of ej.tareas) if (ubicacion[t.id] === undefined) out.push({ tipo: "falta", tarea: t.id, texto: `Falta ubicar «${t.texto}».` });
  if (out.length) return out;
  for (const t of ej.tareas)
    if (t.hora !== null && ubicacion[t.id] !== franjaFija(t.hora, ej.franjas))
      out.push({ tipo: "hora", tarea: t.id, texto: `«${t.texto}» es a las ${etiquetaHora(t.hora)}` });
  for (const r of ej.reglas) {
    const a = ubicacion[r.antes]!;
    const d = ubicacion[r.despues]!;
    // Por momentos, dos cosas en la misma franja pueden ir en el orden pedido.
    if (ej.franjas === "horas" ? a >= d : a > d) out.push({ tipo: "orden", tarea: r.despues, texto: r.texto, regla: r });
  }
  if (ej.franjas === "horas") {
    const vistas = new Map<number, string>();
    for (const t of ej.tareas) {
      const f = ubicacion[t.id]!;
      if (vistas.has(f)) out.push({ tipo: "cruce", tarea: t.id, texto: "Dos cosas quedaron a la misma hora: una tiene que ir en otra franja." });
      vistas.set(f, t.id);
    }
  }
  return out;
}

// ¿Hay alguna organización válida? (búsqueda chica: hasta 6 tareas).
export function resolverAgenda(ej: EjercicioAgenda): Record<string, number> | null {
  const n = franjasDe(ej.franjas).length;
  const ub: Record<string, number | undefined> = {};
  const tareas = [...ej.tareas].sort((a, b) => (a.hora === null ? 1 : 0) - (b.hora === null ? 1 : 0));
  function paso(k: number): boolean {
    if (k === tareas.length) return revisarAgenda(ej, ub).length === 0;
    const t = tareas[k];
    const opciones = t.hora !== null ? [franjaFija(t.hora, ej.franjas)] : Array.from({ length: n }, (_, i) => i);
    for (const f of opciones) {
      if (ej.franjas === "horas" && Object.values(ub).includes(f)) continue;
      ub[t.id] = f;
      if (paso(k + 1)) return true;
    }
    delete ub[t.id];
    return false;
  }
  return paso(0) ? (ub as Record<string, number>) : null;
}

export function generarAgenda(c: ConfigAgenda, azar: Azar, evitar?: string): EjercicioAgenda {
  for (let intento = 0; intento < 300; intento++) {
    const posibles = DIAS.filter((d) => d.id !== evitar);
    const dia = elegir(posibles.length ? posibles : DIAS, azar);
    const reglas = barajar(dia.reglas, azar).slice(0, c.restricciones);
    const conHora = barajar(dia.tareas.filter((t) => t.hora !== undefined), azar).slice(0, c.conHoraFija);
    const necesarias = new Set([...reglas.flatMap((r) => [r.antes, r.despues]), ...conHora.map((t) => t.id)]);
    if (necesarias.size > c.tareas || conHora.length < c.conHoraFija) continue;
    const resto = barajar(dia.tareas.filter((t) => !necesarias.has(t.id)), azar);
    const ids = new Set([...necesarias, ...resto.map((t) => t.id).slice(0, c.tareas - necesarias.size)]);
    const fijas = new Set(conHora.map((t) => t.id));
    const tareas = barajar(
      dia.tareas.filter((t) => ids.has(t.id)).map((t) => ({ id: t.id, texto: t.texto, hora: fijas.has(t.id) ? t.hora! : null })),
      azar,
    );
    const ej: EjercicioAgenda = { dia: dia.id, titulo: dia.titulo, franjas: c.franjas, tareas, reglas };
    if (tareas.length === c.tareas && resolverAgenda(ej)) return ej;
  }
  throw new Error("No se pudo armar un día con esas condiciones.");
}

export const agenda: DefActividad<ConfigAgenda, EjercicioAgenda> = {
  tipo: "agenda",
  version: 1,
  nombre: "La pizarra de la cocina",
  area: "Funciones ejecutivas",
  funcion: "Planificación con reglas (actividades del día)",
  porNivel: {
    suave: { tareas: 3, conHoraFija: 1, restricciones: 0, franjas: "momentos" },
    medio: { tareas: 4, conHoraFija: 2, restricciones: 1, franjas: "horas" },
    retador: { tareas: 6, conHoraFija: 2, restricciones: 2, franjas: "horas" },
  },
  campos: [
    { clave: "tareas", tipo: "numero", etiqueta: "Tareas del día", min: 3, max: 6 },
    { clave: "conHoraFija", tipo: "numero", etiqueta: "Tareas con hora fija", min: 0, max: 3 },
    { clave: "restricciones", tipo: "numero", etiqueta: "Reglas de orden («antes de…»)", min: 0, max: 2 },
    {
      clave: "franjas",
      tipo: "opcion",
      etiqueta: "La pizarra",
      opciones: [
        { valor: "momentos", etiqueta: "Mañana, tarde y noche" },
        { valor: "horas", etiqueta: "Por hora" },
      ],
    },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.tareas, 3, 6, "Tareas del día");
    enRango(e, c.conHoraFija, 0, 3, "Tareas con hora fija");
    enRango(e, c.restricciones, 0, 2, "Reglas de orden");
    if (c.franjas !== "momentos" && c.franjas !== "horas") e.push("Elegí cómo se divide la pizarra.");
    if (!e.length) {
      try {
        generarAgenda(c, crearAzar(1));
      } catch {
        e.push("No hay días que cumplan esas condiciones: probá con menos horas fijas o menos reglas.");
      }
    }
    return e;
  },
  generar: (c, n, { azar }) => {
    const out: EjercicioAgenda[] = [];
    for (let i = 0; i < n; i++) out.push(generarAgenda(c, azar, out[i - 1]?.dia));
    return out;
  },
  consigna: () => "En la cocina: acomodá las tareas del día en la pizarra. Tocá una tarjeta y después la franja donde la harías. Respetá las horas fijas y las reglas.",
  resumen: (c) =>
    `${c.tareas} tareas, ${c.conHoraFija} con hora fija${c.restricciones ? ` y ${c.restricciones} ${c.restricciones === 1 ? "regla" : "reglas"} de orden` : ""}; pizarra ${c.franjas === "momentos" ? "por momentos del día" : "por hora"}.`,
};
