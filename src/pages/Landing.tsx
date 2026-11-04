import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/ui/Reveal";
import { Button } from "../components/ui/Button";
import { ModuloIcon } from "../components/ui/ModuloIcon";
import { useScrolled } from "../lib/useScrollFx";
import { moduloLabel, moduloTheme, type ResourceModulo } from "../lib/modulos";
import { programas } from "../lib/programasData";
import { WhatsAppIcon } from "../components/ui/WhatsAppIcon";
import { VideoYouTube } from "../components/ui/VideoYouTube";
import { reproducirVideo } from "../lib/video";
import {
  areas,
  contacto,
  equipo,
  fotosSesiones,
  type MiembroEquipo,
  guiaProfesionales,
  precioValoracion,
  preguntas,
  programasHome,
  pruebaSocial,
  testimonios,
  videos,
  whatsappHome,
} from "../lib/landingContenido";
import { Logo } from "../components/ui/Logo";
import { FacebookIcon, InstagramIcon, SitioFooter } from "../components/layout/SitioFooter";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Hero: la pantalla real "Mi semana", animada ───────────────────────
// El mismo diseño de tarjetas por módulo que ve la familia en la app; las
// actividades se van marcando como hechas en bucle para contar "así de
// simple es una semana" sin una sola palabra. Sin animación si el sistema
// pide reducir movimiento.
const semanaDemo: { dia: string; n: number; hora: string; titulo: string; modulo: ResourceModulo }[] = [
  { dia: "Lun", n: 12, hora: "9:00", titulo: "Caminata con música", modulo: "movimiento" },
  { dia: "Mar", n: 13, hora: "10:30", titulo: "Álbum de recuerdos", modulo: "reminiscencia" },
  { dia: "Mié", n: 14, hora: "4:00", titulo: "Boleros de siempre", modulo: "musica" },
  { dia: "Jue", n: 15, hora: "9:30", titulo: "Texturas del jardín", modulo: "sentidos" },
  { dia: "Vie", n: 16, hora: "10:00", titulo: "Movilidad sentado", modulo: "movimiento" },
];

// Proporción del teléfono (alto/ancho). El iPhone Pro real mide
// 150 × 71,9 mm (2,086), pero dibujado plano y de frente — sin los bordes
// curvos ni el reflejo del metal que lo hacen ver más ancho en la mano —
// se percibe alargado. 2,00 se sigue leyendo como un iPhone y se ve
// equilibrado (decisión tomada comparando 2,086 / 2,00 / 1,95).
const TELEFONO = { ancho: 1, alto: 2 };

