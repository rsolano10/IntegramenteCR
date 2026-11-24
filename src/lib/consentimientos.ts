import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";
import { VERSION_LEGAL } from "./versionLegal";

// Consentimientos (Ley 8968). Cada decisión queda en public.consentimientos
// con la versión y el texto exacto que se mostró: es la prueba. Cambiar un
// texto obligatorio o la política implica subir VERSION_LEGAL, y todas las
// cuentas vuelven a aceptar al entrar (RouteGuard → /app/consentimiento).
//
// El texto se guarda tal cual; por eso cada texto es una función del rol y
// no se arma con JSX.

export { VERSION_LEGAL, FECHA_LEGAL } from "./versionLegal";

export type TipoConsentimiento =
  | "terminos"
  | "datos_salud"
  | "proveedores"
  | "rol_familiar"
  | "confidencialidad"
  | "ia_clara"
  | "ia_equipo"
  | "voz"
  | "whatsapp";

export type RolCuenta = "familiar" | "paciente" | "profesional";

export interface DefConsentimiento {
  tipo: TipoConsentimiento;
  titulo: string;
  obligatorio: boolean;
  roles: RolCuenta[];
  texto: (rol: RolCuenta) => string;
}

const deQuien = (rol: RolCuenta) => (rol === "paciente" ? "mis datos" : "mis datos y los de la persona participante");

export const CONSENTIMIENTOS: DefConsentimiento[] = [
  {
    tipo: "terminos",
    titulo: "Condiciones y privacidad",
    obligatorio: true,
    roles: ["familiar", "paciente", "profesional"],
    texto: () =>
      "Leí y acepto las Condiciones de uso y la Política de privacidad de IntegraMente en Casa. Entiendo que es un programa de estimulación con acompañamiento profesional, que no es un diagnóstico, que no reemplaza la atención médica y que ante una urgencia debo llamar al 9-1-1.",
  },
  {
    tipo: "datos_salud",
    titulo: "Datos de salud",
    obligatorio: true,
    roles: ["familiar", "paciente"],
    texto: (rol) =>
      `Autorizo de forma expresa que IntegraMente trate ${deQuien(rol)}, incluidos los datos de salud (memoria, ánimo, movilidad, alimentación, autonomía y registros de las actividades), para armar y ajustar el plan semanal, dar seguimiento y compartirlos con el equipo profesional que acompaña el caso, bajo secreto profesional. Sé que dar datos sensibles no es obligatorio y que puedo revocar esta autorización.`,
  },
  {
    tipo: "proveedores",
    titulo: "Proveedores fuera de Costa Rica",
    obligatorio: true,
    roles: ["familiar", "paciente"],
    texto: () =>
      "Autorizo que mis datos se guarden y procesen con los proveedores tecnológicos que hacen funcionar el servicio, ubicados fuera de Costa Rica: Supabase (base de datos y archivos, Estados Unidos), Vercel (sitio web, Estados Unidos) y Resend (correos, Estados Unidos). Estos proveedores solo pueden usarlos para prestar el servicio.",
  },
  {
    tipo: "rol_familiar",
    titulo: "Tu rol como familiar",
    obligatorio: true,
    roles: ["familiar"],
    texto: () =>
      "Declaro que soy familiar o persona cuidadora de la persona participante, que le conté sobre el programa en palabras sencillas y que participa con su acuerdo, o que la represento o apoyo legalmente en estas decisiones. Me comprometo a que la información que ingreso sea veraz y a respetar su voluntad si decide no participar.",
  },
  {
    tipo: "confidencialidad",
    titulo: "Confidencialidad profesional",
    obligatorio: true,
    roles: ["profesional"],
    texto: () =>
      "Me comprometo a usar la información de las personas participantes y sus familias solo para la atención dentro del programa, bajo secreto profesional; a no copiarla ni compartirla fuera de la plataforma; a no compartir mi acceso; a validar todo lo que genere la inteligencia artificial antes de usarlo; y a avisar de inmediato a la administración ante cualquier acceso indebido o pérdida de datos.",
  },
  {
    tipo: "ia_clara",
    titulo: "Clara, la asistente con inteligencia artificial",
    obligatorio: false,
    roles: ["familiar", "paciente"],
    texto: () =>
      "Quiero usar a Clara, una asistente de inteligencia artificial (no una persona) que responde por texto y por voz. Para ayudarme usa mi nombre, la actividad que estoy haciendo y un resumen de conversaciones anteriores. Las conversaciones se procesan con ElevenLabs (Estados Unidos), solo para prestar este servicio. Clara no da diagnósticos ni indica medicamentos.",
  },
  {
    tipo: "ia_equipo",
    titulo: "Inteligencia artificial para el equipo",
    obligatorio: false,
    roles: ["familiar", "paciente"],
    texto: () =>
      "Autorizo que el equipo use herramientas de inteligencia artificial (Google Gemini, Estados Unidos) para preparar el resumen del cuestionario, el panorama del caso y ajustes del plan semanal. Se envían los datos mínimos necesarios, nunca números de identificación, y siempre una persona del equipo revisa y decide. Sin esta autorización el equipo hace ese trabajo sin IA.",
  },
  {
    tipo: "voz",
    titulo: "Voz natural para leer las actividades",
    obligatorio: false,
    roles: ["familiar", "paciente"],
    texto: () =>
      "Quiero que las consignas de las actividades se lean con una voz natural generada por ElevenLabs (Estados Unidos). Se envía solo el texto que se va a leer. Sin esta autorización se usa la voz del teléfono o la computadora.",
  },
  {
    tipo: "whatsapp",
    titulo: "Recordatorios por WhatsApp",
    obligatorio: false,
    roles: ["familiar", "paciente"],
    texto: () =>
      "Quiero recibir recordatorios de las actividades y avisos del programa por WhatsApp, enviados mediante la plataforma de Meta (Estados Unidos). Los mensajes incluyen el nombre de la persona participante y el de la actividad. Puedo dejar de recibirlos cuando quiera.",
  },
];

