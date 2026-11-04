import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { WhatsAppIcon } from "../components/ui/WhatsAppIcon";
import { Reveal } from "../components/ui/Reveal";
import { SitioFooter } from "../components/layout/SitioFooter";
import { AyudaWhatsApp, Eyebrow, Icono, SectionTitle } from "../components/landing/Piezas";
import { useScrolled } from "../lib/useScrollFx";
import { areas, contacto, equipo } from "../lib/landingContenido";
import { WHATSAPP_EQUIPO, WHATSAPP_EQUIPO_VISIBLE, waLink } from "../lib/whatsapp";

// Página para médicos y geriatras (/medicos). Prioridad del negocio: que
// refieran pacientes. Mismo lenguaje visual que el home (encabezado fijo,
// secciones con fondos alternados, tarjetas, fotos reales, animaciones de
// entrada), con un tono más técnico e igual de breve. No repite secciones
// del home salvo el equipo clínico. El formulario vive solo en
// /medicos/referir.
//
// "Referir un paciente" no guarda nada en la base: arma el mensaje con los
// datos y abre WhatsApp del equipo. Así no hay un formulario público
// recibiendo datos de salud de terceros sin autenticación.

const hablarConElEquipo = waLink(WHATSAPP_EQUIPO, "Hola, soy médico/a y quisiera conocer IntegraMente en Casa para referir pacientes.");
const REFERIR = "/medicos/referir";

const metodologia: { icono: string; t: string; d: string }[] = [
  {
    icono: "check",
    t: "Evaluación inicial estandarizada",
    d: "Perfil funcional con puntuación determinista: cognición y comunicación, actividades instrumentales y básicas, ánimo y sueño, movilidad y caídas, alimentación.",
  },
  {
    icono: "ajuste",
    t: "Plan según etapa",
    d: "Cada recurso trae su adaptación para envejecimiento saludable, deterioro cognitivo leve, demencia leve y moderada. Las etapas avanzadas requieren pauta individual.",
  },
  {
    icono: "escudo",
    t: "Reglas de seguridad",
    d: "Ruta física por riesgo de caídas y nivel de supervisión. Exclusiones nutricionales por alergias, disfagia, enfermedad renal o anticoagulación, entre otras.",
  },
  {
    icono: "profesional",
    t: "Revisión profesional",
    d: "Neuropsicología, gerontogimnasia y nutrición revisan el plan antes de publicarlo y el registro de cada semana.",
  },
];

const recibe: { icono: string; t: string; d: string; fondo: string; tinta: string }[] = [
  {
    icono: "campana",
    t: "Referencia de vuelta",
    d: "Si detectamos señales que requieren consulta (caídas, cambios cognitivos o conductuales, riesgo nutricional), orientamos a la familia a consultarte y, con su autorización, te avisamos.",
    fondo: "#3f6a70",
    tinta: "#ffffff",
  },
  {
    icono: "semana",
    t: "Información de seguimiento",
    d: "Adherencia y evolución funcional de tu paciente, cuando el paciente o su familia lo autorizan.",
    fondo: "#f4d096",
    tinta: "#1f3338",
  },
  {
    icono: "corazon",
    t: "Adaptado a tu consulta",
    d: "Podemos preparar la aplicación con la identidad de tu clínica para tus pacientes.",
    fondo: "#a9c49f",
    tinta: "#1f3338",
  },
];

const pasosReferir: { icono: string; t: string; d: string }[] = [
  { icono: "charla", t: "Nos enviás la referencia", d: "Con el formulario o por WhatsApp, en un minuto." },
  { icono: "profesional", t: "Contactamos a la familia", d: "Le explicamos el programa y la acompañamos a crear la cuenta." },
  { icono: "semana", t: "Evaluación y plan", d: "Responde la evaluación inicial y el equipo prepara su plan." },
];

const botonPrimario =
  "inline-flex items-center justify-center gap-2.5 min-h-[56px] px-8 rounded-full font-sans font-semibold text-[17px] no-underline bg-verde-serenidad text-white hover:bg-verde-profundo transition-colors";