function HeroPhone() {
  const [hechas, setHechas] = useState(prefersReducedMotion() ? 2 : 0);
  const marco = useRef<HTMLDivElement>(null);
  const [aLaVista, setALaVista] = useState(true);
  // Solo anima mientras se ve (ahorra batería en el celular al seguir bajando).
  useEffect(() => {
    const el = marco.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (prefersReducedMotion() || !aLaVista) return;
    const id = window.setInterval(() => setHechas((h) => (h >= semanaDemo.length ? 0 : h + 1)), 1400);
    return () => window.clearInterval(id);
  }, [aLaVista]);

  // Tamaño fijo: ancho fijo + aspect-ratio real, y todo el contenido de
  // la pantalla con alturas fijas — marcar una actividad como hecha nunca
  // cambia el tamaño del teléfono, solo lo que se ve adentro.
  return (
    <div ref={marco} className="relative mx-auto w-[288px] sm:w-[312px]" aria-hidden="true">
      <div aria-hidden="true" className="absolute -inset-10 rounded-full bg-beige-serenidad/70 blur-2xl" />
      <div
        className="relative w-full rounded-[15.5%/7.4%] bg-[#1b2629] p-[2.2%]"
        // Sombra pareja alrededor (una sombra solo hacia abajo alarga la
        // silueta a la vista) + aro metálico fino, como el marco real.
        style={{
          aspectRatio: `${TELEFONO.ancho} / ${TELEFONO.alto}`,
          boxShadow:
            "inset 0 0 0 1.5px #8a9ea2, inset 0 0 0 3px #2c3a3e, 0 22px 50px -18px rgba(31,51,56,0.45), 0 4px 14px -4px rgba(31,51,56,0.25)",
        }}
      >
        {/* Botones laterales */}
        <span className="absolute -left-[3px] top-[17%] w-[3px] h-[5%] rounded-l-full bg-[#8a9ea2]" />
        <span className="absolute -left-[3px] top-[24%] w-[3px] h-[9%] rounded-l-full bg-[#8a9ea2]" />
        <span className="absolute -right-[3px] top-[26%] w-[3px] h-[13%] rounded-r-full bg-[#8a9ea2]" />
        <div className="relative h-full w-full rounded-[13.4%/6.3%] overflow-hidden bg-fondo-papel flex flex-col">
          {/* Barra de estado + Dynamic Island */}
          <div className="bg-verde-profundo text-white shrink-0">
            <div className="relative h-[34px] flex items-center justify-between px-6 text-[11px] font-semibold">
              <span>9:41</span>
              <span className="absolute left-1/2 top-[9px] -translate-x-1/2 w-[30%] h-[22px] rounded-full bg-black" />
              <span className="flex items-center gap-1">
                <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor">
                  <rect x="0" y="6" width="2.5" height="3" rx=".6" />
                  <rect x="3.8" y="4" width="2.5" height="5" rx=".6" />
                  <rect x="7.6" y="2" width="2.5" height="7" rx=".6" />
                  <rect x="11.4" y="0" width="2.5" height="9" rx=".6" />
                </svg>
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                  <rect x=".5" y=".5" width="16" height="9" rx="2.5" stroke="currentColor" opacity=".6" />
                  <rect x="2" y="2" width="12" height="6" rx="1.4" fill="currentColor" />
                  <rect x="17.5" y="3.2" width="1.6" height="3.6" rx=".8" fill="currentColor" opacity=".6" />
                </svg>
              </span>
            </div>
            <div className="px-5 pt-2 pb-4">
              <p className="m-0 text-[11px] text-[#c4dbdb]">Esta semana · 12 al 18 de octubre</p>
              <p className="m-0 font-serif text-[20px] leading-tight">Hola, Marcela</p>
            </div>
          </div>

          <div className="flex-1 min-h-0 px-3 py-3 grid content-start gap-1.5 overflow-hidden">
            <div className="h-[40px] flex items-center justify-between bg-white border border-borde rounded-2xl px-3.5">
              <span className="font-serif text-[14.5px] text-tinta whitespace-nowrap">La semana de doña Rosa</span>
              <span className="text-[11.5px] text-tinta-suave whitespace-nowrap">
                <strong className="font-serif text-[16px] text-tinta">{hechas}</strong>/{semanaDemo.length} hechas
              </span>
            </div>
            {semanaDemo.map((a, i) => {
              const hecha = i < hechas;
              const hoy = i === hechas;
              const t = moduloTheme[a.modulo];
              return (
                <div key={a.titulo} className="h-[58px] grid grid-cols-[36px_1fr] gap-2">
                  <div className={`rounded-xl flex flex-col items-center justify-center transition-colors duration-500 ${hoy ? "bg-verde-profundo text-white" : "bg-white border border-borde text-tinta"}`}>
                    <span className={`text-[8.5px] uppercase font-semibold ${hoy ? "text-[#c4dbdb]" : "text-tinta-tenue"}`}>{a.dia}</span>
                    <span className="font-serif text-[16px] leading-tight">{a.n}</span>
                  </div>
                  <div className="relative flex rounded-2xl bg-white border border-borde overflow-hidden">
                    <div
                      className="relative w-[50px] shrink-0 flex flex-col items-center justify-center text-white"
                      style={{ backgroundImage: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
                    >
                      <ModuloIcon modulo={a.modulo} className="w-3.5 h-3.5" />
                      <span className="font-serif text-[13px] mt-0.5">{a.hora}</span>
                      <span
                        className="absolute inset-0 bg-[#5f8b5f] flex items-center justify-center transition-opacity duration-500"
                        style={{ opacity: hecha ? 1 : 0 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12.5l4.2 4.2L19 7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                    <div className="px-2.5 min-w-0 flex flex-col justify-center">
                      <p className="m-0 text-[8.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.ink }}>
                        {moduloLabel[a.modulo]}
                      </p>
                      <p className="m-0 font-serif text-[13.5px] leading-snug text-tinta truncate">{a.titulo}</p>
                    </div>
                    <span
                      className="absolute right-2 bottom-1.5 text-[9px] font-semibold rounded-full px-1.5 bg-[#e3efe3] text-semaforo-verde-texto transition-opacity duration-500"
                      style={{ opacity: hecha ? 1 : 0 }}
                    >
                      Hecha
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="rounded-2xl border-[1.5px] border-verde-serenidad bg-verde-tenue px-3 py-2.5">
              <p className="m-0 text-[8.5px] uppercase tracking-[0.1em] font-semibold text-verde-profundo">Mensaje de tu profesional</p>
              <p className="m-0 mt-0.5 text-[11.5px] leading-snug text-tinta">¡Qué buena semana! Esta vez sumamos más música, que tanto le gusta.</p>
            </div>
          </div>

          <div className="shrink-0 bg-white border-t border-borde">
            <div className="grid grid-cols-3 text-[10px] font-semibold text-center">
              {["Hoy", "Mi semana", "Ayuda"].map((t) => (
                <span key={t} className={`pt-2.5 pb-1 ${t === "Mi semana" ? "text-verde-profundo" : "text-tinta-tenue"}`}>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex justify-center pb-2 pt-1">
              <span className="w-[35%] h-[4px] rounded-full bg-tinta/80" />
            </div>
          </div>
        </div>
      </div>
      {/* Notificación flotante: el recordatorio que llega al teléfono */}
      <div className="absolute -right-3 sm:-right-16 top-[7%] w-[200px] rounded-2xl bg-white border border-borde shadow-elevada px-3.5 py-3">
        <p className="m-0 text-[10px] font-semibold text-[#2f8f5b] uppercase tracking-wide">Recordatorio · 9:00</p>
        <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-tinta">Hoy toca “Caminata con música” con doña Rosa 🎶</p>
      </div>
    </div>
  );
}

// ─── Piezas reutilizables ───────────────────────────────────────────────
function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">{children}</p>;
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-serif font-normal text-[30px] sm:text-[36px] lg:text-[46px] leading-[1.12] m-0 ${className}`} style={{ textWrap: "balance" }}>
      {children}
    </h2>
  );
}

// Íconos de línea propios (mismo trazo en todo el home).
function Icono({ name, className = "w-7 h-7" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    charla: (
      <>
        <path {...p} d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h0a2.5 2.5 0 0 1-2-2.5z" />
        <path {...p} d="M9 9h6M9 11.5h3.5" />
      </>
    ),
    elegir: (
      <>
        <rect {...p} x="3.5" y="5" width="7.5" height="14" rx="2" />
        <rect {...p} x="13" y="5" width="7.5" height="14" rx="2" />
        <path {...p} d="M15 12l1.5 1.5L19 10.5" />
      </>
    ),
    profesional: (
      <>
        <circle {...p} cx="12" cy="8" r="3.5" />
        <path {...p} d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
        <path {...p} d="M16.5 4.5l1 1 2-2" />
      </>
    ),
    semana: (
      <>
        <rect {...p} x="4" y="5" width="16" height="15" rx="3" />
        <path {...p} d="M4 9.5h16M8.5 3v4M15.5 3v4" />
        <path {...p} d="M9.5 15.2l1.6 1.6 3.4-3.4" />
      </>
    ),
    sol: (
      <>
        <circle {...p} cx="12" cy="12" r="4" />
        <path {...p} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </>
    ),
    campana: (
      <>
        <path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
        <path {...p} d="M10 20.5a2 2 0 0 0 4 0" />
      </>
    ),
    check: (
      <>
        <circle {...p} cx="12" cy="12" r="8.5" />
        <path {...p} d="M8.3 12.3l2.5 2.5 4.9-5" />
      </>
    ),
    ajuste: (
      <>
        <path {...p} d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle {...p} cx="16" cy="7" r="2" />
        <circle {...p} cx="8" cy="17" r="2" />
      </>
    ),
    corazon: <path {...p} d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z" />,
    cerebro: (
      <>
        <path {...p} d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3.2 3.2 0 0 0 7 18h2V4.5z" />
        <path {...p} d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2A3.2 3.2 0 0 1 17 18h-2V4.5z" />
        <path {...p} d="M9 4.5h6M9 18v2M15 18v2M9 11h1.5M13.5 11H15" />
      </>
    ),
    manzana: (
      <>
        <path {...p} d="M12 7.5c-2-1.6-6-1.4-6.8 2.6-.9 4.4 2 9.4 4.3 9.4 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.3 0 5.2-5 4.3-9.4C18 6.1 14 5.9 12 7.5z" />
        <path {...p} d="M12 7.5c0-2 1-3.5 3-4" />
      </>
    ),
    fisio: (
      <>
        <circle {...p} cx="13" cy="4.5" r="1.8" />
        <path {...p} d="M8 11l3-3.5h3l2.5 3M11 7.5l-1 6 3.5 2.5V21M10 13.5L7 21" />
      </>
    ),
    equilibrio: (
      <>
        <circle {...p} cx="12" cy="4.5" r="1.8" />
        <path {...p} d="M12 7v7M12 14l-3 6.5M12 14h4.5M5.5 9.5l6.5-1 6.5 1" />
      </>
    ),
    estrella: <path {...p} d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />,
    escudo: (
      <>
        <path {...p} d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
        <path {...p} d="M12 8.5v4M12 15.5v.5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}


// Ilustraciones propias para "Para quién es" (en lugar de emojis). Estilo
// plano y adulto, solo con la paleta oficial: Verde Serenidad, Beige
// Serenidad, Mostaza Vital y el verde profundo de los textos.
function IlustracionAcompanar() {
  // Dos personas sentadas a la mesa, armando juntas una actividad.
  return (
    <svg viewBox="0 0 240 170" className="w-[170px] h-[120px] md:w-[240px] md:h-[170px]" aria-hidden="true">
      <circle cx="76" cy="64" r="17" fill="#fbf7ea" />
      <path d="M46 130c0-30 13-48 30-48s30 18 30 48z" fill="#fbf7ea" />
      <circle cx="164" cy="60" r="18" fill="#ebe6ce" />
      <path d="M132 130c0-32 14-50 32-50s32 18 32 50z" fill="#ebe6ce" />
      <path d="M96 100l18 22" stroke="#fbf7ea" strokeWidth="9" strokeLinecap="round" />
      <path d="M144 98l-18 24" stroke="#ebe6ce" strokeWidth="9" strokeLinecap="round" />
      <rect x="104" y="112" width="15" height="11" rx="2.5" fill="#f4d096" transform="rotate(-8 111 117)" />
      <rect x="122" y="111" width="15" height="12" rx="2.5" fill="#f4d096" transform="rotate(6 129 117)" />
      <rect x="34" y="124" width="172" height="9" rx="4.5" fill="#3f6a70" />
      <rect x="54" y="133" width="7" height="37" rx="2" fill="#3f6a70" />
      <rect x="179" y="133" width="7" height="37" rx="2" fill="#3f6a70" />
    </svg>
  );
}

function IlustracionAutonomia() {
  // Una persona leyendo por su cuenta, sentada en su sillón.
  return (
    <svg viewBox="0 0 240 170" className="w-[170px] h-[120px] md:w-[240px] md:h-[170px]" aria-hidden="true">
      <rect x="68" y="58" width="104" height="104" rx="26" fill="#6a969c" />
      <circle cx="120" cy="58" r="18" fill="#fbf7ea" />
      <path d="M86 156c0-40 15-72 34-72s34 32 34 72z" fill="#ebe6ce" />
      <path d="M92 104l28 8 28-8v30l-28 8-28-8z" fill="#fbf7ea" stroke="#3f6a70" strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 112v30" stroke="#3f6a70" strokeWidth="3" strokeLinecap="round" />
      <circle cx="92" cy="122" r="6" fill="#fbf7ea" />
      <circle cx="148" cy="122" r="6" fill="#fbf7ea" />
      <rect x="56" y="146" width="128" height="22" rx="10" fill="#3f6a70" />
      <rect x="48" y="104" width="22" height="64" rx="11" fill="#6a969c" />
      <rect x="170" y="104" width="22" height="64" rx="11" fill="#6a969c" />
      <path d="M210 62v104" stroke="#3f6a70" strokeWidth="3" strokeLinecap="round" />
      <path d="M196 62l6-22h16l6 22z" fill="#fbf7ea" />
    </svg>
  );
}

function IlustracionProfesional() {
  // Una profesional con la guía en la mano, lista para recomendarla.
  return (
    <svg viewBox="0 0 240 170" className="w-[170px] h-[120px] md:w-[240px] md:h-[170px]" aria-hidden="true">
      <circle cx="96" cy="62" r="18" fill="#ebe6ce" />
      <path d="M62 170c0-40 15-70 34-70s34 30 34 70z" fill="#ebe6ce" />
      <path d="M84 100l12 22 12-22" stroke="#6a969c" strokeWidth="4" strokeLinejoin="round" fill="none" />
      <rect x="128" y="74" width="62" height="80" rx="8" fill="#fbf7ea" transform="rotate(6 159 114)" />
      <rect x="146" y="68" width="26" height="10" rx="4" fill="#f4d096" transform="rotate(6 159 73)" />
      <path d="M142 96h32M141 110h32M140 124h22" stroke="#6a969c" strokeWidth="4" strokeLinecap="round" transform="rotate(6 159 114)" />
      <path d="M118 130l16 -8" stroke="#ebe6ce" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

// "Así de fácil se usa": los tres pasos de una semana, junto al video.
const pasosUso: { icono: string; t: string; d: string }[] = [
  { icono: "semana", t: "Recibís tu plan", d: "Cada semana, actividades elegidas para vos." },
  { icono: "check", t: "Hacés la actividad del día", d: "Una consigna por pantalla, a tu ritmo." },
  { icono: "profesional", t: "Tu equipo revisa tu avance", d: "Profesionales revisan tu semana y ajustan el plan." },
];

// Preguntas frecuentes como carrusel: cada pregunta es una tarjeta con la
// respuesta ya visible (nada que abrir). Desplazamiento nativo con
// scroll-snap (dedo, trackpad, teclado) + flechas y puntos que también
// sirven para saltar. La tarjeta siguiente asoma para invitar a seguir.
const margenContenido = "max(1.25rem, calc((100vw - 1280px) / 2 + 3rem))";

const tonosFaq = [
  { from: "#4f7d83", to: "#3f6a70" },
  { from: "#e8b5a1", to: "#c0664f" },
  { from: "#fadfa9", to: "#d9a441" },
  { from: "#89c0c6", to: "#4f8a91" },
  { from: "#ece3c4", to: "#b7a06d" },
];

function FaqCarousel() {
  const pista = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);
  const total = preguntas.length;

  function irA(i: number) {
    const el = pista.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const x = el.scrollLeft;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft - el.offsetLeft - x) < Math.abs(cards[best].offsetLeft - el.offsetLeft - x)) best = i;
      });
      // Al llegar al final, la última se marca aunque no pueda alinearse a la izquierda.
      if (x + el.clientWidth >= el.scrollWidth - 4) best = cards.length - 1;
      setActiva(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div role="region" aria-roledescription="carrusel" aria-label="Preguntas frecuentes">
      <div
        ref={pista}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            irA(Math.min(total - 1, activa + 1));
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            irA(Math.max(0, activa - 1));
          }
        }}
        // De borde a borde de la pantalla, pero alineado con el contenido:
        // el relleno lateral replica el margen del contenedor de 1280px.
        style={{ paddingInline: margenContenido, scrollPaddingInline: margenContenido }}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-verde-serenidad/40"
      >
        {preguntas.map((q, i) => {
          const t = tonosFaq[i % tonosFaq.length];
          return (
            <article
              key={q.p}
              aria-roledescription="tarjeta"
              aria-label={`${i + 1} de ${total}`}
              className={`snap-start shrink-0 w-[84%] sm:w-[400px] lg:w-[420px] rounded-[32px] bg-white border border-borde overflow-hidden flex flex-col transition-[transform,box-shadow,opacity] duration-500 ${
                i === activa ? "shadow-elevada" : "opacity-[0.88]"
              }`}
            >
              <div className="relative px-6 sm:px-7 pt-6 pb-7 text-white min-h-[184px] flex flex-col" style={{ backgroundImage: `linear-gradient(150deg, ${t.from}, ${t.to})` }}>
                <span aria-hidden="true" className="absolute right-6 top-3 font-serif italic text-[96px] leading-none text-white/20 select-none">
                  ?
                </span>
                <span aria-hidden="true" className="absolute right-10 bottom-[-46px] w-28 h-28 rounded-full bg-white/10" />
                <span className="relative text-[12px] font-semibold tracking-[0.16em] text-white/80">
                  {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
                <h3 className="relative m-0 mt-auto pt-6 font-serif font-normal text-[26px] sm:text-[28px] leading-[1.15] drop-shadow-sm" style={{ textWrap: "balance" }}>
                  {q.p}
                </h3>
              </div>
              <div className="px-6 sm:px-7 py-6">
                <p className="m-0 text-[16px] leading-relaxed text-tinta-suave whitespace-pre-line">{q.r}</p>
                {q.video && (
                  <button
                    type="button"
                    onClick={() => reproducirVideo(q.video!)}
                    className="mt-4 inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-verde-tenue border-0 text-verde-profundo font-semibold text-[15px] cursor-pointer hover:bg-beige-serenidad"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                    </svg>
                    Ver el video «Así de fácil se usa»
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between gap-4 max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 mt-2">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Elegir pregunta">
          {preguntas.map((q, i) => (
            <button
              key={q.p}
              type="button"
              role="tab"
              aria-selected={i === activa}
              aria-label={`Pregunta ${i + 1}: ${q.p}`}
              onClick={() => irA(i)}
              // El punto se ve igual, pero el área táctil mide 44 px de alto.
              className={`relative h-2 rounded-full border-none cursor-pointer transition-all duration-300 after:absolute after:content-[''] after:-inset-y-[18px] after:-inset-x-[3px] ${i === activa ? "w-8 bg-verde-profundo" : "w-2 bg-borde-campo hover:bg-verde-serenidad"}`}
            />
          ))}
        </div>
        <div className="hidden sm:flex gap-2.5">
          {[
            { d: -1, label: "Pregunta anterior", path: "M12.5 4.5L7 10l5.5 5.5" },
            { d: 1, label: "Pregunta siguiente", path: "M7.5 4.5L13 10l-5.5 5.5" },
          ].map((b) => {
            const destino = activa + b.d;
            const off = destino < 0 || destino > total - 1;
            return (
              <button
                key={b.d}
                type="button"
                aria-label={b.label}
                onClick={() => irA(destino)}
                disabled={off}
                className="w-12 h-12 rounded-full bg-white border border-borde flex items-center justify-center text-tinta cursor-pointer transition-all hover:bg-verde-profundo hover:text-white hover:border-verde-profundo disabled:opacity-35 disabled:cursor-default disabled:hover:bg-white disabled:hover:text-tinta disabled:hover:border-borde"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d={b.path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Miniatura del video de presentación: foto real de la directora del
// programa, con la marca encima.
function PosterIntro() {
  const f = equipo[0].foto;
  return (
    <span className="absolute inset-0 block">
      {f && (
        <picture>
          <source srcSet={f.webp} type="image/webp" />
          <img src={f.jpg} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-[center_30%]" />
        </picture>
      )}
      <span className="absolute inset-0 bg-gradient-to-r from-verde-profundo/85 via-verde-profundo/35 to-transparent" />
      <span className="absolute left-5 top-5 sm:left-8 sm:top-8 flex items-center gap-2 text-white">
        <img src="/marca/isotipo.png" alt="" className="h-7 w-auto brightness-0 invert" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">Presentación del programa</span>
      </span>
    </span>
  );
}

// Miniatura de "Así de fácil se usa": la pantalla real del paso a paso.
function PosterAsiDeFacil() {
  return (
    <span className="absolute inset-0 block" style={{ backgroundImage: "linear-gradient(150deg, #6a969c, #3f6a70)" }}>
      <span aria-hidden="true" className="absolute -right-10 -bottom-16 w-64 h-64 rounded-full bg-white/10" />
      <span className="absolute right-[9%] top-[8%] h-[84%] aspect-[1/2] rounded-[22px] bg-[#1b2629] p-[1.2%] shadow-[0_24px_50px_-18px_rgba(0,0,0,.6)]">
        <span className="flex h-full w-full flex-col rounded-[18px] bg-fondo-papel overflow-hidden">
          <span className="h-1.5 bg-beige-serenidad">
            <span className="block h-full w-1/2 bg-verde-serenidad" />
          </span>
          <span className="px-[9%] pt-[12%] text-[clamp(7px,1.1vw,10px)] font-semibold uppercase tracking-wider text-tinta-tenue">Paso 2 de 4</span>
          <span className="px-[9%] pt-[6%] font-serif text-[clamp(10px,1.7vw,17px)] leading-tight text-tinta">Despegá un pie apenas del suelo.</span>
          <span className="mt-auto mx-[9%] mb-[12%] rounded-full bg-verde-profundo text-white text-center text-[clamp(7px,1.1vw,11px)] font-semibold py-[7%]">Siguiente</span>
        </span>
      </span>
    </span>
  );
}

// Datos verificables: solo se muestran los que tienen valor cargado.
function PruebaSocial() {
  const datos = pruebaSocial.filter((d) => d.valor);
  if (datos.length === 0) return null;
  return (
    <dl className="m-0 mt-8 grid gap-3 sm:grid-cols-3 max-w-[960px] mx-auto">
      {datos.map((d) => (
        <div key={d.etiqueta} className="rounded-3xl px-5 py-4 text-center bg-white border border-borde">
          <dt className="font-serif text-[30px] leading-none text-verde-profundo">{d.valor}</dt>
          <dd className="m-0 mt-1.5 text-[14.5px] text-tinta-suave">{d.etiqueta}</dd>
        </div>
      ))}
    </dl>
  );
}

// Fotos reales de las sesiones. Sin fotos cargadas no se muestra nada.
function GaleriaSesiones() {
  if (fotosSesiones.length === 0) return null;
  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 pb-16 lg:pb-24 grid gap-3 grid-cols-2 lg:grid-cols-4">
      {fotosSesiones.map((f, i) => (
        <picture key={f.jpg} className={i === 0 ? "col-span-2 row-span-2" : ""}>
          <source srcSet={f.webp} type="image/webp" />
          <img src={f.jpg} alt={f.alt} loading="lazy" decoding="async" className="w-full h-full aspect-square object-cover rounded-3xl" />
        </picture>
      ))}
    </div>
  );
}

// Registro: el mismo proceso desde todos los botones. `para` deja elegida
// la modalidad (se puede cambiar en el formulario y en el cuestionario).
const registro = "/ingresar?mode=register";
const registroPara = (para: "ser-querido" | "mi") => `${registro}&para=${para}`;

// Botón de WhatsApp del home. "primario" solo donde es la acción principal
// de la tarjeta; el resto queda contorneado para no competir con el registro.
function BotonWhatsApp({ href, children, primario = false, className = "" }: { href: string; children: ReactNode; primario?: boolean; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 min-h-[52px] px-6 rounded-full font-sans font-semibold text-[16px] no-underline transition-colors ${
        primario ? "bg-verde-serenidad text-white hover:bg-verde-profundo" : "bg-white border-[1.5px] border-verde-serenidad text-verde-profundo hover:bg-verde-tenue"
      } ${className}`}
    >
      <WhatsAppIcon size={20} /> {children}
    </a>
  );
}

// Retrato provisional mientras no esté la foto real del equipo (paleta oficial).
const tonosEquipo = [
  { fondo: "#6a969c", figura: "#ebe6ce" },
  { fondo: "#f4d096", figura: "#fbf7ea" },
  { fondo: "#ebe6ce", figura: "#6a969c" },
];

function FotoEquipo({ foto, alt, i }: { foto: MiembroEquipo["foto"]; alt: string; i: number }) {
  // Fotos horizontales con la cara en el tercio superior: el recorte de la
  // tarjeta se ancla arriba del centro para no cortar ninguna cara.
  if (foto)
    return (
      <picture>
        <source srcSet={foto.webp} type="image/webp" />
        <img
          src={foto.jpg}
          alt={alt}
          width={foto.ancho}
          height={foto.alto}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
        />
      </picture>
    );
  const t = tonosEquipo[i % tonosEquipo.length];
  return (
    <div className="absolute inset-0 flex items-end justify-center" style={{ background: t.fondo }} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="w-[52%] h-[86%]">
        <circle cx="60" cy="44" r="22" fill={t.figura} opacity=".85" />
        <path d="M18 120c0-26 19-44 42-44s42 18 42 44z" fill={t.figura} opacity=".85" />
      </svg>
    </div>
  );
}

// Los botones flotantes se ocultan cuando el pie de página (que ya tiene
// WhatsApp y redes) está a la vista, para no tapar sus enlaces.
function useOcultoEnElPie() {
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    const pie = document.getElementById("pie");
    if (!pie || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOculto(e.isIntersecting));
    io.observe(pie);
    return () => io.disconnect();
  }, []);
  return oculto;
}

const flotanteBase =
  "fixed z-30 bg-white/95 backdrop-blur border border-borde shadow-[0_10px_28px_-14px_rgba(31,51,56,.45)] transition-[opacity,transform,border-color] duration-300";
const flotanteBottom = { bottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" };

// Ayuda por WhatsApp: discreta, en la esquina derecha.
function AyudaWhatsApp() {
  const oculto = useOcultoEnElPie();
  return (
    <a
      href={whatsappHome.general}
      target="_blank"
      rel="noreferrer"
      aria-label="¿Necesitás ayuda? Escribinos por WhatsApp"
      tabIndex={oculto ? -1 : undefined}
      className={`${flotanteBase} right-3 sm:right-6 inline-flex items-center gap-2 min-h-11 pl-1.5 pr-3.5 rounded-full text-tinta text-[14px] font-semibold no-underline hover:border-verde-serenidad ${
        oculto ? "opacity-0 translate-y-3 pointer-events-none" : ""
      }`}
      style={flotanteBottom}
    >
      <span className="w-8 h-8 rounded-full bg-[#25d366] text-white flex items-center justify-center">
        <WhatsAppIcon size={18} />
      </span>
      ¿Necesitás ayuda?
    </a>
  );
}

// Redes sociales: a la izquierda, con menos peso que «Crear mi cuenta
// gratis». En celular va en columna angosta para no chocar con el botón de
// WhatsApp; desde tablet, en fila.
function RedesFlotantes() {
  const oculto = useOcultoEnElPie();
  const redes = [
    { href: contacto.instagram, label: "Seguinos en Instagram (se abre en otra pestaña)", icono: <InstagramIcon size={18} /> },
    { href: contacto.facebook, label: "Seguinos en Facebook (se abre en otra pestaña)", icono: <FacebookIcon size={18} /> },
  ];
  return (
    <div
      className={`${flotanteBase} left-3 sm:left-6 flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 p-1 sm:pl-3.5 sm:pr-1.5 rounded-[22px] sm:rounded-full ${
        oculto ? "opacity-0 translate-y-3 pointer-events-none" : ""
      }`}
      style={flotanteBottom}
      aria-hidden={oculto || undefined}
    >
      <span className="text-[10.5px] sm:text-[14px] font-semibold text-tinta-suave pt-1 sm:pt-0 sm:mr-0.5">Seguinos</span>
      {redes.map((r) => (
        <a
          key={r.href}
          href={r.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={r.label}
          tabIndex={oculto ? -1 : undefined}
          className="w-9 h-9 rounded-full flex items-center justify-center text-verde-profundo hover:bg-verde-tenue transition-colors"
        >
          {r.icono}
        </a>
      ))}
    </div>
  );
}


const caminos = [
  {
    t: "Acompaño a un ser querido",
    d: "Actividades paso a paso para compartir y registrar cómo les fue.",
    etiquetas: ["Familiares", "Personas cuidadoras"],
    boton: "Empezar para un ser querido",
    to: registroPara("ser-querido"),
    fondo: "#6a969c",
    ilustracion: <IlustracionAcompanar />,
  },
  {
    t: "Quiero cuidar mi salud cerebral",
    d: "Actividades para mantenerte activo y cuidar tu bienestar, a tu ritmo.",
    etiquetas: ["Estimulación cognitiva", "Movimiento", "Bienestar"],
    boton: "Empezar para mí",
    to: registroPara("mi"),
    fondo: "#f4d096",
    ilustracion: <IlustracionAutonomia />,
  },
  {
    t: "¿Sos médico o profesional de la salud?",
    d: "Referí pacientes y recibí información de su seguimiento.",
    etiquetas: ["Geriatría", "Medicina general", "Neurología"],
    boton: "Información para médicos",
    to: guiaProfesionales,
    fondo: "#3f6a70",
    ilustracion: <IlustracionProfesional />,
  },
];

export function Landing() {
  const scrolled = useScrolled(24);
  // El correo de bienvenida enlaza a /#video-introduccion: al llegar, el
  // video arranca solo (o muestra "muy pronto" si todavía no está).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id === "video-introduccion" || id === "video-asi-de-facil") {
      const t = window.setTimeout(() => reproducirVideo(id), 300);
      return () => window.clearTimeout(t);
    }
  }, []);
  const autoguiado = programas.find((p) => p.id === "autoguiado")!;
  const auto = programasHome.autoguiado;
  const ses = programasHome.sesiones;

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-full">
      {/* ─── Header ─── */}
      <header
        className={`sticky top-0 z-30 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled ? "bg-fondo-papel/90 backdrop-blur-md border-b border-borde shadow-[0_8px_24px_-20px_rgba(31,51,56,.5)]" : "border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 lg:px-12 lg:py-4 max-w-[1280px] mx-auto">
          <a href="#top" aria-label="IntegraMente en Casa, ir al inicio" className="no-underline shrink-0">
            <Logo />
          </a>
          <div className="flex items-center gap-2">
            <Link to="/ingresar?mode=login" className="inline-flex items-center min-h-10 px-3 sm:px-4 rounded-full text-[15px] font-semibold text-tinta no-underline hover:bg-white whitespace-nowrap">
              Iniciar sesión
            </Link>
            <span className="hidden sm:inline-flex">
              <Button dense to={registro}>
                Crear mi cuenta gratis
              </Button>
            </span>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section id="top" className="max-w-[1280px] mx-auto px-5 pt-8 pb-10 sm:px-8 lg:px-12 lg:pt-14 lg:pb-24 grid gap-8 md:gap-14 lg:gap-16 items-center lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Eyebrow>Salud cerebral en casa</Eyebrow>
          <h1 className="font-serif font-normal text-[42px] sm:text-[56px] lg:text-[72px] leading-[1.02] tracking-[-0.01em] m-0 mb-5" style={{ textWrap: "balance" }}>
            Saber qué hacer hoy, <em className="italic text-verde-profundo">sin improvisar.</em>
          </h1>
          <p className="text-[17px] sm:text-lg lg:text-[21px] leading-relaxed text-tinta-suave max-w-[32em] m-0 mb-4">
            Cuidá tu salud cerebral o acompañá a un ser querido con un plan semanal de estimulación cognitiva, movimiento y orientaciones de
            nutrición, elaborado por el equipo de IntegraMente.
          </p>
          <p className="m-0 mb-8 font-serif italic text-[19px] lg:text-[22px] text-verde-profundo">Preservá lo que te hace ser vos.</p>
          <div className="flex flex-wrap gap-3">
            <Button to={registro}>Crear mi cuenta gratis</Button>
            <Button variant="secondary" onClick={() => reproducirVideo("video-introduccion")}>
              Ver el video
            </Button>
          </div>
        </div>
        {/* En celular el video de presentación va justo después del texto:
            la maqueta del teléfono se muestra desde escritorio. */}
        <div className="hidden lg:block">
          <HeroPhone />
        </div>
      </section>

      {/* ─── Video de presentación: el elemento principal del home ─── */}
      <section className="max-w-[1280px] mx-auto px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="max-w-[960px] mx-auto">
          <VideoYouTube id="video-introduccion" youtubeId={videos.introduccion.youtubeId} titulo={videos.introduccion.titulo}>
            <PosterIntro />
          </VideoYouTube>
        </div>
        <PruebaSocial />
      </section>

      {/* ─── Para quién es ─── */}
      <section className="bg-beige-serenidad">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="text-center">
            <Eyebrow>Para quién es</Eyebrow>
            <SectionTitle className="max-w-[18em] mx-auto mb-10 lg:mb-12">Para vos y para quienes acompañás.</SectionTitle>
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-3">
            {caminos.map((c, i) => (
              <Reveal key={c.t} delay={i * 110} className="h-full">
                <article className="h-full flex flex-col rounded-[32px] bg-white border border-borde overflow-hidden">
                  <div className="h-[140px] md:h-[190px] flex items-end justify-center overflow-hidden" style={{ background: c.fondo }}>
                    {c.ilustracion}
                  </div>
                  <div className="flex flex-col gap-3 p-6 sm:p-7 flex-1">
                    <h3 className="m-0 font-serif font-normal text-[27px] leading-tight lg:min-h-[2.5em]">{c.t}</h3>
                    <p className="m-0 text-[16px] leading-relaxed text-tinta-suave">{c.d}</p>
                    {/* Información, no controles: texto plano, sin forma de botón. */}
                    <ul aria-label="Pensado para" className="list-none m-0 p-0 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-semibold text-verde-profundo">
                      {c.etiquetas.map((x) => (
                        <li key={x} className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-verde-serenidad" />
                          {x}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-4">
                      <Button to={c.to} variant={i === 2 ? "secondary" : "primary"} className="w-full sm:w-auto">
                        {c.boton}
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ─── Así de fácil se usa: video + tres pasos ─── */}
      <section id="como-funciona" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20 grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <VideoYouTube id="video-asi-de-facil" youtubeId={videos.asiDeFacil.youtubeId} titulo={videos.asiDeFacil.titulo}>
            <PosterAsiDeFacil />
          </VideoYouTube>
        </Reveal>
        <Reveal delay={120}>
          <Eyebrow>Así de fácil se usa</Eyebrow>
          <SectionTitle className="mb-3">Tres pasos cada semana.</SectionTitle>
          <p className="m-0 mb-8 text-[17px] leading-relaxed text-tinta-suave">Actividades explicadas paso a paso para integrarlas a la vida cotidiana.</p>
          <ol className="list-none m-0 p-0 grid gap-5">
            {pasosUso.map((p, i) => (
              <li key={p.t} className="grid grid-cols-[56px_1fr] gap-4 items-center">
                <span
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-[0_14px_30px_-16px_rgba(31,51,56,0.6)]"
                  style={{ background: i === 1 ? "#6a969c" : "#3f6a70" }}
                >
                  <Icono name={p.icono} className="w-7 h-7" />
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-mostaza-vital text-tinta text-[12.5px] font-bold flex items-center justify-center">{i + 1}</span>
                </span>
                <div>
                  <h3 className="m-0 font-serif font-normal text-[21px] leading-tight">{p.t}</h3>
                  <p className="m-0 mt-0.5 text-[15.5px] leading-snug text-tinta-suave">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-9">
            <Button to={registro}>Crear mi cuenta gratis</Button>
          </div>
        </Reveal>
      </section>

      {/* ─── Las áreas del programa ─── */}
      <section className="bg-white border-y border-borde-suave">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <Reveal>
            <Eyebrow>Las áreas del programa</Eyebrow>
            <SectionTitle className="max-w-[16em] mb-10 lg:mb-14">Cuidamos la mente, el movimiento y la alimentación.</SectionTitle>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {areas.map((a, i) => (
              <Reveal key={a.t} delay={i * 90} className="h-full">
                <article className="h-full rounded-[26px] overflow-hidden border border-borde bg-white flex flex-col">
                  <div className="relative p-5 sm:p-6 min-h-[130px] flex flex-col justify-end gap-2" style={{ background: a.fondo, color: a.tinta }}>
                    <span className="absolute right-4 top-4 w-14 h-14 rounded-full flex items-center justify-center bg-white/25">
                      <Icono name={a.icono} className="w-8 h-8" />
                    </span>
                    <h3 className="m-0 pr-16 font-serif font-normal text-[25px] leading-tight">{a.t}</h3>
                    {a.destacado && (
                      <span className="self-start text-[13px] font-bold tracking-[0.04em] rounded-full px-3 py-1 bg-white text-tinta">{a.destacado}</span>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1">
                    <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave">{a.frase}</p>
                    <ul className="list-none m-0 p-0 grid gap-2">
                      {a.puntos.map((e) => (
                        <li key={e} className="flex gap-2.5 text-[15px] leading-snug text-tinta">
                          <span aria-hidden="true" className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full bg-verde-serenidad" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ─── Programas ─── */}
      <section id="programas" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20">
        <Reveal className="text-center">
          <Eyebrow>Programas</Eyebrow>
          <SectionTitle className="max-w-[15em] mx-auto mb-10 lg:mb-12">Dos formas de cuidar tu salud cerebral.</SectionTitle>
        </Reveal>
        {/* Mismo orden en las dos: nombre, descripción, precio, beneficios, condiciones y botón.
            Mismo alto, con los botones alineados abajo. */}
        <div className="grid gap-5 md:grid-cols-2 max-w-[1040px] mx-auto">
          <Reveal className="h-full">
            <article className="h-full rounded-[28px] p-6 sm:p-8 flex flex-col gap-5 border-[1.5px] border-borde bg-white">
              <div>
                <h3 className="m-0 font-serif font-normal text-[30px] leading-tight">{auto.nombre}</h3>
                <p className="m-0 mt-1 text-[15.5px] italic text-verde-profundo">{auto.subtitulo}</p>
              </div>
              <p className="m-0 flex items-baseline gap-2 pb-5 border-b border-borde-suave">
                <span className="font-serif text-[40px] leading-none">{autoguiado.precio}</span>
                <span className="text-[15px] text-tinta-suave">{autoguiado.periodo}</span>
              </p>
              <ListaIncluye items={auto.incluye} />
              <p className="m-0 text-[15px] leading-relaxed text-tinta bg-campo border border-borde-suave rounded-2xl px-4 py-3">{auto.aclaracion}</p>
              <div className="mt-auto">
                <Button to={registro} className="w-full sm:w-auto">
                  Crear mi cuenta gratis
                </Button>
              </div>
            </article>
          </Reveal>
          <Reveal delay={100} className="h-full">
            <article className="h-full rounded-[28px] p-6 sm:p-8 flex flex-col gap-5 border-[1.5px] border-verde-serenidad bg-verde-tenue">
              <div>
                <span className="inline-block mb-2 text-[11px] tracking-[0.12em] uppercase bg-mostaza-vital text-tinta px-3 py-1.5 rounded-full font-bold">{ses.etiqueta}</span>
                <h3 className="m-0 font-serif font-normal text-[30px] leading-tight">{ses.nombre}</h3>
                <p className="m-0 mt-1 text-[15.5px] italic text-verde-profundo">{ses.subtitulo}</p>
              </div>
              <p className="m-0 pb-5 border-b border-borde-suave font-serif text-[28px] leading-tight text-tinta">{ses.presupuesto}</p>
              <ListaIncluye items={ses.incluye} />
              <div className="rounded-2xl bg-white border-[1.5px] border-mostaza-vital px-4 py-3">
                <h4 className="m-0 text-[15px] font-bold text-tinta">Requisito de ingreso</h4>
                <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-tinta">
                  Valoración neuropsicológica de los últimos 12 meses, de IntegraMente o de otro profesional. Con IntegraMente:{" "}
                  <strong>{precioValoracion}</strong>, se contrata aparte.
                </p>
              </div>
              <BotonWhatsApp href={whatsappHome.programaSesiones} primario className="mt-auto w-full sm:w-auto sm:self-start">
                Consultar mi programa con sesiones
              </BotonWhatsApp>
            </article>
          </Reveal>
        </div>
        <p className="m-0 mt-8 text-center text-[15.5px] leading-relaxed text-tinta-suave">
          ¿Ya sos paciente de IntegraMente? Consultá con nuestro equipo cómo acceder a tu cuenta.{" "}
          <a href={whatsappHome.accesoPaciente} target="_blank" rel="noreferrer" className="text-verde-profundo font-semibold inline-block py-2">
            Consultar mi acceso
          </a>
        </p>
      </section>

      {/* ─── Equipo ─── */}
      <section id="equipo" className="bg-beige-serenidad scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-22">
          <Reveal className="text-center">
            <Eyebrow>Conocé al equipo</Eyebrow>
            <SectionTitle className="max-w-[17em] mx-auto mb-3">Profesionales detrás de cada plan.</SectionTitle>
            <p className="m-0 mb-10 lg:mb-12 mx-auto text-[17px] leading-relaxed text-tinta-suave max-w-[38em]">
              Neuropsicología, gerontogimnasia y nutrición. Este equipo revisa cada plan antes de que llegue a tu casa.
            </p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-5">
            {equipo.map((m, i) => (
              <Reveal key={m.nombre} delay={i * 80} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <figure className="m-0 h-full rounded-[26px] bg-white border border-borde overflow-hidden flex flex-col">
                  <div className="relative aspect-[16/10] bg-campo">
                    <FotoEquipo foto={m.foto} alt={m.nombre} i={i} />
                    {!m.foto && (
                      <span className="absolute top-3 left-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-tinta bg-white/85 rounded-full px-2 py-0.5">
                        Foto pronto
                      </span>
                    )}
                  </div>
                  <figcaption className="px-5 py-4 grid gap-1">
                    <p className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-verde-profundo">{m.area}</p>
                    <p className="m-0 font-serif text-[21px] leading-tight text-tinta">{m.nombre}</p>
                    {m.cargo && <p className="m-0 text-[14.5px] font-semibold text-tinta">{m.cargo}</p>}
                    <p className="m-0 mt-1 text-[15px] leading-relaxed text-tinta-suave">{m.descripcion}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Fotos de las sesiones ─── */}
      {fotosSesiones.length > 0 && <div className="bg-beige-serenidad"><GaleriaSesiones /></div>}

      {/* ─── Para médicos ─── */}
      <section id="medicos" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20">
        <div>
          <div className="rounded-[32px] bg-tinta text-white overflow-hidden grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-[#a9c7ca] font-semibold">Para médicos y geriatras</p>
              <h2 className="m-0 mb-6 font-serif font-normal text-[30px] sm:text-[38px] lg:text-[44px] leading-[1.1] text-white" style={{ textWrap: "balance" }}>
                Un aliado entre consultas para tus pacientes.
              </h2>
              <ul className="list-none m-0 p-0 grid gap-3 mb-8">
                {[
                  "Evaluación funcional estandarizada y plan según etapa.",
                  "Te avisamos si detectamos señales que requieren consulta.",
                  "Podemos adaptar la aplicación a tu clínica.",
                ].map((x) => (
                  <li key={x} className="flex gap-3 text-[16px] leading-snug text-[#dce9e9]">
                    <span aria-hidden="true" className="text-mostaza-vital font-bold">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/medicos/referir"
                  className="inline-flex items-center justify-center min-h-[52px] px-7 rounded-full bg-mostaza-vital text-tinta font-bold text-[16px] no-underline hover:bg-white"
                >
                  Referir un paciente
                </Link>
                <a
                  href={whatsappHome.profesional}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-6 rounded-full border-[1.5px] border-[#6f8a8e] text-white font-semibold text-[16px] no-underline hover:border-white"
                >
                  <WhatsAppIcon size={20} /> Hablar con el equipo
                </a>
              </div>
              <Link to={guiaProfesionales} className="inline-block mt-6 text-[15px] font-semibold text-[#a9c7ca] hover:text-white">
                Ver metodología y cómo trabajamos →
              </Link>
            </div>
            <div className="relative min-h-[240px] bg-verde-profundo">
              {equipo[1].foto && (
                <picture>
                  <source srcSet={equipo[1].foto.webp} type="image/webp" />
                  <img src={equipo[1].foto.jpg} alt={`${equipo[1].nombre}, ${equipo[1].area}`} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-[center_25%]" />
                </picture>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonios (solo si hay reales) ─── */}
      {testimonios.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <Reveal>
            <Eyebrow>Familias que nos acompañan</Eyebrow>
            <SectionTitle className="mb-10">Lo que nos cuentan.</SectionTitle>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonios.map((t, i) => (
              <Reveal key={t.nombre} delay={i * 90}>
                <figure className="m-0 h-full rounded-3xl bg-white border border-borde p-6 flex flex-col gap-4">
                  <blockquote className="m-0 font-serif text-[20px] leading-snug text-tinta">“{t.cita}”</blockquote>
                  <figcaption className="mt-auto text-[14.5px] text-tinta-suave">
                    <strong className="text-tinta">{t.nombre}</strong> · {t.relacion}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── Preguntas frecuentes ─── */}
      <section id="preguntas" className="py-16 lg:py-24 scroll-mt-20 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-wrap items-end justify-between gap-4 mb-8 lg:mb-10">
          <Reveal>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <SectionTitle>Lo que suelen preguntarnos.</SectionTitle>
          </Reveal>
          <p className="m-0 text-[15.5px] text-tinta-suave max-w-[24em]">
            ¿Tenés otra consulta? Escribinos a <strong className="text-tinta">{contacto.correo}</strong> o por{" "}
            <a href={whatsappHome.general} target="_blank" rel="noreferrer" className="text-verde-profundo font-semibold inline-block py-2.5 -my-2.5 md:py-0 md:my-0">
              WhatsApp
            </a>
            .
          </p>
        </div>
        <FaqCarousel />
      </section>

      {/* ─── CTA final ─── */}
      <section className="bg-verde-profundo text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-verde-serenidad/40" />
        <div className="relative max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-22 grid gap-6 lg:gap-14 items-center text-center lg:text-left lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-serif font-normal text-[30px] sm:text-[36px] lg:text-[46px] leading-[1.12] m-0 mb-3 text-white">Cuidar la mente es cuidar la vida.</h2>
            <p className="m-0 text-[17px] lg:text-lg leading-relaxed text-[#dce9e9] max-w-[34em] mx-auto lg:mx-0">
              Empezá con un cuestionario de unos 10 minutos.
            </p>
          </div>
          <Link
            to={registro}
            className="inline-flex items-center justify-center min-h-14 px-8 rounded-full bg-mostaza-vital text-tinta font-bold text-[17px] whitespace-nowrap hover:bg-white transition-colors no-underline mx-auto lg:mx-0"
          >
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      <SitioFooter />

      <RedesFlotantes />
      <AyudaWhatsApp />
    </div>
  );
}

function ListaIncluye({ items }: { items: string[] }) {
  return (
    <ul className="list-none m-0 p-0 grid gap-2.5">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5 text-[15.5px] leading-snug text-tinta">
          <span aria-hidden="true" className="text-verde-serenidad font-bold">✓</span>
          {x}
        </li>
      ))}
    </ul>
  );
}
