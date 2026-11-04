import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { SitioFooter } from "../components/layout/SitioFooter";
import { WhatsAppIcon } from "../components/ui/WhatsAppIcon";
import { contacto, equipo } from "../lib/landingContenido";
import { WHATSAPP_EQUIPO, WHATSAPP_EQUIPO_VISIBLE, waLink } from "../lib/whatsapp";

// Página para médicos y geriatras (/medicos). Prioridad del negocio: que
// refieran pacientes. Tono más técnico que el home, igual de breve.
//
// "Referir un paciente" no guarda nada en la base: arma el mensaje con los
// datos y abre WhatsApp del equipo. Así no hay un formulario público
// recibiendo datos de salud de terceros sin autenticación, y la referencia
// queda en el canal donde el equipo ya hace el seguimiento.

const hablarConElEquipo = waLink(
  WHATSAPP_EQUIPO,
  "Hola, soy médico/a y quisiera conocer IntegraMente en Casa para referir pacientes.",
);

const metodologia: { t: string; d: string }[] = [
  {
    t: "Evaluación inicial estandarizada",
    d: "Perfil funcional con puntuación determinista: cognición y comunicación, actividades instrumentales y básicas, ánimo y sueño, movilidad y caídas, alimentación.",
  },
  {
    t: "Plan según etapa",
    d: "Cada recurso trae su adaptación para envejecimiento saludable, deterioro cognitivo leve, demencia leve y moderada. Las etapas avanzadas requieren pauta individual.",
  },
  {
    t: "Reglas de seguridad",
    d: "Ruta física por riesgo de caídas y nivel de supervisión. Exclusiones nutricionales por alergias, disfagia, enfermedad renal o anticoagulación, entre otras.",
  },
  {
    t: "Revisión profesional",
    d: "Neuropsicología, gerontogimnasia y nutrición revisan el plan antes de publicarlo y el registro de cada semana.",
  },
];

const recibe: { icono: string; t: string; d: string }[] = [
  {
    icono: "alerta",
    t: "Referencia de vuelta",
    d: "Si detectamos señales que requieren consulta (caídas, cambios cognitivos o conductuales, riesgo nutricional), orientamos a la familia a consultarte y, con su autorización, te avisamos.",
  },
  {
    icono: "informe",
    t: "Información de seguimiento",
    d: "Adherencia y evolución funcional de tu paciente, cuando el paciente o su familia lo autorizan.",
  },
  {
    icono: "clinica",
    t: "Adaptado a tu consulta",
    d: "Podemos preparar la aplicación con la identidad de tu clínica para tus pacientes.",
  },
];

const pasosReferir: { t: string; d: string }[] = [
  { t: "Nos enviás la referencia", d: "Con el formulario de abajo o por WhatsApp." },
  { t: "Contactamos a la familia", d: "Le explicamos el programa y la acompañamos a crear la cuenta." },
  { t: "Evaluación y plan", d: "Responde la evaluación inicial y el equipo prepara su plan." },
];

