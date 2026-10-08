import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { comparacion, programaSugerido, programas, type ProgramaId } from "../../lib/programas";
import { nombreConTratamiento, participanteEsRespondente } from "../../lib/respondentVoice";
import { Button } from "../../components/ui/Button";

// Después del cuestionario: la familia elige entre Autoguiado y Orientado.
// Es a la vez una decisión y la explicación de qué trae cada programa —
// precios incluidos. Todavía no se cobra (la elección solo queda
// registrada con elegir_programa); el cobro se conecta acá más adelante.
export function ElegirPrograma() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const { data: myPatient, isPending } = useMyPatient();
  const answers = useAppStore((s) => s.onboarding2);
  const [elegido, setElegido] = useState<ProgramaId | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  if (isPending || session.status !== "authed") return <div className="min-h-[40vh]" />;
  if (!myPatient) return <Navigate to="/app/consent" replace />;
  // Plan ya asignado: cambiar de programa pasa por la clínica, no por acá.
  if (myPatient.plan_status !== "pendiente") return <Navigate to="/app/login" replace />;

  const tieneRespuestas = typeof answers.nombre_participante === "string" && !!answers.nombre_participante;
  const esPropia = tieneRespuestas && participanteEsRespondente(answers);
  const nombre = tieneRespuestas ? nombreConTratamiento(answers) : myPatient.nombre;
  const sugerido = tieneRespuestas ? programaSugerido(answers) : null;
  // Si ya había elegido antes (volvió desde el panel), arranca marcado.
  const seleccion = elegido ?? (myPatient.programa_elegido ? (myPatient.modalidad as ProgramaId) : null);
  const programaSeleccionado = programas.find((p) => p.id === seleccion);

  async function continuar() {
    if (!seleccion) return;
    setError("");
    setGuardando(true);
    const { error: rpcError } = await supabase.rpc("elegir_programa", { p_modalidad: seleccion });
    setGuardando(false);
    if (rpcError) {
      setError(rpcError.code === "42501" ? rpcError.message : "No pudimos guardar tu elección. Probá de nuevo.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["my-patient", session.status === "authed" ? session.session.user.id : null] });
    navigate(myPatient!.programa_elegido ? "/app/login" : "/app/perfil/invitar");
  }

  return (
    <div className="im-in max-w-[980px] mx-auto px-5 pt-10 pb-36 sm:px-8 lg:pt-14">
      <div className="text-center max-w-[640px] mx-auto mb-8 lg:mb-10">
        <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Último paso</p>
        <h1 className="font-serif font-normal text-[28px] sm:text-[38px] leading-[1.14] m-0 mb-4">
          {esPropia ? "¿Cómo querés que te acompañemos?" : `¿Cómo querés acompañar a ${nombre}?`}
        </h1>
        <p className="m-0 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
          Los dos programas parten del perfil que acabás de completar. La diferencia está en cuánto acompañamiento profesional van a tener
          en el camino.
        </p>
      </div>

      {sugerido && (
        <div className="flex items-start gap-3 max-w-[640px] mx-auto mb-8 bg-aviso border border-riesgo-borde rounded-2xl px-4.5 py-3.5">
          <span aria-hidden="true" className="text-[18px] leading-none mt-0.5">✦</span>
          <p className="m-0 text-[15px] leading-relaxed text-riesgo-texto">
            <strong>Nuestra sugerencia: {programas.find((p) => p.id === sugerido.id)!.nombre}.</strong> {sugerido.motivo} La decisión es
            de ustedes.
          </p>
        </div>
      )}

      <div role="radiogroup" aria-label="Programa" className="grid gap-5 md:grid-cols-2 items-stretch">
        {programas.map((p) => {
          const activo = seleccion === p.id;
          const esSugerido = sugerido?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setElegido(p.id)}
              className={`relative text-left rounded-3xl p-6 sm:p-7 flex flex-col gap-5 cursor-pointer transition-[border-color,box-shadow,background-color] border-2 font-sans ${
                activo
                  ? "border-verde-serenidad bg-verde-tenue shadow-elevada"
                  : "border-borde bg-white hover:border-verde-serenidad/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {esSugerido && (
                    <span className="inline-block mb-2.5 text-[11px] tracking-[0.12em] uppercase bg-mostaza-vital text-semaforo-amarillo-texto px-2.5 py-1 rounded-full font-bold">
                      Sugerido para {esPropia ? "vos" : "ustedes"}
                    </span>
                  )}
                  <h2 className="font-serif font-normal text-[28px] leading-tight m-0">{p.nombre}</h2>
                  <p className="m-0 mt-1 text-[15px] italic text-verde-profundo">{p.lema}</p>
                </div>
                <span
                  aria-hidden="true"
                  className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center mt-1 ${
                    activo ? "border-verde-serenidad bg-verde-serenidad text-white" : "border-borde-campo bg-white"
                  }`}
                >
                  {activo && <span className="text-[13px] leading-none">✓</span>}
                </span>
              </div>

              <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave">{p.descripcion}</p>

              <div className="flex items-baseline gap-2 pb-5 border-b border-borde-suave">
                <span className="font-serif text-[36px] leading-none text-tinta">{p.precio}</span>
                <span className="text-[14px] text-tinta-tenue">{p.periodo}</span>
              </div>

              <div>
                <p className="m-0 mb-2.5 text-[12px] tracking-[0.12em] uppercase text-tinta-tenue font-semibold">Incluye</p>
                <ul className="list-none m-0 p-0 grid gap-2">
                  {p.incluye.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-tinta">
                      <span aria-hidden="true" className="text-verde-serenidad font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto bg-white/70 border border-borde-suave rounded-2xl p-4">
                <p className="m-0 mb-2 text-[12px] tracking-[0.12em] uppercase text-tinta-tenue font-semibold">Ideal si…</p>
                <ul className="list-none m-0 p-0 grid gap-1.5">
                  {p.idealSi.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[14px] leading-snug text-tinta-suave">
                      <span aria-hidden="true" className="text-tinta-tenue">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      <details className="group mt-8 bg-white border border-borde rounded-3xl">
        <summary className="list-none cursor-pointer px-6 py-4.5 flex items-center justify-between gap-3 font-semibold text-[16px] text-tinta">
          Compará en detalle
          <span aria-hidden="true" className="text-tinta-tenue transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="px-3 sm:px-6 pb-5 overflow-x-auto">
          <table className="w-full border-collapse text-[14.5px]">
            <thead>
              <tr className="text-left text-[12px] tracking-[0.1em] uppercase text-tinta-tenue">
                <th className="py-2.5 pr-3 font-semibold"></th>
                <th className="py-2.5 px-3 font-semibold text-center">Autoguiado</th>
                <th className="py-2.5 pl-3 font-semibold text-center">Orientado</th>
              </tr>
            </thead>
            <tbody>
              {comparacion.map((fila) => (
                <tr key={fila.aspecto} className="border-t border-borde-suave">
                  <td className="py-3 pr-3 text-tinta-suave">{fila.aspecto}</td>
                  {[fila.autoguiado, fila.orientado].map((v, i) => (
                    <td key={i} className="py-3 px-3 text-center text-tinta">
                      {v === true ? (
                        <span className="text-verde-serenidad font-bold" aria-label="Incluido">✓</span>
                      ) : v === false ? (
                        <span className="text-tinta-tenue" aria-label="No incluido">—</span>
                      ) : (
                        <span className="text-[13.5px]">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="m-0 mt-6 text-center text-[14px] leading-relaxed text-tinta-tenue max-w-[560px] mx-auto">
        <strong className="text-tinta-suave">Hoy no se cobra nada.</strong> Te vamos a avisar antes de cualquier cobro. Si más adelante
        querés cambiar de programa, solo escribile a tu clínica.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-white/95 backdrop-blur border-t border-borde" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="max-w-[980px] mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <p className="m-0 text-[14px] sm:text-[15px] text-tinta-suave min-w-0">
            {programaSeleccionado ? (
              <>
                <span className="hidden sm:inline">Elegiste </span>
                <strong className="text-tinta">{programaSeleccionado.nombre}</strong> · {programaSeleccionado.precio} {programaSeleccionado.periodo}
              </>
            ) : (
              "Elegí un programa para continuar"
            )}
          </p>
          <Button variant="ink" onClick={continuar} disabled={!seleccion || guardando} className="shrink-0">
            {guardando ? "Guardando…" : "Continuar"}
          </Button>
        </div>
        {error && <p className="m-0 pb-3 px-5 text-center text-[14px] text-alerta-texto">{error}</p>}
      </div>
    </div>
  );
}
