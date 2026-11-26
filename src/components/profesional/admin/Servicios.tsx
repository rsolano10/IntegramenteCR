import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { PillToggle } from "../../ui/PillToggle";
import { Seccion } from "./Piezas";

// Servicios con costo: encender o apagar desde un solo lugar. Cada función
// del servidor consulta este control antes de gastar, así que apagar algo
// corta el gasto de inmediato.
interface Control {
  wa_activo: boolean;
  wa_manana: boolean;
  wa_tarde: boolean;
  wa_noche: boolean;
  wa_semana: boolean;
  wa_tope_diario: number;
  correos_activo: boolean;
  ia_clinica: boolean;
  ia_familia: boolean;
  voz_proveedor: "elevenlabs" | "dispositivo";
  clara_activa: boolean;
}
type Campo = keyof Control;

export interface CostoFuncion {
  servicio: string;
  funcion: string;
  usd: number;
  veces: number;
}

const IA_CLINICA = ["personalizar_semana", "seguimiento", "mensaje_semana"];

function Interruptor({ titulo, detalle, activo, onCambiar, disabled = false, costo, children }: { titulo: string; detalle: string; activo: boolean; onCambiar: (v: boolean) => void; disabled?: boolean; costo?: string; children?: ReactNode }) {
  return (
    <li className={`px-4 py-3.5 border-b border-borde-suave last:border-b-0 ${disabled ? "opacity-55" : ""}`}>
      <label className={`flex items-start justify-between gap-4 ${disabled ? "" : "cursor-pointer"}`}>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-tinta">
            {titulo}
            {!activo && <span className="ml-2 align-middle inline-block rounded-full bg-campo px-2 py-0.5 text-[12px] font-semibold text-tinta-suave">Apagado</span>}
          </span>
          <span className="block mt-0.5 text-[13.5px] leading-snug text-tinta-suave">{detalle}</span>
          {costo && <span className="block mt-1 text-[12.5px] text-tinta-tenue">{costo}</span>}
        </span>
        <span className="relative shrink-0 mt-0.5">
          <input type="checkbox" role="switch" checked={activo} disabled={disabled} onChange={(e) => onCambiar(e.target.checked)} className="peer sr-only" aria-label={titulo} />
          <span className="block w-11 h-6 rounded-full bg-borde-campo peer-checked:bg-verde-profundo transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-verde-serenidad/50" />
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
      {children}
    </li>
  );
}

