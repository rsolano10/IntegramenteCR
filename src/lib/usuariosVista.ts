// Ayudas de la página de Usuarios (sin componentes).
import type { ManagedAccount } from "./adminAccounts";

export function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}


// Estado de la cuenta de un familiar: confirmada (anillo verde), sin
// confirmar (mostaza) o desactivada (gris).
export type EstadoFamiliar = "confirmada" | "pendiente" | "desactivada";
export function estadoFamiliar(acc: ManagedAccount | undefined): EstadoFamiliar {
  return !acc || !acc.is_active ? "desactivada" : acc.email_confirmed_at ? "confirmada" : "pendiente";
}
export const textoEstadoFamiliar: Record<EstadoFamiliar, string> = { confirmada: "Cuenta confirmada", pendiente: "Sin confirmar el correo", desactivada: "Cuenta desactivada" };
