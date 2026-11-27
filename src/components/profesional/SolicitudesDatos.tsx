import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEsAdmin } from "../../lib/useEsAdmin";
import { Caja, CajaAviso, CajaCuerpo } from "./Caja";

// Solicitudes de derechos (Ley 8968). Desde 2026-11-28 las familias las
// resuelven solas en Mis datos y permisos (informe al instante, eliminación
// programada a 7 días que se ejecuta sola): acá quedan como constancia, sin
// nada que contestar. Las manuales anteriores (sin «automatica») siguen
// resolviéndose con resolver_solicitud_datos.

interface Solicitud {
  id: string;
  nombre: string | null;
  tipo: "acceso" | "rectificacion" | "eliminacion" | "oposicion";
  detalle: string | null;
  estado: string;
  respuesta: string | null;
  vence_el: string;
  created_at: string;
  automatica: boolean;
  ejecutar_el: string | null;
}

const TIPO: Record<Solicitud["tipo"], string> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  eliminacion: "Eliminación",
  oposicion: "Oposición",
};

const fecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

export function SolicitudesDatos() {
  const esAdmin = useEsAdmin();
  const { data } = useQuery({
    queryKey: ["solicitudes-datos"],
    enabled: esAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("solicitudes_datos").select("id, nombre, tipo, detalle, estado, respuesta, vence_el, created_at, automatica, ejecutar_el").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Solicitud[];
    },
  });
  const [aviso, setAviso] = useState<string | null>(null);
  if (!esAdmin || !data || data.length === 0) return null;
  const pendientes = data.filter((s) => s.estado === "pendiente" && !s.automatica);

  return (
    <Caja
      nivel={2}
      eyebrow="Ley 8968"
      titulo="Solicitudes sobre datos personales"
      descripcion="Las familias las resuelven solas desde Mis datos y permisos; acá queda la constancia. Solo las manuales anteriores necesitan respuesta (5 días hábiles)."
      acciones={pendientes.length > 0 ? <span className="text-[14px] font-semibold text-alerta-texto">{pendientes.length} en trámite</span> : undefined}
    >
      {aviso && <CajaAviso texto={aviso} onCerrar={() => setAviso(null)} />}
      <CajaCuerpo>
        <ul className="m-0 p-0 list-none grid gap-3">
          {data.map((s) => (
            <Fila key={s.id} s={s} onListo={setAviso} />
          ))}
        </ul>
      </CajaCuerpo>
    </Caja>
  );
}

function Fila({ s, onListo }: { s: Solicitud; onListo: (t: string) => void }) {
  const qc = useQueryClient();
  const [respuesta, setRespuesta] = useState("");
  const [borrar, setBorrar] = useState(false);
  const vencida = s.estado === "pendiente" && new Date(`${s.vence_el}T23:59:59`) < new Date();
  const resolver = useMutation({
    mutationFn: async (estado: "resuelta" | "rechazada") => {
      const { error } = await supabase.rpc("resolver_solicitud_datos", { p_id: s.id, p_estado: estado, p_respuesta: respuesta, p_borrar: borrar });
      if (error) throw error;
    },
    onSuccess: () => {
      onListo("Solicitud resuelta. La persona ve la respuesta en Mis datos y permisos.");
      qc.invalidateQueries({ queryKey: ["solicitudes-datos"] });
    },
  });

  if (s.automatica) {
    return (
      <li className="rounded-2xl border border-borde bg-white px-4 py-3 grid gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="m-0 text-[15px] font-semibold text-tinta">
            {TIPO[s.tipo]} · {s.nombre ?? "Cuenta"} <span className="ml-1 rounded-full bg-verde-tenue px-2 py-0.5 text-[12px] font-semibold text-verde-profundo">Automática</span>
          </p>
          <p className="m-0 text-[13.5px] text-tinta-tenue">
            {s.estado === "pendiente" && s.ejecutar_el ? `Se ejecuta sola el ${fecha(s.ejecutar_el)}` : s.estado === "cancelada" ? "Cancelada por la persona" : "Hecha"} · {fecha(s.created_at)}
          </p>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-borde bg-white px-4 py-3.5 grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[15.5px] font-semibold text-tinta">
          {TIPO[s.tipo]} · {s.nombre ?? "Cuenta"}
        </p>
        <p className={`m-0 text-[13.5px] ${vencida ? "text-alerta-texto font-semibold" : "text-tinta-tenue"}`}>
          {s.estado === "pendiente" ? `${vencida ? "Venció" : "Vence"} el ${fecha(s.vence_el)}` : s.estado === "resuelta" ? "Resuelta" : "No procede"} · recibida el {fecha(s.created_at)}
        </p>
      </div>
      {s.detalle && <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave whitespace-pre-wrap">{s.detalle}</p>}
      {s.estado !== "pendiente" ? (
        s.respuesta && <p className="m-0 text-[14px] text-tinta-tenue">Respuesta: {s.respuesta}</p>
      ) : (
        <div className="grid gap-2">
          <textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            rows={2}
            placeholder="Respuesta para la persona (la ve en la app)"
            className="px-3 py-2.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta"
          />
          {(s.tipo === "eliminacion" || s.tipo === "oposicion") && (
            <label className="flex items-start gap-2 text-[14px] text-tinta-suave">
              <input type="checkbox" checked={borrar} onChange={(e) => setBorrar(e.target.checked)} className="mt-1" />
              <span>
                Borrar lo no clínico de la cuenta: conversaciones y memoria de Clara y del asistente, avisos de WhatsApp, borradores y teléfono. También se retiran los permisos opcionales (Clara, IA para el equipo, voz natural y WhatsApp). Para cerrar la cuenta, desactivala desde Cuentas.
              </span>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!respuesta.trim() || resolver.isPending}
              onClick={() => resolver.mutate("resuelta")}
              className="min-h-10 px-4 rounded-full border-0 bg-verde-profundo text-white text-[14px] font-semibold cursor-pointer disabled:opacity-50"
            >
              Marcar como resuelta
            </button>
            <button
              type="button"
              disabled={!respuesta.trim() || resolver.isPending}
              onClick={() => resolver.mutate("rechazada")}
              className="min-h-10 px-4 rounded-full border-[1.5px] border-borde bg-white text-tinta text-[14px] font-semibold cursor-pointer disabled:opacity-50"
            >
              No procede
            </button>
          </div>
          {resolver.isError && <p className="m-0 text-[14px] text-alerta-texto">{(resolver.error as Error).message}</p>}
        </div>
      )}
    </li>
  );
}
