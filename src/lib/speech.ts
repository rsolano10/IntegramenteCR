import { leerEnVoz } from "./voz";

// Lectura en voz alta de la vista del participante: la misma voz natural
// que el resto de la app (ver lib/voz.ts).
export function speak(text: string) {
  if (!text.trim()) return;
  leerEnVoz(text, () => {});
}
