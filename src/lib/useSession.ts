import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AppRole = "familiar" | "paciente" | "profesional";

export interface SessionProfile {
  role: AppRole;
  nombre: string;
  especialidad: string | null;
}

export type SessionState =
  | { status: "loading"; session: null; profile: null }
  | { status: "anon"; session: null; profile: null }
  | { status: "authed"; session: Session; profile: SessionProfile };

const LOADING: SessionState = { status: "loading", session: null, profile: null };
const ANON: SessionState = { status: "anon", session: null, profile: null };

// Single source of truth for "who's signed in and what's their role" —
// wraps supabase.auth so every screen reads the same live session instead
// of each page re-deriving it. Replaces the old store.role/loginAs, which
// only ever simulated a role by guessing from the email prefix.
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(LOADING);

  useEffect(() => {
    let cancelled = false;

    async function resolve(session: Session | null) {
      if (!session) {
        if (!cancelled) setState(ANON);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("role, nombre, especialidad")
        .eq("id", session.user.id)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setState(ANON);
        return;
      }
      setState({ status: "authed", session, profile: data as SessionProfile });
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => resolve(session));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function roleHome(role: AppRole): string {
  if (role === "familiar") return "/app/hoy";
  if (role === "paciente") return "/app/participante/gustos";
  return "/app/profesional/panel";
}