export function Servicios({ detalle, tc, etiquetaMes, onAviso }: { detalle: CostoFuncion[]; tc: number; etiquetaMes: string; onAviso: (t: string, error?: boolean) => void }) {
  const qc = useQueryClient();
  const { data: c } = useQuery({
    queryKey: ["control-servicios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("control_servicios").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as Control;
    },
  });
  const cambiar = useMutation({
    mutationFn: async ({ campo, valor }: { campo: Campo; valor: boolean | number | string; texto: string }) => {
      const { error } = await supabase.rpc("actualizar_control_servicio", { p_campo: campo, p_valor: valor });
      if (error) throw error;
    },
    onMutate: ({ campo, valor }) => {
      qc.setQueryData<Control>(["control-servicios"], (x) => (x ? { ...x, [campo]: valor } : x));
    },
    onSuccess: (_d, { texto }) => {
      onAviso(texto);
      qc.invalidateQueries({ queryKey: ["servicios-activos"] });
    },
    onError: (e) => {
      onAviso((e as Error).message, true);
      qc.invalidateQueries({ queryKey: ["control-servicios"] });
    },
  });
  if (!c) return null;

  const costo = (filtro: (d: CostoFuncion) => boolean, unidad?: string) => {
    const xs = detalle.filter(filtro);
    const usd = xs.reduce((n, d) => n + Number(d.usd), 0);
    const veces = xs.reduce((n, d) => n + d.veces, 0);
    if (veces === 0) return `${etiquetaMes}: sin uso.`;
    const monto = usd > 0 ? `₡${Math.round(usd * tc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : "incluido en el plan";
    return `${etiquetaMes}: ${monto}${unidad ? ` · ${veces} ${unidad}` : ""}.`;
  };
  const set = (campo: Campo, valor: boolean | number | string, texto: string) => cambiar.mutate({ campo, valor, texto });
  const onOff = (campo: Campo, nombre: string) => (v: boolean) => set(campo, v, `${nombre}: ${v ? "encendido" : "apagado"}.`);
  const sub = "flex items-center justify-between gap-3 py-2 text-[14px] text-tinta";
  const mini = (campo: Campo, etiqueta: string, nombre: string) => (
    <label className={`${sub} ${c.wa_activo ? "cursor-pointer" : "opacity-55"}`}>
      <span>{etiqueta}</span>
      <input type="checkbox" checked={c[campo] as boolean} disabled={!c.wa_activo} onChange={(e) => onOff(campo, nombre)(e.target.checked)} className="w-5 h-5 accent-[#2f5d62] cursor-pointer" />
    </label>
  );

  return (
    <Seccion titulo="Servicios">
      <p className="m-0 text-[14px] leading-relaxed text-tinta-suave max-w-[66ch]">
        Lo que tiene costo, en un solo lugar. Al apagar algo se deja de usar de inmediato y la app sigue funcionando sin ese servicio.
      </p>
      <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden">
        <Interruptor
          titulo="WhatsApp a las familias"
          detalle="Recordatorios y avisos de semana nueva. Elegí qué mensajes salen y cuántos como máximo por día."
          activo={c.wa_activo}
          onCambiar={onOff("wa_activo", "WhatsApp")}
          costo={costo((d) => d.servicio === "whatsapp", "mensajes")}
        >
          <div className="mt-2 ml-0 sm:ml-1 grid sm:grid-cols-2 gap-x-8 border-t border-borde-suave pt-1">
            {mini("wa_manana", "Mañana, 8:00 a.m. (próxima actividad)", "WhatsApp de la mañana")}
            {mini("wa_tarde", "Tarde, 2:45 p.m. (próxima actividad)", "WhatsApp de la tarde")}
            {mini("wa_noche", "Noche anterior, 7:00 p.m. (qué preparar)", "WhatsApp de la noche")}
            {mini("wa_semana", "Aviso de semana nueva", "Aviso de semana nueva")}
            <label className={`${sub} ${c.wa_activo ? "" : "opacity-55"}`}>
              <span>Máximo por familia y por día</span>
              <select
                value={c.wa_tope_diario}
                disabled={!c.wa_activo}
                onChange={(e) => set("wa_tope_diario", Number(e.target.value), `WhatsApp: máximo ${e.target.value} ${e.target.value === "1" ? "mensaje" : "mensajes"} por día.`)}
                className="min-h-9 px-2 rounded-lg border-[1.5px] border-borde-campo bg-white font-sans text-[14px] text-tinta"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Interruptor>
        <Interruptor
          titulo="Correos a las familias"
          detalle="Semana publicada y respuesta a la solicitud. Los correos para entrar a la cuenta y los avisos de riesgo al equipo salen siempre."
          activo={c.correos_activo}
          onCambiar={onOff("correos_activo", "Correos a las familias")}
        />
        <Interruptor
          titulo="IA para la clínica"
          detalle="Personalizar la semana desde una plantilla, el panorama del caso y el mensaje para la familia. Apagada, el equipo arma todo a mano."
          activo={c.ia_clinica}
          onCambiar={onOff("ia_clinica", "IA para la clínica")}
          costo={costo((d) => d.servicio === "gemini" && IA_CLINICA.includes(d.funcion), "usos")}
        />
        <Interruptor
          titulo="IA para las familias"
          detalle="El resumen que recibe la familia al terminar el registro. Apagada, se usa un resumen armado sin IA."
          activo={c.ia_familia}
          onCambiar={onOff("ia_familia", "IA para las familias")}
          costo={costo((d) => d.servicio === "gemini" && !IA_CLINICA.includes(d.funcion), "usos")}
        />
        <Interruptor
          titulo="Clara"
          detalle="La asistente de las familias (chat y voz). Apagada, en Ayuda queda solo el contacto con el equipo por WhatsApp."
          activo={c.clara_activa}
          onCambiar={onOff("clara_activa", "Clara")}
          costo={costo((d) => d.funcion === "clara", "conversaciones")}
        />
        <li className="px-4 py-3.5">
          <span className="block text-[15px] font-semibold text-tinta">Voz que lee las actividades</span>
          <span className="block mt-0.5 mb-2.5 text-[13.5px] leading-snug text-tinta-suave">ElevenLabs suena más natural y usa créditos. La del teléfono o la computadora no tiene costo.</span>
          <PillToggle
            value={c.voz_proveedor}
            onChange={(v) => set("voz_proveedor", v, v === "elevenlabs" ? "Voz: ElevenLabs." : "Voz: la del teléfono o la computadora.")}
            options={[
              { value: "elevenlabs", label: "ElevenLabs" },
              { value: "dispositivo", label: "Voz del dispositivo" },
            ]}
          />
          <span className="block mt-2 text-[12.5px] text-tinta-tenue">{costo((d) => d.funcion === "voz", "lecturas")}</span>
        </li>
      </ul>
    </Seccion>
  );
}
