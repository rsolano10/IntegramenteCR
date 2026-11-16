import { useState } from "react";
import { LUGARES, OBJETOS, lugarEsPiso, revisarCorredor, type EjercicioCorredor, type Puesto } from "../../../lib/actividades/queCambio";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { P } from "./paleta";
import { clasePieza, sombraCapa } from "./pieza";

// «El corredor» (qué cambió). El corredor de una casa de adobe: pared
// encalada con zócalo, horcones de madera, piso de cemento lujado y el gato
// dormido en una esquina. Primero se mira («Ya lo vi»); después el mismo
// corredor con cambios: se toca lo que cambió (también el lugar vacío de lo
// que desapareció) y «Listo». Lo que no era un cambio se desmarca solo.

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioCorredor; config: { permitirVerDeNuevo: boolean }; ctl: Control }) {
  const [fase, setFase] = useState<"mirar" | "buscar">("mirar");
  const [viendo, setViendo] = useState(false);
  const [tocados, setTocados] = useState<number[]>([]);
  const [pistas, setPistas] = useState<number[]>([]);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const mirando = fase === "mirar" || viendo;
  const escena = mirando ? ej.antes : ej.despues;

  usePista(ctl.pista, () => {
    const falta = ej.cambios.find((c) => !c.lugares.some((i) => tocados.includes(i)) && !c.lugares.some((i) => pistas.includes(i)));
    if (!falta) return;
    setPistas((p) => [...p, falta.lugares[falta.lugares.length - 1]]);
    ctl.aviso("Mirá la parte del corredor marcada con amarillo.");
  });

  function tocar(i: number) {
    if (mirando || hecho) return;
    setTocados((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  }

  function listo() {
    const r = revisarCorredor(ej, tocados);
    if (r.completo) {
      setHecho(true);
      return ctl.listo();
    }
    if (r.sobran.length) setTocados((t) => t.filter((i) => !r.sobran.includes(i)));
    ctl.reintento(r.faltan ? (r.faltan === 1 ? "Todavía falta encontrar un cambio." : `Todavía faltan ${r.faltan} cambios.`) : "Algo de lo que tocaste no cambió.");
  }

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Escena puestos={escena} tocados={mirando ? [] : tocados} pistas={mirando ? [] : pistas} onTocar={mirando || hecho ? undefined : tocar} gato={hecho ? "estira" : "duerme"} />
        {mirando && fase === "buscar" && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[16px] font-bold" style={{ background: P.mostaza, color: P.tierra }}>
            Así estaba antes
          </span>
        )}
      </div>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {fase === "mirar" ? "Mirá bien todo lo que hay en el corredor." : hecho ? "¡Encontraste lo que cambió!" : ej.cambios.length === 1 ? "Algo cambió. Tocá lo que cambió." : `Cambiaron ${ej.cambios.length} cosas. Tocalas.`}
      </p>
      {!hecho && (
        <Acciones ctl={ctl}>
          {fase === "mirar" ? (
            <Boton onClick={() => setFase("buscar")} large={L}>
              Ya lo vi
            </Boton>
          ) : (
            <>
              <Boton onClick={listo} disabled={!tocados.length || viendo} large={L}>
                Listo
              </Boton>
              {config.permitirVerDeNuevo && (
                <Boton variante="secundario" onClick={() => setViendo((v) => !v)} large={L}>
                  {viendo ? "Volver" : "Ver de nuevo"}
                </Boton>
              )}
            </>
          )}
        </Acciones>
      )}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  const muestra: (Puesto | null)[] = Array(LUGARES).fill(null);
  muestra[1] = { objeto: "jaula", color: "#F6F1E4" };
  muestra[3] = { objeto: "sombrero", color: "#E2B13A" };
  muestra[6] = { objeto: "helecho", color: "#E2582A" };
  muestra[8] = { objeto: "reloj", color: "#3f6a70" };
  muestra[11] = { objeto: "mecedora", color: "#5E3B22" };
  muestra[13] = { objeto: "lata", color: "#A8232B" };
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Escena puestos={muestra} tocados={[]} pistas={[]} gato={final ? "estira" : "duerme"} chica />
    </div>
  );
}

