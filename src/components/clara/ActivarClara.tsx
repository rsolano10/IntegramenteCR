import { useState } from "react";
import { useSession } from "../../lib/useSession";
import { CONSENTIMIENTOS, useRegistrarConsentimientos, type RolCuenta } from "../../lib/consentimientos";
import { ClaraAvatar } from "./ClaraAvatar";

// Clara solo funciona con el permiso «ia_clara». Sin él, en lugar del chat
// se muestra esto: qué es Clara, el texto exacto de la autorización y un
// botón para darla (queda registrada como cualquier otro consentimiento).
export function ActivarClara({ compacto = false, large = false }: { compacto?: boolean; large?: boolean }) {
  const session = useSession();
  const rol = (session.status === "authed" ? session.profile.role : "familiar") as RolCuenta;
  const registrar = useRegistrarConsentimientos();
  const [abierto, setAbierto] = useState(!compacto);
  const def = CONSENTIMIENTOS.find((c) => c.tipo === "ia_clara")!;
  const cuerpo = large ? "text-[18px]" : "text-[15.5px]";

  return (
    <section className={`${compacto ? "mt-2 pt-4 border-t border-borde" : "rounded-3xl border border-borde bg-white p-5 sm:p-6"} grid gap-3`} aria-label="Activar a Clara">
      <p className={`m-0 flex items-center gap-2.5 font-semibold text-tinta ${large ? "text-[18px]" : "text-[16px]"}`}>
        <ClaraAvatar tam={compacto ? 22 : 30} />
        {compacto ? "Clara está desactivada" : "Conocé a Clara"}
      </p>
      {abierto ? (
        <>
          <p className={`m-0 leading-relaxed text-tinta-suave ${cuerpo}`}>{def.texto(rol)}</p>
          <button
            type="button"
            onClick={() => registrar.mutate({ rol, decisiones: { ia_clara: true } })}
            disabled={registrar.isPending}
            className="justify-self-start min-h-11 px-5 rounded-full border-0 bg-verde-profundo text-white font-sans text-[15px] font-semibold cursor-pointer hover:bg-tinta disabled:opacity-50"
          >
            {registrar.isPending ? "Activando…" : "Activar a Clara"}
          </button>
          {registrar.isError && <p className="m-0 text-[14.5px] text-alerta-texto">No se pudo activar. Probá de nuevo.</p>}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className={`justify-self-start p-0 border-0 bg-transparent font-sans font-semibold text-verde-profundo underline underline-offset-4 cursor-pointer ${cuerpo}`}
        >
          Ver cómo activarla
        </button>
      )}
    </section>
  );
}
