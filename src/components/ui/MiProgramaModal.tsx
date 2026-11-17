import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMyPatient, type MyPatient } from "../../lib/useMyPatient";
import { usePlan } from "../../lib/usePlan";
import { programas, type Programa } from "../../lib/programasData";
import { planTiers } from "../../lib/mockData";
import { iniciarCompra } from "../../lib/pagos";
import { waEquipo } from "../../lib/whatsapp";
import { Modal } from "./Modal";
import { BotonWhatsApp } from "./BotonWhatsApp";

// «Mi programa», desde el menú de la cuenta de la familia. Cuenta una
// historia: el programa que tienen y cómo los acompaña, lo que ya hicieron
// esta semana, y cuándo conviene dar un paso más (el otro programa) con
// cómo obtenerlo. Los textos de los programas salen de programasData.ts
// (los mismos del home): no se promete nada que no esté definido.

function diasRestantes(fin: string | null): number {
  if (!fin) return 0;
  return Math.max(0, Math.ceil((new Date(fin).getTime() - Date.now()) / 86_400_000));
}

export function MiProgramaModal({ onClose, nombreCuenta }: { onClose: () => void; nombreCuenta: string }) {
  const { data: patient } = useMyPatient();
  return (
    <Modal onClose={onClose} bare size="lg">
      {patient ? (
        <Contenido patient={patient} nombreCuenta={nombreCuenta} onClose={onClose} />
      ) : (
        <div className="p-10 flex justify-center">
          <span className="inline-block w-7 h-7 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
        </div>
      )}
    </Modal>
  );
}