// ─── Dibujo ───

function Escena({
  puestos,
  tocados,
  pistas,
  onTocar,
  gato,
  chica = false,
}: {
  puestos: (Puesto | null)[];
  tocados: number[];
  pistas: number[];
  onTocar?: (i: number) => void;
  gato: "duerme" | "estira";
  chica?: boolean;
}) {
  const celda = (i: number) => {
    const p = puestos[i];
    const o = p ? OBJETOS.find((x) => x.id === p.objeto) : undefined;
    const marcado = tocados.includes(i);
    const pista = pistas.includes(i);
    const contenido = p ? <Objeto id={p.objeto} color={p.color} /> : <span className="block w-full h-full" />;
    const estilo = {
      outline: marcado ? `4px solid ${P.mostaza}` : pista ? `3px dashed ${P.mostaza}` : undefined,
      outlineOffset: -2,
      background: marcado ? "rgba(244,208,150,0.35)" : "transparent",
    };
    if (!onTocar)
      return (
        <span key={i} className="relative aspect-square rounded-[12px]" style={estilo}>
          {contenido}
        </span>
      );
    return (
      <button
        key={i}
        type="button"
        onClick={() => onTocar(i)}
        aria-pressed={marcado}
        aria-label={`${o ? o.nombre[0].toUpperCase() + o.nombre.slice(1) : "Lugar vacío"}${lugarEsPiso(i) ? ", en el piso" : ", en la pared"}${pista ? ". Mirá acá" : ""}`}
        className={`${clasePieza} aspect-square rounded-[12px] hover:bg-[rgba(244,208,150,0.2)]`}
        style={estilo}
      >
        {contenido}
        {marcado && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-extrabold" style={{ background: P.mostaza, color: P.tierra }} aria-hidden="true">
            ✓
          </span>
        )}
      </button>
    );
  };
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      {/* Alero de teja y viga */}
      <div className="h-5" style={{ background: `repeating-linear-gradient(90deg, #B4543A 0 22px, #9C4430 22px 24px)`, boxShadow: "0 3px 0 rgba(51,36,28,0.25)" }} />
      <div className="h-2.5" style={{ background: P.madera }} />
      <div className={`relative mx-auto max-w-[560px] ${chica ? "px-6 pt-3" : "px-4 pt-4 sm:px-8"}`}>
        {/* Horcones */}
        <span aria-hidden="true" className="absolute top-0 bottom-0 left-1 w-3" style={{ background: P.madera }} />
        <span aria-hidden="true" className="absolute top-0 bottom-0 right-1 w-3" style={{ background: P.madera }} />
        {/* Pared: dos filas de cinco */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">{Array.from({ length: 10 }, (_, i) => celda(i))}</div>
      </div>
      {/* Zócalo */}
      <div className="h-3 mt-2" style={{ background: P.serenidad, opacity: 0.55 }} />
      {/* Piso de ladrillo con lo del piso y el gato */}
      {/* Piso de cemento lujado con mosaico (claro: todo lo de encima contrasta) */}
      <div className="relative pt-2 pb-8" style={{ background: `repeating-linear-gradient(90deg, #E2D8C0 0 46px, #CFC3A6 46px 48px)` }}>
        <div className={`relative mx-auto max-w-[560px] ${chica ? "px-6" : "px-4 sm:px-8"}`}>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">{Array.from({ length: 5 }, (_, k) => celda(10 + k))}</div>
        </div>
        <Gato estado={gato} />
      </div>
    </div>
  );
}

