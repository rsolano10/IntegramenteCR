import { useState } from "react";
import { companera, continuar, estadoParejas, parejasCompletas, voltear, type Carta, type EjercicioParejas } from "../../../lib/actividades/parejas";
import { foco, usePista, type Control } from "./comun";
import { Figura } from "./Figura";
import { Boton, Check } from "./ui";

// «Encontrá las parejas»: dar vuelta dos cartas. Si no son pareja quedan a
// la vista hasta «Continuar» (nada se voltea solo ni con tiempo).
export function JuegoParejas({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioParejas; config: { numerarReverso: boolean }; ctl: Control }) {
  const [e, setE] = useState(estadoParejas);
  const [ultima, setUltima] = useState<number | null>(null);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const L = ctl.large;
  const cols = ej.cartas.length <= 6 ? "grid-cols-3" : ej.cartas.length <= 12 ? "grid-cols-3 min-[480px]:grid-cols-4" : "grid-cols-4";

  usePista(ctl.pista, () => {
    if (ultima !== null && !e.encontradas.includes(ultima)) setMarcadas([companera(ej, ultima)]);
    else {
      const libre = ej.cartas.find((c) => !e.encontradas.includes(c.id));
      if (libre) setMarcadas([libre.id, companera(ej, libre.id)]);
    }
    ctl.aviso("La carta marcada es la pareja.");
  });

  function tocar(c: Carta) {
    const r = voltear(ej, e, c.id);
    if (r.resultado === "nada") return;
    setE(r.estado);
    setUltima(c.id);
    setMarcadas((m) => m.filter((x) => x !== c.id && !r.estado.encontradas.includes(x)));
    if (r.resultado === "pareja") {
      if (parejasCompletas(ej, r.estado)) ctl.listo();
      else ctl.acierto("Muy bien, son pareja.");
    } else if (r.resultado === "distintas") ctl.reintento("No son pareja. Tocá «Continuar» para darlas vuelta.");
    else ctl.aviso("Ahora tocá otra carta.");
  }

  const cara = (c: Carta) =>
    c.cara.tipo === "icono" ? (
      <Figura id={c.cara.valor} size={L ? 56 : 48} />
    ) : (
      <span className={`px-1 text-center leading-tight break-words ${L ? "text-[20px]" : "text-[18px]"}`}>{c.cara.valor}</span>
    );
  const nombre = (c: Carta) => (c.cara.tipo === "icono" ? c.cara.nombre : c.cara.valor);

  return (
    <div className="grid gap-4">
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>{e.esperando ? "Mirá bien dónde están." : "Tocá dos cartas."}</p>
      <ul className={`list-none m-0 p-0 grid gap-3 ${cols}`} aria-label="Cartas">
        {ej.cartas.map((c, i) => {
          const encontrada = e.encontradas.includes(c.id);
          const arriba = encontrada || e.volteadas.includes(c.id);
          const marcada = marcadas.includes(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => tocar(c)}
                aria-disabled={arriba || e.esperando}
                aria-label={arriba ? `${nombre(c)}${encontrada ? ", pareja encontrada" : ""}` : `Carta ${i + 1}, boca abajo${marcada ? ". Es la pareja" : ""}`}
                className={`relative w-full aspect-[3/4] min-h-14 rounded-2xl flex items-center justify-center font-sans font-semibold cursor-pointer transition-colors motion-reduce:transition-none ${foco} ${
                  encontrada
                    ? "bg-campo border-2 border-semaforo-verde-texto text-tinta cursor-default"
                    : arriba
                      ? `bg-white text-tinta ${e.esperando ? "border-[3px] border-mostaza-vital" : "border-[3px] border-verde-profundo"}`
                      : marcada
                        ? "bg-verde-profundo text-white border-[4px] border-dashed border-mostaza-vital"
                        : "bg-verde-profundo text-white border-2 border-verde-profundo hover:bg-tinta"
                }`}
              >
                {encontrada && <Check />}
                {arriba ? cara(c) : config.numerarReverso ? <span className={L ? "text-[26px]" : "text-[24px]"}>{i + 1}</span> : <Reverso />}
              </button>
            </li>
          );
        })}
      </ul>
      {e.esperando && (
        <Boton onClick={() => setE(continuar(e))} autoFocus large={L} className="w-full">
          Continuar
        </Boton>
      )}
    </div>
  );
}

function Reverso() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#f4d096" strokeWidth="2" aria-hidden="true">
      <path d="M16 4 28 16 16 28 4 16z" />
      <circle cx="16" cy="16" r="3" fill="#f4d096" />
    </svg>
  );
}
