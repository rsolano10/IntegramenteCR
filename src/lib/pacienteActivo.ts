import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

// Un familiar puede acompañar a más de una persona. El «familiar activo» es
// la persona con la que está trabajando ahora: toda la app de la familia
// (Hoy, Mi semana, el resumen, los avisos) muestra la suya. Se recuerda por
// cuenta en este dispositivo.
const clave = (uid: string) => `paciente-activo:${uid}`;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

export function leerPacienteActivo(uid: string | null): string | null {
  if (!uid) return null;
  try {
    return localStorage.getItem(clave(uid));
  } catch {
    return null;
  }
}

export function elegirPacienteActivo(uid: string, patientId: string | null) {
  try {
    if (patientId) localStorage.setItem(clave(uid), patientId);
    else localStorage.removeItem(clave(uid));
  } catch {
    // Sin almacenamiento: vale hasta recargar.
  }
  memoria.set(uid, patientId);
  avisar();
}

const memoria = new Map<string, string | null>();

export function usePacienteActivoId(): string | null {
  const session = useSession();
  const uid = session.status === "authed" ? session.session.user.id : null;
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => (uid ? (memoria.has(uid) ? memoria.get(uid)! : leerPacienteActivo(uid)) : null),
  );
}

// «Agregar otro familiar»: el cuestionario crea un paciente nuevo en vez de
// editar el actual. Vale para esta pestaña del navegador.
const CLAVE_NUEVO = "agregando-familiar";
export function empezarNuevoFamiliar() {
  try {
    sessionStorage.setItem(CLAVE_NUEVO, "1");
  } catch {
    // nada
  }
}
export function terminarNuevoFamiliar() {
  try {
    sessionStorage.removeItem(CLAVE_NUEVO);
  } catch {
    // nada
  }
}
export function agregandoFamiliar(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_NUEVO) === "1";
  } catch {
    return false;
  }
}

export interface PacienteDeCuenta {
  id: string;
  nombre: string;
  relation: "familiar_admin" | "participante";
  estado_cuenta: string | null;
  plan_status: string;
}

// Todas las personas que acompaña la cuenta.
export function useMisPacientes() {
  const session = useSession();
  const uid = session.status === "authed" ? session.session.user.id : null;
  const rol = session.status === "authed" ? session.profile.role : null;
  return useQuery({
    queryKey: ["my-patients", uid],
    enabled: !!uid && (rol === "familiar" || rol === "paciente"),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_patients");
      if (error) throw error;
      return (data ?? []) as PacienteDeCuenta[];
    },
  });
}