// El gato, sin rostro detallado: dormido (enroscado) o estirándose al final.
function Gato({ estado }: { estado: "duerme" | "estira" }) {
  return (
    <svg viewBox="0 0 80 40" className="absolute bottom-0 right-4 w-[60px] sm:w-[72px] h-auto pointer-events-none" aria-hidden="true">
      {estado === "duerme" ? (
        <g>
          <ellipse cx="40" cy="32" rx="26" ry="6" fill={P.tierra} opacity="0.2" />
          <path d="M16 30 C14 16 30 10 44 12 C58 14 66 22 62 30z" fill={P.tinta} />
          <circle cx="22" cy="24" r="8" fill={P.tinta} />
          <path d="M16 18 l2 -7 l4 5z M24 16 l4 -6 l2 7z" fill={P.tinta} />
          <path d="M62 30 C70 30 72 22 66 20" stroke={P.tinta} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g className="motion-safe:animate-[pueblo-aparece_480ms_ease-out_both]">
          <ellipse cx="40" cy="36" rx="30" ry="4" fill={P.tierra} opacity="0.2" />
          <path d="M14 34 L18 22 C24 16 50 16 58 20 L66 34 L60 34 L56 26 L26 26 L22 34z" fill={P.tinta} />
          <circle cx="62" cy="16" r="7" fill={P.tinta} />
          <path d="M57 11 l1 -7 l4 5z M64 9 l4 -5 l1 7z" fill={P.tinta} />
          <path d="M18 22 C10 14 8 8 12 4" stroke={P.tinta} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Las cosas del corredor, planas, en un lienzo de 60 × 60.
function Objeto({ id, color }: { id: string; color: string }) {
  const T = P.tierra;
  const d = (() => {
    switch (id) {
      case "jaula":
        return (
          <>
            <path d="M30 4 V10" stroke={T} strokeWidth="2" />
            <path d="M12 50 V26 C12 14 48 14 48 26 V50z" fill={color} stroke={T} strokeWidth="2.5" />
            {[18, 24, 30, 36, 42].map((x) => <path key={x} d={`M${x} 18 V50`} stroke={T} strokeWidth="1.6" />)}
            <rect x="9" y="48" width="42" height="6" rx="2" fill={T} />
          </>
        );
      case "sombrero":
        return (
          <>
            <circle cx="30" cy="8" r="2" fill={T} />
            <ellipse cx="30" cy="38" rx="27" ry="8" fill={color} stroke={T} strokeWidth="2" />
            <path d="M17 38 C17 20 43 20 43 38z" fill={color} stroke={T} strokeWidth="2" />
            <path d="M17 34 h26" stroke={T} strokeWidth="4" />
          </>
        );
      case "farol":
        return (
          <>
            <path d="M30 2 V10" stroke={T} strokeWidth="2" />
            <path d="M20 14 h20 l-4 -5 h-12z" fill={color} />
            <rect x="19" y="14" width="22" height="30" rx="3" fill="#F7E3B0" stroke={color} strokeWidth="4" />
            <path d="M30 22 c-4 6 -3 12 0 14 c3 -2 4 -8 0 -14z" fill={P.naranja} />
            <rect x="17" y="44" width="26" height="6" rx="2" fill={color} />
          </>
        );
      case "reloj":
        return (
          <>
            <rect x="16" y="6" width="28" height="48" rx="8" fill={color} />
            <circle cx="30" cy="22" r="11" fill={P.cal} stroke={T} strokeWidth="2" />
            <path d="M30 22 V15 M30 22 l5 3" stroke={T} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M30 34 V46" stroke={P.mostaza} strokeWidth="2" />
            <circle cx="30" cy="47" r="3.5" fill={P.mostaza} />
          </>
        );
      case "helecho":
        return (
          <>
            <path d="M18 4 L30 22 L42 4" stroke={T} strokeWidth="1.5" fill="none" />
            {[-26, -12, 0, 12, 26].map((r) => (
              <path key={r} d="M30 30 C30 42 30 50 30 58" stroke={P.profundo} strokeWidth="4" fill="none" strokeLinecap="round" transform={`rotate(${r} 30 30)`} />
            ))}
            <path d="M16 22 h28 l-4 12 h-20z" fill={color} />
          </>
        );
      case "plato":
        return (
          <>
            <circle cx="30" cy="30" r="24" fill={P.cal} stroke={T} strokeWidth="2" />
            <circle cx="30" cy="30" r="17" fill="none" stroke={color} strokeWidth="5" />
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <ellipse key={r} cx="30" cy="22" rx="3" ry="6" fill={color} transform={`rotate(${r} 30 30)`} />
            ))}
            <circle cx="30" cy="30" r="3" fill={color} />
          </>
        );
      case "canasta":
        return (
          <>
            <path d="M14 26 C14 6 46 6 46 26" stroke={T} strokeWidth="3" fill="none" />
            <path d="M8 26 h44 l-6 26 h-32z" fill={color} />
            {[32, 40].map((y) => <path key={y} d={`M10 ${y} h40`} stroke={T} strokeOpacity="0.35" strokeWidth="2" />)}
          </>
        );
      case "almanaque":
        return (
          <>
            <rect x="12" y="8" width="36" height="44" rx="2" fill={P.cal} stroke={T} strokeWidth="2" />
            <rect x="12" y="8" width="36" height="14" fill={color} />
            {[0, 1, 2].map((f) => [0, 1, 2, 3].map((k) => <rect key={`${f}${k}`} x={16 + k * 8} y={27 + f * 8} width="5" height="5" fill={T} opacity="0.35" />))}
          </>
        );
      case "ristra":
        return (
          <>
            <path d="M30 2 V54" stroke={P.maderaClara} strokeWidth="3" />
            {[12, 24, 36, 48].map((y, i) => (
              <g key={y}>
                <circle cx={i % 2 ? 36 : 24} cy={y} r="8" fill={color} stroke={T} strokeOpacity="0.4" strokeWidth="1.5" />
              </g>
            ))}
          </>
        );
      case "mecedora":
        return (
          <>
            <path d="M14 8 V40 M46 8 V40" stroke={color} strokeWidth="5" strokeLinecap="round" />
            <path d="M14 14 h32 M14 22 h32 M14 30 h32" stroke={color} strokeWidth="3" />
            <path d="M10 38 h40" stroke={color} strokeWidth="5" />
            <path d="M6 50 C18 58 42 58 56 46" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M16 40 L14 52 M44 40 L46 50" stroke={color} strokeWidth="4" />
          </>
        );
      case "banca":
        return (
          <>
            <rect x="4" y="24" width="52" height="9" rx="2" fill={color} />
            <rect x="6" y="14" width="48" height="6" rx="2" fill={color} />
            <path d="M10 33 V52 M50 33 V52 M10 20 V24 M50 20 V24" stroke={color} strokeWidth="5" />
          </>
        );
      case "lata":
        return (
          <>
            {[14, 24, 34, 44].map((x, i) => (
              <g key={x}>
                <path d={`M${x} 28 C${x} 20 ${30} 16 ${30} 12`} stroke={P.profundo} strokeWidth="2" fill="none" />
                <circle cx={x} cy={i % 2 ? 12 : 18} r="6" fill={color} />
                <circle cx={x} cy={i % 2 ? 12 : 18} r="2" fill={P.mostaza} />
              </g>
            ))}
            <rect x="16" y="28" width="28" height="28" rx="3" fill="#A9B4B6" stroke={T} strokeWidth="2" />
            <path d="M16 36 h28 M16 48 h28" stroke={T} strokeOpacity="0.4" strokeWidth="2" />
          </>
        );
      case "tinaja":
        return (
          <>
            <path d="M22 8 h16 v6 C52 20 54 44 42 54 H18 C6 44 8 20 22 14z" fill={color} />
            <path d="M14 30 h32" stroke={P.cal} strokeOpacity="0.5" strokeWidth="3" />
            <rect x="20" y="6" width="20" height="5" rx="2" fill={T} opacity="0.5" />
          </>
        );
      case "regadera":
        return (
          <>
            <path d="M14 22 h26 v30 h-26z" fill={color} />
            <path d="M40 30 L56 16" stroke={color} strokeWidth="5" strokeLinecap="round" />
            <circle cx="56" cy="15" r="4" fill={color} />
            <path d="M18 22 C18 8 36 8 36 22" stroke={color} strokeWidth="4" fill="none" />
          </>
        );
      case "botas":
        return (
          <>
            {[8, 32].map((x) => (
              <path key={x} d={`M${x} 6 h14 v36 h8 a4 4 0 0 1 0 10 h-22z`} fill={color} stroke={T} strokeOpacity="0.4" strokeWidth="1.5" />
            ))}
          </>
        );
      default:
        return null;
    }
  })();
  return (
    <svg viewBox="0 0 60 60" className="block w-full h-full p-1" aria-hidden="true">
      {d}
    </svg>
  );
}
