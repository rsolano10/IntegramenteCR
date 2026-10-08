import type { ResourceModulo } from "../../lib/modulos";

// Replaces moduloEmoji (👃🚶🎵📷) as the module marker on resource cards —
// same stroke-based line-icon language already used in FamiliarNav.tsx /
// ProfesionalNav.tsx (currentColor, ~1.6-2 stroke, round caps/joins)
// instead of an emoji glyph that broke from it.
const paths: Record<ResourceModulo, React.ReactNode> = {
  sentidos: (
    <>
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  movimiento: (
    <>
      <circle cx="12" cy="4.6" r="1.8" />
      <path d="M12 7v6M12 9l-4 3M12 9l4 2M12 13l-3 6M12 13l4 5" />
    </>
  ),
  musica: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2.2" />
      <circle cx="17" cy="16" r="2.2" />
    </>
  ),
  reminiscencia: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M3.5 16.5 8 12l4 4 3-3 5.5 5" />
    </>
  ),
};

export function ModuloIcon({ modulo, className }: { modulo: ResourceModulo; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[modulo]}
      </g>
    </svg>
  );
}
