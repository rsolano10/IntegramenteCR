// Control de servicios (Administración → Gastos): qué está encendido.
// Cada función lo consulta antes de gastar. Si la fila no se puede leer, todo
// queda encendido (es preferible no cortar un servicio por un error de lectura).
import { createClient } from "npm:@supabase/supabase-js@2";

export interface ControlServicios {
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

const POR_DEFECTO: ControlServicios = {
  wa_activo: true,
  wa_manana: true,
  wa_tarde: true,
  wa_noche: true,
  wa_semana: true,
  wa_tope_diario: 3,
  correos_activo: true,
  ia_clinica: true,
  ia_familia: true,
  voz_proveedor: "elevenlabs",
  clara_activa: true,
};

export async function controlServicios(): Promise<ControlServicios> {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await admin.from("control_servicios").select("*").eq("id", 1).maybeSingle();
    return data ? { ...POR_DEFECTO, ...(data as Partial<ControlServicios>) } : POR_DEFECTO;
  } catch {
    return POR_DEFECTO;
  }
}
