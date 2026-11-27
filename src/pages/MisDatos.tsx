import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { useMyPatient } from "../lib/useMyPatient";
import { CheckRow } from "../components/ui/CheckRow";
import { BotonVolver } from "../components/ui/BotonVolver";
import { useMiReferidor } from "../lib/referidos";
import { abrirVentanaCuenta } from "../lib/abrirCuenta";
import { waEquipo } from "../lib/whatsapp";
import { useAccionEliminacion, useEliminacionProgramada } from "../lib/misDatos";
import { CONSENTIMIENTOS, consentimientosDeRol, useMisConsentimientos, useRegistrarConsentimientos, type RolCuenta } from "../lib/consentimientos";

// Mis datos y permisos: los derechos de la Ley 8968 en autoservicio, sin
// solicitudes que el equipo tenga que contestar a mano.
//   - Acceso: el informe legible, al instante (/app/mis-datos/informe).
//   - Rectificación: se corrige en la app (Mi cuenta, Perfil de …).
//   - Oposición: los permisos, que se aplican al tocar.
//   - Eliminación: se programa y se ejecuta sola a los 7 días, salvo que se
//     cancele (función derechos-datos, con correo de constancia).
//   - Historial de autorizaciones y de lo pedido.

const SOLICITUD: Record<string, string> = { acceso: "Ver mis datos", rectificacion: "Corregir un dato", eliminacion: "Eliminar mis datos", oposicion: "Oponerme a un uso" };
const ESTADO: Record<string, string> = { pendiente: "Programada", resuelta: "Hecha", rechazada: "No procede", cancelada: "Cancelada" };

interface Solicitud {
  id: string;
  tipo: string;
  estado: string;
  respuesta: string | null;
  created_at: string;
}
interface Registro {
  id: string;
  tipo: string;
  otorgado: boolean;
  created_at: string;
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });

