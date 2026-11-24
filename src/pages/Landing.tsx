import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/ui/Reveal";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { ModuloIcon } from "../components/ui/ModuloIcon";
import { useScrolled } from "../lib/useScrollFx";
import { moduloLabel, moduloTheme, type ResourceModulo } from "../lib/modulos";
import { programas } from "../lib/programasData";
import { WhatsAppIcon } from "../components/ui/WhatsAppIcon";
import { VideoYouTube } from "../components/ui/VideoYouTube";
import { reproducirVideo } from "../lib/video";
import { VideoModal } from "../components/landing/VideoModal";
import {
  areas,
  contacto,
  equipo,
  type EjemploArea,
  fotosSesiones,
  type MiembroEquipo,
  guiaProfesionales,
  preguntas,
  programasHome,
  pruebaSocial,
  testimonios,
  videos,
  videosSitio,
  type VideoSitio,
  whatsappHome,
} from "../lib/landingContenido";
import { Logo } from "../components/ui/Logo";
import { AyudaWhatsApp, Eyebrow, Icono, SectionTitle } from "../components/landing/Piezas";
import { CarruselMovil } from "../components/landing/CarruselMovil";
import { SitioFooter } from "../components/layout/SitioFooter";

// Vista real de una actividad (misma que la app). Se carga recién al abrirla.
const EjemploActividad = lazy(() => import("../components/landing/EjemploActividad"));

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


// "Así de fácil se usa": los tres pasos de una semana, junto al video.
const pasosUso: { icono: string; t: string; d: string }[] = [
  { icono: "semana", t: "Recibís tu plan", d: "Cada semana, actividades elegidas para vos." },
  { icono: "check", t: "Hacés la actividad del día", d: "Una consigna por pantalla, a tu ritmo." },
  { icono: "profesional", t: "Tu equipo revisa tu avance", d: "Profesionales revisan tu semana y ajustan el plan." },
];

// Texto recortado en celular (áreas): así todas las
// tarjetas miden lo mismo. Si no entra completo aparece «Ver más», que lo
// abre en un modal (la tarjeta no cambia de tamaño). El recorte va en
// `clase` (line-clamp-N md:line-clamp-none): desde tablet se ve completo y
// el botón no aparece.
function TextoConVerMas({ texto, clase, onVerMas }: { texto: string; clase: string; onVerMas: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [recortada, setRecortada] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setRecortada(el.scrollHeight > el.clientHeight + 1);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <p ref={ref} className={`m-0 ${clase}`}>
        {texto}
      </p>
      {recortada && (
        <button
          type="button"
          onClick={onVerMas}
          className="mt-1 self-start min-h-11 px-0 bg-transparent border-0 cursor-pointer font-sans text-[15px] font-semibold text-verde-profundo underline decoration-borde-campo decoration-2 underline-offset-4"
        >
          Ver más
        </button>
      )}
    </>
  );
}

// Preguntas frecuentes como acordeón (<details>): se leen de arriba abajo,
// funcionan con teclado y lector de pantalla sin código extra, y el texto
// queda en la página para los buscadores. Se muestran las primeras; el
// resto, con «Ver todas».
const PREGUNTAS_VISIBLES = 4;

