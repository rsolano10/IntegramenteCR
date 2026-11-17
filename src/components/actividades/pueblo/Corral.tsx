import { useState, type ReactNode } from "react";
import { NOMBRE_ESPECIE, ROTULO, porton, portones, type Animal, type EjercicioCorral, type Especie } from "../../../lib/actividades/corral";
import { leerEnVoz } from "../../../lib/voz";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { Letrero } from "./Ornamento";
import { sombraCapa } from "./pieza";

// «El corral». La finca de tarde: el rótulo de madera sobre los dos
// portones dice la regla; los animales esperan en fila afuera. La persona
// toca el portón que le toca al primero de la fila. Cuando el rótulo
// cambia, se voltea (y, si así se configuró, se anuncia y se lee).

interface Config {
  avisarCambio: boolean;
}

const nombreAnimal = (a: Animal) =>
  `${NOMBRE_ESPECIE[a.especie].uno} ${a.tamano === "grande" ? "grande" : "pequeño"}${a.especie === "gallina" ? (a.color === "cafe" ? " café" : " blanca") : a.color === "cafe" ? " café" : " blanco"}`;

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioCorral; config: Config; ctl: Control }) {
  const [t, setT] = useState(0);
  const [i, setI] = useState(0);
  const [corrales, setCorrales] = useState<[Animal[], Animal[]]>([[], []]);
  const [resalta, setResalta] = useState(false);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const tramo = ej.tramos[t];
  const animal = tramo.animales[i];
  const [izq, der] = portones(tramo.criterio, ej.especies);

  usePista(ctl.pista, () => {
    setResalta(true);
    setTimeout(() => setResalta(false), 2600);
    leerEnVoz(`${ROTULO[tramo.criterio]}: ${izq} a la izquierda, ${der} a la derecha.`, () => {});
  });

  function mandar(lado: 0 | 1) {
    if (hecho) return;
    if (porton(animal, tramo.criterio, ej.especies) !== lado) return ctl.reintento("Ese portón no es. Mirá el rótulo.");
    setCorrales((c) => {
      const n: [Animal[], Animal[]] = [[...c[0]], [...c[1]]];
      n[lado].push(animal);
      return n;
    });
    if (i < tramo.animales.length - 1) return setI(i + 1);
    if (t < ej.tramos.length - 1) {
      const sig = ej.tramos[t + 1].criterio;
      // Con la regla nueva, los corrales se vacían: los portones dicen otra cosa.
      setTimeout(() => setCorrales([[], []]), 450);
      setT(t + 1);
      setI(0);
      if (config.avisarCambio) {
        ctl.aviso(`¡Cambió el rótulo! Ahora: ${ROTULO[sig].toLowerCase()}.`);
        leerEnVoz(`Cambió el rótulo. Ahora, ${ROTULO[sig].toLowerCase()}.`, () => {});
      } else ctl.acierto();
      return;
    }
    setHecho(true);
    ctl.listo();
  }

  const fila = hecho ? [] : tramo.animales.slice(i, i + 4);

  return (
    <div className="grid gap-4">
      <Letrero large={L} arriba>
        {hecho ? "¡Todos los animales quedaron en su corral!" : `¿A qué portón va ${a(animal)}?`}
      </Letrero>
      <div className="overflow-hidden rounded-[20px] pueblo-grano" style={{ ...sombraCapa, backgroundColor: P.rosa }}>
        {/* El rótulo de la regla, que se voltea al cambiar */}
        <div className="flex justify-center pt-4 px-3" style={{ perspective: 600 }}>
          <p
            key={tramo.criterio + t}
            className={`m-0 px-6 py-2 rounded-[6px] font-rotulo leading-tight text-center motion-safe:animate-[pueblo-volteo_600ms_ease-out] ${L ? "text-[30px]" : "text-[26px]"}`}
            style={{
              background: P.madera,
              color: P.cal,
              boxShadow: "0 4px 0 rgba(51,36,28,0.35)",
              outline: resalta ? `4px solid ${P.mostaza}` : "none",
              outlineOffset: 4,
            }}
            aria-live="polite"
          >
            {ROTULO[tramo.criterio]}
          </p>
        </div>
        {/* Los dos corrales con su portón */}
        <div className="grid grid-cols-2 gap-3 px-3 pt-4 pb-3">
          {([0, 1] as const).map((lado) => (
            <button
              key={lado}
              type="button"
              onClick={() => mandar(lado)}
              disabled={hecho}
              aria-label={`Portón: ${lado === 0 ? izq : der}`}
              className="relative flex flex-col rounded-[14px] border-0 p-0 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform disabled:cursor-default"
              style={{ background: "#B9C98F", boxShadow: "0 4px 0 rgba(51,36,28,0.3)" }}
            >
              <span
                className={`block px-2 py-1.5 font-bold leading-tight text-center ${L ? "text-[20px]" : "text-[17px]"}`}
                style={{ background: P.cal, color: P.tierra, borderBottom: `3px solid ${P.madera}` }}
              >
                {lado === 0 ? izq : der}
              </span>
              <span className="relative block min-h-[120px] sm:min-h-[150px] p-2">
                <span className="flex flex-wrap gap-0.5 justify-center">
                  {corrales[lado].map((a, k) => (
                    <DibujoAnimal key={k} a={a} size={L ? 34 : 30} />
                  ))}
                </span>
                <Cerca cerrada={hecho} />
              </span>
            </button>
          ))}
        </div>
        {/* La fila de animales que esperan */}
        <div className="flex items-end justify-center gap-3 px-3 pb-4 min-h-[110px]" style={{ background: "#C9A26B" }}>
          {fila.map((a, k) => (
            <span key={`${t}-${i + k}`} className={k === 0 ? "motion-safe:animate-[pueblo-asentar_320ms_ease-out]" : ""} style={{ opacity: k === 0 ? 1 : 0.55 }}>
              <DibujoAnimal a={a} size={k === 0 ? (L ? 96 : 84) : 44} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const a = (x: Animal) => (x.especie === "gallina" ? "la " : "el ") + nombreAnimal(x);

export function Portada({ final = false }: { final?: boolean }) {
  const ej: Animal[] = [
    { especie: "gallina", color: "cafe", tamano: "grande" },
    { especie: "cerdo", color: "blanco", tamano: "grande" },
    { especie: "ternero", color: "cafe", tamano: "pequeno" },
  ];
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px] pueblo-grano" style={{ ...sombraCapa, backgroundColor: P.rosa }} aria-hidden="true">
      <div className="flex justify-center pt-3">
        <span className="px-4 py-1 rounded-[5px] font-rotulo text-[20px]" style={{ background: P.madera, color: P.cal }}>
          Por animal
        </span>
      </div>
      <div className="relative flex items-end justify-center gap-4 h-[120px] px-4" style={{ background: "linear-gradient(transparent 55%, #B9C98F 55%)" }}>
        {ej.map((x, k) => (
          <DibujoAnimal key={k} a={x} size={final ? 52 : 70} />
        ))}
        <Cerca cerrada={final} />
      </div>
    </div>
  );
}

// ─── Dibujos ───

function Cerca({ cerrada }: { cerrada: boolean }) {
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-8 pointer-events-none" aria-hidden="true">
      <path d="M0 10 h100 M0 22 h100" stroke={P.madera} strokeWidth="3" />
      {[4, 28, 52, 76, 96].map((x) => (
        <rect key={x} x={x - 2} y="4" width="4" height="26" fill={P.maderaOscura} />
      ))}
      {cerrada && <path d="M30 6 L70 26 M30 26 L70 6" stroke={P.madera} strokeWidth="3" className="motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]" />}
    </svg>
  );
}

const CUERPO = { cafe: P.madera, blanco: P.cal };

export function DibujoAnimal({ a, size }: { a: Animal; size: number }) {
  const f = CUERPO[a.color];
  const escala = a.tamano === "grande" ? 1 : 0.68;
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-label={nombreAnimal(a)} role="img" className="shrink-0">
      <g transform={`translate(30 58) scale(${escala}) translate(-30 -58)`} stroke={linea} strokeWidth="1.6" strokeLinejoin="round">
        {DIBUJOS[a.especie](f)}
      </g>
    </svg>
  );
}

const linea = P.tierra;
const DIBUJOS: Record<Especie, (f: string) => ReactNode> = {
  gallina: (f) => (
    <>
      <path d="M12 30 c-6 -8 -4 -16 2 -18 c2 6 4 8 8 10z" fill={f} />
      <ellipse cx="30" cy="38" rx="16" ry="12" fill={f} />
      <circle cx="44" cy="22" r="7" fill={f} />
      <path d="M41 15 c1 -4 4 -4 5 -1 c1 -3 4 -2 3 2z" fill={P.grano} />
      <path d="M50 22 l6 2 l-6 2z" fill={P.mostaza} />
      <path d="M46 28 c1 3 -1 5 -2 4" fill={P.grano} />
      <circle cx="45" cy="21" r="1" fill={linea} />
      <path d="M26 50 v7 M34 50 v7 M24 57 h5 M32 57 h5" stroke={P.naranja} strokeWidth="2" />
    </>
  ),
  chompipe: (f) => (
    <>
      {[-50, -25, 0, 25, 50].map((r) => (
        <ellipse key={r} cx="22" cy="20" rx="5" ry="16" fill={f} transform={`rotate(${r} 22 34)`} />
      ))}
      <ellipse cx="30" cy="40" rx="15" ry="11" fill={f} />
      <path d="M42 34 c4 -4 6 -12 4 -18 c4 0 6 4 5 8 c-1 4 -4 8 -7 12z" fill={f} />
      <path d="M50 16 c2 4 0 9 -2 10" fill={P.grano} />
      <path d="M51 14 l5 2 l-5 2z" fill={P.mostaza} />
      <circle cx="49" cy="14" r="1" fill={linea} />
      <path d="M26 50 v7 M34 50 v7 M24 57 h5 M32 57 h5" stroke={P.naranja} strokeWidth="2" />
    </>
  ),
  ternero: (f) => (
    <>
      <rect x="10" y="22" width="34" height="20" rx="9" fill={f} />
      <path d="M14 40 v16 M22 40 v16 M34 40 v16 M41 40 v16" strokeWidth="3.5" stroke={f === P.cal ? P.tierra : P.maderaOscura} />
      <path d="M10 28 c-4 2 -6 8 -4 12" fill="none" />
      <rect x="40" y="12" width="15" height="17" rx="6" fill={f} />
      <ellipse cx="38" cy="15" rx="5" ry="2.5" fill={f} />
      <ellipse cx="57" cy="15" rx="5" ry="2.5" fill={f} />
      <ellipse cx="48" cy="26" rx="6" ry="4" fill={P.rosa} />
      <circle cx="45" cy="18" r="1" fill={linea} />
      <circle cx="51" cy="18" r="1" fill={linea} />
      {f === P.cal && <ellipse cx="22" cy="30" rx="6" ry="4" fill={P.madera} stroke="none" />}
    </>
  ),
  cerdo: (f) => (
    <>
      <ellipse cx="28" cy="36" rx="20" ry="14" fill={f === P.cal ? "#F2C9C0" : f} />
      <path d="M8 34 c-6 -2 -4 -8 0 -6" fill="none" />
      <circle cx="47" cy="30" r="9" fill={f === P.cal ? "#F2C9C0" : f} />
      <ellipse cx="54" cy="32" rx="4" ry="5" fill={P.rosa} />
      <circle cx="53" cy="31" r="0.8" fill={linea} />
      <circle cx="55" cy="33" r="0.8" fill={linea} />
      <path d="M44 22 l2 -6 l4 5z" fill={f === P.cal ? "#F2C9C0" : f} />
      <circle cx="47" cy="27" r="1" fill={linea} />
      <path d="M16 46 v10 M24 47 v10 M34 47 v10 M40 46 v10" strokeWidth="3.5" />
    </>
  ),
};