const botonSecundario =
  "inline-flex items-center justify-center gap-2.5 min-h-[56px] px-7 rounded-full font-sans font-semibold text-[17px] no-underline bg-white border-[1.5px] border-verde-serenidad text-verde-profundo hover:bg-verde-tenue transition-colors";

function Encabezado({ accion }: { accion: ReactNode }) {
  const scrolled = useScrolled(24);
  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled ? "bg-fondo-papel/90 backdrop-blur-md border-b border-borde shadow-[0_8px_24px_-20px_rgba(31,51,56,.5)]" : "border-b border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 lg:px-12 lg:py-4 max-w-[1280px] mx-auto">
        <Link to="/" aria-label="IntegraMente en Casa, ir al inicio" className="no-underline shrink-0">
          <Logo />
        </Link>
        {accion}
      </div>
    </header>
  );
}

const campo =
  "w-full min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta focus:outline-none focus:border-verde-serenidad";

interface Referencia {
  medico: string;
  especialidad: string;
  codigo: string;
  contactoMedico: string;
  paciente: string;
  edad: string;
  contactoFamilia: string;
  motivo: string;
}

const vacia: Referencia = { medico: "", especialidad: "Geriatría", codigo: "", contactoMedico: "", paciente: "", edad: "", contactoFamilia: "", motivo: "" };

function mensajeReferencia(r: Referencia): string {
  const linea = (k: string, v: string) => (v.trim() ? `${k}: ${v.trim()}\n` : "");
  return (
    "Hola, quiero referir un paciente a IntegraMente en Casa.\n\n" +
    linea("Médico/a", r.medico) +
    linea("Especialidad", r.especialidad) +
    linea("Código profesional", r.codigo) +
    linea("Mi contacto", r.contactoMedico) +
    "\n" +
    linea("Paciente", r.paciente) +
    linea("Edad", r.edad) +
    linea("Contacto de la familia", r.contactoFamilia) +
    linea("Motivo", r.motivo) +
    "\nEl paciente o su familia autorizó compartir estos datos con IntegraMente."
  );
}

function FormularioReferencia() {
  const [r, setR] = useState<Referencia>(vacia);
  const [autoriza, setAutoriza] = useState(false);
  const [intento, setIntento] = useState(false);
  const set = (k: keyof Referencia) => (e: { target: { value: string } }) => setR((x) => ({ ...x, [k]: e.target.value }));
  const faltan = !r.medico.trim() || !r.paciente.trim() || !r.contactoFamilia.trim() || !autoriza;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setIntento(true);
    if (faltan) return;
    window.open(waLink(WHATSAPP_EQUIPO, mensajeReferencia(r)), "_blank", "noopener,noreferrer");
  }

  const etiqueta = "grid gap-1.5 text-[14.5px] font-semibold text-tinta";
  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      <label className={etiqueta}>
        Tu nombre *
        <input className={campo} value={r.medico} onChange={set("medico")} autoComplete="name" aria-invalid={intento && !r.medico.trim()} />
      </label>
      <label className={etiqueta}>
        Especialidad
        <input className={campo} value={r.especialidad} onChange={set("especialidad")} />
      </label>
      <label className={etiqueta}>
        Código profesional
        <input className={campo} value={r.codigo} onChange={set("codigo")} inputMode="numeric" />
      </label>
      <label className={etiqueta}>
        Tu teléfono o correo
        <input className={campo} value={r.contactoMedico} onChange={set("contactoMedico")} />
      </label>
      <label className={etiqueta}>
        Nombre del paciente *
        <input className={campo} value={r.paciente} onChange={set("paciente")} aria-invalid={intento && !r.paciente.trim()} />
      </label>
      <label className={etiqueta}>
        Edad
        <input className={campo} value={r.edad} onChange={set("edad")} inputMode="numeric" />
      </label>
      <label className={`${etiqueta} sm:col-span-2`}>
        Teléfono de la familia o del paciente *
        <input className={campo} value={r.contactoFamilia} onChange={set("contactoFamilia")} inputMode="tel" aria-invalid={intento && !r.contactoFamilia.trim()} />
      </label>
      <label className={`${etiqueta} sm:col-span-2`}>
        Motivo de referencia
        <textarea className={`${campo} py-3 min-h-24`} value={r.motivo} onChange={set("motivo")} placeholder="Ej.: DCL amnésico, MoCA 22/30, buena movilidad." />
      </label>
      <label className="sm:col-span-2 flex items-start gap-3 text-[15px] leading-relaxed text-tinta cursor-pointer">
        <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} className="mt-1 w-5 h-5 accent-[#3f6a70]" />
        El paciente o su familia autorizó que comparta estos datos con IntegraMente. *
      </label>
      {intento && faltan && (
        <p className="sm:col-span-2 m-0 text-[14px] text-alerta-texto" role="alert">
          Completá los campos marcados con * y confirmá la autorización.
        </p>
      )}
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-7 rounded-full bg-verde-profundo text-white font-semibold text-[16px] border-0 cursor-pointer hover:bg-tinta"
        >
          <WhatsAppIcon size={20} /> Enviar referencia por WhatsApp
        </button>
        <span className="text-[13.5px] text-tinta-tenue">Se abre WhatsApp con el mensaje listo para enviar.</span>
      </div>
    </form>
  );
}

