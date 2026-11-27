import { useMiReferidor } from "../../lib/referidos";
import { useMisConsentimientos, useRegistrarConsentimientos, type RolCuenta } from "../../lib/consentimientos";

// Si la refirió un profesional y todavía no decidió: ¿le compartimos el
// avance? Se puede cambiar después en «Mis datos y permisos».
export function AvisoReferidor({ rol }: { rol: RolCuenta }) {
  const { data: referidor } = useMiReferidor();
  const { data: consentimientos, isPending } = useMisConsentimientos();
  const registrar = useRegistrarConsentimientos();
  if (!referidor || isPending || consentimientos?.some((c) => c.tipo === "compartir_referidor")) return null;
  const quien = `${referidor.nombre}${referidor.especialidad ? ` (${referidor.especialidad})` : ""}`;
  return (
    <section className="mb-5 rounded-[24px] border-[1.5px] border-verde-serenidad bg-verde-tenue px-5 py-4">
      <p className="m-0 text-[16px] font-semibold text-tinta">{quien} les recomendó el programa</p>
      <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-tinta-suave">
        ¿Le compartimos el resumen de las actividades en casa? Ve lo que se hizo cada semana y lo que nos cuentan; no ve los mensajes ni el cuestionario. Lo podés cambiar cuando quieras en «Mis datos y permisos».
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={registrar.isPending}
          onClick={() => registrar.mutate({ rol, decisiones: { compartir_referidor: true } })}
          className="min-h-11 px-5 rounded-full border-0 bg-verde-profundo text-white text-[15px] font-semibold cursor-pointer hover:bg-tinta"
        >
          Sí, compartir
        </button>
        <button
          type="button"
          disabled={registrar.isPending}
          onClick={() => registrar.mutate({ rol, decisiones: { compartir_referidor: false } })}
          className="min-h-11 px-5 rounded-full border-[1.5px] border-borde bg-white text-[15px] font-semibold text-tinta cursor-pointer"
        >
          Ahora no
        </button>
      </div>
    </section>
  );
}
