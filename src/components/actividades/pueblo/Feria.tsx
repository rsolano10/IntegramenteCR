import { useState } from "react";
import type { DibujoProducto } from "../../../lib/actividades/bancos/clasificar";
import { esGrupoValido, type EjercicioClasificar } from "../../../lib/actividades/clasificarObjetos";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La feria» (clasificar). Un tramo de la feria del agricultor al amanecer:
// toldos, tramos de madera y el cielo que va de rosa a dorado. Las piezas
// son los productos; los grupos, canastos y cajones rotulados. Con cada
// ejercicio el sol sube un poco; al final el tramo queda acomodado.

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioClasificar; ctl: Control }) {
  const [ubicados, setUbicados] = useState<Record<number, string>>({});
  const [elegido, setElegido] = useState<number | null>(null);
  const [devuelto, setDevuelto] = useState<number | null>(null);
  const [recien, setRecien] = useState<number | null>(null);
  const [pistaGrupo, setPistaGrupo] = useState<string | null>(null);
  const L = ctl.large;
  const listo = Object.keys(ubicados).length === ej.elementos.length;

  usePista(ctl.pista, () => {
    const i = elegido ?? ej.elementos.findIndex((_, k) => ubicados[k] === undefined);
    if (i < 0) return;
    setElegido(i);
    setPistaGrupo(ej.elementos[i].validos[0]);
    ctl.aviso(`«${ej.elementos[i].texto}» va en el canasto marcado.`);
  });

  function tocarGrupo(g: string) {
    if (elegido === null) return ctl.aviso("Primero tocá un producto.");
    const e = ej.elementos[elegido];
    setPistaGrupo(null);
    if (!esGrupoValido(e, g)) {
      setDevuelto(elegido);
      setElegido(null);
      return ctl.reintento("Probemos con otro canasto.");
    }
    const sig = { ...ubicados, [elegido]: g };
    setUbicados(sig);
    setRecien(elegido);
    setElegido(null);
    setDevuelto(null);
    if (Object.keys(sig).length === ej.elementos.length) ctl.listo();
    else ctl.acierto(`Muy bien, ${e.texto.toLowerCase()} en ${ej.grupos.find((x) => x.id === g)!.nombre.toLowerCase()}.`);
  }

  const pendientes = ej.elementos.map((e, i) => ({ e, i })).filter(({ i }) => ubicados[i] === undefined);
  // El sol sube con cada ejercicio (y un poco más al terminar este).
  const sol = (ctl.indice + (listo ? 1 : 0)) / Math.max(1, ctl.total);

  return (
    <div className="grid gap-4" onKeyDown={(e) => e.key === "Escape" && setElegido(null)}>
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Cielo sol={sol} />
        {/* Tramo: tablones de madera (la mesa de juego) */}
        <div className="relative px-3 pt-4 pb-4 sm:px-5" style={{ background: `repeating-linear-gradient(90deg, ${P.maderaClara} 0 46px, #CF9A5E 46px 48px)`, borderTop: `8px solid ${P.madera}` }}>
          <div className="mx-auto max-w-[560px]">
            {/* Canastos y cajones */}
            <div className={`grid gap-3 ${ej.grupos.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {ej.grupos.map((g, k) => {
                const dentro = ej.elementos.map((e, i) => ({ e, i })).filter(({ i }) => ubicados[i] === g.id);
                const ejemplos = ej.ejemplos.filter((x) => x.grupo === g.id);
                const marcado = pistaGrupo === g.id;
                const cajon = k % 2 === 1;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => tocarGrupo(g.id)}
                    aria-label={`${g.nombre}, ${dentro.length} ${dentro.length === 1 ? "producto" : "productos"}${elegido !== null ? `. Tocá para poner «${ej.elementos[elegido].texto}» acá` : ""}${marcado ? ". Va aquí" : ""}`}
                    className={`${clasePieza} text-left rounded-t-[10px] rounded-b-[18px] overflow-visible`}
                    style={{
                      background: "transparent",
                      outline: marcado ? `3px dashed ${P.mostaza}` : undefined,
                      outlineOffset: 3,
                    }}
                  >
                    {/* Rótulo de cartón */}
                    <span className="block mx-auto w-fit -mb-2 relative z-10 px-3 py-1 rounded-[3px] font-rotulo text-[19px] leading-tight -rotate-2" style={{ background: P.cal, color: P.tierra, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
                      {g.nombre}
                    </span>
                    {/* Canasto tejido o cajón de madera */}
                    <span
                      className={`relative flex flex-wrap content-end justify-center gap-1.5 px-2 pt-5 pb-3 min-h-[104px] ${cajon ? "rounded-[4px]" : "rounded-b-[26px] rounded-t-[8px]"}`}
                      style={
                        cajon
                          ? { background: `repeating-linear-gradient(180deg, ${P.madera} 0 18px, ${P.maderaOscura} 18px 21px)`, boxShadow: "0 4px 0 rgba(51,36,28,0.35)" }
                          : {
                              background: `repeating-linear-gradient(45deg, #B5793F 0 6px, #9C652F 6px 12px), ${P.madera}`,
                              boxShadow: `inset 0 6px 0 ${P.maderaOscura}, 0 4px 0 rgba(51,36,28,0.35)`,
                            }
                      }
                    >
                      {ejemplos.map((x) => (
                        <Producto key={x.texto} texto={x.texto} dibujo={ej.elementos.find((e) => e.texto === x.texto)?.dibujo} chico />
                      ))}
                      {dentro.map(({ e, i }) => (
                        <span key={i} className={i === recien ? "motion-safe:animate-[pueblo-asentar_320ms_ease-out]" : ""}>
                          <Producto texto={e.texto} dibujo={e.dibujo} chico />
                        </span>
                      ))}
                      {marcado && (
                        <span className="absolute -top-1 right-1 rounded-full px-2 py-0.5 text-[15px] font-semibold" style={{ background: P.mostaza, color: P.tierra }}>
                          Va aquí
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Productos por acomodar, sobre el tablón */}
            {pendientes.length > 0 && (
              <ul className="list-none m-0 mt-5 p-0 flex flex-wrap justify-center gap-3" aria-label="Productos por acomodar">
                {pendientes.map(({ e, i }) => {
                  const est = estiloPieza(elegido === i ? "elegida" : devuelto === i ? "regreso" : "reposo");
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        aria-pressed={elegido === i}
                        onClick={() => {
                          setDevuelto(null);
                          setPistaGrupo(null);
                          setElegido(elegido === i ? null : i);
                        }}
                        className={`${clasePieza} ${est.className} rounded-[14px]`}
                        style={{ ...est.style, background: P.cal }}
                      >
                        <Producto texto={e.texto} dibujo={e.dibujo} large={L} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {listo ? "¡El tramo quedó acomodado!" : elegido === null ? "Tocá un producto y después su canasto." : `¿Dónde va «${ej.elementos[elegido].texto}»?`}
      </p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  const muestra: { texto: string; dibujo: DibujoProducto }[] = [
    { texto: "Mango", dibujo: { forma: "redonda", color: "#E2B13A" } },
    { texto: "Culantro", dibujo: { forma: "manojo", color: P.profundo } },
    { texto: "Yuca", dibujo: { forma: "raiz", color: P.maderaClara } },
    { texto: "Zanahoria", dibujo: { forma: "alargada", color: P.naranja } },
  ];
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Cielo sol={final ? 1 : 0} />
      <div className="relative px-4 py-4 flex flex-wrap justify-center gap-2.5" style={{ background: `repeating-linear-gradient(90deg, ${P.maderaClara} 0 46px, #CF9A5E 46px 48px)`, borderTop: `8px solid ${P.madera}` }}>
        {muestra.map((m) => (
          <span key={m.texto} className="rounded-[12px]" style={{ background: P.cal, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
            <Producto texto={m.texto} dibujo={m.dibujo} chico />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Dibujo ───

// Producto: un dibujo plano y su nombre, como en el cartoncito de la feria.
function Producto({ texto, dibujo, chico = false, large = false }: { texto: string; dibujo?: DibujoProducto; chico?: boolean; large?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 ${chico ? "px-1.5 py-1 rounded-[10px]" : "px-3 py-2 min-h-14"}`} style={chico ? { background: P.cal } : undefined}>
      {dibujo && <DibujoP d={dibujo} size={chico ? 22 : 34} />}
      <span className={`font-bold leading-tight ${chico ? "text-[14px]" : large ? "text-[22px]" : "text-[20px]"}`} style={{ color: P.tierra }}>
        {texto}
      </span>
    </span>
  );
}

function DibujoP({ d, size }: { d: DibujoProducto; size: number }) {
  const sombra = "rgba(51,36,28,0.3)";
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      {d.forma === "redonda" && (
        <>
          <circle cx="20" cy="23" r="14" fill={sombra} />
          <circle cx="20" cy="21" r="14" fill={d.color} />
          <path d="M20 8 c2 -5 7 -6 10 -4 c-3 3 -6 4 -10 4z" fill={P.profundo} />
        </>
      )}
      {d.forma === "alargada" && (
        <>
          <path d="M8 34 C6 22 16 8 30 5 C34 4 36 7 33 10 C24 16 18 26 12 35 C11 37 9 37 8 34z" fill={d.color} />
          <path d="M30 5 l4 -3 l2 4z" fill={P.profundo} />
        </>
      )}
      {d.forma === "raiz" && (
        <>
          <path d="M5 26 C8 14 22 10 34 12 C38 13 38 18 34 20 C24 25 14 30 7 31 C4 32 4 29 5 26z" fill={d.color} />
          <path d="M8 27 C14 22 24 18 32 16" stroke={P.madera} strokeWidth="1.4" fill="none" opacity="0.6" />
        </>
      )}
      {d.forma === "manojo" && (
        <>
          <path d="M18 38 L20 20 M22 38 L20 20" stroke={P.profundo} strokeWidth="2" />
          {[-14, -6, 2, 10].map((dx, i) => (
            <ellipse key={dx} cx={20 + dx * 0.9} cy={12 + (i % 2) * 4} rx="6" ry="9" fill={d.color} transform={`rotate(${dx * 2} ${20 + dx} 14)`} />
          ))}
          <rect x="15" y="27" width="10" height="4" rx="1" fill={P.naranja} />
        </>
      )}
      {d.forma === "racimo" && (
        <>
          {[
            [14, 14],
            [24, 12],
            [19, 21],
            [29, 20],
            [12, 25],
            [22, 29],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="6" fill={d.color} />
              <circle cx={x} cy={y} r="6" fill="none" stroke={P.tierra} strokeOpacity="0.35" strokeDasharray="1.5 2" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

// Cielo de amanecer (nunca celeste): rosa de tarde que se vuelve dorado,
// el sol que sube, cerros y los toldos de la feria. Formas planas en capas.
function Cielo({ sol }: { sol: number }) {
  const y = 110 - sol * 70; // el sol sube
  return (
    <svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" className="block w-full h-[150px] sm:h-[180px] transition-[background-color] duration-700" style={{ backgroundColor: sol >= 1 ? P.mostaza : P.rosa }} aria-hidden="true">
      {/* Banda de luz que crece con el sol */}
      <rect x="0" y="0" width="360" height={60 + sol * 60} fill={P.mostaza} opacity={0.35 + sol * 0.45} className="transition-all duration-700 motion-reduce:transition-none" />
      <circle cx="270" cy={y} r="26" fill={P.cal} opacity="0.55" className="transition-all duration-700 motion-reduce:transition-none" />
      <circle cx="270" cy={y} r="18" fill={P.cal} className="transition-all duration-700 motion-reduce:transition-none" />
      {/* Cerros (capas con sombra dura) */}
      <path d="M0 104 C50 76 92 80 130 96 C170 70 230 66 280 88 C312 76 340 78 360 86 V150 H0z" fill={P.serenidad} />
      <path d="M0 116 C60 98 120 104 170 114 C230 100 300 98 360 108 V150 H0z" fill={P.profundo} />
      {/* Toldos de la feria */}
      {[0, 120, 240].map((x, i) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <rect x="6" y="104" width="4" height="46" fill={P.maderaOscura} />
          <rect x="110" y="104" width="4" height="46" fill={P.maderaOscura} />
          <path d="M0 98 L60 82 L120 98 V108 H0z" fill={i === 1 ? P.naranja : P.cal} />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={`M${k * 20} 108 q10 9 20 0`} fill={i === 1 ? P.naranja : P.cal} />
          ))}
          {[1, 3, 5].map((k) => (
            <path key={k} d={`M${k * 20 - 20} 98 L${k * 20} 93 L${k * 20} 108 L${k * 20 - 20} 108z`} fill={i === 1 ? P.grano : P.naranja} opacity="0.9" />
          ))}
        </g>
      ))}
    </svg>
  );
}
