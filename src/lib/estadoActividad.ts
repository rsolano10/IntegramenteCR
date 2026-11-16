// Un solo vocabulario y un solo conteo para el estado de una actividad, en
// todas las pantallas de la familia y del participante (Hoy, Mi semana, el
// detalle, el historial y el resumen). Son las mismas palabras que usa la
// clínica (lib/seguimiento.ts). Un «No» nunca se pinta como fracaso.

export type EstadoActividad = "realizado" | "parcial" | "no" | "pendiente" | "futuro";

export const ETIQUETA_ESTADO: Partial<Record<EstadoActividad, string>> = {
  realizado: "Hecha",
  parcial: "En parte",
  no: "No se hizo",
};

// Clases del chip, iguales en todas partes.
export const CHIP_ESTADO: Partial<Record<EstadoActividad, string>> = {
  realizado: "bg-fila-fria text-semaforo-verde-texto",
  parcial: "bg-fila-calida text-semaforo-amarillo-texto",
  no: "bg-campo text-tinta-suave",
};

// Hecha = se hizo, entera o en parte. Es lo que cuenta el anillo de avance.
export const estaHecha = (t: { estado: string }) => t.estado === "realizado" || t.estado === "parcial";

// Registrada = ya contaron cómo les fue (también «No se hizo»): no queda pendiente.
export const estaRegistrada = (t: { estado: string }) => estaHecha(t) || t.estado === "no";

export const contarHechas = (tareas: { estado: string }[]) => tareas.filter(estaHecha).length;
