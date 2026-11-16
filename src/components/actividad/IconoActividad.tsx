import type { PlanTask } from "../../lib/mockData";
import { guionDe } from "../../lib/sesiones";
import { temaDeTarea } from "../../lib/modulos";
import { Icono } from "../sesion/Icono";
import { ModuloIcon } from "../ui/ModuloIcon";

// El dibujo de una actividad, el mismo afuera (Hoy, Mi semana) y adentro
// (el tablero de la actividad): el del guion si lo tiene (la sombrilla de
// «¿Qué necesitamos llevar?»), si no el del módulo. Va sobre el mismo fondo
// que el encabezado del tablero, para que se reconozca de un vistazo.

export function GlifoActividad({ task, className }: { task: Pick<PlanTask, "codigo" | "modulo">; className: string }) {
  const guion = guionDe(task.codigo);
  const tema = temaDeTarea(task);
  if (guion) return <Icono nombre={guion.icono} className={`${className} text-tinta`} relleno={`${tema.to}80`} />;
  if (task.modulo) return <ModuloIcon modulo={task.modulo} className={`${className} text-tinta`} />;
  return null;
}

export function IconoActividad({
  task,
  lado,
  apagado = false,
}: {
  task: Pick<PlanTask, "codigo" | "modulo">;
  // Tamaño del cuadro en px.
  lado: number;
  // Ya registrada: un poco más tenue, sin perder el dibujo.
  apagado?: boolean;
}) {
  const tema = temaDeTarea(task);
  return (
    <span
      aria-hidden="true"
      className={`relative shrink-0 rounded-2xl flex items-center justify-center overflow-hidden ${apagado ? "saturate-[0.6] opacity-80" : ""}`}
      style={{ width: lado, height: lado, background: `radial-gradient(130% 120% at 0% 0%, #fff 0%, ${tema.from} 60%, ${tema.to} 150%)` }}
    >
      <GlifoActividad task={task} className="w-[64%] h-[64%]" />
    </span>
  );
}
