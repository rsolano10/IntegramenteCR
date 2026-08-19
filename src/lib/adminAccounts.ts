import { supabase } from "./supabase";

export type AppRole = "familiar" | "paciente" | "profesional";

export interface AccountLink {
  patient_id: string;
  patient_nombre: string;
  relation: "familiar_admin" | "participante";
}

export interface ManagedAccount {
  id: string;
  email: string;
  nombre: string;
  role: AppRole;
  especialidad: string | null;
  email_confirmed_at: string | null;
  invited_at: string | null;
  created_at: string;
  links: AccountLink[];
}

export const roleLabel: Record<AppRole, string> = {
  familiar: "Familiar",
  paciente: "Participante",
  profesional: "Clínica",
};

export const roleBadgeClass: Record<AppRole, string> = {
  familiar: "bg-verde-serenidad/15 text-verde-profundo",
  paciente: "bg-[#e7edf3] text-[#3b4c51]",
  profesional: "bg-tinta text-white",
};

export const relationLabel: Record<string, string> = {
  familiar_admin: "Familiar administrador",
  participante: "Participante",
};

// Privileged account actions (invite/resend/update_email/update_role/
// delete_user) all funnel through this one edge function, the only place
// the service-role key is used.
export async function callAdminAccounts(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-accounts", { body: { action, ...payload } });
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
