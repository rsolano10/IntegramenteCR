// Clara: las tres gotas del isotipo. La misma en Ayuda y en las actividades.
export function ClaraAvatar({ tam, animado = false }: { tam: number; animado?: boolean }) {
  const p = (color: string, x: number, y: number, s: number, radio: string) => (
    <span
      className="absolute block"
      style={{ left: x * tam, top: y * tam, width: s * tam, height: s * tam, background: color, borderRadius: radio, transformOrigin: "center" }}
    />
  );
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${animado ? "clara-respira" : ""}`} style={{ width: tam, height: tam }}>
      {p("#6a969c", 0.02, 0.02, 0.54, "50% 50% 12% 50%")}
      {p("#ebe6ce", 0.6, 0.1, 0.38, "50% 50% 50% 12%")}
      {p("#f4d096", 0.08, 0.6, 0.38, "50% 12% 50% 50%")}
    </span>
  );
}
