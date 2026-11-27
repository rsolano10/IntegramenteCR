import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { CheckRow } from "../components/ui/CheckRow";
import { Button } from "../components/ui/Button";
import { BotonVolver } from "../components/ui/BotonVolver";
import { useMiReferidor } from "../lib/referidos";
import { CONSENTIMIENTOS, consentimientosDeRol, useMisConsentimientos, useRegistrarConsentimientos, type RolCuenta } from "../lib/consentimientos";

// Mis datos y permisos: los derechos de la Ley 8968 en un solo lugar.
//   - Permisos opcionales (Clara, IA del equipo, voz, WhatsApp): se
//     guardan al tocar, cada cambio queda en el historial.
//   - Descargar mis datos (JSON, exportar_mis_datos).
//   - Solicitudes de acceso, rectificación, eliminación u oposición, con
//     respuesta en 5 días hábiles (solicitar_derecho).
//   - Historial de consentimientos.

type TipoSolicitud = "acceso" | "rectificacion" | "eliminacion" | "oposicion";

const SOLICITUDES: { tipo: TipoSolicitud; titulo: string; ayuda: string }[] = [
  { tipo: "acceso", titulo: "Ver todo lo que tienen sobre mí", ayuda: "Incluye el expediente que lleva el equipo, que no aparece en la descarga." },
  { tipo: "rectificacion", titulo: "Corregir un dato", ayuda: "Contanos qué dato está mal y cuál es el correcto." },
  { tipo: "eliminacion", titulo: "Eliminar mis datos", ayuda: "Borramos lo que no es parte del expediente de salud y cerramos la cuenta si lo pedís. El expediente se conserva el plazo que exige la ley." },
  { tipo: "oposicion", titulo: "Oponerme a un uso", ayuda: "Contanos qué uso de tus datos no querés que hagamos." },
];

const ESTADO: Record<string, string> = { pendiente: "En trámite", resuelta: "Resuelta", rechazada: "No procede" };

interface Solicitud {
  id: string;
  tipo: TipoSolicitud;
  detalle: string | null;
  estado: string;
  respuesta: string | null;
  vence_el: string;
  created_at: string;
}

interface Registro {
  id: string;
  tipo: string;
  otorgado: boolean;
  version: string;
  created_at: string;
}

const fecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });

