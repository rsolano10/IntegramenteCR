import { Suspense, lazy, useState } from "react";
import { usePermiso } from "../../lib/consentimientos";
import { ActivarClara } from "./ActivarClara";
import { useMyPatient } from "../../lib/useMyPatient";
import { contextoParaClara, type ContextoActividad } from "../../lib/claraActividad";
import { ClaraAvatar } from "./ClaraAvatar";
import { useServiciosActivos } from "../../lib/servicios";

// Clara en la «Ayuda» de cada paso de la sesión guiada, debajo de los
// consejos: un chat mínimo, sin preguntas de ejemplo. Esta parte es
// liviana: el chat (y el SDK de ElevenLabs) se carga con la primera pregunta.

const Chat = lazy(() => import("./ChatClaraActividad"));

function ClaraActividadConPermiso({
  contexto,
  quien,
  large = false,
}: {
  contexto: Omit<ContextoActividad, "quien" | "nombrePaciente">;
  quien: "familia" | "participante";
  large?: boolean;
}) {
  const { data: myPatient } = useMyPatient();
  const [primera, setPrimera] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const texto = contextoParaClara({ ...contexto, quien, nombrePaciente: myPatient?.nombre?.split(" ")[0] ?? null });
  const cuerpo = large ? "text-[18px]" : "text-[16px]";

  return (
    <section className="mt-2 pt-4 border-t border-borde grid gap-3" aria-label="Preguntale a Clara">
      <p className={`m-0 flex items-center gap-2.5 font-semibold text-tinta ${large ? "text-[18px]" : "text-[16px]"}`}>
        <ClaraAvatar tam={22} />
        Preguntale a Clara
      </p>

      {primera ? (
        <Suspense fallback={<p className={`m-0 text-tinta-suave ${cuerpo}`}>Abriendo el chat…</p>}>
          <Chat contexto={texto} inicial={primera} quien={quien} large={large} />
        </Suspense>
      ) : (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) setPrimera(input.trim());
          }}
        >
          <label className="sr-only" htmlFor="clara-actividad-primera">
            Tu pregunta para Clara
          </label>
          <textarea
            id="clara-actividad-primera"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) setPrimera(input.trim());
              }
            }}
            rows={1}
            placeholder="Escribí tu duda…"
            className={`flex-1 min-h-12 max-h-32 resize-none rounded-2xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans leading-snug text-tinta ${cuerpo}`}
          />
          <button type="submit" disabled={!input.trim()} className="shrink-0 min-h-12 px-5 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed">
            Enviar
          </button>
        </form>
      )}
      <p className="m-0 text-[12.5px] leading-snug text-tinta-suave">Clara es una IA y puede equivocarse. Ante una urgencia, llamá al 9-1-1.</p>
    </section>
  );
}

// Sin el permiso «ia_clara», en lugar del chat se ofrece activarla.
export function ClaraActividad(props: Parameters<typeof ClaraActividadConPermiso>[0]) {
  const { permitido, cargando } = usePermiso("ia_clara");
  const { servicios, cargando: cargandoServicios } = useServiciosActivos();
  // Clara apagada desde Administración: no se ofrece.
  if (cargando || cargandoServicios || !servicios.clara) return null;
  return permitido ? <ClaraActividadConPermiso {...props} /> : <ActivarClara compacto large={props.large} />;
}
