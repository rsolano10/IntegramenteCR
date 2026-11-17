import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMyPatient, type MyPatient } from "../../lib/useMyPatient";
import { programas, type Programa } from "../../lib/programasData";
import { planTiers } from "../../lib/mockData";
import { iniciarCompra } from "../../lib/pagos";
import { waEquipo } from "../../lib/whatsapp";
import { Modal } from "./Modal";
import { BotonWhatsApp } from "./BotonWhatsApp";

// «Mi programa», desde el menú de la cuenta de la familia: el programa
// actual y su estado, y los dos programas con el mismo formato (para quién
// son ideales y qué incluyen) para ver fácil cuál conviene, con cómo pasar
// al otro. Los textos salen de programasData.ts (los mismos del home): no
// se promete nada que no esté definido.

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
  const [abriendo, setAbriendo] = useState(false);
  const nombre = patient.nombre.split(" ")[0];
  const clinico = patient.modalidad === "clinico";
  const actual = programas.find((p) => p.id === patient.modalidad) ?? (clinico ? null : programas[0]);
  const tierClinico = planTiers.find((t) => t.id === "clinico")!;
  const pendientePlan = patient.plan_status === "pendiente";

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
        {/* Los dos programas, uno al lado del otro, para ver cuál les queda mejor */}
        <section className="grid gap-4">
          <div>
            <p className="m-0 font-serif text-[24px] leading-tight text-tinta">¿Cuál es el programa ideal?</p>
            <p className="m-0 mt-1 text-[15.5px] leading-relaxed text-tinta-suave">Compará los dos y fijate cuál se ajusta mejor a lo que necesita {nombre}.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 items-stretch">
            {programas.map((p) => (
              <Cuadro
                key={p.id}
                programa={p}
                esActual={!clinico && actual?.id === p.id}
                patient={patient}
                pie={
                  estado.activar ? (
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={activar}
                        disabled={abriendo}
                        className="w-full inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-verde-profundo text-white font-semibold text-[16px] border-0 cursor-pointer hover:bg-tinta disabled:opacity-60"
                      >
                        Activar mi programa
                      </button>
                      <p className="m-0 text-center text-[13.5px] text-tinta-suave">Así el plan de {nombre} sigue cada semana sin cortes.</p>
                    </div>
                  ) : (
                    <p className="m-0 flex items-center justify-center gap-2 rounded-full bg-verde-tenue py-3 text-[15px] font-semibold text-verde-profundo">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Es el programa de {nombre}
                    </p>
                  )
                }
              />
            ))}
          </div>
          {actual?.id === "autoguiado" && !pendientePlan && <ComoObtenerlo />}
        </section>

        {/* Plan en preparación: todavía se puede cambiar de programa */}
        {pendientePlan && !estado.activar && (
          <section className="rounded-3xl bg-mostaza-vital/25 border border-mostaza-vital px-5 py-5 grid gap-3">
            <p className="m-0 font-serif text-[22px] leading-tight text-tinta">Estamos preparando el plan</p>
            <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">Mientras tanto, todavía podés cambiar de programa.</p>
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
          </section>
        )}

        {!pendientePlan && (
          <p className="m-0 text-[14px] leading-relaxed text-tinta-tenue text-center">
            ¿Querés cambiar de programa o tenés dudas? Escribinos: lo vemos juntos, sin compromiso.
          </p>
        )}
      </div>
    </div>
  );
}

// Un programa, con el mismo formato para los dos: nombre, frase, precio,
// para quién es ideal y qué incluye. El de la familia se marca como «Tu
// programa»; el otro ofrece escribir por WhatsApp.
function Cuadro({ programa, esActual, patient, pie }: { programa: Programa; esActual: boolean; patient: MyPatient; pie: ReactNode }) {
  const sesiones = programa.id === "orientado";
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] bg-white flex flex-col ${esActual ? "border-2 border-verde-profundo shadow-[0_20px_40px_-30px_rgba(31,51,56,0.7)]" : "border border-borde"}`}
    >
      <div className={`relative px-5 pt-5 pb-4 overflow-hidden ${sesiones ? "bg-mostaza-vital/25" : "bg-verde-tenue"}`}>
        <span aria-hidden="true" className={`absolute -right-10 -top-12 w-32 h-32 rounded-full ${sesiones ? "bg-mostaza-vital/50" : "bg-verde-serenidad/30"}`} />
        <div className="relative flex items-start justify-between gap-2">
          <p className="m-0 font-serif text-[24px] leading-tight text-tinta">{programa.nombre}</p>
          {esActual && <span className="shrink-0 mt-1 rounded-full bg-verde-profundo text-white text-[12px] font-semibold px-2.5 py-1">Tu programa</span>}
        </div>
        <p className="relative m-0 mt-1 text-[15px] leading-snug text-tinta-suave">{programa.lema}</p>
        <p className="relative m-0 mt-3 font-semibold text-[16px] text-tinta">
          {programa.precio} {programa.periodo}
        </p>
      </div>
      <div className="px-5 pt-4 pb-5 grid gap-4 flex-1 content-start">
        <div className="grid gap-2">
          <p className="m-0 text-[12.5px] tracking-[0.12em] uppercase font-semibold text-tinta-suave">Ideal si…</p>
          <Lista items={programa.idealSi} />
        </div>
        <div className="grid gap-2">
          <p className="m-0 text-[12.5px] tracking-[0.12em] uppercase font-semibold text-tinta-suave">Incluye</p>
          <Lista items={programa.incluye} />
        </div>
        {programa.requisito && <p className="m-0 text-[13.5px] leading-relaxed text-tinta-tenue">{programa.requisito}</p>}
      </div>
      {esActual && <div className="px-5 pb-5 mt-auto">{pie}</div>}
      {!esActual && (
        <div className="px-5 pb-5 mt-auto">
          <BotonWhatsApp fullWidth href={waEquipo(`Quiero saber más del programa ${programa.nombre}.`, patient.nombre)}>
            Quiero saber más
          </BotonWhatsApp>
        </div>
      )}
    </article>
  );
}

// Para quien tiene el Autoguiado: cómo pasar al programa con sesiones.
function ComoObtenerlo() {
  return (
    <div className="rounded-3xl bg-fila-calida border border-borde px-5 py-5 grid gap-3">
      <p className="m-0 font-semibold text-[16px] text-tinta">¿Cómo paso al programa con sesiones?</p>
      <ol className="m-0 p-0 list-none grid gap-2.5">
        {[
          "Nos escribís por WhatsApp y conversamos sobre lo que estás notando.",
          "Vemos la valoración neuropsicológica: compartís una de los últimos 12 meses o la coordinamos con IntegraMente (se paga aparte).",
          "Te enviamos el presupuesto según las sesiones que necesite y armamos el programa.",
        ].map((t, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-7 h-7 rounded-full bg-verde-profundo text-white text-[14px] font-semibold flex items-center justify-center">{i + 1}</span>
            <span className="text-[15px] leading-relaxed text-tinta pt-0.5">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

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