export function Medicos() {
  const directora = equipo[0];
  const clinicos = equipo.filter((m) => m.foto);

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-full">
      <Encabezado
        accion={
          <Link to={REFERIR} className="inline-flex items-center min-h-10 px-4 sm:px-5 rounded-full bg-verde-serenidad text-white text-[15px] font-semibold no-underline hover:bg-verde-profundo whitespace-nowrap">
            Referir un paciente
          </Link>
        }
      />

      <main className="overflow-x-clip">
        {/* ─── Hero ─── */}
        <section className="max-w-[1280px] mx-auto px-5 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-14 lg:pb-24 grid gap-12 lg:gap-16 items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Eyebrow>Para médicos y geriatras</Eyebrow>
            <h1 className="font-serif font-normal text-[40px] sm:text-[54px] lg:text-[64px] leading-[1.03] tracking-[-0.01em] m-0 mb-5" style={{ textWrap: "balance" }}>
              Estimulación cognitiva en casa, <em className="italic text-verde-profundo">con seguimiento profesional.</em>
            </h1>
            <p className="text-[17px] sm:text-lg lg:text-[20px] leading-relaxed text-tinta-suave max-w-[32em] m-0 mb-8">
              Un programa domiciliario para personas mayores, del envejecimiento saludable a la demencia moderada. Vos referís, nosotros acompañamos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={REFERIR} className={botonPrimario}>
                Referir un paciente
              </Link>
              <a href={hablarConElEquipo} target="_blank" rel="noopener noreferrer" className={botonSecundario}>
                <WhatsAppIcon size={20} /> Hablar con el equipo
              </a>
            </div>
          </div>

          {/* Foto real de la directora clínica con datos flotantes. */}
          <div className="relative mx-auto w-full max-w-[520px]">
            <div aria-hidden="true" className="absolute -inset-2 sm:-inset-6 rounded-[44px] bg-seccion-arena rotate-[-2deg] sm:rotate-[-3deg]" />
            {directora.foto && (
              <picture>
                <source srcSet={directora.foto.webp} type="image/webp" />
                <img
                  src={directora.foto.jpg}
                  alt={`${directora.nombre}, ${directora.area}`}
                  className="relative block w-full aspect-[4/5] object-cover object-[center_25%] rounded-[36px] shadow-elevada"
                />
              </picture>
            )}
            <div className="absolute left-2 sm:-left-8 bottom-10 rounded-2xl bg-white border border-borde shadow-elevada px-4 py-3 max-w-[220px]">
              <p className="m-0 font-serif text-[30px] leading-none text-verde-profundo">100%</p>
              <p className="m-0 mt-1 text-[13.5px] leading-snug text-tinta">de los planes revisados por profesionales</p>
            </div>
            <div className="absolute right-2 sm:-right-6 top-8 rounded-2xl bg-white border border-borde shadow-elevada px-4 py-3">
              <p className="m-0 text-[12px] tracking-[0.12em] uppercase font-semibold text-tinta-suave">3 áreas</p>
              <div className="mt-2 flex gap-1.5">
                {areas.map((a) => (
                  <span key={a.t} title={a.t} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: a.fondo, color: a.tinta }}>
                    <Icono name={a.icono} className="w-5 h-5" />
                  </span>
                ))}
              </div>
            </div>
            <p className="absolute right-4 bottom-4 m-0 rounded-full bg-white/90 backdrop-blur px-3.5 py-1.5 text-[13px] font-semibold text-tinta">
              {directora.nombre} · {directora.area}
            </p>
          </div>
        </section>

        {/* ─── Metodología ─── */}
        <section className="bg-white">
          <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
            <Reveal className="text-center">
              <Eyebrow>Base y metodología</Eyebrow>
              <SectionTitle className="max-w-[16em] mx-auto mb-12 lg:mb-16">Cómo se construye cada plan.</SectionTitle>
            </Reveal>
            <ol className="list-none m-0 p-0 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {metodologia.map((m, i) => (
                <Reveal key={m.t} delay={i * 90} className="h-full">
                  <li className="h-full rounded-[26px] border border-borde bg-fondo-papel p-6 flex flex-col gap-3">
                    <span className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-[0_14px_30px_-16px_rgba(31,51,56,0.6)]" style={{ background: i % 2 ? "#6a969c" : "#3f6a70" }}>
                      <Icono name={m.icono} className="w-7 h-7" />
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-mostaza-vital text-tinta text-[12.5px] font-bold flex items-center justify-center">{i + 1}</span>
                    </span>
                    <h3 className="m-0 mt-2 font-serif font-normal text-[22px] leading-tight">{m.t}</h3>
                    <p className="m-0 text-[15.5px] leading-relaxed text-tinta">{m.d}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
            <p className="m-0 mt-8 text-center text-[15px] leading-relaxed text-tinta-suave">
              El programa no emite diagnósticos ni modifica tratamientos: complementa la atención médica entre consultas.
            </p>
          </div>
        </section>

        {/* ─── Qué recibís ─── */}
        <section className="bg-seccion-fria">
          <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
            <Reveal>
              <Eyebrow>Qué recibís</Eyebrow>
              <SectionTitle className="max-w-[16em] mb-10 lg:mb-14">Trabajamos con vos, no en paralelo.</SectionTitle>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {recibe.map((r, i) => (
                <Reveal key={r.t} delay={i * 90} className="h-full">
                  <article className="h-full rounded-[26px] overflow-hidden border border-borde bg-white flex flex-col">
                    <div className="flex items-center gap-3 px-6 py-4" style={{ background: r.fondo, color: r.tinta }}>
                      <span className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center">
                        <Icono name={r.icono} className="w-6 h-6" />
                      </span>
                      <h3 className="m-0 font-serif font-normal text-[22px] leading-tight">{r.t}</h3>
                    </div>
                    <p className="m-0 p-6 text-[16px] leading-relaxed text-tinta">{r.d}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Equipo ─── */}
        <section className="bg-seccion-arena">
          <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-22">
            <Reveal className="text-center">
              <Eyebrow>Equipo clínico</Eyebrow>
              <SectionTitle className="max-w-[17em] mx-auto mb-10 lg:mb-12">Quiénes revisan cada plan.</SectionTitle>
            </Reveal>
            <div className="flex flex-wrap justify-center gap-5">
              {clinicos.map((m, i) => (
                <Reveal key={m.nombre} delay={i * 80} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                  <figure className="m-0 h-full rounded-[26px] bg-white border border-borde overflow-hidden flex flex-col">
                    <div className="relative aspect-[16/10] bg-campo">
                      <picture>
                        <source srcSet={m.foto!.webp} type="image/webp" />
                        <img src={m.foto!.jpg} alt={m.nombre} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-[center_25%]" />
                      </picture>
                    </div>
                    <figcaption className="px-5 py-4 grid gap-1">
                      <p className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-verde-profundo">{m.area}</p>
                      <p className="m-0 font-serif text-[21px] leading-tight text-tinta">{m.nombre}</p>
                      <p className="m-0 mt-1 text-[15px] leading-relaxed text-tinta">{m.descripcion}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Cómo referir ─── */}
        <section className="bg-white">
          <div className="max-w-[1280px] mx-auto px-5 py-16 sm:px-8 lg:px-12 lg:py-24 grid gap-10 lg:gap-16 lg:grid-cols-[0.9fr_1.1fr] items-center">
            <Reveal>
              <Eyebrow>Cómo referir un paciente</Eyebrow>
              <SectionTitle className="mb-4">Tres pasos, sin trámites.</SectionTitle>
              <p className="m-0 mb-8 text-[17px] leading-relaxed text-tinta-suave">Completás un formulario corto y se abre WhatsApp con el mensaje listo para nuestro equipo.</p>
              <Link to={REFERIR} className={botonPrimario}>
                Referir un paciente
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <ol className="list-none m-0 p-0 grid gap-4">
                {pasosReferir.map((p, i) => (
                  <li key={p.t} className="grid grid-cols-[56px_1fr] gap-4 items-center rounded-[24px] bg-fondo-papel border border-borde-suave p-4 sm:p-5">
                    <span className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: i === 1 ? "#6a969c" : "#3f6a70" }}>
                      <Icono name={p.icono} className="w-7 h-7" />
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-mostaza-vital text-tinta text-[12.5px] font-bold flex items-center justify-center">{i + 1}</span>
                    </span>
                    <div>
                      <h3 className="m-0 font-serif font-normal text-[21px] leading-tight">{p.t}</h3>
                      <p className="m-0 mt-0.5 text-[15.5px] leading-snug text-tinta">{p.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ─── Cierre ─── */}
        <section className="bg-verde-profundo text-white relative overflow-hidden">
          <div aria-hidden="true" className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-verde-serenidad/40" />
          <div className="relative max-w-[1280px] mx-auto px-5 py-14 sm:px-8 lg:px-12 lg:py-20 grid gap-6 lg:gap-14 items-center text-center lg:text-left lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif font-normal text-[30px] sm:text-[36px] lg:text-[44px] leading-[1.12] m-0 mb-3 text-white">Cuidemos juntos la salud cerebral de tus pacientes.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#dce9e9]">
                WhatsApp {WHATSAPP_EQUIPO_VISIBLE} · {contacto.correo}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={REFERIR} className="inline-flex items-center justify-center min-h-14 px-8 rounded-full bg-mostaza-vital text-tinta font-bold text-[17px] whitespace-nowrap hover:bg-white transition-colors no-underline">
                Referir un paciente
              </Link>
              <a
                href={hablarConElEquipo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 min-h-14 px-7 rounded-full border-[1.5px] border-[#8fb3b7] text-white font-semibold text-[17px] no-underline hover:border-white"
              >
                <WhatsAppIcon size={20} /> Hablar con el equipo
              </a>
            </div>
          </div>
        </section>
      </main>

      <SitioFooter />
      <AyudaWhatsApp href={hablarConElEquipo} />
    </div>
  );
}

// /medicos/referir: solo el formulario (los botones «Referir un paciente»
// del home y de /medicos llevan directo acá).
export function ReferirPaciente() {
  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-full">
      <Encabezado
        accion={
          <Link to="/medicos" className="inline-flex items-center min-h-10 px-4 rounded-full text-[15px] font-semibold text-verde-profundo no-underline hover:bg-white whitespace-nowrap">
            Información para médicos
          </Link>
        }
      />
      <main className="bg-seccion-arena">
        <div className="max-w-[880px] mx-auto px-5 pt-10 pb-16 sm:px-8 lg:pt-14 lg:pb-24">
          <Eyebrow>Para médicos y geriatras</Eyebrow>
          <h1 className="m-0 mb-3 font-serif font-normal text-[36px] sm:text-[46px] leading-[1.05]">Referir un paciente</h1>
          <p className="m-0 mb-8 text-[17px] leading-relaxed text-tinta-suave max-w-[36em]">Completá los datos y se abre WhatsApp con el mensaje listo para enviar a nuestro equipo.</p>
          <div className="rounded-[32px] bg-white border border-borde p-5 sm:p-9 shadow-[0_30px_60px_-40px_rgba(31,51,56,.45)]">
            <FormularioReferencia />
          </div>
        </div>
      </main>
      <SitioFooter />
      <AyudaWhatsApp href={hablarConElEquipo} />
    </div>
  );
}