function Icono({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    alerta: (
      <>
        <path {...p} d="M12 3.5l9 15.5H3z" />
        <path {...p} d="M12 9.5v4.5M12 16.8v.2" />
      </>
    ),
    informe: (
      <>
        <rect {...p} x="5" y="3.5" width="14" height="17" rx="2.5" />
        <path {...p} d="M8.5 15.5l2.5-3 2 2 2.5-3.5M8.5 8h7" />
      </>
    ),
    clinica: (
      <>
        <path {...p} d="M4 20.5V9l8-5 8 5v11.5z" />
        <path {...p} d="M12 10v6M9 13h6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function BotonWa({ href, children, claro = false }: { href: string; children: ReactNode; claro?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 min-h-[52px] px-6 rounded-full font-semibold text-[16px] no-underline transition-colors ${
        claro ? "bg-white border-[1.5px] border-verde-serenidad text-verde-profundo hover:bg-verde-tenue" : "bg-verde-serenidad text-white hover:bg-verde-profundo"
      }`}
    >
      <WhatsAppIcon size={20} /> {children}
    </a>
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

function Titulo({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <>
      <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">{eyebrow}</p>
      <h2 className="m-0 mb-8 font-serif font-normal text-[28px] sm:text-[36px] leading-[1.12]" style={{ textWrap: "balance" }}>
        {children}
      </h2>
    </>
  );
}

export function Medicos() {
  const clinicos = equipo.filter((m) => m.foto);
  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen">
      <header className="max-w-[1120px] mx-auto px-5 py-4 sm:px-8 flex items-center justify-between gap-4">
        <Link to="/" aria-label="IntegraMente en Casa, ir al inicio" className="no-underline">
          <Logo size="sm" />
        </Link>
        <Link to="/medicos/referir" className="inline-flex items-center min-h-10 px-4 rounded-full bg-verde-profundo text-white text-[14.5px] font-semibold no-underline hover:bg-tinta">
          Referir un paciente
        </Link>
      </header>

      <main>
        {/* Presentación */}
        <section className="max-w-[1120px] mx-auto px-5 pt-8 pb-14 sm:px-8 lg:pt-14 lg:pb-20 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-center">
          <div>
            <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">Para médicos y geriatras</p>
            <h1 className="m-0 mb-5 font-serif font-normal text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05]" style={{ textWrap: "balance" }}>
              Estimulación cognitiva en casa, con seguimiento profesional.
            </h1>
            <p className="m-0 mb-8 text-[17px] sm:text-[19px] leading-relaxed text-tinta-suave max-w-[34em]">
              Un programa domiciliario para personas mayores, del envejecimiento saludable a la demencia moderada. Vos referís, nosotros
              acompañamos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/medicos/referir" className="inline-flex items-center justify-center min-h-[52px] px-7 rounded-full bg-verde-profundo text-white font-semibold text-[16px] no-underline hover:bg-tinta">
                Referir un paciente
              </Link>
              <BotonWa href={hablarConElEquipo} claro>
                Hablar con el equipo
              </BotonWa>
            </div>
          </div>
          <dl className="m-0 grid grid-cols-3 gap-3">
            {[
              { n: "3", t: "áreas de trabajo" },
              { n: "5", t: "perfiles por etapa" },
              { n: "100%", t: "planes revisados por profesionales" },
            ].map((d) => (
              <div key={d.t} className="rounded-3xl bg-white border border-borde p-4 sm:p-5">
                <dt className="font-serif text-[30px] sm:text-[40px] leading-none text-verde-profundo">{d.n}</dt>
                <dd className="m-0 mt-2 text-[13.5px] sm:text-[14.5px] leading-snug text-tinta-suave">{d.t}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Metodología */}
        <section className="bg-white border-y border-borde-suave">
          <div className="max-w-[1120px] mx-auto px-5 py-14 sm:px-8 lg:py-20">
            <Titulo eyebrow="Base y metodología">Cómo se construye cada plan.</Titulo>
            <ol className="list-none m-0 p-0 grid gap-4 sm:grid-cols-2">
              {metodologia.map((m, i) => (
                <li key={m.t} className="rounded-3xl border border-borde bg-fondo-papel p-5 sm:p-6 grid grid-cols-[40px_1fr] gap-4">
                  <span className="w-10 h-10 rounded-full bg-verde-profundo text-white font-serif text-[18px] flex items-center justify-center">{i + 1}</span>
                  <div>
                    <h3 className="m-0 mb-1.5 text-[17px] font-bold text-tinta">{m.t}</h3>
                    <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave">{m.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-6 text-[14.5px] leading-relaxed text-tinta-tenue max-w-[52em]">
              El programa no emite diagnósticos ni modifica tratamientos: complementa la atención médica entre consultas.
            </p>
          </div>
        </section>

        {/* Qué recibe el médico */}
        <section className="max-w-[1120px] mx-auto px-5 py-14 sm:px-8 lg:py-20">
          <Titulo eyebrow="Qué recibís">Trabajamos con vos, no en paralelo.</Titulo>
          <div className="grid gap-4 md:grid-cols-3">
            {recibe.map((r) => (
              <article key={r.t} className="rounded-3xl bg-white border border-borde p-6">
                <span className="w-12 h-12 rounded-2xl bg-verde-tenue text-verde-profundo flex items-center justify-center mb-4">
                  <Icono name={r.icono} />
                </span>
                <h3 className="m-0 mb-1.5 text-[17px] font-bold">{r.t}</h3>
                <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave">{r.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Equipo */}
        {clinicos.length > 0 && (
          <section className="bg-beige-serenidad">
            <div className="max-w-[1120px] mx-auto px-5 py-14 sm:px-8 lg:py-18">
              <Titulo eyebrow="Equipo clínico">Quiénes revisan cada plan.</Titulo>
              <ul className="list-none m-0 p-0 grid gap-4 grid-cols-2 md:grid-cols-5">
                {clinicos.map((m) => (
                  <li key={m.nombre} className="rounded-3xl bg-white border border-borde overflow-hidden">
                    <picture>
                      <source srcSet={m.foto!.webp} type="image/webp" />
                      <img src={m.foto!.jpg} alt={m.nombre} loading="lazy" className="block w-full aspect-[4/3] object-cover object-[center_25%]" />
                    </picture>
                    <div className="p-3.5">
                      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-verde-profundo">{m.area}</p>
                      <p className="m-0 mt-0.5 font-serif text-[16.5px] leading-tight">{m.nombre}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Cómo referir */}
        <section id="referir" className="max-w-[1120px] mx-auto px-5 py-14 sm:px-8 lg:py-20 scroll-mt-6">
          <Titulo eyebrow="Cómo referir un paciente">Tres pasos, sin trámites.</Titulo>
          <ol className="list-none m-0 p-0 grid gap-3 sm:grid-cols-3 mb-10">
            {pasosReferir.map((p, i) => (
              <li key={p.t} className="flex gap-3 items-start">
                <span className="shrink-0 w-9 h-9 rounded-full bg-mostaza-vital text-tinta font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="m-0 font-bold text-[16px]">{p.t}</p>
                  <p className="m-0 text-[15px] leading-snug text-tinta-suave">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-[28px] bg-white border border-borde p-5 sm:p-8">
            <FormularioReferencia />
          </div>
        </section>

        {/* Contacto */}
        <section className="bg-verde-profundo text-white">
          <div className="max-w-[1120px] mx-auto px-5 py-12 sm:px-8 lg:py-16 grid gap-6 lg:grid-cols-[1fr_auto] items-center">
            <div>
              <h2 className="m-0 mb-2 font-serif font-normal text-[28px] sm:text-[34px] leading-tight text-white">Contacto directo con el equipo</h2>
              <p className="m-0 text-[16px] leading-relaxed text-[#dce9e9]">
                WhatsApp {WHATSAPP_EQUIPO_VISIBLE} · {contacto.correo} · {contacto.telefono}
              </p>
            </div>
            <a
              href={hablarConElEquipo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 min-h-14 px-7 rounded-full bg-mostaza-vital text-tinta font-bold text-[16px] no-underline hover:bg-white"
            >
              <WhatsAppIcon size={20} /> Hablar con el equipo
            </a>
          </div>
        </section>
      </main>

      <SitioFooter />
    </div>
  );
}

// /medicos/referir: solo el formulario (el botón «Referir un paciente» del
// home y de /medicos lleva directo acá).
export function ReferirPaciente() {
  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen">
      <header className="max-w-[820px] mx-auto px-5 py-4 sm:px-8 flex items-center justify-between gap-4">
        <Link to="/" aria-label="IntegraMente en Casa, ir al inicio" className="no-underline">
          <Logo size="sm" />
        </Link>
        <Link to="/medicos" className="text-[14.5px] font-semibold text-verde-profundo">
          Información para médicos
        </Link>
      </header>
      <main className="max-w-[820px] mx-auto px-5 pt-6 pb-16 sm:px-8">
        <h1 className="m-0 mb-2 font-serif font-normal text-[32px] sm:text-[40px] leading-tight">Referir un paciente</h1>
        <p className="m-0 mb-8 text-[16px] leading-relaxed text-tinta-suave">Completá los datos y se abre WhatsApp con el mensaje listo para enviar a nuestro equipo.</p>
        <div className="rounded-[28px] bg-white border border-borde p-5 sm:p-8">
          <FormularioReferencia />
        </div>
      </main>
      <SitioFooter />
    </div>
  );
}
