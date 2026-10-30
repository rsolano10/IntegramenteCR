// Los módulos de actividades: nombre y color. Sin dependencias, para que el
// home público lo use sin arrastrar el cliente de Supabase. `cognicion` es
// «Atención, memoria y funciones ejecutivas» del manual de recursos cognitivos.
export type ResourceModulo = "sentidos" | "movimiento" | "musica" | "reminiscencia" | "cognicion" | "gerontogimnasia" | "nutricion";

// One mood per módulo so cards read by color before they read by text —
// sentidos (calma/teal), movimiento (energía/ámbar), música (calidez/
// terracota), reminiscencia (nostalgia/sepia), cognición (foco/azul
// pizarra). Shared by the library cards
// and the family's weekly plan.
export const moduloTheme: Record<ResourceModulo, { from: string; to: string; chip: string; ink: string }> = {
  sentidos: { from: "#89c0c6", to: "#3f6a70", chip: "bg-verde-profundo/85", ink: "#3f6a70" },
  movimiento: { from: "#fadfa9", to: "#e8b857", chip: "bg-[#8a6a2a]/80", ink: "#8a6a2a" },
  musica: { from: "#e8b5a1", to: "#c0664f", chip: "bg-[#8c3f2a]/80", ink: "#8c3f2a" },
  reminiscencia: { from: "#ece3c4", to: "#b7a06d", chip: "bg-[#6b5726]/80", ink: "#6b5726" },
  cognicion: { from: "#c3d2dc", to: "#5b7489", chip: "bg-[#3e5566]/80", ink: "#3e5566" },
  gerontogimnasia: { from: "#f4d096", to: "#c99a45", chip: "bg-[#7a5a1f]/80", ink: "#7a5a1f" },
  nutricion: { from: "#cfe0b8", to: "#6f8f4e", chip: "bg-[#4b6534]/80", ink: "#4b6534" },
};

export const moduloLabel: Record<ResourceModulo, string> = {
  sentidos: "Sentidos",
  movimiento: "Movimiento",
  musica: "Música",
  reminiscencia: "Reminiscencia",
  cognicion: "Atención y memoria",
  gerontogimnasia: "Gerontogimnasia",
  nutricion: "Nutrición",
};

// Módulos con formato de ficha (business/integramente-recursos-spec.md):
// ¿Para quién?, ¿Sabías que…?, Tu actividad, Tené en cuenta, Para cerrar.
export const modulosFicha: ResourceModulo[] = ["gerontogimnasia", "nutricion"];
