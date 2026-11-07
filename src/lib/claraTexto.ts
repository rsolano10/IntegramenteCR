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

// Accesos directos que se ofrecen debajo de una respuesta cuando Clara
// nombra una pantalla de la app («Ir a Mi semana», «Abrir el calendario»…).
export type Destino = "hoy" | "semana" | "calendario" | "cuenta" | "perfil" | "emergencia";
export const destinos: Record<Destino, { label: string; ruta?: string; ventana?: "calendario" | "mi-perfil" }> = {
  hoy: { label: "Ir a Hoy", ruta: "/app/hoy" },
  semana: { label: "Ir a Mi semana", ruta: "/app/plan" },
  calendario: { label: "Abrir el calendario", ventana: "calendario" },
  cuenta: { label: "Abrir Mi cuenta", ventana: "mi-perfil" },
  perfil: { label: "Ver el perfil", ruta: "/app/perfil/resumen" },
  emergencia: { label: "Abrir SOS", ruta: "/app/emergencia" },
};

const reglas: { destino: Destino; patron: RegExp }[] = [
  { destino: "semana", patron: /mi semana/i },
  { destino: "calendario", patron: /calendario en tu tel[eé]fono|agregar a mi calendario|calendario del tel[eé]fono/i },
  { destino: "cuenta", patron: /mi cuenta/i },
  { destino: "perfil", patron: /perfil de [A-ZÁÉÍÓÚÑ]/ },
  { destino: "emergencia", patron: /\bSOS\b/ },
  { destino: "hoy", patron: /pantalla (de )?[«"“]?hoy|pestaña [«"“]?hoy|[«"“]hoy[»"”]/i },
];

export function destinosEnTexto(texto: string, max = 2): Destino[] {
  const encontrados = reglas.filter((r) => r.patron.test(texto)).map((r) => r.destino);
  return [...new Set(encontrados)].slice(0, max);
}
