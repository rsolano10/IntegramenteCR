import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient, type MyPatient } from "../../lib/useMyPatient";
import { empezarNuevoFamiliar } from "../../lib/pacienteActivo";
import { useAppStore } from "../../lib/store";
import { planTiers } from "../../lib/mockData";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { AcompanantesContenido } from "./SumarAcompanante";

// «Perfil de Esteban»: todo lo de la persona que acompaña la familia, en una
// ventana con pestañas (igual que «Mi cuenta»): sus datos y su cuestionario,
// su programa, quiénes la acompañan y el resumen para el médico.
type Tab = "datos" | "programa" | "acompanan" | "medico";

const inputClass = "w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta focus:border-verde-serenidad";

export function PerfilPersonaModal({ onClose, onVerProgramas }: { onClose: () => void; onVerProgramas: () => void }) {
  const { data: persona } = useMyPatient();
  return (
    <Modal onClose={onClose} bare>
      {persona ? (
        <Contenido persona={persona} onClose={onClose} onVerProgramas={onVerProgramas} />
      ) : (
        <div className="p-10 flex justify-center">
          <span className="inline-block w-7 h-7 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
        </div>
      )}
    </Modal>
  );
}

function Contenido({ persona, onClose, onVerProgramas }: { persona: MyPatient; onClose: () => void; onVerProgramas: () => void }) {
  const navigate = useNavigate();
  const session = useSession();
  const qc = useQueryClient();
  const resetOnboardingForNewAccount = useAppStore((s) => s.resetOnboardingForNewAccount);
  const [tab, setTab] = useState<Tab>("datos");
  const [nombre, setNombre] = useState(persona.nombre);
  const [edad, setEdad] = useState(persona.edad ?? "");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);
  const primer = persona.nombre.split(" ")[0];
  const programa = planTiers.find((t) => t.id === persona.modalidad)?.nombre ?? persona.modalidad;
  const cambio = nombre.trim() !== persona.nombre || (edad.trim() || null) !== (persona.edad ?? null);
  const ir = (ruta: string) => {
    onClose();
    navigate(ruta);
  };

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "datos", label: "Datos" },
    { id: "programa", label: "Programa" },
    { id: "acompanan", label: "Acompañan" },
    { id: "medico", label: "Resumen" },
  ];

  return (
    <div>
      {/* Encabezado: la persona */}
      <div className="relative bg-verde-profundo text-white px-6 sm:px-7 pt-6 pb-6 overflow-hidden">
        <div aria-hidden="true" className="absolute -right-14 -top-16 w-48 h-48 rounded-full bg-verde-serenidad/40" />
        <div className="relative flex items-center gap-4 pr-10">
          <span className="shrink-0 w-16 h-16 rounded-full bg-beige-serenidad text-verde-profundo font-serif text-2xl flex items-center justify-center">{persona.nombre.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <h2 className="m-0 font-serif font-normal text-[24px] leading-tight truncate">{persona.nombre}</h2>
            <p className="m-0 mt-0.5 text-[14px] text-[#c4dbdb]">{[persona.edad ? `${persona.edad} años` : null, `Programa ${programa}`].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div role="tablist" className="flex gap-1 px-4 sm:px-5 border-b border-borde bg-campo overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-3.5 text-[14.5px] font-semibold border-b-2 -mb-px cursor-pointer transition-colors ${
              tab === t.id ? "border-verde-serenidad text-tinta" : "border-transparent text-tinta-tenue hover:text-tinta"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 sm:px-7 py-6">
        {tab === "datos" && (
          <div className="grid gap-4.5">
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
            {aviso && <p className={`m-0 text-[14px] ${aviso.error ? "text-alerta-texto" : "text-[#22663f]"}`}>{aviso.texto}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="principal" dense onClick={guardar} disabled={!cambio || guardando}>
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="secondary" dense onClick={() => ir("/app/perfil/resumen")}>
                Ver lo que contaron sobre {primer}
              </Button>
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-tinta-tenue">Lo que respondieron al inscribir a {primer}: sus intereses, cómo está y qué apoyo necesita. Lo pueden revisar y corregir cuando quieran.</p>
          </div>
        )}

        {tab === "programa" && (
          <div className="grid gap-4">
            <p className="m-0 text-[15.5px] text-tinta">
              <strong className="font-semibold">{programa}</strong>
              {persona.estado_cuenta === "en_demo" ? " · semana gratis" : persona.estado_cuenta === "demo_finalizada" ? " · terminó la semana gratis" : ""}
            </p>
            <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave">Qué incluye, cómo activarlo o cambiar de programa.</p>
            <Button
              variant="principal"
              dense
              onClick={() => {
                onClose();
                onVerProgramas();
              }}
              className="justify-self-start"
            >
              Ver el programa
            </Button>
          </div>
        )}

        {tab === "acompanan" && <AcompanantesContenido />}

        {tab === "medico" && (
          <div className="grid gap-4">
            <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
              Un resumen de lo que hicieron en casa estas semanas, para llevar impreso a la consulta o mandarle un enlace al médico de {primer}.
            </p>
            <Button variant="principal" dense onClick={() => ir("/app/resumen-medico")} className="justify-self-start">
              Abrir el resumen
            </Button>
          </div>
        )}
      </div>

      {/* Otra persona del programa */}
      <div className="px-6 sm:px-7 py-4 border-t border-borde-suave bg-campo">
        <button
          type="button"
          onClick={() => {
            if (session.status !== "authed") return;
            empezarNuevoFamiliar();
            resetOnboardingForNewAccount(session.session.user.id);
            ir("/app/perfil/bienvenida");
          }}
          className="border-0 bg-transparent p-0 text-[14px] font-semibold text-verde-profundo cursor-pointer underline decoration-dotted"
        >
          ¿Acompañás a otra persona? Inscribila al programa
        </button>
      </div>
    </div>
  );
}
