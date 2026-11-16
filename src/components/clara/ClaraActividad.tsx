import { Suspense, lazy, useState } from "react";
import { useMyPatient } from "../../lib/useMyPatient";
import { contextoParaClara, preguntasSugeridas, type ContextoActividad } from "../../lib/claraActividad";
import { ClaraAvatar } from "./ClaraAvatar";

// «Preguntale a Clara» dentro de una actividad: en el tablero (antes de
// empezar) y en la «Ayuda» de cada paso de la sesión guiada. Esta parte es
// liviana: el chat (y el SDK de ElevenLabs) se carga con la primera pregunta.

const Chat = lazy(() => import("./ChatClaraActividad"));

export function ClaraActividad({
  contexto,
  quien,
  enSesion,
  large = false,
}: {
  contexto: Omit<ContextoActividad, "quien" | "nombrePaciente">;
  quien: "familia" | "participante";
  enSesion: boolean;
  large?: boolean;
}) {
  const { data: myPatient } = useMyPatient();
  const [primera, setPrimera] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const sugerencias = preguntasSugeridas(quien, enSesion);
  const texto = contextoParaClara({ ...contexto, quien, nombrePaciente: myPatient?.nombre?.split(" ")[0] ?? null });
  const t = large ? { titulo: "text-[21px]", cuerpo: "text-[17px]", chico: "text-[16px]" } : { titulo: "text-[18px]", cuerpo: "text-[15px]", chico: "text-[14.5px]" };

  return (
    <section className="rounded-[22px] border-[1.5px] border-verde-serenidad/40 bg-[linear-gradient(160deg,#f5f9f9,#e7f0ef)] px-4 py-4 grid gap-3">
      <div className="flex items-center gap-3">
        <ClaraAvatar tam={large ? 40 : 34} />
        <div className="min-w-0">
          <p className={`m-0 font-semibold text-tinta ${t.titulo}`}>Preguntale a Clara</p>
          <p className={`m-0 text-tinta-suave leading-snug ${t.chico}`}>{enSesion ? "Sabe en qué paso están y cómo se hace." : "Conoce esta actividad de punta a punta."}</p>
        </div>
      </div>

      {primera ? (
        <Suspense fallback={<p className={`m-0 text-tinta-suave ${t.cuerpo}`}>Abriendo el chat con Clara…</p>}>
          <Chat contexto={texto} inicial={primera} quien={quien} large={large} sugerencias={sugerencias} />
        </Suspense>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrimera(s)}
                className={`min-h-11 px-3.5 rounded-full border-[1.5px] border-borde bg-white text-tinta font-semibold cursor-pointer hover:border-verde-serenidad ${t.chico}`}
              >
                {s}
              </button>
            ))}
          </div>
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
              placeholder="Escribí tu pregunta…"
              className={`flex-1 min-h-12 max-h-32 resize-none rounded-2xl border-[1.5px] border-borde-campo bg-white px-4 py-3 font-sans leading-snug text-tinta ${t.cuerpo}`}
            />
            <button type="submit" disabled={!input.trim()} className="shrink-0 min-h-12 px-5 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed">
              Preguntar
            </button>
          </form>
        </>
      )}
      <p className={`m-0 text-tinta-suave ${large ? "text-[15px]" : "text-[14px]"}`}>Clara es una IA y puede equivocarse. Ante una urgencia, llamá al 9-1-1.</p>
    </section>
  );
}
