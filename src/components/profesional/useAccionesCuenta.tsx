import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { FilaCuenta } from "../../lib/cuentas";
import type { EstadoCuenta } from "../../lib/useMyPatient";
import { waLink } from "../../lib/whatsapp";
import type { RowMenuItem } from "../ui/RowMenu";
import { HistorialModal } from "./CuentaSeguimiento";

const PAGABLE: EstadoCuenta[] = ["en_demo", "demo_finalizada", "inactiva", "activa"];

// Acciones de la cuenta: la principal va como botón en la tarjeta, el resto
// en el menú ⋯ de la tarjeta.
export function useAccionesCuenta(onChanged: (message: string, isError?: boolean) => void) {
  const queryClient = useQueryClient();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [historial, setHistorial] = useState<FilaCuenta | null>(null);

  async function correr(f: FilaCuenta, fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setOcupado(f.patient_id);
    const { error } = await fn();
    setOcupado(null);
    if (error) onChanged(error.message, true);
    else onChanged(ok);
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  const aprobar = (f: FilaCuenta) => {
    if (!window.confirm(`¿Aprobar la cuenta de ${f.paciente_nombre ?? f.nombre}? Empieza su semana gratis y recibe los recursos de bienvenida.`)) return;
    correr(f, () => supabase.rpc("aprobar_cuenta", { p_patient_id: f.patient_id }), "Cuenta aprobada: empezó la semana gratis.");
  };
  const pagar = (f: FilaCuenta, pagada: boolean) => {
    const nota = pagada ? window.prompt("Nota del pago (opcional): plan, monto, comprobante…") : "";
    if (nota === null) return;
    correr(
      f,
      () => supabase.rpc("marcar_cuenta_pagada", { p_patient_id: f.patient_id, p_pagada: pagada, p_nota: nota || null }),
      pagada ? "Cuenta marcada como pagada: quedó activa." : "Se quitó el pago.",
    );
  };
  const contacto = (f: FilaCuenta) => {
    if (f.requiere_contacto) {
      correr(f, () => supabase.rpc("marcar_requiere_contacto", { p_patient_id: f.patient_id, p_valor: false }), "Contacto resuelto.");
      return;
    }
    const nota = window.prompt("¿Qué hay que aclarar con la familia?");
    if (nota === null) return;
    correr(f, () => supabase.rpc("marcar_requiere_contacto", { p_patient_id: f.patient_id, p_valor: true, p_nota: nota }), "Marcada como «requiere contacto».");
  };
  const rechazar = (f: FilaCuenta) => {
    const motivo = window.prompt("Motivo del rechazo (lo ve la familia):");
    if (!motivo?.trim()) return;
    correr(f, () => supabase.rpc("rechazar_cuenta", { p_patient_id: f.patient_id, p_motivo: motivo }), "Cuenta rechazada.");
  };

  function menu(f: FilaCuenta | undefined): RowMenuItem[] {
    if (!f) return [];
    const pagable = PAGABLE.includes(f.estado!);
    return [
      { label: "Marcar pagada", hidden: !pagable || !!f.pagada_desde, onClick: () => pagar(f, true) },
      { label: "Quitar pago", hidden: !pagable || !f.pagada_desde, onClick: () => pagar(f, false) },
      { label: f.requiere_contacto ? "Contacto resuelto" : "Requiere contacto", hidden: f.estado !== "pendiente_aprobacion", onClick: () => contacto(f) },
      {
        label: "Escribir por WhatsApp",
        hidden: !f.telefono,
        onClick: () => window.open(waLink(f.telefono!, `Hola ${f.nombre.split(" ")[0]}, te escribimos de IntegraMente en Casa.`), "_blank", "noopener"),
      },
      { label: "Historial de la cuenta", onClick: () => setHistorial(f) },
      { label: "Rechazar cuenta", danger: true, hidden: f.estado !== "pendiente_aprobacion", onClick: () => rechazar(f) },
    ];
  }

  const modalHistorial = historial ? <HistorialModal fila={historial} onClose={() => setHistorial(null)} /> : null;
  return { ocupado, aprobar, pagar, menu, modalHistorial };
}

