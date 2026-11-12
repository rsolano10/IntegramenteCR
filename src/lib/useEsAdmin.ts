import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

// ¿La cuenta es el administrador del sistema? (profiles.es_admin, que nadie
// puede darse a sí mismo). Todo el equipo comparte los permisos clínicos; el
// administrador además ve las métricas generales del programa.
export function useEsAdmin(): boolean {
  const session = useSession();
  const profesional = session.status === "authed" && session.profile.role === "profesional";
  const { data } = useQuery({
    queryKey: ["es-admin", session.status === "authed" ? session.session.user.id : null],
    enabled: profesional,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("es_admin");
      if (error) return false;
      return data === true;
    },
  });
  return profesional && data === true;
}

// Ids de las cuentas administradoras (para marcarlas en el equipo).
export function useIdsAdministradores(): Set<string> {
  const { data } = useQuery({
    queryKey: ["ids-administradores"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ids_administradores");
      if (error) return [] as string[];
      return (data ?? []) as string[];
    },
  });
  return new Set(data ?? []);
}