export function consentimientosDeRol(rol: RolCuenta) {
  return CONSENTIMIENTOS.filter((c) => c.roles.includes(rol));
}

export interface ConsentimientoGuardado {
  tipo: TipoConsentimiento;
  otorgado: boolean;
  version: string;
  created_at: string;
}

export function useMisConsentimientos(enabled = true) {
  const session = useSession();
  const uid = session.status === "authed" ? session.session.user.id : null;
  return useQuery({
    // Por cuenta: en un navegador compartido no se mezclan los permisos.
    queryKey: ["mis-consentimientos", uid],
    enabled: enabled && !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("mis_consentimientos");
      if (error) throw error;
      return (data ?? []) as ConsentimientoGuardado[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ¿Faltan obligatorios de la versión vigente?
export function faltaAceptar(rol: RolCuenta, guardados: ConsentimientoGuardado[]) {
  return consentimientosDeRol(rol)
    .filter((c) => c.obligatorio)
    .some((c) => {
      const g = guardados.find((x) => x.tipo === c.tipo);
      return !g || !g.otorgado || g.version !== VERSION_LEGAL;
    });
}

// Un permiso opcional vigente (Clara, voz, WhatsApp, IA del equipo).
export function usePermiso(tipo: TipoConsentimiento) {
  const { data, isPending } = useMisConsentimientos();
  return { permitido: !!data?.find((c) => c.tipo === tipo)?.otorgado, cargando: isPending };
}

export function useRegistrarConsentimientos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rol, decisiones }: { rol: RolCuenta; decisiones: Partial<Record<TipoConsentimiento, boolean>> }) => {
      const items = consentimientosDeRol(rol)
        .filter((c) => c.tipo in decisiones)
        .map((c) => ({ tipo: c.tipo, otorgado: !!decisiones[c.tipo], texto: c.texto(rol) }));
      const { error } = await supabase.rpc("registrar_consentimientos", {
        p_version: VERSION_LEGAL,
        p_items: items,
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-consentimientos"] });
      qc.invalidateQueries({ queryKey: ["clara-session"] });
    },
  });
}