export function MisDatos() {
  const session = useSession();
  const rol = (session.status === "authed" ? session.profile.role : null) as RolCuenta | null;
  const esFamilia = rol === "familiar" || rol === "paciente";
  const { data: referidor } = useMiReferidor(esFamilia);
  const { data: persona } = useMyPatient();
  const uid = session.status === "authed" ? session.session.user.id : null;
  const { data: guardados } = useMisConsentimientos(!!rol);
  const registrar = useRegistrarConsentimientos();
  const [aviso, setAviso] = useState<string | null>(null);

  const { data: solicitudes } = useQuery({
    queryKey: ["mis-solicitudes-datos", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("solicitudes_datos").select("id, tipo, estado, respuesta, created_at").eq("profile_id", uid!).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as Solicitud[];
    },
  });
  const { data: historial } = useQuery({
    queryKey: ["historial-consentimientos", uid, guardados],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("consentimientos").select("id, tipo, otorgado, created_at").eq("profile_id", uid!).order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as Registro[];
    },
  });

  if (!rol) return null;
  const opcionales = consentimientosDeRol(rol, { conReferidor: !!referidor }).filter((c) => !c.obligatorio);
  const tituloDe = (t: string) => CONSENTIMIENTOS.find((c) => c.tipo === t)?.titulo ?? t;
  const primer = persona?.nombre.split(" ")[0];

  return (
    <div className="im-in max-w-[760px] mx-auto px-4 py-8 pb-20 sm:px-8 grid grid-cols-[minmax(0,1fr)] gap-8">
      <BotonVolver respaldo="/app/login" />

      {/* Encabezado de marca */}
      <header className="relative overflow-hidden rounded-[28px] bg-verde-profundo text-white px-6 sm:px-8 pt-7 pb-7 -mt-3">
        <div aria-hidden="true" className="absolute -right-16 -top-24 w-60 h-60 rounded-full bg-verde-serenidad/45" />
        <div aria-hidden="true" className="absolute right-20 -bottom-36 w-52 h-52 rounded-full bg-mostaza-vital/20" />
        <div className="relative">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#cfe2e2]">Tu privacidad</p>
          <h1 className="m-0 mt-1.5 font-serif font-normal text-[30px] sm:text-[36px] leading-tight">Mis datos y permisos</h1>
          <p className="m-0 mt-2 max-w-[520px] text-[15px] leading-relaxed text-[#e1ecec]">
            Todo se hace acá, al instante: ver tus datos, corregirlos, decidir qué usos permitís o eliminarlos. Más detalle en la{" "}
            <Link to="/legal/privacidad" className="text-mostaza-vital font-semibold">
              Política de privacidad
            </Link>
            .
          </p>
        </div>
      </header>

      {aviso && (
        <p role="status" className="m-0 -my-3 rounded-2xl bg-verde-tenue border border-verde-serenidad px-4 py-3 text-[15px] text-tinta">
          {aviso}
        </p>
      )}

      {/* Ver y corregir */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Tarjeta
          icono={<IconoDoc />}
          titulo="Ver todo lo que tenemos"
          texto="Un informe para leer, imprimir o guardar como PDF. Incluye las notas del equipo."
        >
          <Link
            to="/app/mis-datos/informe"
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-verde-profundo text-white text-[15px] font-semibold no-underline hover:bg-tinta"
          >
            Ver mis datos
          </Link>
        </Tarjeta>
        <Tarjeta icono={<IconoLapiz />} titulo="Corregir un dato" texto="Cambialo vos mismo: se guarda al momento.">
          <div className="flex flex-wrap gap-2">
            <BotonSuave onClick={() => abrirVentanaCuenta("mi-perfil")}>Mis datos</BotonSuave>
            {rol === "familiar" && persona && <BotonSuave onClick={() => abrirVentanaCuenta("perfil-persona")}>Datos de {primer}</BotonSuave>}
          </div>
          <a href={waEquipo("Quiero corregir un dato que no puedo cambiar en la app.")} target="_blank" rel="noreferrer" className="text-[13.5px] font-semibold text-verde-profundo">
            ¿Algo que no podés cambiar? Escribinos
          </a>
        </Tarjeta>
      </div>

      {/* Permisos: oponerse a un uso */}
      {opcionales.length > 0 && (
        <section>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">Permisos</p>
          <h2 className="m-0 mt-0.5 mb-1 font-serif font-normal text-[24px] leading-tight">Qué usos permitís</h2>
          <p className="m-0 mb-4 text-[15px] text-tinta-suave">Se aplican al tocar. El programa sigue funcionando aunque los desactives.</p>
          <div className="grid gap-3">
            {opcionales.map((d) => {
              const activo = !!guardados?.find((g) => g.tipo === d.tipo)?.otorgado;
              return (
                <CheckRow
                  key={d.tipo}
                  checked={activo}
                  disabled={registrar.isPending}
                  onToggle={() =>
                    registrar.mutate({ rol, decisiones: { [d.tipo]: !activo } }, { onSuccess: () => setAviso(`${d.titulo}: ${activo ? "desactivado" : "activado"}.`) })
                  }
                >
                  <strong className="block mb-1 text-tinta">{d.titulo}</strong>
                  <span className="text-[15px] text-tinta-suave">{d.texto(rol)}</span>
                </CheckRow>
              );
            })}
          </div>
          {registrar.isError && <p className="m-0 mt-2 text-[14.5px] text-alerta-texto">No se pudo guardar el cambio. Probá de nuevo.</p>}
        </section>
      )}

      {esFamilia && <Eliminar uid={uid} />}

      {/* Historial */}
      <section className="grid gap-3">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">Constancias</p>
          <h2 className="m-0 mt-0.5 font-serif font-normal text-[24px] leading-tight">Historial</h2>
        </div>
        <details className="rounded-[20px] border border-borde bg-white px-4 py-3 group">
          <summary className="cursor-pointer text-[15px] font-semibold text-tinta">Autorizaciones ({historial?.length ?? 0})</summary>
          {(historial ?? []).length === 0 ? (
            <p className="m-0 mt-2 text-[14.5px] text-tinta-suave">Todavía no hay registros.</p>
          ) : (
            <ul className="m-0 mt-2 p-0 list-none grid">
              {historial!.map((h) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-x-4 text-[14px] text-tinta-suave border-t border-borde-suave py-2">
                  <span>
                    <strong className="text-tinta font-semibold">{tituloDe(h.tipo)}</strong>: {h.otorgado ? "autorizado" : "no autorizado"}
                  </span>
                  <span className="text-tinta-tenue">{fecha(h.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
        {(solicitudes ?? []).length > 0 && (
          <details className="rounded-[20px] border border-borde bg-white px-4 py-3">
            <summary className="cursor-pointer text-[15px] font-semibold text-tinta">Lo que pediste ({solicitudes!.length})</summary>
            <ul className="m-0 mt-2 p-0 list-none grid">
              {solicitudes!.map((s) => (
                <li key={s.id} className="border-t border-borde-suave py-2 text-[14px] text-tinta-suave">
                  <span className="flex flex-wrap justify-between gap-x-4">
                    <strong className="text-tinta font-semibold">
                      {SOLICITUD[s.tipo] ?? s.tipo} · {ESTADO[s.estado] ?? s.estado}
                    </strong>
                    <span className="text-tinta-tenue">{fecha(s.created_at)}</span>
                  </span>
                  {s.respuesta && <span className="block mt-0.5">{s.respuesta}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

function Eliminar({ uid }: { uid: string | null }) {
  const { data: programada } = useEliminacionProgramada(uid);
  const accion = useAccionEliminacion();
  const [abierto, setAbierto] = useState(false);
  const [entiendo, setEntiendo] = useState(false);

  if (programada) {
    return (
      <section className="rounded-[24px] bg-mostaza-vital/35 border border-mostaza-vital px-5 sm:px-6 py-5 grid gap-3">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6e521c]">Eliminación programada</p>
        <p className="m-0 font-serif text-[22px] leading-snug text-tinta">Tus datos se eliminan el {fechaLarga(programada)}</p>
        <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">Hasta ese día todo sigue igual. Si cambiaste de idea, cancelalo y no se borra nada.</p>
        <div>
          <button
            type="button"
            onClick={() => accion.mutate("cancelar")}
            disabled={accion.isPending}
            className="inline-flex items-center min-h-11 px-5 rounded-full border-0 bg-verde-profundo text-white text-[15px] font-semibold cursor-pointer hover:bg-tinta disabled:opacity-60 font-sans"
          >
            {accion.isPending ? "Cancelando…" : "Cancelar la eliminación"}
          </button>
        </div>
        {accion.isError && <p className="m-0 text-[14.5px] text-alerta-texto">{(accion.error as Error).message}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-borde bg-white px-5 sm:px-6 py-5 grid gap-3">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-alerta text-alerta-texto inline-flex items-center justify-center">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="m-0 font-serif text-[21px] leading-tight text-tinta">Eliminar mis datos y cerrar la cuenta</p>
          <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-tinta-suave">Se hace 7 días después de pedirlo, así tenés tiempo de arrepentirte.</p>
        </div>
      </div>
      {!abierto ? (
        <div>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="inline-flex items-center min-h-11 px-5 rounded-full border-[1.5px] border-alerta-borde bg-white text-alerta-texto text-[15px] font-semibold cursor-pointer hover:bg-alerta font-sans"
          >
            Quiero eliminar mis datos
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-2xl bg-alerta/60 px-4 py-3 text-[14px] leading-relaxed text-tinta">
              <p className="m-0 mb-1 font-semibold">Se borra</p>
              Tus conversaciones y lo que recuerdan Clara y el asistente, tu WhatsApp y los avisos. Se retiran los permisos opcionales y se cierra tu cuenta.
            </div>
            <div className="rounded-2xl bg-fondo-papel px-4 py-3 text-[14px] leading-relaxed text-tinta">
              <p className="m-0 mb-1 font-semibold">Se conserva</p>
              El expediente de salud (cuestionario, planes, registros y notas del equipo), bloqueado el plazo que exige la ley; después se elimina.
            </div>
          </div>
          <p className="m-0 text-[14px] text-tinta-suave">
            Antes, podés{" "}
            <Link to="/app/mis-datos/informe" className="font-semibold text-verde-profundo">
              guardar una copia de tus datos
            </Link>
            .
          </p>
          <label className="flex items-start gap-2.5 text-[14.5px] text-tinta">
            <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} className="mt-1 w-4 h-4 accent-[#8c3f2a]" />
            Entiendo que, pasados los 7 días, no se puede deshacer.
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => accion.mutate("programar")}
              disabled={!entiendo || accion.isPending}
              className="inline-flex items-center min-h-11 px-5 rounded-full border-0 bg-alerta-texto text-white text-[15px] font-semibold cursor-pointer disabled:opacity-50 font-sans"
            >
              {accion.isPending ? "Programando…" : "Programar la eliminación"}
            </button>
            <BotonSuave
              onClick={() => {
                setAbierto(false);
                setEntiendo(false);
              }}
            >
              Mejor no
            </BotonSuave>
          </div>
          {accion.isError && <p className="m-0 text-[14.5px] text-alerta-texto">{(accion.error as Error).message}</p>}
        </div>
      )}
    </section>
  );
}

function Tarjeta({ icono, titulo, texto, children }: { icono: ReactNode; titulo: string; texto: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-beige-serenidad/55 px-5 py-5 grid gap-3 content-start">
      <div aria-hidden="true" className="absolute -right-10 -top-12 w-28 h-28 rounded-full bg-mostaza-vital/30" />
      <span aria-hidden="true" className="relative w-10 h-10 rounded-full bg-verde-profundo text-mostaza-vital inline-flex items-center justify-center">
        {icono}
      </span>
      <div className="relative">
        <p className="m-0 font-serif text-[21px] leading-tight text-tinta">{titulo}</p>
        <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-tinta-suave">{texto}</p>
      </div>
      <div className="relative grid gap-2.5 justify-items-start">{children}</div>
    </section>
  );
}

function BotonSuave({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center min-h-11 px-4.5 rounded-full border-[1.5px] border-borde bg-white text-tinta text-[14.5px] font-semibold cursor-pointer hover:border-verde-serenidad font-sans"
    >
      {children}
    </button>
  );
}

function IconoDoc() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function IconoLapiz() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}
