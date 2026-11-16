import { imagenDeCategoria, type ResourceModulo } from "../../lib/modulos";

// La imagen de una actividad es la de su categoría (Atención y memoria,
// Gerontogimnasia, Movimiento…): la misma en Hoy, en Mi semana, en el
// tablero y en la portada de la sesión. Son ilustraciones propias con la
// línea gráfica de IntegraMente (las gotas del isotipo y su paleta), en
// public/categorias, generadas con scripts/categorias/generar.py.

export function IconoActividad({
  modulo,
  lado,
  apagado = false,
  redondez,
}: {
  modulo: ResourceModulo | null | undefined;
  // Tamaño en px.
  lado: number;
  // Ya registrada: un poco más tenue, sin perder la imagen.
  apagado?: boolean;
  redondez?: number;
}) {
  return (
    <img
      src={imagenDeCategoria(modulo)}
      alt=""
      aria-hidden="true"
      width={lado}
      height={lado}
      draggable={false}
      className={`shrink-0 select-none shadow-[0_8px_18px_-12px_rgba(31,51,56,0.55)] ${apagado ? "saturate-[0.6] opacity-80" : ""}`}
      style={{ width: lado, height: lado, borderRadius: redondez ?? Math.round(lado * 0.28) }}
    />
  );
}
