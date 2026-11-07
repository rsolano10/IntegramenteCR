// Formato de las respuestas de Clara y accesos directos a pantallas de la
// app (Ayuda). Funciones puras, con pruebas en claraTexto.test.ts.

export type Bloque = { tipo: "parrafo"; texto: string } | { tipo: "numerada"; items: string[] } | { tipo: "lista"; items: string[] };

const NUMERADA = /^\s*\d+[.)]\s+/;
const VINETA = /^\s*[-•*]\s+/;

// Párrafos, listas numeradas y viñetas a partir del texto plano que llega
// del agente (también a medio escribir).
export function bloquesDeTexto(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  let parrafo: string[] = [];
  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push({ tipo: "parrafo", texto: parrafo.join("\n") });
    parrafo = [];
  };
  for (const linea of texto.split("\n")) {
    const numerada = NUMERADA.test(linea);
    const vineta = !numerada && VINETA.test(linea);
    if (numerada || vineta) {
      cerrarParrafo();
      const tipo = numerada ? "numerada" : "lista";
      const item = linea.replace(numerada ? NUMERADA : VINETA, "").trim();
      const ultimo = bloques[bloques.length - 1];
      if (ultimo && ultimo.tipo === tipo) ultimo.items.push(item);
      else bloques.push({ tipo, items: [item] });
    } else if (!linea.trim()) {
      cerrarParrafo();
    } else {
      parrafo.push(linea.trim());
    }
  }
  cerrarParrafo();
  return bloques;
}

// Trozos de una línea: lo que va entre comillas («…», "…", “…”) o entre
// **…** se destaca (son nombres de botones y pantallas); las comillas se
// quitan para que se lea más limpio.
export type Trozo = { texto: string; destacado: boolean };
const DESTACADO = /\*\*([^*]+)\*\*|«([^»]+)»|“([^”]+)”|"([^"\n]+)"/g;

export function trozosDeLinea(linea: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;
  for (const m of linea.matchAll(DESTACADO)) {
    if (m.index! > desde) trozos.push({ texto: linea.slice(desde, m.index), destacado: false });
    trozos.push({ texto: m[1] ?? m[2] ?? m[3] ?? m[4], destacado: true });
    desde = m.index! + m[0].length;
  }
  if (desde < linea.length) trozos.push({ texto: linea.slice(desde), destacado: false });
  return trozos;
}

// Acciones que se ofrecen debajo de una respuesta cuando Clara nombra una
// pantalla o recomienda algo («Ir a Mi semana», «Escribir por WhatsApp»,
// «Activar mi programa»…). Así el chat es interactivo: la persona no tiene
// que ir a buscar lo que Clara le indicó.
export type Destino = "whatsapp" | "activar" | "hoy" | "semana" | "evaluar" | "calendario" | "cuenta" | "perfil" | "emergencia";
export const destinos: Record<Destino, { label: string; ruta?: string; ventana?: "calendario" | "mi-perfil" }> = {
  whatsapp: { label: "Escribir por WhatsApp" },
  activar: { label: "Activar mi programa" },
  hoy: { label: "Ir a Hoy", ruta: "/app/hoy" },
  semana: { label: "Ir a Mi semana", ruta: "/app/plan" },
  evaluar: { label: "Evaluar la semana", ruta: "/app/revision" },
  calendario: { label: "Abrir el calendario", ventana: "calendario" },
  cuenta: { label: "Abrir Mi cuenta", ventana: "mi-perfil" },
  perfil: { label: "Ver el perfil", ruta: "/app/perfil/resumen" },
  emergencia: { label: "Ver qué hacer en una urgencia", ruta: "/app/emergencia" },
};

// En orden de prioridad: si hay más de 3, se ofrecen las primeras.
const reglas: { destino: Destino; patron: RegExp }[] = [
  // WhatsApp con el equipo (no los «recordatorios por WhatsApp» de Mi cuenta).
  { destino: "whatsapp", patron: /(?<!recordatorios por )whatsapp|8346[\s-]?4703|escrib(í|i|ir)le al equipo|contact(á|a|ar)(te)? (con|al) (el |nuestro )?equipo|habl(á|a|ar) con (el |nuestro )?equipo/i },
  { destino: "activar", patron: /activar (mi|tu|el) programa|activ(á|a) tu programa/i },
  { destino: "evaluar", patron: /evaluar la semana/i },
  { destino: "semana", patron: /mi semana|actividades sugeridas/i },
  { destino: "calendario", patron: /calendario en tu tel[eé]fono|agregar a mi calendario|calendario del tel[eé]fono/i },
  { destino: "cuenta", patron: /mi cuenta|contraseña|recordatorios por whatsapp/i },
  { destino: "perfil", patron: /perfil de [A-ZÁÉÍÓÚÑ]/ },
  { destino: "emergencia", patron: /\bSOS\b|gu[ií]a de emergencia/i },
  { destino: "hoy", patron: /pantalla (de )?[«"“]?hoy|pestaña [«"“]?hoy|[«"“]hoy[»"”]/i },
];

export function destinosEnTexto(texto: string, max = 3): Destino[] {
  let encontrados = reglas.filter((r) => r.patron.test(texto)).map((r) => r.destino);
  // «Activar mi programa» ya abre WhatsApp con el mensaje listo: no se repite.
  if (encontrados.includes("activar")) encontrados = encontrados.filter((d) => d !== "whatsapp");
  return [...new Set(encontrados)].slice(0, max);
}
