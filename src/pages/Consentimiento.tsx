import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../lib/useSession";
import { CheckRow } from "../components/ui/CheckRow";
import { Button } from "../components/ui/Button";
import {
  consentimientosDeRol,
  FECHA_LEGAL,
  useMisConsentimientos,
  useRegistrarConsentimientos,
  type RolCuenta,
  type TipoConsentimiento,
} from "../lib/consentimientos";

// Aceptación de la versión vigente de las condiciones y la privacidad, con
// cada consentimiento por separado (Ley 8968: expreso y específico). Los
// obligatorios habilitan el botón; los opcionales arrancan apagados (un
// permiso ya marcado no es consentimiento) salvo que la persona ya los
// hubiera dado antes. RouteGuard manda acá a toda cuenta que no haya
// aceptado VERSION_LEGAL.
export function Consentimiento() {
  const session = useSession();
  const rol = (session.status === "authed" ? session.profile.role : null) as RolCuenta | null;
  const { data: guardados } = useMisConsentimientos(!!rol);
  const registrar = useRegistrarConsentimientos();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [marcas, setMarcas] = useState<Partial<Record<TipoConsentimiento, boolean>>>({});
  const [iniciado, setIniciado] = useState(false);

  const defs = rol ? consentimientosDeRol(rol) : [];
  const obligatorios = defs.filter((d) => d.obligatorio);
  const opcionales = defs.filter((d) => !d.obligatorio);

  useEffect(() => {
    if (iniciado || !guardados) return;
    const previos: Partial<Record<TipoConsentimiento, boolean>> = {};
    for (const d of opcionales) previos[d.tipo] = !!guardados.find((g) => g.tipo === d.tipo)?.otorgado;
    setMarcas(previos);
    setIniciado(true);
  }, [guardados, opcionales, iniciado]);

  if (!rol) return null;
  const listo = obligatorios.every((d) => marcas[d.tipo]);
  const actualizacion = (guardados ?? []).some((g) => g.tipo === "terminos");

  async function aceptar() {
    if (!rol) return;
    const decisiones: Partial<Record<TipoConsentimiento, boolean>> = {};
    for (const d of defs) decisiones[d.tipo] = !!marcas[d.tipo];
    await registrar.mutateAsync({ rol, decisiones });
    const next = params.get("next");
    navigate(next && next.startsWith("/app/") ? next : "/app/login", { replace: true });
  }

  const alternar = (t: TipoConsentimiento) => setMarcas((m) => ({ ...m, [t]: !m[t] }));

  return (
    <div className="im-in max-w-[680px] mx-auto px-5 py-10 pb-20 sm:px-8">
      <p className="m-0 mb-2 text-[12.5px] tracking-[0.16em] uppercase font-semibold text-tinta-tenue">Vigente desde el {FECHA_LEGAL}</p>
      <h1 className="m-0 mb-3 font-serif font-normal text-[30px] sm:text-[36px] leading-tight">
        {actualizacion ? "Actualizamos nuestras condiciones" : "Antes de empezar"}
      </h1>
      <p className="m-0 mb-2 text-[16.5px] leading-relaxed text-tinta-suave">
        {rol === "profesional"
          ? "Para usar la plataforma con información de salud necesitamos tu aceptación y tu compromiso de confidencialidad."
          : "Cuidamos información sensible. Por eso te pedimos cada autorización por separado: así sabés exactamente para qué se usa cada dato."}
      </p>
      <p className="m-0 mb-8 text-[15px] leading-relaxed text-tinta-suave">
        Podés leer las{" "}
        <Link to="/legal/condiciones" target="_blank" className="text-verde-profundo font-semibold">
          Condiciones de uso
        </Link>{" "}
        y la{" "}
        <Link to="/legal/privacidad" target="_blank" className="text-verde-profundo font-semibold">
          Política de privacidad
        </Link>{" "}
        completas.
      </p>

      <h2 className="m-0 mb-3 font-serif font-normal text-[22px]">Necesarias para usar el programa</h2>
      <div className="grid gap-3 mb-9">
        {obligatorios.map((d) => (
          <CheckRow key={d.tipo} checked={!!marcas[d.tipo]} onToggle={() => alternar(d.tipo)}>
            <strong className="block mb-1 text-tinta">{d.titulo}</strong>
            <span className="text-[15px] text-tinta-suave">{d.texto(rol)}</span>
          </CheckRow>
        ))}
      </div>

      {opcionales.length > 0 && (
        <>
          <h2 className="m-0 mb-1.5 font-serif font-normal text-[22px]">Opcionales</h2>
          <p className="m-0 mb-3 text-[15px] leading-relaxed text-tinta-suave">
            El programa funciona igual sin estas. Las podés activar o desactivar cuando quieras en <strong className="text-tinta">Mis datos y permisos</strong>.
          </p>
          <div className="grid gap-3 mb-9">
            {opcionales.map((d) => (
              <CheckRow key={d.tipo} checked={!!marcas[d.tipo]} onToggle={() => alternar(d.tipo)}>
                <strong className="block mb-1 text-tinta">{d.titulo}</strong>
                <span className="text-[15px] text-tinta-suave">{d.texto(rol)}</span>
              </CheckRow>
            ))}
          </div>
        </>
      )}

      {registrar.isError && (
        <p role="alert" className="m-0 mb-4 text-[15px] text-alerta-texto">
          No pudimos guardar tu respuesta. Revisá la conexión y probá de nuevo.
        </p>
      )}
      <Button variant="principal" fullWidth onClick={aceptar} disabled={!listo || registrar.isPending}>
        {registrar.isPending ? "Guardando…" : "Aceptar y seguir"}
      </Button>
      {!listo && <p className="m-0 mt-3 text-center text-[14px] text-tinta-tenue">Marcá las autorizaciones necesarias para seguir.</p>}
    </div>
  );
}
