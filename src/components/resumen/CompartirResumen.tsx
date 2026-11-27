import { useState } from "react";
import { Button } from "../ui/Button";
import { urlResumen, useCrearEnlace, useEnlacesResumen, useRevocarEnlace } from "../../lib/resumen";

// Imprimir o compartir el resumen con el médico: un enlace que vence (30
// días) y se puede anular. El médico lo abre sin cuenta.
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long" });

export function CompartirResumen({ patientId, nombre }: { patientId?: string | null; nombre?: string }) {
  const { data: enlaces } = useEnlacesResumen(patientId);
  const crear = useCrearEnlace(patientId);
  const revocar = useRevocarEnlace();
  const [copiado, setCopiado] = useState<string | null>(null);
  const activos = (enlaces ?? []).filter((e) => !e.revocado_en && new Date(e.expira) > new Date());

  const copiar = async (token: string) => {
    try {
      await navigator.clipboard.writeText(urlResumen(token));
      setCopiado(token);
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      window.prompt("Copiá el enlace:", urlResumen(token));
    }
  };
  const whatsapp = (token: string) =>
    `https://wa.me/?text=${encodeURIComponent(`Le comparto el resumen de las actividades en casa${nombre ? ` de ${nombre}` : ""} (IntegraMente en Casa): ${urlResumen(token)}`)}`;

  return (
    <section className="print:hidden rounded-[24px] bg-white border border-borde px-5 py-5 grid gap-4">
      <div>
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Compartirlo con el médico</h2>
        <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-tinta-suave">Llevalo impreso a la consulta o mandale un enlace. El enlace se abre sin cuenta, vence en 30 días y lo podés anular cuando quieras.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="principal" onClick={() => window.print()}>
          Imprimir o guardar PDF
        </Button>
        <Button variant="secondary" onClick={() => crear.mutate(30)} disabled={crear.isPending}>
          {crear.isPending ? "Creando…" : "Crear enlace para el médico"}
        </Button>
      </div>
      {crear.isError && <p className="m-0 text-[14px] text-alerta-texto">No pudimos crear el enlace. Probá de nuevo.</p>}
      {activos.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-2.5">
          {activos.map((e) => (
            <li key={e.token} className="rounded-2xl bg-campo px-4 py-3 grid gap-2">
              <span className="text-[13.5px] text-tinta-suave">
                Enlace creado el {fecha(e.created_at)} · vence el {fecha(e.expira)} · {e.vistas === 0 ? "todavía no lo abrieron" : e.vistas === 1 ? "lo abrieron 1 vez" : `lo abrieron ${e.vistas} veces`}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" dense onClick={() => copiar(e.token)}>
                  {copiado === e.token ? "¡Copiado!" : "Copiar enlace"}
                </Button>
                <a href={whatsapp(e.token)} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-10 px-4 rounded-full border-[1.5px] border-borde bg-white text-[14px] font-semibold text-tinta no-underline hover:border-verde-serenidad">
                  Mandar por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => window.confirm("¿Anular este enlace? Quien lo tenga ya no va a poder abrirlo.") && revocar.mutate(e.token)}
                  className="min-h-10 px-3 border-0 bg-transparent text-[14px] font-semibold text-alerta-texto cursor-pointer underline decoration-dotted"
                >
                  Anular
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