function FaqAcordeon() {
  const [todas, setTodas] = useState(false);
  const lista = todas ? preguntas : preguntas.slice(0, PREGUNTAS_VISIBLES);
  return (
    <div className="max-w-[880px] mx-auto px-5 sm:px-8">
      <ul className="list-none m-0 p-0 grid gap-3">
        {lista.map((q, i) => (
          <li key={q.p}>
            <details open={i === 0} className="group rounded-3xl bg-white border border-borde open:shadow-[0_18px_40px_-30px_rgba(31,51,56,.5)]">
              <summary className="flex items-center justify-between gap-4 min-h-14 px-5 sm:px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-serif text-[20px] sm:text-[22px] leading-snug text-tinta rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo">
                {q.p}
                <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full bg-verde-tenue text-verde-profundo flex items-center justify-center transition-transform group-open:rotate-45 font-sans text-[22px] leading-none">
                  +
                </span>
              </summary>
              <div className="px-5 sm:px-6 pb-5 -mt-1">
                <p className="m-0 text-[16.5px] leading-relaxed text-tinta whitespace-pre-line">{q.r}</p>
                {q.video && (
                  <button
                    type="button"
                    onClick={() => reproducirVideo(q.video!)}
                    className="mt-4 inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-verde-tenue border-0 text-verde-profundo font-semibold text-[15px] cursor-pointer hover:bg-beige-serenidad"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                    </svg>
                    Ver el video
                  </button>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
      {preguntas.length > PREGUNTAS_VISIBLES && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setTodas((t) => !t)}
            aria-expanded={todas}
            className="min-h-12 px-6 rounded-full border-[1.5px] border-verde-profundo bg-white font-sans text-[16px] font-semibold text-verde-profundo cursor-pointer hover:bg-verde-tenue"
          >
            {todas ? "Ver menos preguntas" : `Ver todas las preguntas (${preguntas.length})`}
          </button>
        </div>
      )}
    </div>
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
    <dl className="m-0 mb-14 px-5 grid gap-3 sm:grid-cols-3 max-w-[960px] mx-auto">
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

// Registro: el mismo proceso desde todos los botones. Quién responde
// (para mí / para un ser querido) se elige en la primera pregunta del
// cuestionario.
const registro = "/ingresar?mode=register";
// El botón de registro dice qué se obtiene: la semana de prueba.
const CTA = "Probar una semana gratis";

// Atajos del encabezado (escritorio).
const secciones = [
  { id: "como-funciona", t: "Cómo funciona" },
  { id: "areas", t: "Áreas" },
  { id: "equipo", t: "Equipo" },
  { id: "programas", t: "Programas" },
  { id: "preguntas", t: "Preguntas" },
];

// Botón de WhatsApp del home. "primario" solo donde es la acción principal
// de la tarjeta; el resto queda contorneado para no competir con el registro.
function BotonWhatsApp({ href, children, primario = false, className = "" }: { href: string; children: ReactNode; primario?: boolean; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 min-h-[52px] px-6 rounded-full font-sans font-semibold text-[16px] no-underline transition-colors ${
        primario ? "bg-verde-profundo text-white hover:bg-tinta" : "bg-white border-[1.5px] border-verde-profundo text-verde-profundo hover:bg-verde-tenue"
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

// «Para quién es»: dos caminos (primero familiares, que suelen ser quienes
// deciden), sin botones de registro. Médicos tiene su propia sección más
// abajo («Para médicos y geriatras»).
const caminos = [
  {
    para: "ser-querido",
    etiqueta: "Para familias y cuidadores",
    t: "Acompaño a un ser querido",
    d: "Un plan claro para cada día, con seguimiento profesional.",
    figura: "#6a969c",
    mitad: "#dfeceb",
    ilustracion: <IlustracionAcompanar />,
  },
  {
    para: "mi",
    etiqueta: "Para vos",
    t: "Cuido mi salud cerebral",
    d: "Actividades para tu mente y tu cuerpo, a tu ritmo.",
    figura: "#f4d096",
    mitad: "#fbf0d6",
    ilustracion: <IlustracionAutonomia />,
  },
];

export function Landing() {
  const scrolled = useScrolled(24);
  // El video de presentación no está en la página: se abre en un modal
  // desde «Ver el video» (y desde el enlace del correo de bienvenida).
  // El video abierto: la presentación de la app o el de un área.
  const [video, setVideo] = useState<VideoSitio | null>(null);
  const [ejemplo, setEjemplo] = useState<EjemploArea | null>(null);
  const [areaAbierta, setAreaAbierta] = useState<number | null>(null);
  // El correo de bienvenida enlaza a /#video-introduccion: al llegar, el
  // video arranca solo (o muestra "muy pronto" si todavía no está).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id === "video-introduccion") {
      setVideo(videosSitio.app);
      return;
    }
    if (id === "video-asi-de-facil") {
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
            <Logo compacto />
          </a>
          {/* Página larga: atajos a cada sección (solo en pantallas grandes). */}
          <nav aria-label="Secciones" className="hidden xl:flex items-center gap-1">
            {secciones.map((x) => (
              <a key={x.id} href={`#${x.id}`} className="px-3 py-2 rounded-full text-[15px] font-semibold text-tinta-suave no-underline hover:text-tinta hover:bg-white">
                {x.t}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/ingresar?mode=login" className="inline-flex items-center min-h-10 px-2 sm:px-4 rounded-full text-[15px] font-semibold text-tinta no-underline hover:bg-white whitespace-nowrap">
              <span className="sm:hidden">Ingresar</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
            <Button dense variant="principal" to={registro} className="whitespace-nowrap !min-h-10 !px-3.5 sm:!px-5">
              Probar gratis
            </Button>
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
          <p className="text-[18px] sm:text-lg lg:text-[21px] leading-relaxed text-tinta max-w-[30em] m-0 mb-8">
            Un plan semanal de actividades para la mente, el cuerpo y la alimentación, para vos o para un ser querido.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="principal" to={registro}>
              {CTA}
            </Button>
            <Button variant="secondary" onClick={() => setVideo(videosSitio.app)}>
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

      <PruebaSocial />

      {/* ─── Para quién es ─── */}
      {/* Dos caminos que llevan al registro con la modalidad ya elegida
          (/ingresar?para=…): compactos, y cada tarjeta entera es el enlace. */}
      <section className="bg-seccion-arena">
        <div className="max-w-[1080px] mx-auto px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <Reveal className="text-center">
            <Eyebrow>Para quién es</Eyebrow>
            <SectionTitle className="max-w-[18em] mx-auto mb-8 lg:mb-10">Para vos y para quienes acompañás.</SectionTitle>
          </Reveal>
          <Reveal>
            <ul className="list-none m-0 p-0 grid gap-4 md:grid-cols-2 md:gap-5">
              {caminos.map((c) => (
                <li key={c.t}>
                  <Link
                    to={`${registro}&para=${c.para}`}
                    className="group h-full grid grid-cols-[88px_1fr] sm:grid-cols-[112px_1fr] gap-4 sm:gap-5 items-center rounded-[28px] border border-borde p-4 sm:p-5 no-underline text-tinta transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-elevada focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
                    style={{ background: c.mitad }}
                  >
                    <span aria-hidden="true" className="relative w-[88px] h-[72px] sm:w-[112px] sm:h-[92px]">
                      <span className="absolute inset-0 rounded-[48%_52%_44%_56%/58%_50%_50%_42%]" style={{ background: c.figura }} />
                      <span className="relative h-full flex items-end justify-center overflow-hidden rounded-b-[40%] [&>svg]:w-[86%] [&>svg]:h-auto">{c.ilustracion}</span>
                    </span>
                    <span className="grid gap-1">
                      <span className="text-[12px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">{c.etiqueta}</span>
                      <span className="font-serif text-[23px] sm:text-[26px] leading-[1.1]">{c.t}</span>
                      <span className="text-[15.5px] leading-snug text-tinta">{c.d}</span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-[15.5px] font-semibold text-verde-profundo">
                        Empezar
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ─── Así de fácil se usa: video + tres pasos ─── */}
      <div className="bg-white">
      {/* Celular: título, video y pasos, en ese orden. Computadora: video a
          la izquierda y el título con los pasos a la derecha. */}
      <section id="como-funciona" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20 grid gap-8 lg:gap-x-16 lg:gap-y-0 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-[auto_auto]">
        <Reveal className="lg:col-start-2 lg:row-start-1 lg:self-end">
          <Eyebrow>Así de fácil se usa</Eyebrow>
          <SectionTitle className="mb-3">Tres pasos cada semana.</SectionTitle>
          <p className="m-0 lg:mb-8 text-[17px] leading-relaxed text-tinta-suave">Actividades explicadas paso a paso para integrarlas a la vida cotidiana.</p>
        </Reveal>
        <Reveal className="lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-center">
          <VideoYouTube id="video-asi-de-facil" youtubeId={videos.asiDeFacil.youtubeId} titulo={videos.asiDeFacil.titulo}>
            <PosterAsiDeFacil />
          </VideoYouTube>
        </Reveal>
        <Reveal delay={120} className="lg:col-start-2 lg:row-start-2 lg:self-start">
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
            <Button variant="principal" to={registro}>
              {CTA}
            </Button>
          </div>
        </Reveal>
      </section>
      </div>

      {/* ─── Las áreas del programa ─── */}
      <section id="areas" className="bg-seccion-fria scroll-mt-20">
        <div className="max-w-[1280px] mx-auto py-16 lg:py-24">
          <Reveal className="px-5 sm:px-8 lg:px-12">
            <Eyebrow>Las áreas del programa</Eyebrow>
            <SectionTitle className="max-w-[18em] mb-3">Cuidamos la mente, el movimiento, la autonomía y la alimentación.</SectionTitle>
            <p className="m-0 mb-10 lg:mb-12 text-[17px] leading-relaxed text-tinta-suave max-w-[40em]">
              Cada área la diseña un especialista de nuestro <a href="#equipo" className="font-semibold text-verde-profundo">equipo</a>.
            </p>
          </Reveal>
          {/* Celular: carrusel horizontal (no una pared de tarjetas). Desde
              tablet: dos columnas; en pantallas grandes, las cuatro. */}
          <ul
            aria-label="Áreas del programa"
            className="list-none m-0 flex md:grid md:grid-cols-2 md:auto-rows-fr xl:grid-cols-4 gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory px-5 sm:px-8 lg:px-12 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollPaddingInline: "1.25rem" }}
          >
            {areas.map((a, i) => {
              return (
                <li key={a.t} className="snap-start shrink-0 w-[84%] sm:w-[62%] md:w-auto">
                  <article className="h-full rounded-[26px] overflow-hidden border border-borde bg-white flex flex-col transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-elevada">
                    <div className="relative aspect-video">
                      {a.foto ? (
                        <picture>
                          <source srcSet={a.foto.webp} type="image/webp" />
                          <img src={a.foto.jpg} alt={a.foto.alt} loading="lazy" decoding="async" width={1280} height={720} className="absolute inset-0 w-full h-full object-cover" />
                        </picture>
                      ) : (
                        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${a.fondo}66, ${a.fondo})`, color: a.tinta }}>
                          <Icono name={a.icono} className="w-20 h-20 opacity-70" />
                        </div>
                      )}
                      <span
                        className="absolute right-3.5 top-3.5 w-11 h-11 rounded-full flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(0,0,0,.45)] ring-2 ring-white/70"
                        style={{ background: a.fondo, color: a.tinta }}
                      >
                        <Icono name={a.icono} className="w-6 h-6" />
                      </span>
                    </div>
                    {/* Corte limpio entre la imagen y la franja del título. */}
                    <div className="px-5 sm:px-6 py-3.5" style={{ background: a.fondo, color: a.tinta }}>
                      <h3 className="m-0 font-serif font-normal text-[24px] leading-tight">{a.t}</h3>
                    </div>
                    <div className="px-5 sm:px-6 pt-5 pb-5 flex flex-col gap-4 flex-1">
                      <div className="flex flex-col">
                        <TextoConVerMas texto={a.frase} clase="text-[16px] leading-relaxed text-tinta line-clamp-4 md:line-clamp-none" onVerMas={() => setAreaAbierta(i)} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEjemplo(a.ejemplo)}
                        className="mt-auto self-start inline-flex items-center gap-2 min-h-11 px-0 bg-transparent border-0 cursor-pointer text-left whitespace-nowrap font-sans text-[15px] xl:text-[14.5px] font-semibold text-verde-profundo underline decoration-borde-campo decoration-2 underline-offset-4 hover:decoration-verde-serenidad"
                      >
                        <span aria-hidden="true" className="w-7 h-7 rounded-full bg-verde-tenue flex items-center justify-center no-underline">
                          {/* Mismo ícono en todas las áreas: abre la actividad. */}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                          </svg>
                        </span>
                        Ver una actividad de ejemplo
                      </button>
                      {/* La presentación del área, en video. */}
                      <button type="button" onClick={() => setVideo(a.video)} className="-mt-3 self-start inline-flex items-center gap-2 min-h-11 px-0 bg-transparent border-0 cursor-pointer text-left whitespace-nowrap font-sans text-[15px] xl:text-[14.5px] font-semibold text-verde-profundo underline decoration-borde-campo decoration-2 underline-offset-4 hover:decoration-verde-serenidad">
                        <span aria-hidden="true" className="w-7 h-7 rounded-full bg-verde-tenue flex items-center justify-center no-underline">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" />
                            <path d="M15.5 10.5l5-3v9l-5-3z" />
                          </svg>
                        </span>
                        Conocé el área en video
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ─── Equipo ─── */}
      <section id="equipo" className="bg-seccion-arena scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-22">
          <Reveal className="text-center">
            <Eyebrow>Conocé al equipo</Eyebrow>
            <SectionTitle className="max-w-[17em] mx-auto mb-3">Profesionales detrás de cada plan.</SectionTitle>
            <p className="m-0 mb-10 lg:mb-12 mx-auto text-[17px] leading-relaxed text-tinta-suave max-w-[38em]">
              Un equipo especializado en neuropsicología, terapia física y gerontogimnasia, nutrición y terapia ocupacional que trabaja para adaptar las actividades a las necesidades de cada persona.
            </p>
          </Reveal>
          <Reveal>
          <CarruselMovil etiqueta="Equipo" escritorio="md:flex-wrap md:justify-center md:gap-5" item="md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
            {equipo.map((m, i) => (
                <figure key={m.nombre} className="m-0 h-full rounded-[26px] bg-white border border-borde overflow-hidden flex flex-col">
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
                    {m.credencial && <p className="m-0 text-[14px] text-tinta-suave">{m.credencial}</p>}
                    <p className="m-0 mt-1 text-[15px] leading-relaxed text-tinta-suave">{m.descripcion}</p>
                  </figcaption>
                </figure>
            ))}
          </CarruselMovil>
          </Reveal>
        </div>
      </section>

      {/* ─── Fotos de las sesiones ─── */}
      {fotosSesiones.length > 0 && <div className="bg-seccion-arena"><GaleriaSesiones /></div>}

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

      {/* ─── Programas ─── */}
      <section id="programas" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20">
        <Reveal className="text-center">
          <Eyebrow>Programas</Eyebrow>
          <SectionTitle className="max-w-[15em] mx-auto mb-10 lg:mb-12">Dos formas de cuidar tu salud cerebral.</SectionTitle>
        </Reveal>
        {/* Mismo orden en las dos: nombre, descripción, precio, beneficios, condiciones y botón.
            Mismo alto, con los botones alineados abajo. */}
        <Reveal className="max-w-[1040px] mx-auto">
          <CarruselMovil etiqueta="Programas" escritorio="md:grid md:grid-cols-2 md:gap-x-5 md:gap-y-0" item="md:w-auto md:grid md:grid-rows-subgrid md:row-span-3">
            <article className="h-full rounded-[28px] p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 md:grid md:grid-rows-subgrid md:row-span-3 md:gap-y-5 border-[1.5px] border-borde bg-white">
              <div>
                <h3 className="m-0 font-serif font-normal text-[26px] sm:text-[30px] leading-tight">{auto.nombre}</h3>
                <p className="m-0 mt-1 text-[15.5px] italic text-verde-profundo">{auto.subtitulo}</p>
              </div>
              <div className="pb-4 sm:pb-5 border-b border-borde-suave grid gap-3 content-start">
                <p className="m-0 flex items-baseline gap-2">
                  <span className="font-serif text-[34px] sm:text-[40px] leading-none">{autoguiado.precio}</span>
                  <span className="text-[15px] text-tinta-suave">{autoguiado.periodo}</span>
                </p>
                <div className="grid gap-2">
                  <p className="m-0 justify-self-start rounded-full bg-verde-tenue px-3 py-1 text-[14px] font-semibold text-verde-profundo">{auto.prueba}</p>
                  <p className="m-0 text-[15px] text-tinta">{auto.ideal}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5">
              <ListaIncluye items={auto.incluye} />
              <p className="m-0 text-[14.5px] sm:text-[15px] leading-relaxed text-tinta bg-campo border border-borde-suave rounded-2xl px-4 py-2.5 sm:py-3">{auto.aclaracion}</p>
              <div className="mt-auto">
                <Button variant="principal" to={registro} className="w-full sm:w-auto whitespace-nowrap !px-4 sm:!px-8 max-sm:!text-[16px]">
                  {CTA}
                </Button>
              </div>
              </div>
            </article>
            <article className="h-full rounded-[28px] p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 md:grid md:grid-rows-subgrid md:row-span-3 md:gap-y-5 border-[1.5px] border-verde-serenidad bg-verde-tenue">
              <div>
                <h3 className="m-0 font-serif font-normal text-[26px] sm:text-[30px] leading-tight">{ses.nombre}</h3>
                <p className="m-0 mt-1 text-[15.5px] italic text-verde-profundo">{ses.subtitulo}</p>
              </div>
              <div className="pb-4 sm:pb-5 border-b border-borde-suave grid gap-3 content-start">
                <p className="m-0 font-serif text-[34px] sm:text-[40px] leading-none text-tinta">{ses.presupuesto}</p>
                <p className="m-0 text-[15px] text-tinta">{ses.ideal}</p>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5">
              <ListaIncluye items={ses.incluye} />
              {/* Requisito como nota al pie: discreto, sin caja ni color de
                  aviso, con el mismo contraste legible del resto. */}
              {/* En celular el requisito queda detrás de un botón informativo
                  para que la tarjeta sea corta. */}
              <InfoRequisito />
              <p className="m-0 hidden md:flex gap-2.5 pt-4 border-t border-borde-suave text-[14px] leading-relaxed text-tinta-suave">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 mt-[3px] text-verde-profundo">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 11v5.5M12 7.6v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>
                  <span className="font-semibold text-tinta">Requisito de ingreso:</span> {REQUISITO_INGRESO}
                </span>
              </p>
              <BotonWhatsApp href={whatsappHome.programaSesiones} primario className="mt-auto w-full sm:w-auto sm:self-start">
                {/* En celular, corto para que el botón entre en una línea (la tarjeta ya dice «con sesiones»). */}
                <span className="lg:hidden whitespace-nowrap">Consultar mi programa</span>
                <span className="hidden lg:inline">Consultar mi programa con sesiones</span>
              </BotonWhatsApp>
              </div>
            </article>
          </CarruselMovil>
        </Reveal>
        <p className="m-0 mt-8 text-center text-[15.5px] leading-relaxed text-tinta-suave">
          ¿Ya sos paciente de IntegraMente? Consultá con nuestro equipo cómo acceder a tu cuenta.{" "}
          <a href={whatsappHome.accesoPaciente} target="_blank" rel="noreferrer" className="text-verde-profundo font-semibold inline-block py-2">
            Consultar mi acceso
          </a>
        </p>
      </section>

      {/* ─── Preguntas frecuentes ─── */}
      <section id="preguntas" className="bg-seccion-fria py-16 lg:py-24 scroll-mt-20 overflow-hidden">
        <div className="max-w-[880px] mx-auto px-5 sm:px-8 grid gap-3 mb-8 lg:mb-10">
          <Reveal>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <SectionTitle>Lo que suelen preguntarnos.</SectionTitle>
          </Reveal>
          <p className="m-0 text-[15.5px] text-tinta-suave">
            ¿Tenés otra consulta? Escribinos a <strong className="text-tinta">{contacto.correo}</strong> o por{" "}
            <a href={whatsappHome.general} target="_blank" rel="noreferrer" className="text-verde-profundo font-semibold inline-block py-2.5 -my-2.5 md:py-0 md:my-0">
              WhatsApp
            </a>
            .
          </p>
        </div>
        <FaqAcordeon />
      </section>

      {/* ─── CTA final ─── */}
      <section data-sin-flotantes="" className="bg-verde-profundo text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-verde-serenidad/40" />
        <div className="relative max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-22 grid gap-6 lg:gap-14 items-center text-center lg:text-left lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-serif font-normal text-[30px] sm:text-[36px] lg:text-[46px] leading-[1.12] m-0 mb-3 text-white">Cuidar la mente es cuidar la vida.</h2>
            <p className="m-0 mb-2 font-serif italic text-[20px] lg:text-[22px] text-mostaza-vital">Preservá lo que te hace ser vos.</p>
            <p className="m-0 text-[17px] lg:text-lg leading-relaxed text-[#dce9e9] max-w-[34em] mx-auto lg:mx-0">
              Empezá con un cuestionario de unos 10 minutos.
            </p>
          </div>
          <Link
            to={registro}
            className="inline-flex items-center justify-center min-h-14 px-8 rounded-full bg-mostaza-vital text-tinta font-bold text-[17px] whitespace-nowrap hover:bg-white transition-colors no-underline mx-auto lg:mx-0"
          >
            {CTA}
          </Link>
        </div>
      </section>

      {/* ─── Para médicos ─── */}
      {/* Otro público: franja breve al final, el detalle está en /medicos. */}
      <section id="medicos" className="bg-fondo-papel border-t border-borde scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-5 py-10 sm:px-8 lg:px-12 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="m-0 mb-1.5 text-xs sm:text-[13px] tracking-[0.16em] uppercase font-semibold text-tinta-suave">Para médicos y geriatras</p>
            <h2 className="m-0 font-serif font-normal text-[25px] sm:text-[30px] leading-[1.15] text-tinta">Un aliado entre consultas para tus pacientes.</h2>
            <p className="m-0 mt-2 text-[15.5px] leading-relaxed text-tinta-suave max-w-[46em]">
              Evaluación funcional estandarizada, plan según etapa y aviso si detectamos señales que requieren consulta.{" "}
              <Link to={guiaProfesionales} className="font-semibold text-verde-profundo">
                Ver metodología
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/medicos/referir"
              className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-full bg-verde-profundo text-white font-semibold text-[16px] no-underline hover:bg-tinta"
            >
              Referir un paciente
            </Link>
            <BotonWhatsApp href={whatsappHome.profesional}>Hablar con el equipo</BotonWhatsApp>
          </div>
        </div>
      </section>

      <SitioFooter />

      {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
      {areaAbierta !== null && (
        <Modal onClose={() => setAreaAbierta(null)}>
          <h3 className="m-0 mb-4 pr-10 font-serif font-normal text-[26px] leading-[1.15] text-tinta">{areas[areaAbierta].t}</h3>
          <p className="m-0 text-[16.5px] leading-relaxed text-tinta-suave">{areas[areaAbierta].frase}</p>
        </Modal>
      )}
      {ejemplo && (
        <Suspense fallback={null}>
          <EjemploActividad
            codigo={ejemplo.codigo}
            onClose={() => {
              setEjemplo(null);
              // De vuelta en el home, en las áreas del programa.
              requestAnimationFrame(() => document.getElementById("areas")?.scrollIntoView({ block: "start" }));
            }}
          />
        </Suspense>
      )}
      <AyudaWhatsApp href={whatsappHome.general} />
    </div>
  );
}

const REQUISITO_INGRESO = "valoración neuropsicológica de los últimos 12 meses, de IntegraMente o de otro profesional.";

const iconoInfo = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-verde-profundo">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 11v5.5M12 7.6v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Solo celular: «Requisito de ingreso» como botón con un globo informativo
// encima. Se cierra con la ×, tocando afuera o con Escape.
function InfoRequisito() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);
  return (
    <div ref={caja} className="md:hidden relative">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-2 min-h-11 px-0 bg-transparent border-0 cursor-pointer font-sans text-[14.5px] font-semibold text-tinta underline decoration-borde-campo decoration-2 underline-offset-4"
      >
        {iconoInfo}
        Requisito de ingreso
      </button>
      {abierto && (
        <div role="status" className="absolute left-0 right-0 bottom-full mb-1 z-10 rounded-2xl bg-tinta text-white text-[14.5px] leading-relaxed px-4 py-3 pr-10 shadow-elevada">
          <span className="font-semibold">Requisito de ingreso:</span> {REQUISITO_INGRESO}
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
            className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-transparent border-0 text-white/80 text-[20px] leading-none cursor-pointer"
          >
            ×
          </button>
          <span aria-hidden="true" className="absolute left-5 -bottom-1.5 w-3 h-3 rotate-45 bg-tinta" />
        </div>
      )}
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
