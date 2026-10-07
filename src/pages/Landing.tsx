import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlanRow } from "../components/ui/PlanRow";
import { Reveal } from "../components/ui/Reveal";
import { Button } from "../components/ui/Button";
import { trackEvent } from "../lib/analytics";
import { clamp, easeOut, useReveal, useScrolled, useScrollProgress, useStickyProgress } from "../lib/useScrollFx";

// H1 variants for campaign alignment (?h=b / ?h=c) — see the brief's
// "Continuidad de mensaje" requirement. No param (or anything else) falls
// back to the default, which is also the one indexable version search
// engines and share links see — campaigns never touch SEO's H1.
const h1Variants: Record<string, { pre: string; em: string }> = {
  b: { pre: "Un plan diario", em: "que da tranquilidad." },
  c: { pre: "Cada día,", em: "claridad en vez de dudas." },
};
const defaultH1 = { pre: "Saber qué hacer hoy,", em: "sin improvisar." };

/* ---------------------------------- Phone shell ---------------------------------- */
// The one phone frame every product-visual moment reuses — chrome, notch,
// side buttons all drawn once instead of three times with tiny drifts.
// Real phones run ~19.5:9 (iPhone 14/15, most current Android flagships) —
// the old frame had no enforced ratio at all and just sized to content,
// which is why it read as a squat, generic "rounded rectangle" instead of
// an actual phone. aspect-ratio on the outer frame fixes the proportion
// regardless of how much each screen's content needs; the inner flex
// column (below) is what lets that content fill the now-taller screen
// instead of leaving it looking broken/empty.
function PhoneFrame({ children, width = 280 }: { children: React.ReactNode; width?: number }) {
  return (
    <div className="relative rounded-[42px] bg-tinta p-2.5" style={{ width, aspectRatio: "9 / 19.5" }}>
      <span className="absolute -left-[3px] top-[88px] w-[3px] h-[26px] rounded-l-full bg-[#5a7278] shadow-[-1px_0_2px_rgba(0,0,0,.35)]" />
      <span className="absolute -left-[3px] top-[128px] w-[3px] h-[52px] rounded-l-full bg-[#5a7278] shadow-[-1px_0_2px_rgba(0,0,0,.35)]" />
      <span className="absolute -right-[3px] top-[148px] w-[3px] h-[74px] rounded-r-full bg-[#5a7278] shadow-[1px_0_2px_rgba(0,0,0,.35)]" />
      <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-white flex flex-col">
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[84px] h-[22px] rounded-full bg-tinta z-10" />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
        <div className="shrink-0 flex justify-center bg-fondo-papel pt-1 pb-2.5">
          <span className="w-[86px] h-[4px] rounded-full bg-tinta/25" />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Hero visual ---------------------------------- */
// The product is the hero image: today's real plan, 3 activities and a
// notification "arriving" — recreated in HTML, not a stock photo. Deliberately
// NOT a phone silhouette: the calendar-sync section further down already is
// one, and three phone mockups in one page reads as repetitive rather than
// as "the product, shown three times." This is a flat, wide "today" panel —
// a different object, not a smaller/cropped version of the same one.
// <!-- TODO: reemplazar por captura real de la vista Hoy cuando exista. -->
function HeroCard() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="relative rounded-[32px] bg-white border border-borde shadow-elevada overflow-hidden transition-all duration-700 ease-out max-w-[420px] mx-auto w-full"
      style={{
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
      }}
    >
      <div className="bg-verde-profundo text-white px-6 pt-6 pb-5 flex items-center justify-between gap-3">
        <div>
          <p className="m-0 mb-0.5 text-[12px] text-[#c4dbdb]">Miércoles 12 de agosto</p>
          <p className="font-serif font-normal text-[26px] m-0 text-white">Hoy</p>
        </div>
        <span className="shrink-0 w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" className="text-white" />
            <path d="M12 7.5V12l3.2 1.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
          </svg>
        </span>
      </div>
      <div className="relative px-5 pt-14 pb-5 grid gap-2.5">
        <span
          className="absolute left-5 right-5 top-[-18px] bg-white border border-borde rounded-xl px-3.5 py-3 shadow-elevada flex items-start gap-3 transition-all duration-700"
          style={{
            transitionDelay: "550ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-14px)",
          }}
        >
          <span className="w-7 h-7 rounded-lg bg-mostaza-vital shrink-0" aria-hidden="true" />
          <span className="text-[13px] leading-snug">
            <strong className="block text-tinta">IntegraMente</strong>
            <span className="text-tinta-suave">Es hora de: Movilidad sentado</span>
          </span>
        </span>
        {[
          { t: "Movilidad sentado · 12 min", done: true, d: 280 },
          { t: "Organizar fotografías y conversar", done: false, d: 400 },
          { t: "Merienda sencilla en conjunto", done: false, d: 520 },
        ].map((row) => (
          <div
            key={row.t}
            className="bg-fondo-papel border border-borde rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-500"
            style={{
              transitionDelay: `${row.d}ms`,
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-14px)",
            }}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.done ? "bg-verde-serenidad" : "bg-borde-campo"}`} />
            <span className="text-[14.5px] text-tinta">{row.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Sticky "Cómo funciona" ---------------------------------- */
const steps = [
  {
    n: "01",
    t: "Contanos cómo está hoy",
    d: "7 preguntas simples sobre autonomía, movilidad, comprensión e intereses. Sin jerga clínica y con avance guardado.",
  },
  {
    n: "02",
    t: "Recibís un reporte que se entiende",
    d: "Un resumen en lenguaje humano de lo que respondiste — qué significa para el día a día, sin tecnicismos.",
  },
  {
    n: "03",
    t: "Tu semana llega al calendario",
    d: "De tres a cinco actividades por día, con recordatorios propios en el calendario de tu celular.",
  },
];

// The sticky section's visual — deliberately not a phone (the calendar-sync
// section below already is one; three phones on one page read as "the same
// screenshot, cropped differently" rather than three distinct moments).
// Instead: one stable dark panel, with a giant watermark number and an icon
// + word that crossfade per step — typography and a single glyph doing the
// work a screenshot did before, which also means no screen content to keep
// in sync with three different real views as the product evolves.
const stepIcons = [
  // 01 — perfil: a short checklist.
  <path key="perfil" d="M8 7h9M8 12h9M8 17h6M4.5 7l.9.9L7 6.3M4.5 12l.9.9L7 11.3M4.5 17l.9.9L7 16.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  // 02 — reporte: a speech bubble, i.e. "said in plain words".
  <path key="reporte" d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9.5L5 20v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  // 03 — calendario: a calendar with today marked.
  <g key="calendario">
    <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3v4M16 3v4M3.5 10h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="8.5" cy="14.5" r="1.3" fill="currentColor" />
  </g>,
];

function StepVisual({ step }: { step: number }) {
  return (
    <div className="relative w-[280px] h-[360px] lg:w-[320px] lg:h-[400px] rounded-[40px] bg-verde-profundo overflow-hidden flex items-center justify-center">
      {steps.map((s, i) => (
        <span
          key={s.n}
          aria-hidden="true"
          className="absolute -bottom-6 -right-2 font-serif text-[220px] leading-none text-white transition-opacity duration-700"
          style={{ opacity: i === step ? 0.1 : 0, transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          {s.n}
        </span>
      ))}
      {steps.map((s, i) => (
        <div
          key={s.n}
          className="absolute flex flex-col items-center gap-5 px-8 text-center transition-all duration-500"
          style={{
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: i === step ? 1 : 0,
            transform: i === step ? "translateY(0)" : `translateY(${i < step ? -16 : 16}px)`,
            pointerEvents: i === step ? "auto" : "none",
          }}
        >
          <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-verde-profundo">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {stepIcons[i]}
            </svg>
          </span>
          <p className="font-serif font-normal text-[28px] lg:text-[32px] leading-tight m-0 text-white">
            {i === 0 ? "Perfil" : i === 1 ? "Reporte" : "Calendario"}
          </p>
        </div>
      ))}
    </div>
  );
}

function StickyHowItWorks() {
  const { ref, progress } = useStickyProgress<HTMLDivElement>();
  const stepCount = steps.length;
  const raw = clamp(progress) * stepCount;
  const activeIndex = Math.min(stepCount - 1, Math.floor(raw));

  return (
    <div ref={ref} style={{ minHeight: `${stepCount * 100}vh` }} className="relative">
      <div className="sticky top-0 min-h-screen flex items-center">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center w-full">
          <div className="grid gap-4 lg:gap-5 max-w-[34em]">
            <p className="m-0 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">Cómo funciona</p>
            <h2 className="font-serif font-normal text-[26px] sm:text-[30px] lg:text-[34px] leading-[1.2] m-0 mb-1 lg:mb-2 max-w-[14em]">
              De la recomendación general a una semana posible de cumplir.
            </h2>
            {steps.map((s, i) => {
              const active = i === activeIndex;
              return (
                <div
                  key={s.n}
                  className="rounded-2xl border-[1.5px] px-5 py-5 lg:px-7 lg:py-6 transition-all duration-500"
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    borderColor: active ? "var(--color-verde-serenidad)" : "var(--color-borde)",
                    backgroundColor: active ? "var(--color-verde-tenue)" : "var(--color-campo)",
                    transform: active ? "scale(1)" : "scale(0.98)",
                  }}
                >
                  <p className="font-serif text-xl lg:text-2xl text-verde-profundo m-0 mb-1.5">{s.n}</p>
                  <h3 className="text-lg lg:text-xl m-0 mb-1.5 font-bold">{s.t}</h3>
                  <p className="m-0 text-base lg:text-lg leading-relaxed text-tinta-suave">{s.d}</p>
                </div>
              );
            })}
          </div>
          <div className="hidden lg:block" style={{ filter: "drop-shadow(0 30px 46px rgba(31,51,56,.22))" }}>
            <StepVisual step={activeIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Calendario sincronizado (semana) ---------------------------------- */
const weekPreview: { dia: string; titulo: string; estado: "realizado" | "parcial" }[] = [
  { dia: "Lunes", titulo: "Movilidad sentado · 12 min", estado: "realizado" },
  { dia: "Martes", titulo: "Organizar cinco fotografías y conversar", estado: "parcial" },
  { dia: "Miércoles", titulo: "Preparar juntos una merienda sencilla", estado: "realizado" },
  { dia: "Jueves", titulo: "Repetir movilidad sentado · 12 min", estado: "parcial" },
  { dia: "Viernes", titulo: "Paseo breve o actividad elegida", estado: "realizado" },
];

// Reversible 3D-settle tied to scroll (unchanged mechanic), plus one extra
// beat near the end: the first activity "flies" into a small calendar chip
// — the Calendario sincronizado moment — without needing a second phone.
function PhoneWeekPreview() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const rise = easeOut(clamp((progress + 0.15) / 1.3));
  const rotX = 26 * (1 - rise);
  const rotY = -16 * (1 - rise);
  const scale = 0.88 + rise * 0.12;
  const lift = 40 * (1 - rise);
  const flyT = easeOut(clamp((progress - 0.92) / 0.2));

  return (
    <div className="relative">
      <div ref={ref} className="flex justify-center" style={{ perspective: "1500px" }}>
        <div
          style={{
            transform: `translate3d(0, ${lift.toFixed(1)}px, 0) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
            transformOrigin: "50% 100%",
            filter: `drop-shadow(0 30px 46px rgba(31, 51, 56, ${(0.08 + rise * 0.2).toFixed(3)}))`,
          }}
        >
          <PhoneFrame width={300}>
            <div className="shrink-0 bg-verde-profundo text-white px-5 pt-9 pb-3.5">
              <p className="m-0 mb-0.5 text-[11px] text-[#c4dbdb]">Miércoles 12 de agosto</p>
              <p className="font-serif font-normal text-[19px] m-0 text-white">Tu semana</p>
            </div>
            <div className="flex-1 bg-fondo-papel px-3.5 pt-3.5 pb-4 flex flex-col justify-center">
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="font-serif text-[15px]">Semana del 10 al 16</span>
                <span className="text-[8px] tracking-[0.1em] uppercase text-tinta-suave">Participación</span>
              </div>
              <div className="grid gap-1.5">
                {weekPreview.map((row, i) => {
                  const t = easeOut(clamp((progress - (0.4 + i * 0.095)) / 0.18));
                  const flying = i === 0;
                  return (
                    <div
                      key={row.dia}
                      style={{
                        opacity: flying ? t * (1 - flyT) : t,
                        transform: `translateX(${(1 - t) * -18}px) translate(${flying ? flyT * 120 : 0}px, ${flying ? -flyT * 34 : 0}px) scale(${flying ? 1 - flyT * 0.3 : 1})`,
                      }}
                    >
                      <PlanRow dia={row.dia} titulo={row.titulo} estado={row.estado} dense />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 p-3 rounded-xl bg-mostaza-vital" style={{ opacity: easeOut(clamp((progress - 0.85) / 0.15)) }}>
                <p className="m-0 text-[11px] leading-relaxed text-semaforo-amarillo-texto">
                  <strong>Estrategia:</strong> una instrucción por vez.
                </p>
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
      {/* The calendar chip the first activity "lands" in — same timeline as the fly-out above. */}
      <div
        className="hidden sm:flex absolute top-[22%] right-[6%] items-center gap-2 bg-white border border-borde rounded-xl px-3.5 py-2.5 shadow-elevada"
        style={{ opacity: flyT, transform: `translateY(${(1 - flyT) * 10}px)` }}
      >
        <span className="w-7 h-7 rounded-lg bg-verde-serenidad/15 flex items-center justify-center text-verde-profundo font-bold text-xs">
          12
        </span>
        <span className="text-[11px] leading-tight">
          <strong className="block text-tinta">Movilidad sentado</strong>
          <span className="text-tinta-suave">Hoy, 10:00 a.m. · recordatorio</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------- Beneficios ---------------------------------- */
const beneficios = [
  { t: "Tu plan en el calendario", d: "Cada actividad llega directo al calendario de tu celular, con recordatorio incluido." },
  { t: "Reporte sin jerga clínica", d: "Entendés qué significa cada respuesta, explicado en lenguaje simple." },
  { t: "Resultados consistentes", d: "La puntuación sigue siempre el mismo criterio, sin importar el día o quién responda." },
  { t: "Respaldo de neuropsicología clínica", d: "Diseñado y revisado por profesionales en neuropsicología." },
];

/* ---------------------------------- Seguridad ---------------------------------- */
const seguridadItems = [
  { color: "bg-verde-serenidad", t: "Verde · seguimiento en casa", d: "Situación estable y apoyo disponible. Se habilita el plan autoguiado completo." },
  { color: "bg-semaforo-amarillo", t: "Amarillo · con acompañamiento", d: "Mayor dependencia o dudas de seguridad. Se limitan ciertas actividades y se ofrece revisión profesional." },
  { color: "bg-semaforo-rojo", t: "Rojo · atención ahora", d: "Cambio agudo, caída o riesgo. Se detienen las recomendaciones y se muestra la ruta de atención de tu país." },
];

function SeguridadRows() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  return (
    <div ref={ref} className="grid gap-3 lg:gap-4">
      {seguridadItems.map((s, i) => {
        const t = easeOut(clamp((progress - (0.05 + i * 0.26)) / 0.22));
        return (
          <div
            key={s.t}
            style={{ opacity: t, transform: `translateY(${(1 - t) * 26}px)` }}
            className="grid grid-cols-[14px_1fr] gap-4 lg:gap-5 items-start bg-white border border-borde rounded-2xl px-5 py-5 lg:px-7 lg:py-6.5"
          >
            <span className={`w-3.5 h-3.5 rounded-full mt-2 im-pulse ${s.color}`} />
            <div>
              <h3 className="m-0 mb-2 text-[17px] lg:text-[19px] font-bold">{s.t}</h3>
              <p className="m-0 text-base lg:text-[17px] leading-relaxed text-tinta-suave">{s.d}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------- FAQ ---------------------------------- */
const faqs = [
  {
    q: "¿Esto es un diagnóstico?",
    a: "No. Es un programa de tamizaje, educación y acompañamiento. No sustituye la consulta médica ni la valoración neuropsicológica — ante una urgencia, comunicate con los servicios de emergencia de tu país.",
  },
  {
    q: "¿Qué pasa con mis datos?",
    a: (
      <>
        Tus respuestas se usan solo para armar y ajustar el plan de tu familiar. El detalle completo está en nuestra{" "}
        <Link to="/legal/privacidad" className="text-verde-profundo underline decoration-dotted">
          política de privacidad
        </Link>
        .
      </>
    ),
  },
  {
    q: "¿Cuánto cuesta?",
    a: "El perfil funcional y el filtro de seguridad son gratuitos, sin tarjeta. Desde ahí podés elegir acompañamiento autoguiado o continuar con tu equipo clínico — mirá los planes abajo.",
  },
  {
    q: "¿Para quién es?",
    a: "Para quien cuida en casa a una persona con cambios cognitivos: familiares, hijos adultos, o la persona misma si puede responder con ayuda.",
  },
];

/* ---------------------------------- Mobile sticky CTA ---------------------------------- */
// Appears once the hero has scrolled past — the brief asks for it "tras el
// hero", not stacked on top of the hero's own already-visible CTA.
function MobileStickyCta({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { rootMargin: "-10% 0px 0px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [heroRef]);

  if (!show) return null;
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-fondo-papel/95 backdrop-blur-md border-t border-borde">
      <Button
        variant="accent"
        fullWidth
        to="/ingresar?mode=register"
        onClick={() => trackEvent("cta_click", { placement: "mobile_sticky" })}
      >
        Crear mi perfil gratuito
      </Button>
    </div>
  );
}

export function Landing() {
  const [searchParams] = useSearchParams();
  const scrolled = useScrolled(24);
  const heroRef = useRef<HTMLElement>(null);

  const h1 = h1Variants[searchParams.get("h") ?? ""] ?? defaultH1;

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-full">
      <header
        className={`sticky top-0 z-30 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled ? "bg-fondo-papel/85 backdrop-blur-md border-b border-borde shadow-[0_8px_24px_-20px_rgba(31,51,56,.5)]" : "border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12 lg:py-5 max-w-[1280px] mx-auto">
          <Link to="/" className="flex items-baseline gap-2.5 no-underline">
            <span className="font-serif text-xl sm:text-2xl lg:text-[27px] text-tinta">
              Integra<em className="italic text-verde-profundo">Mente</em>
            </span>
            <span className="text-[10px] lg:text-xs tracking-[0.16em] uppercase text-tinta-suave pb-0.5">en Casa</span>
          </Link>
          {/* Navegación mínima: logo + login discreto + un solo CTA. Sin menú de secciones. */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/ingresar?mode=login" className="hidden sm:inline text-[15px] font-semibold text-tinta-suave hover:text-tinta">
              Iniciar sesión
            </Link>
            {/* Button.tsx's own base class already hardcodes inline-flex, so a
                responsive hidden/lg:inline-flex passed straight to its
                className collides with that and loses depending on Tailwind's
                stylesheet order — wrapping the toggle in a plain element
                sidesteps it entirely. */}
            <span className="hidden lg:inline-flex">
              <Button variant="accent" dense to="/ingresar?mode=register" onClick={() => trackEvent("cta_click", { placement: "header" })}>
                Crear mi perfil gratuito
              </Button>
            </span>
            <span className="lg:hidden">
              <Button variant="accent" dense to="/ingresar?mode=register" onClick={() => trackEvent("cta_click", { placement: "header_mobile" })}>
                Empezar<span className="sr-only"> — crear mi perfil gratuito</span>
              </Button>
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section ref={heroRef as React.RefObject<HTMLElement>} className="max-w-[1280px] mx-auto px-5 pt-8 pb-14 sm:px-8 sm:pt-10 sm:pb-18 lg:px-12 lg:pt-14 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <Reveal>
              <p className="m-0 mb-4 lg:mb-5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">
                Estimulación cognitiva en casa
              </p>
              <h1
                className="font-serif font-normal leading-[1.05] tracking-[-0.015em] m-0 mb-5 lg:mb-7"
                style={{ fontSize: "clamp(2.5rem, 4.5vw + 1.2rem, 6rem)", textWrap: "pretty" }}
              >
                {h1.pre}
                <br />
                <em className="italic text-verde-profundo">{h1.em}</em>
              </h1>
              <p className="text-lg lg:text-[21px] leading-relaxed text-tinta-suave max-w-[30em] m-0 mb-7 lg:mb-9" style={{ textWrap: "pretty" }}>
                Un plan semanal breve y adaptado para acompañar en casa a una persona con cambios cognitivos: qué actividad hacer, cómo
                hacerla y cuándo pedir ayuda profesional.
              </p>
              <div className="flex flex-col items-start gap-3 mb-3">
                <span className="hidden lg:inline-flex">
                  <Button variant="accent" to="/ingresar?mode=register" onClick={() => trackEvent("cta_click", { placement: "hero" })}>
                    Crear mi perfil gratuito
                  </Button>
                </span>
                <span className="block w-full lg:hidden">
                  <Button variant="accent" to="/ingresar?mode=register" onClick={() => trackEvent("cta_click", { placement: "hero_mobile" })} fullWidth>
                    Crear mi perfil gratuito
                  </Button>
                </span>
                <a href="#como-funciona" className="text-[15px] font-semibold text-verde-profundo underline decoration-dotted">
                  Ver cómo funciona ↓
                </a>
              </div>
            </Reveal>
            <HeroCard />
          </div>
        </section>

        {/* ---------- Disclaimer franja ---------- */}
        <section className="bg-beige-serenidad">
          <Reveal className="max-w-[1280px] mx-auto px-5 py-5 sm:px-8 lg:px-12 lg:py-6.5 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 lg:gap-5">
            <p className="m-0 font-serif text-xl sm:text-2xl italic text-verde-profundo">Preservá lo que te hace ser vos.</p>
            <p className="m-0 text-base lg:text-[15px] text-[#4a5b5f] max-w-[46em]">
              IntegraMente en Casa acompaña, educa y organiza el cuidado. No diagnostica, no interpreta pruebas y no modifica tratamientos
              médicos.
            </p>
          </Reveal>
        </section>

        {/* ---------- Cómo funciona (sticky — el momento estrella) ---------- */}
        <section id="como-funciona">
          <StickyHowItWorks />
        </section>

        {/* ---------- Calendario sincronizado (semana) ---------- */}
        <section className="max-w-[1280px] mx-auto px-5 pt-14 pb-14 sm:px-8 lg:px-12 lg:pt-24 lg:pb-24 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <p className="m-0 mb-2.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">Sincronizado con tu celular</p>
            <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[40px] leading-[1.2] m-0 mb-4 lg:mb-5">
              Tu semana vive en tu calendario, no en una app más.
            </h2>
            <p className="text-lg lg:text-xl leading-relaxed text-tinta-suave m-0">
              Cada actividad se agrega al calendario nativo de tu celular con su propio recordatorio — no hace falta abrir la app para
              acordarte.
            </p>
          </Reveal>
          <PhoneWeekPreview />
        </section>

        {/* ---------- Beneficios ---------- */}
        <section className="bg-white border-y border-borde-suave">
          <div className="max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
            <Reveal className="mb-8 lg:mb-12">
              <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.18] m-0 max-w-[18em]">
                Lo que de verdad cambia para tu familia.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-7">
              {beneficios.map((b, i) => (
                <Reveal key={b.t} delay={i * 90} className="flex gap-3.5">
                  <span className="w-2 h-2 rounded-full bg-verde-serenidad shrink-0 mt-2.5" aria-hidden="true" />
                  <div>
                    <h3 className="m-0 mb-1 text-lg lg:text-xl font-bold">{b.t}</h3>
                    <p className="m-0 text-base lg:text-lg leading-relaxed text-tinta-suave">{b.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Planes ---------- */}
        <section id="planes" className="bg-beige-serenidad/40">
          <div className="max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-28">
            <Reveal className="text-center mb-10 lg:mb-16">
              <p className="m-0 mb-2.5 lg:mb-3.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">Dos formas de acompañarte</p>
              <h2 className="font-serif font-normal text-[28px] sm:text-[34px] lg:text-[44px] leading-[1.16] m-0 mx-auto max-w-[15em]">
                Elegís cuánta compañía profesional necesitás.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-[860px] mx-auto">
              {[
                {
                  id: "autoguiado",
                  nombre: "Autoguiado",
                  tagline: "Para familias que empiezan hoy.",
                  cta: "Empezar",
                  accentBg: "bg-verde-serenidad/15",
                  accentText: "text-verde-profundo",
                  icon: (
                    <path
                      d="M4 11.5 12 5l8 6.5M6.5 10v9h4v-5.5h3V19h4v-9"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ),
                  features: [
                    "Perfil funcional y filtro de seguridad",
                    "Plan semanal generado automáticamente",
                    "Biblioteca de actividades filtrada por perfil",
                    "Asistente guiado para dudas frecuentes",
                  ],
                },
                {
                  id: "clinico",
                  nombre: "Clínico",
                  tagline: "Para pacientes actuales de IntegraMente.",
                  cta: "Ingresar",
                  accentBg: "bg-tinta/10",
                  accentText: "text-tinta",
                  icon: (
                    <>
                      <rect x="5" y="3.5" width="14" height="17" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M9 3.5v2.4h6V3.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                      <path d="M8.7 12.3l2.1 2.1 4.1-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  ),
                  features: [
                    "Continuidad entre sesiones presenciales",
                    "El plan lo define el equipo tratante",
                    "Panel clínico con historial completo",
                    "Prioridad en la bandeja de alertas",
                  ],
                },
              ].map((plan, i) => (
                <Reveal key={plan.id} delay={i * 110} className="rounded-[28px] border border-borde bg-white overflow-hidden flex flex-col">
                  <div className="px-7 pt-8 pb-7 lg:px-8 lg:pt-9">
                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${plan.accentBg} ${plan.accentText} mb-4`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        {plan.icon}
                      </svg>
                    </span>
                    <h3 className="font-serif font-normal text-2xl lg:text-[30px] m-0 mb-1.5">{plan.nombre}</h3>
                    <p className="m-0 text-base lg:text-lg text-tinta-suave">{plan.tagline}</p>
                  </div>
                  <div className="flex flex-col gap-6 px-7 pb-8 lg:px-8 lg:pb-9 flex-1">
                    <ul className="m-0 p-0 list-none grid gap-3 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-base lg:text-lg leading-snug text-tinta-suave">
                          <span className={`shrink-0 font-bold mt-0.5 ${plan.accentText}`} aria-hidden="true">
                            ✓
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="secondary"
                      to={`/planes/${plan.id}`}
                      fullWidth
                      onClick={() => trackEvent("plan_click", { plan: plan.id })}
                    >
                      {plan.cta}
                      <span className="sr-only"> con el plan {plan.nombre}</span>
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Seguridad ---------- */}
        <section id="seguridad" className="bg-white border-y border-borde-suave">
          <div className="max-w-[1280px] mx-auto px-5 py-12 sm:px-8 lg:px-12 lg:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <p className="m-0 mb-2.5 lg:mb-3.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">Seguridad primero</p>
              <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[40px] leading-[1.2] m-0 mb-3 lg:mb-5">
                Antes de sugerir algo, revisamos si es seguro.
              </h2>
              <p className="text-lg lg:text-xl leading-relaxed text-tinta-suave m-0">
                El semáforo no clasifica la demencia ni sustituye una valoración: define qué funciones del programa pueden usarse con
                tranquilidad y cuándo hay que hablar con un profesional.
              </p>
            </Reveal>
            <SeguridadRows />
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="max-w-[760px] mx-auto px-5 py-14 sm:px-8 lg:py-20">
          <Reveal className="mb-8">
            <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.18] m-0">Preguntas frecuentes</h2>
          </Reveal>
          <div className="grid gap-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details className="group bg-white border border-borde rounded-2xl overflow-hidden">
                  <summary className="min-h-[56px] flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-lg font-bold list-none">
                    {f.q}
                    <span className="shrink-0 text-2xl leading-none text-verde-serenidad transition-transform duration-300 group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="m-0 px-5 pb-5 text-lg leading-relaxed text-tinta-suave">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section className="bg-verde-profundo text-white">
          <Reveal className="max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-24 grid grid-cols-1 gap-6 lg:gap-14 items-center text-center lg:text-left lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif font-normal text-[28px] sm:text-[34px] lg:text-[46px] leading-[1.18] m-0 mb-3 lg:mb-4 text-white max-w-[16em] mx-auto lg:mx-0">
                Saber qué hacer hoy empieza con quince minutos.
              </h2>
              <p className="m-0 text-lg lg:text-xl leading-relaxed text-[#dce9e9] max-w-[34em] mx-auto lg:mx-0">
                Empezá con el perfil funcional. Se guarda solo y podés continuar cuando querás — gratis, sin tarjeta.
              </p>
            </div>
            <Button
              variant="accent"
              to="/ingresar?mode=register"
              onClick={() => trackEvent("cta_click", { placement: "cierre" })}
              className="w-full sm:w-auto mx-auto lg:mx-0"
            >
              Crear mi perfil gratuito
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="bg-tinta text-[#c6d2d3]">
        <div className="max-w-[1280px] mx-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="font-serif text-xl lg:text-2xl text-white mb-3 flex items-baseline gap-2">
              <span>
                {/* verde-profundo (used everywhere else for this accent) falls
                    short of AA contrast against this dark footer background —
                    italic alone carries the brand mark here instead. */}
                Integra<em className="italic">Mente</em>
              </span>
              <span className="text-[11px] tracking-[0.16em] uppercase text-[#9fb0b2]">en Casa</span>
            </div>
            <p className="m-0 text-base lg:text-[15px] leading-relaxed max-w-[26em]">
              Programa integral de estimulación cognitiva y acompañamiento emocional. Dra. Guiselle Solano · Neuropsicología.
            </p>
          </div>
          <div className="grid gap-2.5 text-base lg:text-[15px]">
            <span className="text-[#9fb0b2] text-xs tracking-[0.14em] uppercase">Contacto</span>
            <a href="tel:+50683435772" className="text-[#c6d2d3]">+506 8343 5772</a>
            <a href="mailto:info@integramente.com" className="text-[#c6d2d3]">info@integramente.com</a>
            <span>Costa Rica</span>
          </div>
          <div className="grid gap-2.5 text-base lg:text-[15px] content-start">
            <span className="text-[#9fb0b2] text-xs tracking-[0.14em] uppercase">Legal</span>
            <Link to="/legal/condiciones" className="text-[#c6d2d3]">Condiciones de uso</Link>
            <Link to="/legal/privacidad" className="text-[#c6d2d3]">Privacidad y datos</Link>
            <Link to="/legal/emergencias" className="text-[#c6d2d3]">Emergencias</Link>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-5 pb-8 sm:px-8 lg:px-12 lg:pb-11">
          <p className="m-0 text-sm lg:text-[13px] leading-relaxed text-[#9fb0b2] max-w-[60em]">
            IntegraMente en Casa es un servicio de educación, organización y acompañamiento. No sustituye la consulta médica ni la
            valoración neuropsicológica. Ante una urgencia, comunicate con los servicios de emergencia de tu país.
          </p>
        </div>
      </footer>

      <MobileStickyCta heroRef={heroRef} />

      {/* Mobile-only: with no nav menu, this is the way back up. Offset
          above the sticky CTA bar so the two never overlap. */}
      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver arriba"
          className="lg:hidden fixed bottom-[76px] right-5 z-30 w-13 h-13 rounded-full bg-tinta text-white shadow-elevada flex items-center justify-center cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 15V5M10 5l-5 5M10 5l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