export function MisDatos() {
  const session = useSession();
  const rol = (session.status === "authed" ? session.profile.role : null) as RolCuenta | null;
  const { data: referidor } = useMiReferidor(rol === "familiar" || rol === "paciente");
  const uid = session.status === "authed" ? session.session.user.id : null;
  const { data: guardados } = useMisConsentimientos(!!rol);
  const registrar = useRegistrarConsentimientos();
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);

  const { data: solicitudes } = useQuery({
    queryKey: ["mis-solicitudes-datos", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("solicitudes_datos").select("id, tipo, detalle, estado, respuesta, vence_el, created_at").eq("profile_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Solicitud[];
    },
  });
  const { data: historial } = useQuery({
    queryKey: ["historial-consentimientos", uid, guardados],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("consentimientos").select("id, tipo, otorgado, version, created_at").eq("profile_id", uid!).order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as Registro[];
    },
  });

  const descargar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("exportar_mis_datos");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `integramente-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const [tipo, setTipo] = useState<TipoSolicitud | null>(null);
  const [detalle, setDetalle] = useState("");
  const solicitar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("solicitar_derecho", { p_tipo: tipo, p_detalle: detalle });
      if (error) throw error;
    },
    onSuccess: () => {
      setTipo(null);
      setDetalle("");
      setAviso("Recibimos tu solicitud. Te respondemos en un máximo de 5 días hábiles.");
      qc.invalidateQueries({ queryKey: ["mis-solicitudes-datos"] });
    },
  });

  if (!rol) return null;
  const opcionales = consentimientosDeRol(rol, { conReferidor: !!referidor }).filter((c) => !c.obligatorio);
  const tituloDe = (t: string) => CONSENTIMIENTOS.find((c) => c.tipo === t)?.titulo ?? t;

  return (
    <div className="im-in max-w-[720px] mx-auto px-5 py-8 pb-20 sm:px-8 grid gap-10">
      <div>
        <BotonVolver respaldo="/app/login" />
        <h1 className="m-0 mt-4 mb-2 font-serif font-normal text-[30px] sm:text-[36px] leading-tight">Mis datos y permisos</h1>
        <p className="m-0 text-[16px] leading-relaxed text-tinta-suave">
          Acá decidís qué usos permitís, descargás tu información y ejercés tus derechos. Más detalle en la{" "}
          <Link to="/legal/privacidad" className="text-verde-profundo font-semibold">
            Política de privacidad
          </Link>
          .
        </p>
      </div>

      {aviso && (
        <p role="status" className="m-0 -mb-4 rounded-2xl bg-verde-tenue border border-verde-serenidad px-4 py-3 text-[15px] text-tinta">
          {aviso}
        </p>
      )}

      {opcionales.length > 0 && (
        <section>
          <h2 className="m-0 mb-1.5 font-serif font-normal text-[23px]">Permisos</h2>
          <p className="m-0 mb-3 text-[15px] text-tinta-suave">Se guardan al tocar. El programa sigue funcionando aunque los desactives.</p>
          <div className="grid gap-3">
            {opcionales.map((d) => {
              const activo = !!guardados?.find((g) => g.tipo === d.tipo)?.otorgado;
              return (
                <CheckRow
                  key={d.tipo}
                  checked={activo}
                  disabled={registrar.isPending}
                  onToggle={() =>
                    registrar.mutate(
                      { rol, decisiones: { [d.tipo]: !activo } },
                      { onSuccess: () => setAviso(`${d.titulo}: ${activo ? "desactivado" : "activado"}.`) },
                    )
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

      <section>
        <h2 className="m-0 mb-1.5 font-serif font-normal text-[23px]">Descargar mis datos</h2>
        <p className="m-0 mb-3 text-[15px] leading-relaxed text-tinta-suave">
          Un archivo con tu cuenta, tus permisos, el cuestionario, los planes y registros, los mensajes y las conversaciones con Clara.
        </p>
        <Button variant="secondary" onClick={() => descargar.mutate()} disabled={descargar.isPending}>
          {descargar.isPending ? "Preparando…" : "Descargar mis datos"}
        </Button>
        {descargar.isError && <p className="m-0 mt-2 text-[14.5px] text-alerta-texto">No pudimos preparar el archivo. Probá de nuevo.</p>}
      </section>

      <section>
        <h2 className="m-0 mb-1.5 font-serif font-normal text-[23px]">Tus derechos</h2>
        <p className="m-0 mb-3 text-[15px] leading-relaxed text-tinta-suave">
          Respondemos en un máximo de 5 días hábiles. También podés escribir a{" "}
          <a href="mailto:programas.integramente@gmail.com" className="text-verde-profundo font-semibold">
            programas.integramente@gmail.com
          </a>
          .
        </p>
        <div className="grid gap-2.5">
          {SOLICITUDES.map((s) => (
            <CheckRow key={s.tipo} checked={tipo === s.tipo} onToggle={() => setTipo(tipo === s.tipo ? null : s.tipo)}>
              <strong className="block mb-0.5 text-tinta">{s.titulo}</strong>
              <span className="text-[14.5px] text-tinta-suave">{s.ayuda}</span>
            </CheckRow>
          ))}
        </div>
        {tipo && (
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5 text-[15px] font-semibold text-tinta">
              Contanos más (opcional)
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                rows={3}
                maxLength={2000}
                className="px-3.5 py-3 rounded-2xl border-[1.5px] border-borde-campo bg-white font-sans text-[15.5px] text-tinta"
              />
            </label>
            <Button variant="principal" onClick={() => solicitar.mutate()} disabled={solicitar.isPending}>
              {solicitar.isPending ? "Enviando…" : "Enviar solicitud"}
            </Button>
            {solicitar.isError && (
              <p className="m-0 text-[14.5px] text-alerta-texto">
                {(solicitar.error as Error)?.message?.includes("en trámite") ? "Ya tenés una solicitud de este tipo en trámite." : "No pudimos enviarla. Probá de nuevo."}
              </p>
            )}
          </div>
        )}
        {(solicitudes ?? []).length > 0 && (
          <ul className="m-0 mt-5 p-0 list-none grid gap-2.5">
            {solicitudes!.map((s) => (
              <li key={s.id} className="rounded-2xl border border-borde bg-white px-4 py-3">
                <p className="m-0 text-[15px] font-semibold text-tinta">
                  {SOLICITUDES.find((x) => x.tipo === s.tipo)?.titulo} · {ESTADO[s.estado] ?? s.estado}
                </p>
                <p className="m-0 mt-0.5 text-[14px] text-tinta-tenue">
                  Enviada el {fecha(s.created_at)}
                  {s.estado === "pendiente" ? ` · respuesta a más tardar el ${fecha(s.vence_el)}` : ""}
                </p>
                {s.respuesta && <p className="m-0 mt-2 text-[15px] leading-relaxed text-tinta-suave">{s.respuesta}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="m-0 mb-3 font-serif font-normal text-[23px]">Historial de autorizaciones</h2>
        {(historial ?? []).length === 0 ? (
          <p className="m-0 text-[15px] text-tinta-suave">Todavía no hay registros.</p>
        ) : (
          <ul className="m-0 p-0 list-none grid gap-1.5">
            {historial!.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-x-4 text-[14.5px] text-tinta-suave border-b border-borde-suave py-2">
                <span>
                  <strong className="text-tinta font-semibold">{tituloDe(h.tipo)}</strong>: {h.otorgado ? "autorizado" : "no autorizado"}
                </span>
                <span className="text-tinta-tenue">{fecha(h.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
