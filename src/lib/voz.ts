import { useEffect, useRef, useState } from "react";

// Dictado y lectura en voz alta con las APIs del navegador (sin servicios
// externos). Quien cuida muchas veces tiene las manos ocupadas.

interface Reconocimiento {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function crearReconocimiento(): Reconocimiento | null {
  const w = window as unknown as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

export const dictadoDisponible =
  typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

// alternar(base): `base` es lo que ya estaba escrito; el dictado se agrega al final.
export function useDictado(onTexto: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false);
  const rec = useRef<Reconocimiento | null>(null);

  useEffect(() => () => rec.current?.stop(), []);

  function alternar(base: string) {
    if (escuchando) {
      rec.current?.stop();
      return;
    }
    const r = crearReconocimiento();
    if (!r) return;
    r.lang = "es-CR";
    r.interimResults = true;
    r.continuous = false;
    const prefijo = base.trim() ? `${base.trim()} ` : "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      onTexto(prefijo + t);
    };
    r.onend = () => setEscuchando(false);
    r.onerror = () => setEscuchando(false);
    rec.current = r;
    setEscuchando(true);
    r.start();
  }

  return { escuchando, alternar };
}

export const lecturaDisponible = typeof window !== "undefined" && "speechSynthesis" in window;

export function leerEnVoz(texto: string, alTerminar: () => void) {
  if (!lecturaDisponible) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto.replace(/•/g, ""));
  const voces = window.speechSynthesis.getVoices();
  const voz = voces.find((v) => v.lang === "es-CR") ?? voces.find((v) => v.lang === "es-419" || v.lang === "es-MX" || v.lang === "es-US") ?? voces.find((v) => v.lang.startsWith("es"));
  if (voz) u.voice = voz;
  u.lang = voz?.lang ?? "es-CR";
  u.rate = 0.95;
  u.onend = alTerminar;
  u.onerror = alTerminar;
  window.speechSynthesis.speak(u);
}

export function detenerVoz() {
  if (lecturaDisponible) window.speechSynthesis.cancel();
}
