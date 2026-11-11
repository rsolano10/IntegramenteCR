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

// ─── Lectura en voz alta ───
// Primero, una voz natural (ElevenLabs, vía la función «voz»: la clave nunca
// está en el navegador y el audio queda guardado por texto). Si no hay
// servicio o no hay conexión, la mejor voz en español del dispositivo,
// evitando las voces de efectos (graves, lentas o robóticas).

export const lecturaDisponible = typeof window !== "undefined" && (typeof Audio !== "undefined" || "speechSynthesis" in window);

const audios = new Map<string, string>(); // texto → URL del audio ya bajado
let sonando: HTMLAudioElement | null = null;
let turno = 0;
let sinServicio = false;

export function leerEnVoz(texto: string, alTerminar: () => void) {
  detenerVoz();
  const limpio = texto.replace(/•/g, "").replace(/\s+/g, " ").trim();
  if (!limpio) return alTerminar();
  const mio = ++turno;
  if (sinServicio) return leerConNavegador(limpio, alTerminar);
  vozNatural(limpio)
    .then((url) => {
      if (mio !== turno) return;
      const a = new Audio(url);
      sonando = a;
      a.onended = alTerminar;
      a.onerror = () => leerConNavegador(limpio, alTerminar);
      a.play().catch(() => leerConNavegador(limpio, alTerminar));
    })
    .catch(() => {
      if (mio === turno) leerConNavegador(limpio, alTerminar);
    });
}

async function vozNatural(texto: string): Promise<string> {
  const ya = audios.get(texto);
  if (ya) return ya;
  const { supabase } = await import("./supabase");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("sin sesión");
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voz`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ texto }),
  });
  if (r.status === 503) sinServicio = true;
  if (!r.ok) throw new Error(`voz ${r.status}`);
  const url = URL.createObjectURL(await r.blob());
  audios.set(texto, url);
  return url;
}

// Voces de efectos de Apple y otras que suenan graves, lentas o artificiales.
const MALAS = /eddy|grandpa|grandma|reed|rocko|sandy|shelley|flo\b|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy/i;
const BUENAS = /natural|neural|premium|enhanced|mejorada|online|google|paulina|m[oó]nica|sabina|dalia|elvira|helena|francisca|camila|valentina|marisol|soledad/i;

function mejorVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es") && !MALAS.test(v.name));
  const puntaje = (v: SpeechSynthesisVoice) =>
    (BUENAS.test(v.name) ? 10 : 0) + (/es[-_](cr|419|mx|us|co)/i.test(v.lang) ? 4 : 0) + (v.localService ? 0 : 2) + (/es[-_]es/i.test(v.lang) ? -1 : 0);
  return voces.sort((a, b) => puntaje(b) - puntaje(a))[0] ?? null;
}

function leerConNavegador(texto: string, alTerminar: () => void) {
  if (!("speechSynthesis" in window)) return alTerminar();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  const voz = mejorVoz();
  if (voz) u.voice = voz;
  u.lang = voz?.lang ?? "es-CR";
  u.rate = 1;
  u.pitch = 1;
  u.onend = alTerminar;
  u.onerror = alTerminar;
  window.speechSynthesis.speak(u);
}

export function detenerVoz() {
  turno++;
  if (sonando) {
    sonando.pause();
    sonando = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// Las voces del dispositivo cargan tarde en algunos navegadores.
if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices();
