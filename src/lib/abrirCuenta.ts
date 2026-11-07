// Abrir una ventana del menú de la cuenta (Mi cuenta, Calendario en tu
// teléfono, Contactanos) desde cualquier parte de la app, por ejemplo desde
// un botón en una respuesta de Clara. El encabezado (AppHeader) escucha.
export type VentanaCuenta = "mi-perfil" | "calendario" | "contacto";
export const EVENTO_ABRIR_CUENTA = "abrir-ventana-cuenta";

export function abrirVentanaCuenta(v: VentanaCuenta) {
  window.dispatchEvent(new CustomEvent<VentanaCuenta>(EVENTO_ABRIR_CUENTA, { detail: v }));
}
