import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient, type MyPatient } from "../../lib/useMyPatient";
import { useAppStore } from "../../lib/store";
import { planTiers } from "../../lib/mockData";
import { describeAnswer, groupAnswerableByModule, resolveText } from "../../lib/onboardingSchema";
import type { Answers } from "../../lib/onboardingSchema";
import { useResumen } from "../../lib/resumen";
import { VentanaMarca, CargandoVentana, EncabezadoMarca, ChipMarca, PestanasMarca, TituloPestana } from "../ui/VentanaMarca";
import { ContenidoPrograma } from "../ui/MiProgramaModal";
import { ResumenSeguimiento } from "../resumen/ResumenSeguimiento";
import { CompartirResumen } from "../resumen/CompartirResumen";
import { AcompanantesContenido } from "./SumarAcompanante";

// «Perfil de Esteban»: todo lo de la persona que acompaña la familia, en la
// misma ventana que «El programa de …» (encabezado verde de la marca) con
// pestañas. Cada pestaña muestra todo de una vez, sin otro clic: sus datos
// y lo que contaron al inscribirla, su programa, quiénes la acompañan y el
// resumen para el médico.
type Tab = "datos" | "programa" | "acompanan" | "resumen";

const ESTADO: Record<string, { texto: string; tono: string }> = {
  en_demo: { texto: "Semana gratis", tono: "bg-mostaza-vital" },
  demo_finalizada: { texto: "Terminó la semana gratis", tono: "bg-mostaza-vital" },
  inactiva: { texto: "En pausa", tono: "bg-white/60" },
  pendiente_aprobacion: { texto: "En preparación", tono: "bg-mostaza-vital" },
  activa: { texto: "Activo", tono: "bg-[#9fd3b8]" },
};

export function PerfilPersonaModal({ onClose }: { onClose: () => void }) {
  const { data: persona } = useMyPatient();
  return (
    <VentanaMarca onClose={onClose}>
      {persona ? <Contenido persona={persona} onClose={onClose} /> : <CargandoVentana />}
    </VentanaMarca>
  );
}

function Contenido({ persona, onClose }: { persona: MyPatient; onClose: () => void }) {
  const session = useSession();
  const [tab, setTab] = useState<Tab>("datos");
  const primer = persona.nombre.split(" ")[0];
  const programa = planTiers.find((t) => t.id === persona.modalidad)?.nombre ?? persona.modalidad;
  const estado = ESTADO[persona.estado_cuenta ?? ""] ?? (persona.plan_status === "pendiente" ? ESTADO.pendiente_aprobacion : ESTADO.activa);
  const nombreCuenta = session.status === "authed" ? session.profile.nombre : "";

  const tabs: { id: Tab; label: string }[] = [
    { id: "datos", label: "Su perfil" },
    { id: "programa", label: "Programa" },
    { id: "acompanan", label: "Acompañan" },
    { id: "resumen", label: "Resumen" },
  ];

  return (
    <div>
      {/* Encabezado: la persona de un vistazo (mismo estilo que «El programa de …») */}
      <EncabezadoMarca
        ceja={`Perfil de ${primer}`}
        titulo={persona.nombre}
        chips={
          <>
            {persona.edad && <ChipMarca>{persona.edad} años</ChipMarca>}
            <ChipMarca>
              <span className={`w-2 h-2 rounded-full ${estado.tono}`} />
              {programa} · {estado.texto}
            </ChipMarca>
          </>
        }
      />
      <PestanasMarca tabs={tabs} tab={tab} onTab={setTab} />

      {tab === "datos" && <TabPerfil persona={persona} onClose={onClose} />}
      {tab === "programa" && <ContenidoPrograma patient={persona} nombreCuenta={nombreCuenta} onClose={onClose} sinEncabezado />}
      {tab === "acompanan" && (
        <div className="px-6 sm:px-8 py-7">
          <div className="mb-3">
            <TituloPestana ceja="Su red de apoyo">Quiénes acompañan a {primer}</TituloPestana>
          </div>
          <AcompanantesContenido />
        </div>
      )}
      {tab === "resumen" && <TabResumen persona={persona} />}

    </div>
  );
}

const inputClass = "w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta focus:border-verde-serenidad focus:outline-none";

