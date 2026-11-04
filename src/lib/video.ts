// Pedirle a un <VideoYouTube> de la página que arranque (por id del bloque).
export const EVENTO_REPRODUCIR = "reproducir-video";

export function reproducirVideo(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.dispatchEvent(new CustomEvent(EVENTO_REPRODUCIR, { detail: id }));
}

