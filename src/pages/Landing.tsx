import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/ui/Reveal";
import { Button } from "../components/ui/Button";
import { ModuloIcon } from "../components/ui/ModuloIcon";
import { useScrolled } from "../lib/useScrollFx";
import { moduloLabel, moduloTheme, type ResourceModulo } from "../lib/mediaResources";
import { programas } from "../lib/programas";
import { contacto, equipo, preguntas, programasHome, testimonios } from "../lib/landingContenido";

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
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setHechas((h) => (h >= semanaDemo.length ? 0 : h + 1)), 1400);
    return () => window.clearInterval(id);
  }, []);

  // Tamaño fijo: ancho fijo + aspect-ratio real, y todo el contenido de
  // la pantalla con alturas fijas — marcar una actividad como hecha nunca
  // cambia el tamaño del teléfono, solo lo que se ve adentro.
  return (
    <div className="relative mx-auto w-[288px] sm:w-[312px]" aria-hidden="true">
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

const disciplinas = [
  { icono: "cerebro", t: "Neuropsicología", d: "Memoria, atención y estado de ánimo", from: "#89c0c6", to: "#3f6a70" },
  { icono: "manzana", t: "Nutrición", d: "Una alimentación que cuida el cerebro", from: "#e8b5a1", to: "#c0664f" },
  { icono: "fisio", t: "Fisioterapia", d: "Movimiento seguro y equilibrio", from: "#fadfa9", to: "#d9a441" },
  { icono: "estrella", t: "Expertos del programa", d: "Acompañamiento y seguimiento de resultados", from: "#ece3c4", to: "#b7a06d" },
];

// Ilustraciones propias para "Para quién es" (en lugar de emojis).
function IlustracionAcompanar() {
  return (
    <svg viewBox="0 0 240 170" className="w-[240px] h-[170px]" aria-hidden="true">
      <circle cx="96" cy="58" r="22" fill="#f7f4e9" />
      <path d="M52 170c0-36 20-62 44-62s44 26 44 62z" fill="#f7f4e9" />
      <circle cx="150" cy="74" r="18" fill="#ebe6ce" />
      <path d="M116 170c0-30 15-52 34-52s34 22 34 52z" fill="#ebe6ce" />
      <path d="M128 132c-6 6-14 8-22 6" stroke="#3f6a70" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".55" />
      <path d="M124 28c-4-7-14-6-14 2 0 7 14 14 14 14s14-7 14-14c0-8-10-9-14-2z" fill="#f4d096" />
    </svg>
  );
}

function IlustracionCrecer() {
  return (
    <svg viewBox="0 0 240 170" className="w-[240px] h-[170px]" aria-hidden="true">
      <circle cx="120" cy="66" r="24" fill="#f7f4e9" />
      <path d="M72 170c0-38 22-66 48-66s48 28 48 66z" fill="#f7f4e9" />
      <path d="M120 40c0-14 4-22 4-22" stroke="#5f8b5f" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M124 22c10-10 26-8 28 2-10 8-24 8-28-2z" fill="#7fae7f" />
      <path d="M122 30c-10-8-24-6-26 2 10 7 22 7 26-2z" fill="#a8d5a2" />
      <circle cx="62" cy="54" r="5" fill="#fffaf0" opacity=".9" />
      <circle cx="178" cy="40" r="4" fill="#fffaf0" opacity=".9" />
      <circle cx="190" cy="92" r="6" fill="#fffaf0" opacity=".7" />
    </svg>
  );
}

const pasos = [
  { icono: "charla", t: "Contanos de su día", d: "Unos 10 minutos" },
  { icono: "elegir", t: "Elegí tu programa", d: "Con o sin sesiones en vivo" },
  { icono: "profesional", t: "Lo revisamos", d: "Nuestro equipo prepara su semana" },
  { icono: "semana", t: "¡A disfrutar!", d: "Actividades y recordatorios" },
];

const modulosInfo: Record<ResourceModulo, { frase: string; ejemplos: string[] }> = {
  movimiento: { frase: "Mover el cuerpo con seguridad, a su ritmo.", ejemplos: ["Caminata con música", "Movilidad sentado"] },
  musica: { frase: "Canciones que despiertan recuerdos y ánimo.", ejemplos: ["Boleros de siempre", "Ritmo con las manos"] },
  reminiscencia: { frase: "Conversar sobre su historia, fotos y lugares.", ejemplos: ["Álbum de recuerdos", "Recetas de la familia"] },
  sentidos: { frase: "Texturas, aromas y sabores que conectan.", ejemplos: ["Texturas del jardín", "Aromas de la cocina"] },
};

const ordenModulos: ResourceModulo[] = ["movimiento", "musica", "reminiscencia", "sentidos"];


const seguridad = [
  {
    t: "Solo lo que es seguro para su movilidad",
    d: "Las actividades de movimiento se eligen según cómo camina y su equilibrio. Si algo no es seguro, no se recomienda.",
  },
  {
    t: "Si algo cambia, primero la revisión",
    d: "Ante una caída o un cambio repentino, la aplicación pausa las actividades físicas, te indica qué hacer y avisa al equipo clínico.",
  },
  {
    t: "Acompaña, no diagnostica",
    d: "No interpreta exámenes ni cambia tratamientos médicos. Cuando hace falta, te recomendamos una valoración profesional.",
  },
];

function Faq() {
  const [abierta, setAbierta] = useState<number | null>(0);
  return (
    <div className="grid gap-2.5">
      {preguntas.map((q, i) => {
        const open = abierta === i;
        return (
          <div key={q.p} className={`rounded-2xl border bg-white transition-colors ${open ? "border-verde-serenidad" : "border-borde"}`}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setAbierta(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4.5 bg-transparent border-none cursor-pointer font-sans"
            >
              <span className="text-[16.5px] sm:text-[17.5px] font-semibold text-tinta">{q.p}</span>
              <span aria-hidden="true" className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[18px] transition-transform ${open ? "rotate-45 bg-verde-serenidad text-white" : "bg-campo text-tinta-suave"}`}>
                +
              </span>
            </button>
            {open && <p className="m-0 px-5 sm:px-6 pb-5 -mt-1 text-[16px] leading-relaxed text-tinta-suave max-w-[60em]">{q.r}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function Landing() {
  const scrolled = useScrolled(24);
  const waUrl = `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent("Hola, quiero información sobre IntegraMente en Casa.")}`;

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-full">
      {/* ─── Header ─── */}
      <header
        className={`sticky top-0 z-30 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled ? "bg-fondo-papel/90 backdrop-blur-md border-b border-borde shadow-[0_8px_24px_-20px_rgba(31,51,56,.5)]" : "border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-12 lg:py-4.5 max-w-[1280px] mx-auto">
          <a href="#top" className="flex items-baseline gap-2.5 no-underline shrink-0">
            <span className="font-serif text-xl sm:text-2xl lg:text-[27px] text-tinta">
              Integra<em className="italic text-verde-profundo">Mente</em>
            </span>
            <span className="text-[10px] lg:text-xs tracking-[0.16em] uppercase text-tinta-suave pb-0.5 whitespace-nowrap">en Casa</span>
          </a>
          <div className="flex items-center gap-2">
            <Link to="/ingresar?mode=login" className="inline-flex items-center min-h-10 px-3 sm:px-4 rounded-full text-[15px] font-semibold text-tinta no-underline hover:bg-white whitespace-nowrap">
              Iniciar sesión
            </Link>
            <span className="hidden sm:inline-flex">
              <Button dense to="/ingresar?mode=register">
                Crear perfil gratis
              </Button>
            </span>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section id="top" className="max-w-[1280px] mx-auto px-5 pt-8 pb-14 sm:px-8 lg:px-12 lg:pt-14 lg:pb-24 grid gap-14 lg:gap-16 items-center lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <Eyebrow>Estimulación cognitiva en el hogar · Costa Rica</Eyebrow>
          <h1 className="font-serif font-normal text-[42px] sm:text-[56px] lg:text-[72px] leading-[1.02] tracking-[-0.01em] m-0 mb-5" style={{ textWrap: "balance" }}>
            Saber qué hacer hoy, <em className="italic text-verde-profundo">sin improvisar.</em>
          </h1>
          <p className="text-[17px] sm:text-lg lg:text-[21px] leading-relaxed text-tinta-suave max-w-[32em] m-0 mb-3">
            Para quienes cuidan a un ser querido: un plan semanal de actividades para la memoria, el movimiento y el ánimo, preparado
            por nuestro equipo de salud y adaptado a su día a día.
          </p>
          <p className="m-0 mb-8 font-serif italic text-[19px] lg:text-[22px] text-verde-profundo">Preservá lo que te hace ser vos.</p>
          <div className="flex flex-wrap gap-3">
            <Button to="/ingresar?mode=register">Crear mi perfil gratuito</Button>
            <Button variant="secondary" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
              Ver cómo funciona
            </Button>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <HeroPhone />
        </Reveal>
      </section>

      {/* ─── Para quién: dos caminos, ilustrados ─── */}
      <section className="bg-beige-serenidad">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <Reveal className="text-center">
            <Eyebrow>Para quién es</Eyebrow>
            <SectionTitle className="max-w-[18em] mx-auto mb-3">Para cuidar a quien querés, o para cuidarte vos.</SectionTitle>
            <p className="m-0 mb-10 lg:mb-12 mx-auto text-[17px] leading-relaxed text-tinta-suave max-w-[34em]">
              Para personas adultas mayores que desean mantener su mente activa, con o sin diagnóstico, y para las familias que las acompañan.
            </p>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 max-w-[1040px] mx-auto">
            {[
              {
                t: "Cuido a un familiar",
                d: "Te indicamos qué hacer cada día y cómo hacerlo. Vos acompañás y registrás cómo les fue.",
                chips: ["Mamá o papá", "Abuelita o abuelito", "Pareja"],
                from: "#89c0c6",
                to: "#3f6a70",
                ilustracion: <IlustracionAcompanar />,
              },
              {
                t: "Quiero cuidar mi propia mente",
                d: "Respondés el cuestionario vos mismo y recibís actividades pensadas para tus gustos y tu ritmo.",
                chips: ["Prevención", "Memoria", "Bienestar"],
                from: "#fadfa9",
                to: "#d9a441",
                ilustracion: <IlustracionCrecer />,
              },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 110}>
                <Link
                  to="/ingresar?mode=register"
                  className="group h-full flex flex-col rounded-[32px] bg-white border border-borde overflow-hidden no-underline text-tinta transition-all hover:-translate-y-1 hover:shadow-elevada"
                >
                  <div className="relative h-[190px] overflow-hidden" style={{ backgroundImage: `linear-gradient(150deg, ${c.from}, ${c.to})` }}>
                    <span aria-hidden="true" className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-white/15" />
                    <span aria-hidden="true" className="absolute -left-8 -top-12 w-40 h-40 rounded-full bg-white/10" />
                    <div className="absolute inset-0 flex items-end justify-center transition-transform duration-500 group-hover:scale-[1.04]">{c.ilustracion}</div>
                  </div>
                  <div className="flex flex-col gap-3 p-6 sm:p-7 flex-1">
                    <h3 className="m-0 font-serif font-normal text-[27px] leading-tight">{c.t}</h3>
                    <p className="m-0 text-[16px] leading-relaxed text-tinta-suave">{c.d}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.chips.map((x) => (
                        <span key={x} className="text-[13px] font-semibold rounded-full px-3 py-1 bg-campo border border-borde-suave text-tinta-suave">
                          {x}
                        </span>
                      ))}
                    </div>
                    <span className="mt-auto pt-3 inline-flex items-center gap-2 text-[15.5px] font-semibold text-verde-profundo">
                      Empezar
                      <span aria-hidden="true" className="w-8 h-8 rounded-full bg-verde-tenue border border-borde-suave flex items-center justify-center transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona: cuatro pasos como un camino ─── */}
      <section id="como-funciona" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20">
        <Reveal className="text-center">
          <Eyebrow>Cómo funciona</Eyebrow>
          <SectionTitle className="max-w-[16em] mx-auto mb-12 lg:mb-16">Empezar es más simple de lo que parece.</SectionTitle>
        </Reveal>
        <ol className="list-none m-0 p-0 relative grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-6">
          {/* Línea que une los pasos (escritorio) */}
          <span aria-hidden="true" className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] border-t-2 border-dashed border-borde-campo" />
          {pasos.map((p, i) => {
            const tonos = ["#3f6a70", "#c0664f", "#b7a06d", "#e0a12a"];
            return (
              <Reveal key={p.t} delay={i * 110}>
                <li className="relative flex flex-col items-center text-center">
                  <span
                    className="relative w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] rounded-full flex items-center justify-center text-white shadow-[0_18px_40px_-18px_rgba(31,51,56,0.55)]"
                    style={{ background: `radial-gradient(circle at 30% 25%, ${tonos[i]}cc, ${tonos[i]})` }}
                  >
                    <Icono name={p.icono} className="w-9 h-9 sm:w-11 sm:h-11" />
                    <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-fondo-papel text-tinta font-serif text-[16px] flex items-center justify-center shadow-sm">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="m-0 mt-4 sm:mt-5 font-serif font-normal text-[20px] sm:text-[24px] leading-tight">{p.t}</h3>
                  <p className="m-0 mt-1.5 text-[14px] sm:text-[15.5px] text-tinta-suave">{p.d}</p>
                </li>
              </Reveal>
            );
          })}
        </ol>
        <div className="flex justify-center mt-12">
          <Button to="/ingresar?mode=register">Empezar ahora</Button>
        </div>
      </section>

      {/* ─── Los cuatro módulos ─── */}
      <section className="bg-white border-y border-borde-suave">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <Reveal>
            <Eyebrow>Las actividades</Eyebrow>
            <SectionTitle className="max-w-[16em] mb-3">Cuatro formas de estimular la mente.</SectionTitle>
            <p className="m-0 mb-10 lg:mb-14 text-[17px] leading-relaxed text-tinta-suave max-w-[38em]">
              Cada semana combina actividades de estos módulos, elegidas según sus intereses y lo que es seguro para su movilidad.
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ordenModulos.map((m, i) => {
              const t = moduloTheme[m];
              const info = modulosInfo[m];
              return (
                <Reveal key={m} delay={i * 90}>
                  <article className="h-full rounded-[26px] overflow-hidden border border-borde bg-white flex flex-col">
                    <div className="relative h-36 flex items-end p-5" style={{ backgroundImage: `linear-gradient(140deg, ${t.from}, ${t.to})` }}>
                      <ModuloIcon modulo={m} className="absolute right-4 top-4 w-16 h-16 text-white/35" />
                      <h3 className="m-0 font-serif font-normal text-[28px] text-white drop-shadow-sm">{moduloLabel[m]}</h3>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave">{info.frase}</p>
                      <ul className="list-none m-0 p-0 grid gap-1.5 mt-auto">
                        {info.ejemplos.map((e) => (
                          <li key={e} className="flex items-center gap-2 text-[14px] text-tinta">
                            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: t.to }} />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Seguridad ─── */}
      <section id="seguridad" className="bg-verde-tenue border-y border-borde-suave scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-22 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <Reveal>
            <Eyebrow>Seguridad primero</Eyebrow>
            <SectionTitle className="mb-4">Antes de sugerir algo, revisamos que sea seguro.</SectionTitle>
            <p className="m-0 text-[17px] leading-relaxed text-tinta-suave max-w-[30em]">
              Cada recomendación pasa por un filtro de seguridad basado en lo que nos contás, y nuestro equipo de salud revisa el plan
              antes de que llegue a tu casa.
            </p>
          </Reveal>
          <div className="grid gap-3.5">
            {seguridad.map((s, i) => (
              <Reveal key={s.t} delay={i * 90}>
                <div className="flex gap-4 rounded-2xl bg-white border border-borde px-5 py-5 lg:px-6">
                  <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full bg-verde-profundo text-white flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="m-0 mb-1 text-[17.5px] font-bold">{s.t}</h3>
                    <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Programas ─── */}
      <section id="programas" className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-20">
        <Reveal className="text-center">
          <Eyebrow>Programas</Eyebrow>
          <SectionTitle className="max-w-[15em] mx-auto mb-3">Los dos con nuestro equipo de salud. Vos elegís qué tan cerca.</SectionTitle>
          <p className="m-0 mb-10 lg:mb-12 mx-auto text-[17px] leading-relaxed text-tinta-suave max-w-[38em]">
            En ambos, profesionales de la salud revisan y ajustan las actividades. La diferencia: el Orientado suma sesiones en vivo y un
            acompañamiento cercano. Crear el perfil es gratis y el programa se elige al final del cuestionario.
          </p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 max-w-[980px] mx-auto">
          {programas.map((p, i) => {
            const destacado = p.id === "orientado";
            const txt = programasHome[p.id];
            return (
              <Reveal key={p.id} delay={i * 100}>
                <article className={`h-full rounded-[28px] p-6 sm:p-8 flex flex-col gap-5 border-[1.5px] ${destacado ? "border-verde-serenidad bg-verde-tenue" : "border-borde bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 font-serif font-normal text-[30px] leading-tight">{p.nombre}</h3>
                      <p className="m-0 mt-1 text-[15.5px] italic text-verde-profundo">{txt.lema}</p>
                    </div>
                    {destacado && <span className="shrink-0 text-[11px] tracking-[0.12em] uppercase bg-mostaza-vital text-semaforo-amarillo-texto px-3 py-1.5 rounded-full font-bold">Con sesiones en vivo</span>}
                  </div>
                  <p className="m-0 text-[16px] leading-relaxed text-tinta-suave">{txt.descripcion}</p>
                  <p className="m-0 flex items-baseline gap-2 pb-5 border-b border-borde-suave">
                    <span className="font-serif text-[40px] leading-none">{p.precio}</span>
                    <span className="text-[15px] text-tinta-suave">{p.periodo}</span>
                  </p>
                  <ul className="list-none m-0 p-0 grid gap-2.5">
                    {txt.incluye.map((x) => (
                      <li key={x} className="flex gap-2.5 text-[15.5px] text-tinta">
                        <span aria-hidden="true" className="text-verde-serenidad font-bold">✓</span>
                        {x}
                      </li>
                    ))}
                  </ul>
                  <Button to="/ingresar?mode=register" variant={destacado ? "primary" : "secondary"} className="mt-auto self-start">
                    Empezar gratis
                  </Button>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="m-0 mt-6 text-center text-[15.5px] text-tinta-suave">
          ¿Ya sos paciente de la clínica IntegraMente? Tu cuenta la crea nuestro equipo:{" "}
          <Link to="/ingresar?mode=login" className="text-verde-profundo font-semibold">
            entrá con el correo que registraste en consulta
          </Link>
          .
        </p>
      </section>

      {/* ─── Equipo interdisciplinario ─── */}
      <section id="equipo" className="bg-beige-serenidad scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-22">
          <Reveal className="text-center">
            <Eyebrow>Quiénes estamos detrás</Eyebrow>
            <SectionTitle className="max-w-[16em] mx-auto mb-3">Un equipo de salud, no solo una aplicación.</SectionTitle>
            <p className="m-0 mb-10 lg:mb-12 mx-auto text-[17px] leading-relaxed text-tinta-suave max-w-[36em]">
              Profesionales de distintas áreas revisan y ajustan cada plan, para cuidar la mente, el cuerpo y la alimentación de tu familiar.
            </p>
          </Reveal>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {disciplinas.map((d, i) => (
              <Reveal key={d.t} delay={i * 90}>
                <div className="h-full rounded-[28px] bg-white border border-borde p-5 sm:p-6 flex flex-col items-center text-center">
                  <span
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white mb-4 shadow-[0_14px_30px_-16px_rgba(31,51,56,0.6)]"
                    style={{ backgroundImage: `linear-gradient(145deg, ${d.from}, ${d.to})` }}
                  >
                    <Icono name={d.icono} className="w-9 h-9" />
                  </span>
                  <h3 className="m-0 font-serif font-normal text-[21px] sm:text-[23px] leading-tight">{d.t}</h3>
                  <p className="m-0 mt-1.5 text-[14px] sm:text-[15px] leading-relaxed text-tinta-suave">{d.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {equipo.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {equipo.map((m) => (
                <span key={m.nombre} className="inline-flex items-center gap-3 rounded-full bg-white border border-borde pl-1.5 pr-4 py-1.5">
                  {m.foto ? (
                    <img src={m.foto} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-verde-profundo text-white font-serif text-[14px] flex items-center justify-center">
                      {m.nombre
                        .replace(/^Dr[a]?\.\s*/, "")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <span className="text-[14.5px] text-tinta">
                    <strong className="font-semibold">{m.nombre}</strong> <span className="text-tinta-suave">· {m.rol}</span>
                  </span>
                </span>
              ))}
            </div>
          )}
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
      <section id="preguntas" className="max-w-[980px] mx-auto px-5 py-16 sm:px-8 lg:py-24 scroll-mt-20">
        <Reveal>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <SectionTitle className="mb-8 lg:mb-10">Lo que suelen preguntarnos.</SectionTitle>
        </Reveal>
        <Faq />
        <p className="m-0 mt-6 text-[15.5px] text-tinta-suave">
          ¿Tenés otra consulta? Escribinos a <strong className="text-tinta">{contacto.correo}</strong> o por{" "}
          <a href={waUrl} target="_blank" rel="noreferrer" className="text-verde-profundo font-semibold">
            WhatsApp
          </a>
          .
        </p>
      </section>

      {/* ─── CTA final ─── */}
      <section className="bg-verde-profundo text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-verde-serenidad/40" />
        <Reveal className="relative max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-22 grid gap-6 lg:gap-14 items-center text-center lg:text-left lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-serif font-normal text-[30px] sm:text-[36px] lg:text-[46px] leading-[1.12] m-0 mb-3 text-white">Cuidar la mente es cuidar la vida.</h2>
            <p className="m-0 text-[17px] lg:text-lg leading-relaxed text-[#dce9e9] max-w-[34em] mx-auto lg:mx-0">
              Empezá con el cuestionario: toma unos 10 minutos, se guarda solo y podés seguir cuando quieras.
            </p>
          </div>
          <Link
            to="/ingresar?mode=register"
            className="inline-flex items-center justify-center min-h-14 px-8 rounded-full bg-mostaza-vital text-semaforo-amarillo-texto font-bold text-[17px] whitespace-nowrap hover:bg-white hover:text-tinta transition-colors no-underline mx-auto lg:mx-0"
          >
            Crear mi perfil gratuito
          </Link>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-tinta text-[#d3dcdd]">
        <div className="max-w-[1280px] mx-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-14 grid gap-8 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="font-serif text-xl lg:text-2xl text-white mb-3 flex items-baseline gap-2">
              <span>
                Integra<em className="italic text-[#9cc2c6]">Mente</em>
              </span>
              <span className="text-[11px] tracking-[0.16em] uppercase text-[#a9b9bb]">en Casa</span>
            </div>
            <p className="m-0 text-[15px] leading-relaxed max-w-[26em]">
              Programa integral de estimulación cognitiva y acompañamiento emocional, con un equipo interdisciplinario en neuropsicología,
              nutrición y fisioterapia.
            </p>
          </div>
          <div className="grid gap-2.5 text-[15px] content-start">
            <span className="text-[#a9b9bb] text-xs tracking-[0.14em] uppercase">Contacto</span>
            <span>{contacto.telefono}</span>
            <a href={waUrl} target="_blank" rel="noreferrer" className="text-[#d3dcdd]">
              WhatsApp · +506 8346 4703
            </a>
            <a href={contacto.instagram} target="_blank" rel="noreferrer" className="text-[#d3dcdd]">
              Instagram · @integramentecr
            </a>
            <span>{contacto.correo}</span>
            <span>Costa Rica</span>
          </div>
          <div className="grid gap-2.5 text-[15px] content-start">
            <span className="text-[#a9b9bb] text-xs tracking-[0.14em] uppercase">Legal</span>
            <Link to="/legal/condiciones" className="text-[#d3dcdd]">
              Condiciones de uso
            </Link>
            <Link to="/legal/privacidad" className="text-[#d3dcdd]">
              Privacidad y datos
            </Link>
            <Link to="/legal/emergencias" className="text-[#d3dcdd]">
              Emergencias
            </Link>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-5 pb-8 sm:px-8 lg:px-12 lg:pb-11">
          <p className="m-0 text-[13.5px] leading-relaxed text-[#a9b9bb] max-w-[60em]">
            IntegraMente en Casa es un servicio de educación, organización y acompañamiento. No sustituye la consulta médica ni la valoración
            neuropsicológica. Ante una emergencia, llamá al 9-1-1.
          </p>
        </div>
      </footer>

      {/* Redes flotantes — WhatsApp (el canal natural en Costa Rica) e Instagram */}
      <div className="fixed z-30 right-4 sm:right-6 flex flex-col gap-3" style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>
        <a
          href={contacto.instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="Seguinos en Instagram"
          title="Instagram"
          className="w-14 h-14 rounded-full text-white shadow-elevada flex items-center justify-center hover:scale-105 transition-transform"
          style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
            <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
          </svg>
        </a>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribinos por WhatsApp"
          title="WhatsApp"
          className="w-14 h-14 rounded-full bg-[#25d366] text-white shadow-elevada flex items-center justify-center hover:scale-105 transition-transform"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.7-1.2-1.4-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
