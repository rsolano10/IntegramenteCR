import { useState } from "react";
import type { EjercicioComprension } from "../../../lib/actividades/comprension";
import { leerEnVoz } from "../../../lib/voz";
import { BotonEscuchar } from "../ClasificarNumeros";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La radio y El correo» (comprension). La radio de tubos en la repisa, con
// su perilla y la luz del dial, que trae el aviso de la radio comunal; o el
// apartado de correos con un sobre que se abre en una carta escrita a mano.
// Primero se escucha o se lee; después, las preguntas de a una.

interface Config {
  textoVisible: boolean;
  escucharOtraVez: boolean;
}

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioComprension; config: Config; ctl: Control }) {
  const radio = ej.escena === "radio";
  const [fase, setFase] = useState<"texto" | "preguntas">("texto");
  const [abierta, setAbierta] = useState(radio);
  const [verEscrito, setVerEscrito] = useState(!radio);
  const [q, setQ] = useState(0);
  const [fuera, setFuera] = useState<number[]>([]);
  const [resaltar, setResaltar] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const pregunta = ej.preguntas[q];

  usePista(ctl.pista, () => {
    if (fase !== "preguntas") return;
    if (pregunta.frase) {
      setResaltar(pregunta.frase);
      ctl.aviso(radio ? "Ahí está, marcado en el aviso." : "Ahí está, marcado en la carta.");
      if (radio) leerEnVoz(ej.texto, () => {});
    } else {
      setResaltar("");
      ctl.aviso(radio ? "Pensá en lo que cuenta el aviso." : "Pensá en lo que cuenta la carta.");
    }
  });

  function responder(i: number) {
    if (hecho || fuera.includes(i)) return;
    if (i !== pregunta.correcta) {
      setFuera((f) => [...f, i]);
      return ctl.reintento("No era esa. Probá con otra.");
    }
    if (q === ej.preguntas.length - 1) {
      setHecho(true);
      return ctl.listo();
    }
    ctl.acierto("¡Eso es!");
    setQ(q + 1);
    setFuera([]);
    setResaltar(null);
  }

  const mostrarTexto = fase === "texto" ? verEscrito && abierta : config.textoVisible || resaltar !== null;

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-[20px]" style={sombraCapa}>
        {radio ? <Repisa sonando={hecho} /> : <Apartado abierta={abierta} colgada={false} onAbrir={() => setAbierta(true)} />}
      </div>

      {fase === "texto" && radio && (
        <div className="flex flex-wrap justify-center gap-2">
          <BotonEscuchar texto={ej.texto} etiqueta="Escuchar el aviso" />
          <button
            type="button"
            onClick={() => setVerEscrito((v) => !v)}
            className="inline-flex items-center min-h-11 px-4 rounded-full border-[1.5px] border-borde bg-white text-[15px] font-semibold text-tinta cursor-pointer"
          >
            {verEscrito ? "Esconder el aviso escrito" : "Ver el aviso escrito"}
          </button>
        </div>
      )}
      {fase === "texto" && !radio && !abierta && (
        <p className={`m-0 text-center leading-snug text-tinta ${L ? "text-[24px]" : "text-[21px]"}`}>Llegó una carta. Tocá el sobre para abrirla.</p>
      )}

      {mostrarTexto && <Escrito ej={ej} resaltar={resaltar} large={L} />}
      {fase === "texto" && !radio && abierta && (
        <div className="flex justify-center">
          <BotonEscuchar texto={ej.texto} etiqueta="Leerla en voz alta" />
        </div>
      )}

      {fase === "preguntas" && (
        <div className="grid gap-3">
          {ej.preguntas.length > 1 && (
            <p className="m-0 text-[14px] tracking-[0.12em] uppercase font-semibold text-tinta-tenue">
              Pregunta {q + 1} de {ej.preguntas.length}
            </p>
          )}
          <p className={`m-0 font-semibold leading-snug text-tinta ${L ? "text-[25px]" : "text-[22px]"}`}>{pregunta.texto}</p>
          <ul className="list-none m-0 p-0 grid gap-2.5" aria-label="Respuestas">
            {pregunta.opciones.map((o, i) => {
              const descartada = fuera.includes(i);
              const esta = hecho && i === pregunta.correcta;
              const est = estiloPieza(esta ? "elegida" : descartada ? "quieta" : "reposo");
              return (
                <li key={`${q}-${o}`}>
                  <button
                    type="button"
                    onClick={() => responder(i)}
                    disabled={hecho || descartada}
                    className={`${clasePieza} ${est.className} w-full rounded-[14px] text-left px-4 py-3.5 min-h-14 font-bold leading-snug ${L ? "text-[22px]" : "text-[19px]"}`}
                    style={{ ...est.style, background: P.cal, color: P.tierra, opacity: descartada ? 0.4 : 1 }}
                  >
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>
          {radio && config.escucharOtraVez && !hecho && (
            <div className="flex justify-center">
              <BotonEscuchar texto={ej.texto} etiqueta="Escuchar otra vez" />
            </div>
          )}
        </div>
      )}

      {fase === "texto" && (abierta || radio) && (
        <Acciones ctl={ctl}>
          <Boton onClick={() => setFase("preguntas")} large={L}>
            {radio ? "Ya lo escuché" : "Ya la leí"}
          </Boton>
        </Acciones>
      )}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <div className="grid grid-cols-2">
        <Repisa sonando={final} compacta />
        <Apartado abierta={false} colgada={final} compacta />
      </div>
    </div>
  );
}

// ─── Piezas ───

// El texto escrito: el aviso (letra de imprenta) o la carta (a mano), con
// la frase de la pista resaltada.
function Escrito({ ej, resaltar, large }: { ej: EjercicioComprension; resaltar: string | null; large: boolean }) {
  const carta = ej.escena === "correo";
  const i = resaltar ? ej.texto.indexOf(resaltar) : -1;
  const partes = i >= 0 ? [ej.texto.slice(0, i), ej.texto.slice(i, i + resaltar!.length), ej.texto.slice(i + resaltar!.length)] : [ej.texto, "", ""];
  return (
    <div className="flex justify-center">
      <div
        className={`w-full max-w-[520px] px-5 py-5 ${carta ? "rotate-[-0.6deg]" : ""}`}
        style={{
          background: carta ? "#fffdf6" : P.cal,
          boxShadow: "0 4px 0 rgba(51,36,28,0.22)",
          backgroundImage: carta ? "repeating-linear-gradient(180deg, transparent 0 35px, #e4dfc7 35px 36px)" : undefined,
        }}
      >
        <p className={`m-0 mb-1 font-rotulo ${large ? "text-[21px]" : "text-[18px]"}`} style={{ color: P.madera }}>
          {ej.titulo}
        </p>
        <p className={`m-0 leading-[36px] ${carta ? "font-serif italic" : "font-sans"} ${large ? "text-[24px]" : "text-[21px]"}`} style={{ color: P.tierra }}>
          {partes[0]}
          {partes[1] && (
            <mark className="rounded px-0.5" style={{ background: P.mostaza, color: P.tierra }}>
              {partes[1]}
            </mark>
          )}
          {partes[2]}
        </p>
      </div>
    </div>
  );
}

// La repisa con la radio de tubos. `sonando`: la luz del dial se mueve y
// salen notas (momento final).
function Repisa({ sonando, compacta = false }: { sonando: boolean; compacta?: boolean }) {
  return (
    <div className="pueblo-grano h-full" style={{ backgroundColor: P.serenidad }}>
      <svg viewBox="0 0 220 150" className={`block mx-auto w-full h-auto overflow-visible ${compacta ? "" : "max-w-[420px]"}`} aria-hidden="true">
        <rect x="-300" y="0" width="820" height="150" fill={P.serenidad} />
        <rect x="-300" y="118" width="820" height="10" fill={P.madera} />
        <rect x="-300" y="128" width="820" height="22" fill={P.profundo} opacity="0.5" />
        {/* Radio de tubos: caja de madera con arco */}
        <path d="M50 118 V62 a60 40 0 0 1 120 0 V118z" fill={P.maderaOscura} />
        <path d="M58 116 V64 a52 34 0 0 1 104 0 V116z" fill={P.madera} />
        {/* Tela del parlante */}
        <path d="M70 92 V66 a40 24 0 0 1 80 0 V92z" fill={P.mostaza} opacity="0.85" />
        {[78, 90, 102, 114, 126, 138].map((x) => (
          <path key={x} d={`M${x} 92 V62`} stroke={P.madera} strokeOpacity="0.45" strokeWidth="2" />
        ))}
        {/* Dial y perillas */}
        <rect x="74" y="98" width="72" height="12" rx="3" fill={P.cal} />
        <rect x="74" y="98" width="72" height="12" rx="3" fill={P.mostaza} opacity="0.35" />
        <rect x="104" y="99" width="3" height="10" fill={P.grano} className={sonando ? "motion-safe:animate-[pueblo-dial_2.4s_ease-in-out_infinite]" : ""} />
        <circle cx="64" cy="104" r="6" fill={P.tierra} />
        <circle cx="156" cy="104" r="6" fill={P.tierra} />
        {sonando && (
          <g className="motion-safe:animate-[pueblo-vapor_2.4s_ease-in-out_infinite]" fill={P.cal}>
            <path d="M178 40 v-16 l10 -3 v14" stroke={P.cal} strokeWidth="2.5" fill="none" />
            <circle cx="176" cy="40" r="3.5" />
            <circle cx="186" cy="36" r="3.5" />
            <path d="M34 50 v-14" stroke={P.cal} strokeWidth="2.5" />
            <circle cx="32" cy="50" r="3.5" />
          </g>
        )}
      </svg>
    </div>
  );
}

// El apartado de correos: casilleros de madera con números; en uno, un sobre.
// `abierta`: la carta salió del sobre. `colgada`: momento final, la carta
// queda en la pared junto a otras.
function Apartado({ abierta, colgada, onAbrir, compacta = false }: { abierta: boolean; colgada: boolean; onAbrir?: () => void; compacta?: boolean }) {
  return (
    <div className="pueblo-grano h-full" style={{ backgroundColor: P.rosa }}>
      <svg viewBox="0 0 220 150" className={`block mx-auto w-full h-auto ${compacta ? "" : "max-w-[420px]"}`} aria-hidden="true">
        {colgada ? (
          <g>
            <path d="M20 30 h180" stroke={P.madera} strokeWidth="2" />
            {[30, 80, 130].map((x, i) => (
              <g key={x} className="motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]" style={{ animationDelay: `${i * 120}ms` }}>
                <rect x={x} y="34" width="44" height="56" fill={i === 2 ? "#fffdf6" : P.cal} transform={`rotate(${i === 1 ? 3 : -2} ${x + 22} 34)`} />
                <path d={`M${x + 8} 50 h28 M${x + 8} 58 h24 M${x + 8} 66 h28`} stroke={P.serenidad} strokeWidth="2" transform={`rotate(${i === 1 ? 3 : -2} ${x + 22} 34)`} />
                <circle cx={x + 22} cy="34" r="3" fill={P.grano} />
              </g>
            ))}
          </g>
        ) : (
          <g>
            <rect x="30" y="16" width="160" height="118" rx="4" fill={P.maderaOscura} />
            {[0, 1, 2].map((f) =>
              [0, 1, 2, 3].map((c) => (
                <g key={`${f}-${c}`}>
                  <rect x={38 + c * 38} y={24 + f * 36} width="32" height="30" rx="2" fill={P.madera} />
                  <text x={54 + c * 38} y={44 + f * 36} textAnchor="middle" fontSize="10" fontWeight="700" fill={P.maderaClara}>
                    {12 + f * 4 + c}
                  </text>
                </g>
              )),
            )}
            {/* El casillero abierto con el sobre */}
            <rect x="114" y="60" width="32" height="30" rx="2" fill={P.tierra} />
            {!abierta && (
              <g className="motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]">
                <rect x="96" y="70" width="58" height="38" rx="2" fill={P.cal} stroke={P.tierra} strokeWidth="1.5" />
                <path d="M96 70 l29 20 l29 -20" stroke={P.tierra} strokeWidth="1.5" fill="none" />
                <rect x="138" y="74" width="10" height="12" fill={P.grano} />
              </g>
            )}
          </g>
        )}
      </svg>
      {onAbrir && !abierta && !colgada && (
        <div className="flex justify-center pb-3 -mt-2">
          <button
            type="button"
            onClick={onAbrir}
            className={`${clasePieza} rounded-[12px] px-5 min-h-12 font-bold`}
            style={{ ...estiloPieza("reposo").style, background: P.cal, color: P.tierra }}
          >
            Abrir la carta
          </button>
        </div>
      )}
    </div>
  );
}
