import { useEffect, useState, type ReactNode } from "react";
import { EVENTO_REPRODUCIR } from "../../lib/video";

// Video de YouTube con carga diferida: hasta que la persona toca "play" solo
// se muestra nuestra miniatura (sin el reproductor de YouTube, que pesa
// cerca de 1 MB y hace más lento el home en el celular). Al tocar, se monta
// el iframe de youtube-nocookie con autoplay.
//
// `youtubeId` null = video todavía no grabado: la miniatura se ve igual y al
// tocarla avisa que el video está por llegar (placeholder pedido por el PO).
//
// Otra parte de la página puede pedir que arranque (por ejemplo el enlace de
// la pregunta frecuente "¿Es difícil de usar?"): se dispara el evento
// `reproducir-video` con el id del bloque en `detail` (lib/video.ts).
export function VideoYouTube({
  id,
  youtubeId,
  titulo,
  duracion,
  children,
  className = "",
  autoIniciar = false,
}: {
  // id del bloque en la página (para reproducirVideo y anclas).
  id: string;
  youtubeId: string | null;
  titulo: string;
  duracion?: string;
  // Miniatura propia (imagen o composición).
  children: ReactNode;
  className?: string;
  // Arranca solo al montarse (el video del modal de presentación).
  autoIniciar?: boolean;
}) {
  const [estado, setEstado] = useState<"miniatura" | "reproduciendo" | "pronto">(autoIniciar ? (youtubeId ? "reproduciendo" : "pronto") : "miniatura");

  useEffect(() => {
    const onPedido = (e: Event) => {
      if ((e as CustomEvent<string>).detail === id) setEstado(youtubeId ? "reproduciendo" : "pronto");
    };
    window.addEventListener(EVENTO_REPRODUCIR, onPedido);
    return () => window.removeEventListener(EVENTO_REPRODUCIR, onPedido);
  }, [id, youtubeId]);

  return (
    <div id={id} className={`relative aspect-video rounded-[28px] overflow-hidden bg-tinta shadow-elevada scroll-mt-28 ${className}`}>
      {estado === "reproduciendo" && youtubeId ? (
        <iframe
          className="absolute inset-0 w-full h-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={titulo}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setEstado(youtubeId ? "reproduciendo" : "pronto")}
          aria-label={`Reproducir video: ${titulo}`}
          className="group absolute inset-0 w-full h-full p-0 border-0 bg-transparent cursor-pointer text-left"
        >
          <span className="absolute inset-0">{children}</span>
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full bg-white/95 text-verde-profundo flex items-center justify-center shadow-[0_18px_40px_-12px_rgba(0,0,0,.5)] transition-transform duration-300 group-hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          </span>
          <span className="absolute left-5 right-5 bottom-4 sm:left-7 sm:bottom-6 flex items-end justify-between gap-3 text-white">
            <span className="font-serif text-[19px] sm:text-[24px] leading-tight drop-shadow">{titulo}</span>
            {duracion && <span className="shrink-0 text-[13px] font-semibold bg-black/45 rounded-full px-2.5 py-1">{duracion}</span>}
          </span>
          {estado === "pronto" && (
            <span className="absolute inset-x-5 top-5 sm:inset-x-auto sm:right-6 sm:left-auto text-center sm:text-left bg-white text-tinta text-[14.5px] font-semibold rounded-2xl px-4 py-2.5 shadow-elevada" role="status">
              Estamos terminando este video. Muy pronto vas a poder verlo acá.
            </span>
          )}
        </button>
      )}
    </div>
  );
}
