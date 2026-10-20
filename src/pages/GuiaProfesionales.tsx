import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { WhatsAppIcon } from "../components/ui/WhatsAppIcon";
import { programas } from "../lib/programasData";
import { precioValoracion, whatsappHome } from "../lib/landingContenido";
import { WHATSAPP_EQUIPO_VISIBLE } from "../lib/whatsapp";

// Guía para profesionales de la salud (botón "Ver guía para profesionales"
// del home, que la abre en otra pestaña). Contenido provisional, armado con
// el índice que pidió el PO: qué es, cómo recomendarla, cómo crear la cuenta,
// quién selecciona los recursos, qué no incluye, qué cuesta y contacto.
// Se puede imprimir o guardar como PDF desde el navegador.

const autoguiado = programas.find((p) => p.id === "autoguiado")!;

function Seccion({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 py-9 border-t border-borde break-inside-avoid">
      <h2 className="m-0 font-serif font-normal text-[26px] sm:text-[30px] leading-tight flex items-baseline gap-3">
        <span className="font-sans text-[13px] font-bold tracking-[0.12em] text-verde-profundo">{String(n).padStart(2, "0")}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-none m-0 p-0 grid gap-2.5">
      {items.map((x, i) => (
        <li key={i} className="flex gap-3 text-[16.5px] leading-relaxed text-tinta">
          <span aria-hidden="true" className="mt-[11px] w-1.5 h-1.5 shrink-0 rounded-full bg-verde-serenidad" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

function Nota({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-2xl bg-fila-calida border border-mostaza-vital px-4 py-3 text-[15px] leading-relaxed text-tinta">{children}</p>;
}

const pasosCuenta = [
  { t: "Crear la cuenta", d: "Gratis, con un correo y una contraseña." },
  { t: "Elegir para quién es", d: "Para la propia persona o para acompañar a un ser querido." },
  { t: "Responder las preguntas iniciales", d: "Unos 10 minutos sobre su día a día e intereses. Se guarda solo." },
  { t: "Elegir el programa", d: "Autoguiado o con sesiones profesionales." },
];

export function GuiaProfesionales() {
  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen print:bg-white">
      <header className="max-w-[820px] mx-auto px-5 py-5 sm:px-8 flex items-center justify-between gap-4">
        <Link to="/" aria-label="IntegraMente en Casa, ir al inicio" className="no-underline">
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center min-h-10 px-4 rounded-full border border-borde-campo bg-white text-[14.5px] font-semibold text-tinta cursor-pointer hover:border-verde-serenidad"
        >
          Imprimir o guardar PDF
        </button>
      </header>

      <main className="max-w-[820px] mx-auto px-5 pb-20 sm:px-8">
        <div className="pt-6 pb-10">
          <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Guía para profesionales de la salud</p>
          <h1 className="m-0 mb-5 font-serif font-normal text-[34px] sm:text-[46px] leading-[1.08]" style={{ textWrap: "balance" }}>
            IntegraMente en Casa: actividades para complementar el trabajo entre sesiones
          </h1>
          <p className="m-0 text-[18px] leading-relaxed text-tinta-suave max-w-[36em]">
            Un plan semanal de actividades para hacer en casa, preparado por el equipo de IntegraMente. Acá te contamos qué ofrece y cómo
            recomendarlo a tus pacientes.
          </p>
        </div>

        <Seccion n={1} titulo="Qué ofrece y a quién está dirigida">
          <Lista
            items={[
              "Un plan semanal de estimulación cognitiva, gerontogimnasia y orientaciones de nutrición.",
              "Actividades explicadas paso a paso, con videos y materiales.",
              "Registro de las actividades realizadas.",
              "Para personas mayores que quieren cuidar su salud cerebral y para las familias y personas cuidadoras que las acompañan.",
            ]}
          />
          <Nota>Complementa tu trabajo: no reemplaza la intervención ni las indicaciones profesionales.</Nota>
        </Seccion>

        <Seccion n={2} titulo="Cómo recomendarla">
          <Lista
            items={[
              <>
                Compartí el enlace del sitio: <strong className="font-semibold">{window.location.host}</strong>
              </>,
              "La cuenta la puede crear la propia persona o un familiar que la acompañe.",
              "Contale que el plan se arma con sus respuestas, sus intereses y sus necesidades.",
              "Si tiene una valoración neuropsicológica reciente, le sirve para ingresar al programa con sesiones.",
            ]}
          />
        </Seccion>

        <Seccion n={3} titulo="Cómo crear la cuenta">
          <ol className="list-none m-0 p-0 grid gap-3 sm:grid-cols-2">
            {pasosCuenta.map((p, i) => (
              <li key={p.t} className="flex gap-3.5 rounded-2xl bg-white border border-borde p-4">
                <span className="w-8 h-8 shrink-0 rounded-full bg-verde-serenidad text-white font-serif text-[16px] flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="m-0 text-[16px] font-semibold text-tinta">{p.t}</p>
                  <p className="m-0 mt-0.5 text-[15px] leading-relaxed text-tinta-suave">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Nota>Las preguntas iniciales no son una valoración neuropsicológica.</Nota>
        </Seccion>

        <Seccion n={4} titulo="Quién selecciona los recursos">
          <p className="m-0 text-[16.5px] leading-relaxed text-tinta">
            El equipo de IntegraMente revisa las respuestas y selecciona las actividades. Los recursos los desarrollan profesionales en
            neuropsicología, nutrición y gerontogimnasia.
          </p>
        </Seccion>

        <Seccion n={5} titulo="Lo que todavía no incluye">
          <p className="m-0 text-[16.5px] leading-relaxed text-tinta">
            Por ahora no hay un panel para que profesionales externos asignen actividades o consulten el seguimiento de sus pacientes. Si querés
            coordinar algo sobre un paciente, escribinos.
          </p>
        </Seccion>

        <Seccion n={6} titulo="Qué es gratis y qué tiene costo">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white border border-borde p-5">
              <p className="m-0 mb-2 text-[12px] font-bold tracking-[0.12em] uppercase text-verde-profundo">Gratis</p>
              <Lista items={["Crear la cuenta.", "Responder las preguntas iniciales."]} />
            </div>
            <div className="rounded-2xl bg-white border border-borde p-5">
              <p className="m-0 mb-2 text-[12px] font-bold tracking-[0.12em] uppercase text-verde-profundo">Con costo</p>
              <Lista
                items={[
                  <>
                    Autoguiado: {autoguiado.precio} {autoguiado.periodo}.
                  </>,
                  "Con sesiones profesionales: presupuesto según el plan.",
                  <>Valoración neuropsicológica con IntegraMente: {precioValoracion}, aparte.</>,
                ]}
              />
            </div>
          </div>
          <p className="m-0 text-[14px] text-tinta-tenue">Precios de referencia, sujetos a la oferta definitiva.</p>
        </Seccion>

        <section className="mt-2 rounded-[28px] bg-verde-profundo text-white p-7 sm:p-9 grid gap-4 break-inside-avoid print:bg-white print:text-tinta print:border print:border-borde">
          <h2 className="m-0 font-serif font-normal text-[28px] sm:text-[32px] leading-tight">¿Querés saber más?</h2>
          <p className="m-0 text-[16.5px] leading-relaxed text-[#dce9e9] print:text-tinta-suave">
            Escribinos por WhatsApp al <strong className="text-white print:text-tinta">{WHATSAPP_EQUIPO_VISIBLE}</strong>.
          </p>
          <a
            href={whatsappHome.profesional}
            target="_blank"
            rel="noreferrer"
            className="justify-self-start inline-flex items-center gap-2.5 min-h-[52px] px-6 rounded-full bg-mostaza-vital text-tinta font-semibold text-[16px] no-underline hover:bg-white transition-colors"
          >
            <WhatsAppIcon size={20} /> Contactanos por WhatsApp
          </a>
        </section>
      </main>
    </div>
  );
}
