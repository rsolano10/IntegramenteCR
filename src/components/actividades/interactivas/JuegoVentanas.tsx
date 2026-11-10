import { useState } from "react";
import { revisarPosiciones, type EjercicioPosiciones } from "../../../lib/actividades/recordarPosiciones";
import { foco, usePista, type Control } from "./comun";
import { Boton, Check } from "./ui";

// «Ventanas encendidas»: mirar, tocar «Ya lo memoricé» (sin temporizador) y
// después tocar las ventanas que estaban encendidas.
export function JuegoVentanas({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioPosiciones; config: { permitirVerDeNuevo: boolean }; ctl: Control }) {
  const [fase, setFase] = useState<"mirar" | "responder" | "hecho">("mirar");
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const L = ctl.large;
  const total = ej.filas * ej.columnas;

  usePista(ctl.pista, () => {
    setFase("mirar");
    ctl.aviso("Mirá otra vez las ventanas encendidas.");
  });

  function listo() {
    const r = revisarPosiciones(ej, marcadas);
    if (r.correcto) {
      setFase("hecho");
      return ctl.listo();
    }
    // Se quedan las que acertó; las demás se apagan.
    setMarcadas(r.aciertos);
    ctl.reintento(r.sobran.length ? "Apagamos las que no estaban encendidas. Probemos otra vez." : "Aún falta alguna ventana.");
  }

  const encendida = (i: number) => (fase === "responder" ? marcadas.includes(i) : ej.encendidas.includes(i));

  return (
    <div className="grid gap-4">
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {fase === "mirar" ? "Mirá qué ventanas tienen luz." : fase === "responder" ? "Tocá las ventanas que estaban encendidas." : "¡Las encontraste!"}
      </p>

      {/* La casa: techo y una grilla de ventanas */}
      <div className="mx-auto w-full max-w-[420px]">
        <svg viewBox="0 0 100 22" className="block w-full" aria-hidden="true">
          <path d="M2 22 50 2l48 20z" fill="#3f6a70" />
        </svg>
        <ul
          className="list-none m-0 p-3 grid gap-3 bg-beige-serenidad border-x-[6px] border-b-[6px] border-verde-profundo rounded-b-xl"
          style={{ gridTemplateColumns: `repeat(${ej.columnas}, minmax(0, 1fr))` }}
          aria-label={`Casa con ${total} ventanas`}
        >
          {Array.from({ length: total }, (_, i) => {
            const luz = encendida(i);
            const fila = Math.floor(i / ej.columnas) + 1;
            const col = (i % ej.columnas) + 1;
            const nombre = `Ventana del piso ${ej.filas - fila + 1}, ${col}.ª desde la izquierda`;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={fase !== "responder"}
                  aria-pressed={fase === "responder" ? luz : undefined}
                  aria-label={`${nombre}${fase !== "responder" ? (luz ? ", encendida" : ", apagada") : ""}`}
                  onClick={() => setMarcadas((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))}
                  className={`relative w-full aspect-square min-h-14 rounded-lg border-[4px] border-verde-profundo flex items-center justify-center cursor-pointer disabled:cursor-default transition-colors duration-200 motion-reduce:transition-none ${foco} ${
                    luz ? "bg-mostaza-vital" : "bg-tinta"
                  }`}
                >
                  {luz ? <Lampara /> : <Cortina />}
                  {fase === "hecho" && luz && <Check />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {fase === "mirar" && (
        <Boton onClick={() => setFase("responder")} large={L} className="w-full">
          Ya lo memoricé
        </Boton>
      )}
      {fase === "responder" && (
        <div className="grid gap-3">
          <Boton onClick={listo} disabled={!marcadas.length} large={L} className="w-full">
            Listo
          </Boton>
          {config.permitirVerDeNuevo && (
            <Boton variante="secundario" onClick={() => setFase("mirar")} large={L} className="w-full">
              Ver las ventanas de nuevo
            </Boton>
          )}
        </div>
      )}
    </div>
  );
}

// Luz encendida: una lámpara (no solo el color).
function Lampara() {
  return (
    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#3f6a70" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" fill="#fff" />
    </svg>
  );
}

// Apagada: la cruz del marco de la ventana.
function Cortina() {
  return (
    <svg width="70%" height="70%" viewBox="0 0 24 24" fill="none" stroke="#6a969c" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}
