import { useEffect } from "react";
import { useBodyScrollLock } from "../../lib/useBodyScrollLock";
import type { VideoSitio } from "../../lib/landingContenido";

// Un video del sitio (presentación de la app, de cada área) en un modal:
// arranca solo, con los controles del navegador. Los verticales (grabados
// con el celular) se muestran altos, sin franjas negras a los costados.
// Se cierra con la ×, tocando afuera o con Escape.
export function VideoModal({ video, onClose }: { video: VideoSitio; onClose: () => void }) {
  useBodyScrollLock();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.titulo}
      onClick={onClose}
      className="im-in fixed inset-0 z-50 bg-tinta/85 backdrop-blur-sm flex items-center justify-center p-4 pt-16 sm:p-8 sm:pt-16"
    >
      <div
        className={`relative ${video.vertical ? "w-[min(100%,calc((100dvh_-_7rem)_*_9_/_16),484px)] aspect-[9/16]" : "w-full max-w-[1040px] aspect-video"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar el video"
          autoFocus
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/95 border-0 text-tinta text-[22px] leading-none cursor-pointer hover:bg-white"
        >
          ×
        </button>
        <video
          src={video.src}
          poster={video.poster}
          title={video.titulo}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="w-full h-full rounded-[24px] bg-black object-contain shadow-elevada"
        />
      </div>
    </div>
  );
}
