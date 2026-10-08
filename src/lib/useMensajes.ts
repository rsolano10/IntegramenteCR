import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

export interface Mensaje {
  id: string;
  texto: string;
  autor_id: string | null;
  created_at: string;
}

// Shared by the Ayuda tab (the conversation) and the nav badge — same
// query key, so the badge never costs a second request.
export function useMensajes(patientId: string | undefined) {
  return useQuery({
    queryKey: ["mensajes", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("id, texto, autor_id, created_at")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Mensaje[];
    },
    enabled: !!patientId,
  });
}

// "Read" is per device (localStorage) — a convenience badge, not a receipt
// the clinic relies on.
const key = (patientId: string, userId: string) => `im-mensajes-leidos:${userId}:${patientId}`;
const listeners = new Set<() => void>();

function readMark(patientId: string, userId: string): number {
  try {
    return Number(localStorage.getItem(key(patientId, userId)) ?? 0);
  } catch {
    return 0;
  }
}

export function markMensajesLeidos(patientId: string, userId: string) {
  try {
    localStorage.setItem(key(patientId, userId), String(Date.now()));
  } catch {
    // storage blocked — the badge just stays until next visit
  }
  listeners.forEach((l) => l());
}

export function useUnreadMensajes(patientId: string | undefined): number {
  const session = useSession();
  const userId = session.status === "authed" ? session.session.user.id : null;
  const { data } = useMensajes(patientId);
  const [, bump] = useState(0);

  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (!patientId || !userId || !data) return 0;
  const since = readMark(patientId, userId);
  return data.filter((m) => m.autor_id !== userId && new Date(m.created_at).getTime() > since).length;
}
