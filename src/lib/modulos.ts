// Los cuatro módulos de actividades: nombre y color. Sin dependencias, para
// que el home público lo use sin arrastrar el cliente de Supabase.
export type ResourceModulo = "sentidos" | "movimiento" | "musica" | "reminiscencia";

// One mood per módulo so cards read by color before they read by text —
// sentidos (calma/teal), movimiento (energía/ámbar), música (calidez/
// terracota), reminiscencia (nostalgia/sepia). Shared by the library cards
// and the family's weekly plan.
export const moduloTheme: Record<ResourceModulo, { from: string; to: string; chip: string; ink: string }> = {
  sentidos: { from: "#89c0c6", to: "#3f6a70", chip: "bg-verde-profundo/85", ink: "#3f6a70" },
  movimiento: { from: "#fadfa9", to: "#e8b857", chip: "bg-[#8a6a2a]/80", ink: "#8a6a2a" },
  musica: { from: "#e8b5a1", to: "#c0664f", chip: "bg-[#8c3f2a]/80", ink: "#8c3f2a" },
  reminiscencia: { from: "#ece3c4", to: "#b7a06d", chip: "bg-[#6b5726]/80", ink: "#6b5726" },
};

export const moduloLabel: Record<ResourceModulo, string> = {
  sentidos: "Sentidos",
  movimiento: "Movimiento",
  musica: "Música",
  reminiscencia: "Reminiscencia",
};
