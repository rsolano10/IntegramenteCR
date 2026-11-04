// Capa de pagos (Fase 3.1). Por ahora las ventas son por WhatsApp: el
// "proveedor" arma un enlace wa.me con el mensaje ya escrito (nombre y
// plan de interés) y la clínica marca la cuenta como pagada desde su panel
// (Seguimiento → marcar_cuenta_pagada).
//
// Para conectar una pasarela después: implementar PaymentProvider (crear
// el checkout y devolver la URL a la que redirigir), y cambiar
// `proveedorDePagos`. La activación debería llegar por un webhook de la
// pasarela que llame a la misma lógica que marcar_cuenta_pagada.
import { WHATSAPP_EQUIPO, waLink } from "./whatsapp";
import type { ProgramaId } from "./programasData";
import { programas } from "./programasData";

export interface SolicitudCompra {
  nombreCuenta: string;
  nombrePaciente?: string;
  programa: ProgramaId;
}

export interface InicioCompra {
  // A dónde mandar a la persona (chat de WhatsApp, checkout de la pasarela…).
  url: string;
  // true = se abre afuera (otra pestaña / app).
  externo: boolean;
}

export interface PaymentProvider {
  id: string;
  iniciarCompra(s: SolicitudCompra): Promise<InicioCompra>;
}

export function mensajeCompra(s: SolicitudCompra): string {
  const plan = programas.find((p) => p.id === s.programa)?.nombre ?? s.programa;
  const para = s.nombrePaciente && s.nombrePaciente !== s.nombreCuenta ? ` para ${s.nombrePaciente}` : "";
  return `Hola, soy ${s.nombreCuenta}. Quiero activar el programa ${plan}${para} en IntegraMente en Casa.`;
}

export const whatsappProvider: PaymentProvider = {
  id: "whatsapp",
  async iniciarCompra(s) {
    return { url: waLink(WHATSAPP_EQUIPO, mensajeCompra(s)), externo: true };
  },
};

export const proveedorDePagos: PaymentProvider = whatsappProvider;

export async function iniciarCompra(s: SolicitudCompra) {
  const r = await proveedorDePagos.iniciarCompra(s);
  if (r.externo) window.open(r.url, "_blank", "noopener,noreferrer");
  else window.location.assign(r.url);
}
