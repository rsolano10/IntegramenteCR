import { useState } from "react";
import { nombreFigura, nombreFlecha } from "../../../lib/actividades/bancos/figuras";
import { revisarIguales, type EjercicioIguales } from "../../../lib/actividades/encontrarIguales";
import type { ParamsRoseton } from "../../../lib/actividades/roseton";
import { usePista, type Control } from "../interactivas/comun";
import { Boton } from "../interactivas/ui";
import { Figura } from "../interactivas/Figura";
import { Roseton } from "./Ornamento";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «El taller de carretas» (encontrar-iguales). Taller de pintura de carretas:
// la rueda modelo cuelga de un clavo en la pared; las ruedas recién pintadas
// esperan sobre el piso. Se tocan todas las iguales al modelo y «Listo». La
// dificultad sube acercando los parámetros de las ruedas distractoras (todas
// generadas con el rosetón). Al final, la carreta queda armada.

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioIguales; ctl: Control }) {
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [devueltas, setDevueltas] = useState<number[]>([]);
  const [marcaPista, setMarcaPista] = useState<number | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const { faltan } = revisarIguales(ej, marcadas);
    if (faltan.length) {
      setMarcaPista(faltan[0]);
      ctl.aviso("Mirá la rueda marcada.");
    }
  });

  function listo() {
    const r = revisarIguales(ej, marcadas);
    if (r.correcto) {
      setHecho(true);
      return ctl.listo();
    }
    if (r.sobran.length) {
      setDevueltas(r.sobran);
      setMarcadas((m) => m.filter((x) => !r.sobran.includes(x)));
      return ctl.reintento(r.faltan.length ? "Devolvimos las que no eran iguales. Aún queda alguna por encontrar." : "Devolvimos las que no eran iguales.");
    }
    ctl.reintento("Aún queda alguna por encontrar.");
  }

  const cols = ej.celdas.length > 9 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Pared>
          {/* Rueda modelo colgada de un clavo */}
          <div className="relative flex flex-col items-center pt-2">
            <span aria-hidden="true" className="w-3 h-3 rounded-full" style={{ background: P.tierra }} />
            <span aria-hidden="true" className="w-0.5 h-3" style={{ background: P.tierra }} />
            <div role="img" aria-label={`Rueda modelo${ej.contenido === "ruedas" ? "" : `: ${nombre(ej, ej.modelo)}`}`}>
              <Rueda ej={ej} valor={ej.modelo} size={L ? 112 : 100} />
            </div>
            {hecho && (
              <span className="absolute right-3 bottom-1 motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]" aria-hidden="true">
                <Carreta ej={ej} chica />
              </span>
            )}
          </div>
        </Pared>
        {/* Piso del taller: las ruedas recién pintadas (la mesa de juego) */}
        <div className="px-3 pt-4 pb-4" style={{ background: `repeating-linear-gradient(90deg, ${P.maderaClara} 0 38px, #CF9A5E 38px 40px)`, borderTop: `8px solid ${P.madera}` }}>
          <ul className={`list-none m-0 p-0 mx-auto max-w-[480px] grid gap-3 ${cols}`} aria-label="Ruedas">
            {ej.celdas.map((v, i) => {
              const el = marcadas.includes(i);
              const est = estiloPieza(hecho ? (el ? "quieta" : "reposo") : el ? "elegida" : marcaPista === i ? "pista" : devueltas.includes(i) ? "regreso" : "reposo");
              return (
                <li key={i} className={hecho && !el ? "opacity-40" : ""}>
                  <button
                    type="button"
                    aria-pressed={el}
                    aria-label={`${ej.contenido === "ruedas" ? `Rueda ${i + 1}` : nombre(ej, v)}${marcaPista === i ? ". Esta es igual al modelo" : ""}`}
                    onClick={() => {
                      if (hecho) return;
                      setMarcaPista(null);
                      setDevueltas([]);
                      setMarcadas((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
                    }}
                    className={`${clasePieza} ${est.className} w-full aspect-square rounded-full flex items-center justify-center`}
                    style={{ ...est.style, background: P.maderaOscura }}
                  >
                    <Rueda ej={ej} valor={v} size="100%" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {!hecho && (
        <Boton onClick={listo} disabled={!marcadas.length} large={L} className="w-full">
          Listo
        </Boton>
      )}
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>{hecho ? "¡La carreta ya tiene sus ruedas!" : "Tocá todas las ruedas iguales a la del clavo."}</p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  const ej: EjercicioIguales = {
    contenido: "ruedas",
    modelo: "m",
    celdas: [],
    ruedas: { m: { petalos: 8, anillos: 2, forma: "gota", colores: [P.naranja, P.mostaza, P.grano, P.cal], puntos: true } },
  };
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Pared>
        <div className={`flex justify-center py-3 ${final ? "motion-safe:animate-[pueblo-aparece_480ms_ease-out_both]" : ""}`}>{final ? <Carreta ej={ej} /> : <Rueda ej={ej} valor="m" size={110} />}</div>
      </Pared>
      <div className="h-6" style={{ background: P.maderaClara, borderTop: `8px solid ${P.madera}` }} />
    </div>
  );
}

// ─── Dibujo ───

function nombre(ej: EjercicioIguales, v: string): string {
  if (ej.contenido === "figuras") return nombreFigura(v)?.nombre.replace(/^(el|la) /, "") ?? nombreFlecha[v] ?? v;
  return v;
}

// Rueda de carreta: aro de madera y el rosetón pintado. Para letras, números
// o figuras, la rueda lleva ese valor pintado en la maza.
function Rueda({ ej, valor, size }: { ej: EjercicioIguales; valor: string; size: number | string }) {
  const params: ParamsRoseton | undefined = ej.ruedas?.[valor];
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r="48" fill={P.maderaOscura} />
        <circle cx="50" cy="50" r="42" fill={params ? P.cal : P.naranja} />
      </svg>
      {params ? (
        <Roseton params={params} size="84%" className="relative" />
      ) : (
        <span className="relative w-[58%] h-[58%] rounded-full flex items-center justify-center font-rotulo text-[clamp(18px,7vw,30px)]" style={{ background: P.cal, color: P.tierra }}>
          {ej.contenido === "figuras" ? <Figura id={valor} size={34} /> : valor}
        </span>
      )}
    </span>
  );
}

// La carreta pintada, de perfil, con su rueda.
function Carreta({ ej, chica = false }: { ej: EjercicioIguales; chica?: boolean }) {
  const w = chica ? 120 : 260;
  return (
    <span className="relative inline-block" style={{ width: w, height: w * 0.55 }}>
      <svg viewBox="0 0 260 140" className="absolute inset-0 w-full h-full">
        {/* Lanza */}
        <rect x="0" y="78" width="70" height="8" rx="3" fill={P.maderaOscura} />
        {/* Cajón pintado */}
        <path d="M60 20 h180 l-10 70 h-160z" fill={P.naranja} />
        <path d="M60 20 h180 v10 h-180z" fill={P.grano} />
        {[90, 150, 210].map((x) => (
          <g key={x} transform={`translate(${x - 16} 40) scale(0.32)`}>
            <circle cx="50" cy="50" r="46" fill={P.mostaza} />
            <circle cx="50" cy="50" r="22" fill={P.cal} />
          </g>
        ))}
      </svg>
      <span className="absolute" style={{ left: w * 0.42, top: w * 0.2 }}>
        <Rueda ej={ej} valor={ej.modelo} size={w * 0.4} />
      </span>
    </span>
  );
}

// Pared del taller: tablones, herramientas colgadas y tarros de pintura.
function Pared({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      <svg viewBox="0 0 360 140" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <rect x="0" y="0" width="360" height="140" fill={P.beige} />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 40} y="0" width="2" height="140" fill={P.tierra} opacity="0.08" />
        ))}
        {/* Serrucho y martillo */}
        <path d="M24 30 h46 l-6 16 h-40z" fill={P.serenidad} />
        <rect x="68" y="26" width="16" height="24" rx="4" fill={P.madera} />
        <rect x="290" y="30" width="8" height="46" fill={P.madera} />
        <rect x="278" y="24" width="32" height="12" rx="2" fill={P.profundo} />
        {/* Tarros de pintura */}
        <rect x="16" y="104" width="110" height="5" fill={P.madera} />
        {[22, 50, 78].map((x, i) => (
          <g key={x}>
            <rect x={x} y="82" width="22" height="22" rx="2" fill={[P.naranja, P.grano, P.mostaza][i]} />
            <rect x={x - 1} y="80" width="24" height="4" fill={P.tierra} opacity="0.4" />
          </g>
        ))}
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
