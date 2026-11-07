// Estado en vivo de Clara (escribiendo, en llamada…) para el encabezado de
// Ayuda, que vive en el shell y no dentro del chat. null = el subtítulo de
// siempre.
export const EVENTO_ESTADO_CLARA = "clara-estado";

export function anunciarEstadoClara(estado: string | null) {
  window.dispatchEvent(new CustomEvent<string | null>(EVENTO_ESTADO_CLARA, { detail: estado }));
}