// Su perfil: los datos básicos (editables ahí mismo) y todo lo que contaron
// al inscribirla, por tema, con «Editar» en cada respuesta.
function TabPerfil({ persona, onClose }: { persona: MyPatient; onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hydrateOnboarding = useAppStore((s) => s.hydrateOnboarding);
  const startQuestionEdit = useAppStore((s) => s.startQuestionEdit);
  const [nombre, setNombre] = useState(persona.nombre);
  const [edad, setEdad] = useState(persona.edad ?? "");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);
  const primer = persona.nombre.split(" ")[0];
  const cambio = nombre.trim() !== persona.nombre || (edad.trim() || null) !== (persona.edad ?? null);
  const { data: answers, isLoading } = useQuery({
    queryKey: ["onboarding-answers", persona.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("answers").eq("patient_id", persona.id).single();
      if (error) throw error;
      return data.answers as Answers;
    },
  });
  const grupos = answers ? groupAnswerableByModule(answers) : [];

  async function guardar() {
    if (!nombre.trim()) {
      setAviso({ texto: "El nombre no puede quedar vacío.", error: true });
      return;
    }
    setGuardando(true);
    const { error } = await supabase.from("patients").update({ nombre: nombre.trim(), edad: edad.trim() || null }).eq("id", persona.id);
    setGuardando(false);
    if (error) {
      setAviso({ texto: "No pudimos guardar. Probá de nuevo.", error: true });
      return;
    }
    setAviso({ texto: "Guardado." });
    qc.invalidateQueries({ queryKey: ["my-patient"] });
    qc.invalidateQueries({ queryKey: ["my-patients"] });
  }

  function editar(questionId: string) {
    if (answers) hydrateOnboarding(answers);
    startQuestionEdit(questionId);
    onClose();
    navigate(`/app/perfil/${questionId}`);
  }

  return (
    <div className="px-5 sm:px-8 py-7 grid grid-cols-[minmax(0,1fr)] gap-8">
      <section className="grid gap-4">
        <TituloPestana ceja="Su perfil">Sus datos</TituloPestana>
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta-suave">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-[14px] font-semibold text-tinta-suave">
            Edad
            <input value={edad} onChange={(e) => setEdad(e.target.value)} inputMode="numeric" className={inputClass} />
          </label>
        </div>
        {(cambio || aviso) && (
          <div className="flex flex-wrap items-center gap-3">
            {cambio && (
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center justify-center min-h-11 px-6 rounded-full bg-verde-profundo text-white font-semibold text-[15px] border-0 cursor-pointer hover:bg-tinta disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            )}
            {aviso && <span className={`text-[14px] ${aviso.error ? "text-alerta-texto" : "text-[#22663f]"}`}>{aviso.texto}</span>}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <TituloPestana ceja="Al inscribirse" detalle="Con esto el equipo arma su plan. Si algo cambió, tocá «Editar» en esa respuesta.">
          Lo que nos contaron de {primer}
        </TituloPestana>
        {isLoading ? (
          <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>
        ) : grupos.length === 0 ? (
          <p className="m-0 text-[15px] text-tinta-suave">Todavía no hay respuestas guardadas.</p>
        ) : (
          grupos.map((g) => (
            <div key={g.module} className="rounded-3xl border border-borde bg-white px-5 py-4">
              <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-verde-profundo">{g.module}</p>
              <dl className="m-0 grid">
                {g.questions.map((q) => (
                  <div key={q.id} className="grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 items-start py-2.5 border-t border-borde-suave first:border-t-0">
                    <dt className="text-[14px] leading-snug text-tinta-tenue">{answers ? resolveText(q.title, answers) : ""}</dt>
                    <dd className="m-0 text-[15px] font-medium leading-snug text-tinta">{answers ? describeAnswer(q, answers) : ""}</dd>
                    <button
                      type="button"
                      onClick={() => editar(q.id)}
                      className="justify-self-start sm:justify-self-end border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// Resumen para el médico: el documento y cómo compartirlo, ahí mismo.
function TabResumen({ persona }: { persona: MyPatient }) {
  const { data, isLoading, error } = useResumen(persona.id);
  const primer = persona.nombre.split(" ")[0];
  return (
    <div className="px-5 sm:px-8 py-7 grid grid-cols-[minmax(0,1fr)] gap-6">
      <TituloPestana ceja="Para la consulta" detalle={`Lo que hicieron en casa estas semanas, en una página. Así el médico de ${primer} entiende rápido cómo va.`}>
        Resumen para el médico
      </TituloPestana>
      {isLoading ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>
      ) : error || !data ? (
        <p className="m-0 text-[15px] text-tinta-suave">No pudimos armar el resumen. Probá de nuevo en un momento.</p>
      ) : (
        <>
          <CompartirResumen patientId={persona.id} nombre={primer} />
          <ResumenSeguimiento datos={data} para="familia" />
        </>
      )}
    </div>
  );
}
