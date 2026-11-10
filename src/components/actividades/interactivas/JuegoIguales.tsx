import { useState } from "react";
import { nombreFigura, nombreFlecha } from "../../../lib/actividades/bancos/figuras";
import { revisarIguales, type EjercicioIguales } from "../../../lib/actividades/encontrarIguales";
import { claseFicha, usePista, type Control } from "./comun";
import { Figura } from "./Figura";
import { Boton, Check, Elegido } from "./ui";

// «Buscá los iguales»: tocar todos los que son iguales al modelo y «Listo».
export function JuegoIguales({ ejercicio: ej, ctl }: { ejercicio: EjercicioIguales; ctl: Control }) {
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [marcaPista, setMarcaPista] = useState<number | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const figuras = ej.contenido === "figuras";
  const nombre = (v: string) => (figuras ? (nombreFigura(v)?.nombre.replace(/^(el|la) /, "") ?? nombreFlecha[v] ?? v) : v);

  usePista(ctl.pista, () => {
    const { faltan } = revisarIguales(ej, marcadas);
    if (faltan.length) {
      setMarcaPista(faltan[0]);
      ctl.aviso("Mirá el que está marcado.");
    }
  });

  function tocar(i: number) {
    if (hecho) return;
    setMarcaPista(null);
    setMarcadas((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  }

  function listo() {
    const r = revisarIguales(ej, marcadas);
    if (r.correcto) {
      setHecho(true);
      return ctl.listo();
    }
    if (r.sobran.length) {
      // Los que no corresponden se desmarcan con suavidad.
      setMarcadas((m) => m.filter((x) => !r.sobran.includes(x)));
      return ctl.reintento(r.faltan.length ? "Quitamos los que no eran iguales. Aún queda alguno por encontrar." : "Quitamos los que no eran iguales.");
    }
    ctl.reintento("Aún queda alguno por encontrar.");
  }

  const tam = ej.celdas.length > 12 ? (L ? 44 : 38) : L ? 56 : 48;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4 rounded-2xl bg-verde-tenue border-2 border-verde-serenidad/50 p-3">
        <p className={`m-0 font-semibold text-tinta ${L ? "text-[22px]" : "text-[20px]"}`}>Modelo:</p>
        <span className={`min-w-16 min-h-16 px-3 rounded-2xl bg-white border-2 border-verde-profundo flex items-center justify-center font-semibold text-tinta ${L ? "text-[36px]" : "text-[32px]"}`} aria-label={`Modelo: ${nombre(ej.modelo)}`}>
          {figuras ? <Figura id={ej.modelo} size={L ? 56 : 48} /> : ej.modelo}
        </span>
      </div>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>Tocá todos los iguales al modelo.</p>

      <ul className={`list-none m-0 p-0 grid gap-3 ${ej.celdas.length > 12 ? "grid-cols-4 min-[480px]:grid-cols-5" : ej.celdas.length > 6 ? "grid-cols-3 min-[480px]:grid-cols-4" : "grid-cols-3"}`} aria-label="Elementos">
        {ej.celdas.map((v, i) => {
          const el = marcadas.includes(i);
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={el}
                aria-label={`${nombre(v)}${marcaPista === i ? ". Este es igual al modelo" : ""}`}
                onClick={() => tocar(i)}
                className={`${claseFicha({ elegida: el && !hecho, hecha: hecho && el, pista: marcaPista === i })} w-full aspect-square flex items-center justify-center ${L ? "text-[32px]" : "text-[28px]"}`}
              >
                {el && !hecho && <Elegido />}
                {hecho && el && <Check />}
                {figuras ? <Figura id={v} size={tam} /> : v}
              </button>
            </li>
          );
        })}
      </ul>

      {!hecho && (
        <Boton onClick={listo} disabled={!marcadas.length} large={L} className="w-full">
          Listo
        </Boton>
      )}
    </div>
  );
}