function Contenido({ patient, nombreCuenta, onClose }: { patient: MyPatient; nombreCuenta: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: days } = usePlan(patient.id);
  const [abriendo, setAbriendo] = useState(false);
  const nombre = patient.nombre.split(" ")[0];
  const clinico = patient.modalidad === "clinico";
  const actual = programas.find((p) => p.id === patient.modalidad) ?? (clinico ? null : programas[0]);
  const otro = actual ? programas.find((p) => p.id !== actual.id)! : null;
  const tierClinico = planTiers.find((t) => t.id === "clinico")!;
  const pendientePlan = patient.plan_status === "pendiente";
  const registradas = (days ?? []).flatMap((d) => d.tasks).filter((t) => t.estado === "realizado" || t.estado === "parcial").length;

  const estado = (() => {
    switch (patient.estado_cuenta) {
      case "en_demo": {
        const n = diasRestantes(patient.demo_fin);
        return { texto: `Semana gratis · ${n <= 1 ? "último día" : `quedan ${n} días`}`, activar: true };
      }
      case "demo_finalizada":
        return { texto: "Terminó la semana gratis", activar: true };
      case "inactiva":
        return { texto: "En pausa", activar: false };
      default:
        return { texto: pendientePlan ? "En preparación" : "Activo", activar: false };
    }
  })();

  const activar = async () => {
    setAbriendo(true);
    try {
      await iniciarCompra({ nombreCuenta, nombrePaciente: patient.nombre, programa: patient.modalidad === "orientado" ? "orientado" : "autoguiado" });
    } finally {
      setAbriendo(false);
    }
  };

  // Cómo los acompaña su programa, en tres momentos.
  const historia: { titulo: string; texto: string }[] = clinico
    ? [
        { titulo: "Las sesiones", texto: `El equipo tratante trabaja con ${nombre} en sus sesiones presenciales.` },
        { titulo: "El plan en casa", texto: "Entre sesión y sesión, el plan semanal sigue lo que se trabajó con el equipo." },
        { titulo: "La continuidad", texto: "Lo que registran en casa lo ve el equipo, para seguir afinando." },
      ]
    : actual?.id === "orientado"
      ? [
          { titulo: "Una valoración", texto: `Todo parte de conocer bien a ${nombre}: sus fortalezas y lo que hoy le cuesta.` },
          { titulo: `Objetivos para ${nombre}`, texto: "El equipo define objetivos individualizados y los trabaja en sesiones." },
          { titulo: "Casa y sesiones, juntas", texto: "Las actividades de cada semana continúan en casa lo que se trabaja con el equipo." },
        ]
      : [
          { titulo: "Los conocimos", texto: `Con sus respuestas armamos el perfil de ${nombre}: qué le gusta, qué puede y qué cuidar.` },
          { titulo: "El equipo elige", texto: "Cada semana seleccionamos las actividades que mejor le sientan, sin que tengan que buscar nada." },
          { titulo: "Ustedes lo hacen en casa", texto: "Paso a paso, a su ritmo, y nos cuentan cómo les fue." },
        ];

  return (
    <div>
      {/* Encabezado: el programa de un vistazo */}
      <div className="relative bg-verde-profundo text-white px-6 sm:px-8 pt-7 pb-7 overflow-hidden">
        <div aria-hidden="true" className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-verde-serenidad/40" />
        <div aria-hidden="true" className="absolute right-16 -bottom-28 w-44 h-44 rounded-full bg-mostaza-vital/25" />
        <div className="relative pr-10">
          <p className="m-0 text-[12px] tracking-[0.14em] uppercase font-semibold text-[#c4dbdb]">El programa de {nombre}</p>
          <h2 className="m-0 mt-1.5 font-serif font-normal text-[30px] sm:text-[34px] leading-tight text-white">{clinico ? tierClinico.nombre : actual?.nombre}</h2>
          <p className="m-0 mt-1.5 text-[16px] leading-snug text-[#dcebea] max-w-md">{clinico ? tierClinico.tagline : actual?.lema}</p>
          <span className="inline-flex items-center gap-2 mt-4 text-[13px] font-semibold bg-white/15 rounded-full px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${estado.activar ? "bg-mostaza-vital" : "bg-[#9fd3b8]"}`} />
            {estado.texto}
          </span>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-7 grid gap-8">
        {/* Lo que ya están haciendo */}
        {registradas > 0 && (
          <p className="m-0 rounded-2xl bg-fila-calida border border-borde px-4 py-3.5 text-[16px] leading-relaxed text-tinta">
            <strong className="font-semibold">Esta semana ya registraron {registradas} {registradas === 1 ? "actividad" : "actividades"} con {nombre}.</strong>{" "}
            Cada una suma: lo que se hace seguido, en casa y en buena compañía, es lo que más acompaña.
          </p>
        )}

        {/* Cómo los acompaña */}
        <section className="grid gap-4">
          <Ceja>Cómo los acompaña</Ceja>
          <ol className="m-0 p-0 list-none grid gap-3 sm:grid-cols-3">
            {historia.map((h, i) => (
              <li key={h.titulo} className="relative flex gap-3 sm:block rounded-2xl border border-borde bg-white px-4 py-3.5 sm:pt-4 sm:pb-4">
                <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-verde-tenue text-verde-profundo font-serif text-[18px]">{i + 1}</span>
                <span className="block min-w-0">
                  <span className="block sm:mt-2.5 font-semibold text-[16px] leading-snug text-tinta">{h.titulo}</span>
                  <span className="block mt-0.5 sm:mt-1 text-[14.5px] leading-relaxed text-tinta-suave">{h.texto}</span>
                </span>
              </li>
            ))}
          </ol>
          {actual && !clinico && (
            <div className="grid gap-2">
              <p className="m-0 text-[15px] font-semibold text-tinta">Incluye</p>
              <Lista items={actual.incluye} />
              {actual.aclaracion && <p className="m-0 text-[14px] text-tinta-tenue">{actual.aclaracion}</p>}
            </div>
          )}
        </section>

        {/* Activar o elegir */}
        {(estado.activar || pendientePlan) && (
          <section className="rounded-3xl bg-mostaza-vital/25 border border-mostaza-vital px-5 py-5 grid gap-3">
            {estado.activar ? (
              <>
                <p className="m-0 font-serif text-[22px] leading-tight text-tinta">
                  {patient.estado_cuenta === "en_demo" ? `Que la semana gratis de ${nombre} no se corte` : `Sigamos con ${nombre}`}
                </p>
                <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
                  Al activar el programa, el plan sigue cada semana sin interrupciones.
                  {actual?.periodo ? ` ${actual.precio} ${actual.periodo}.` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={activar}
                    disabled={abriendo}
                    className="inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-verde-profundo text-white font-semibold text-[16px] border-0 cursor-pointer hover:bg-tinta disabled:opacity-60"
                  >
                    Activar mi programa
                  </button>
                  <BotonWhatsApp variant="outline" href={waEquipo("Tengo una consulta sobre mi programa.", patient.nombre)}>
                    Tengo una consulta
                  </BotonWhatsApp>
                </div>
              </>
            ) : (
              <>
                <p className="m-0 font-serif text-[22px] leading-tight text-tinta">Estamos preparando el plan</p>
                <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">Mientras tanto, todavía pueden cambiar de programa.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/app/perfil/programa");
                  }}
                  className="justify-self-start inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-verde-profundo text-white font-semibold text-[16px] border-0 cursor-pointer hover:bg-tinta"
                >
                  Ver o cambiar programa
                </button>
              </>
            )}
          </section>
        )}

        {/* El paso siguiente: el otro programa */}
        {otro && !pendientePlan && (otro.id === "orientado" ? <PasoMas programa={otro} nombre={nombre} patient={patient} /> : <SoloEnCasa programa={otro} patient={patient} />)}

        {!pendientePlan && (
          <p className="m-0 text-[14px] leading-relaxed text-tinta-tenue text-center">
            ¿Querés cambiar de programa o tenés dudas? Escribinos: lo vemos juntos, sin compromiso.
          </p>
        )}
      </div>
    </div>
  );
}

