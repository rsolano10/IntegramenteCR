import { lazy, Suspense } from "react";

// Clara trae el SDK de ElevenLabs (voz en tiempo real, ~600 kB): se carga
// solo al entrar a Ayuda, no con el resto de la app.
const Asistente = lazy(() => import("./Asistente").then((m) => ({ default: m.Asistente })));

// Ayuda = Clara (agente de ElevenLabs, por texto o por voz, con las reglas
// de riesgo de siempre) en una pantalla tipo chat y, para lo que necesita a
// un profesional, WhatsApp (botón fijo en el encabezado): es el único canal
// con el equipo de salud, la app no tiene chat con la clínica.
export function Ayuda() {
  // Pantalla tipo WhatsApp: el saludo y la barra para escribir quedan fijos.
  // Sin ofertas de programas acá: quien llega a Ayuda viene con una duda o
  // un problema. Cómo pasar al programa con sesiones está en «Mi programa».
  return (
    <Suspense fallback={<div className="h-full" />}>
      <Asistente />
    </Suspense>
  );
}
