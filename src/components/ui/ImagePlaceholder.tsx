export function ImagePlaceholder({ label, height = 140, rounded = "rounded-2xl" }: { label: string; height?: number; rounded?: string }) {
  return (
    <div className={`im-placeholder flex items-center justify-center ${rounded}`} style={{ height }}>
      <span className="font-mono text-xs text-tinta-tenue bg-white/85 px-3 py-1.5 rounded-full">{label}</span>
    </div>
  );
}