// Para quien tiene el Autoguiado: el programa con sesiones, contado como el
// paso siguiente, con para quién es, qué suma y cómo se obtiene.
function PasoMas({ programa, nombre, patient }: { programa: Programa; nombre: string; patient: MyPatient }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-borde bg-white">
      <div aria-hidden="true" className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-verde-tenue" />
      <div className="relative px-5 sm:px-7 pt-6 pb-6 grid gap-5">
        <div>
          <Ceja>Cuando hace falta un paso más</Ceja>
          <p className="m-0 mt-2 font-serif text-[26px] leading-tight text-tinta">{programa.nombre}</p>
          <p className="m-0 mt-2 text-[16px] leading-relaxed text-tinta">
            Hay momentos en que las actividades en casa no alcanzan solas. Si notan cambios en la memoria, el ánimo o la movilidad de {nombre}, una mirada
            profesional ayuda a entender qué está pasando y a trabajar con objetivos pensados solo para {nombre}.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2 content-start">
            <p className="m-0 text-[15px] font-semibold text-tinta">Es para ustedes si…</p>
            <Lista items={programa.idealSi} />
          </div>
          <div className="grid gap-2 content-start">
            <p className="m-0 text-[15px] font-semibold text-tinta">Suma a lo que ya tienen</p>
            <Lista items={programa.incluye.filter((x) => !/recursos de la aplicaci/i.test(x))} />
          </div>
        </div>

        <div className="grid gap-3">
          <p className="m-0 text-[15px] font-semibold text-tinta">Cómo obtenerlo</p>
          <ol className="m-0 p-0 list-none grid gap-2.5">
            {[
              "Nos escribís por WhatsApp y conversamos sobre lo que están notando.",
              "Vemos la valoración neuropsicológica: compartís una de los últimos 12 meses o la coordinamos con IntegraMente (se paga aparte).",
              "Te enviamos el presupuesto según las sesiones que necesite y armamos el programa.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-verde-profundo text-white text-[14px] font-semibold flex items-center justify-center">{i + 1}</span>
                <span className="text-[15px] leading-relaxed text-tinta pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
          {programa.notaPrecio && <p className="m-0 text-[14px] text-tinta-tenue">{programa.notaPrecio}</p>}
        </div>

        <BotonWhatsApp fullWidth href={waEquipo(`Quiero saber más del programa ${programa.nombre}.`, patient.nombre)}>
          Quiero saber más
        </BotonWhatsApp>
      </div>
    </section>
  );
}

// Para quien ya tiene sesiones: el Autoguiado, sin insistir.
function SoloEnCasa({ programa, patient }: { programa: Programa; patient: MyPatient }) {
  return (
    <section className="rounded-3xl border border-borde bg-fila-calida px-5 py-5 grid gap-2">
      <Ceja>Otro programa</Ceja>
      <p className="m-0 font-serif text-[22px] leading-tight text-tinta">{programa.nombre}</p>
      <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
        {programa.lema} Si en algún momento prefieren seguir solo con las actividades en casa, también lo pueden hacer. {programa.precio} {programa.periodo}.
      </p>
      <BotonWhatsApp variant="outline" href={waEquipo(`Quiero consultar por el programa ${programa.nombre}.`, patient.nombre)} className="justify-self-start mt-1">
        Consultar
      </BotonWhatsApp>
    </section>
  );
}

const Ceja = ({ children }: { children: ReactNode }) => <p className="m-0 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">{children}</p>;

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="m-0 p-0 list-none grid gap-2">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5 items-start text-[15px] leading-snug text-tinta">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 mt-px">
            <circle cx="10" cy="10" r="9" fill="#e4efee" />
            <path d="M6 10.4l2.6 2.6L14 7.6" stroke="#3f6a70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {x}
        </li>
      ))}
    </ul>
  );
}
