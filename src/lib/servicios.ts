import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

// Qué servicios con costo tiene encendidos la administración
// (Administración → Gastos → Servicios). La app de las familias solo
// necesita saber si Clara está disponible y qué voz se usa.
export interface ServiciosActivos {
  clara: boolean;
  voz: "elevenlabs" | "dispositivo";
  ia_clinica: boolean;
}

const POR_DEFECTO: ServiciosActivos = { clara: true, voz: "elevenlabs", ia_clinica: true };

export function useServiciosActivos() {
  const q = useQuery({
    queryKey: ["servicios-activos"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("servicios_activos");
      if (error) throw error;
      return { ...POR_DEFECTO, ...((data ?? {}) as Partial<ServiciosActivos>) };
    },
  });
  return { servicios: q.data ?? POR_DEFECTO, cargando: q.isLoading };
}
