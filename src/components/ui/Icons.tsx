import type { MediaKind } from "../../lib/mediaResources";

// Small shared glyphs that used to be emoji (🧠, ⚠️, ▶) standing in for an
// icon — same stroke language as the rest of the app's hand-drawn nav icons.

export function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3 11.2c.6.4 1 1.1 1 1.8h4c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" />
      </g>
    </svg>
  );
}

export function WarningIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 4 2 20h20L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10.5v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6 4l14 8-14 8V4Z" fill="currentColor" />
    </svg>
  );
}

// One per MediaKind other than "imagen" (which already gets a real
// thumbnail) — a resource card with no uploaded file shouldn't read as pure
// text with an empty gap where a thumbnail would go.
export function VideoIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9.5l5 2.5-5 2.5V9.5Z" fill="currentColor" />
    </svg>
  );
}

export function AudioIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16.5 9.3a3.4 3.4 0 0 1 0 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 7.2a6.6 6.6 0 0 1 0 9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6.5 3h7l4 4v14h-11V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13.5 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12.5h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LinkIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M10.5 13.5a4 4 0 0 0 5.66 0l2-2a4 4 0 1 0-5.66-5.66l-1.1 1.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.5 10.5a4 4 0 0 0-5.66 0l-2 2a4 4 0 1 0 5.66 5.66l1.1-1.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3.2 1.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 12a8 8 0 0 1 13.5-5.8L20 8.5M20 8.5V4M20 8.5h-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12a8 8 0 0 1-13.5 5.8L4 15.5M4 15.5V20M4 15.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const mediaKindIcons: Partial<Record<MediaKind, (props: { className?: string }) => React.JSX.Element>> = {
  video: VideoIcon,
  audio: AudioIcon,
  documento: DocumentIcon,
  enlace: LinkIcon,
};

// Dispatches to the right glyph for every MediaKind except "imagen" (which
// renders a real uploaded thumbnail instead, see ResourceCard.tsx) — returns
// null there so callers can render unconditionally.
export function MediaKindIcon({ kind, className }: { kind: MediaKind | null; className?: string }) {
  if (!kind) return null;
  const Icon = mediaKindIcons[kind];
  return Icon ? <Icon className={className} /> : null;
}
