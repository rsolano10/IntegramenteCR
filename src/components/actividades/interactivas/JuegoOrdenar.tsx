import { useState } from "react";
import { esSiguienteValida, siguienteCorrecta, type EjercicioOrdenar } from "../../../lib/actividades/ordenar";
import { claseFicha, usePista, type Control } from "./comun";
import { Check } from "./ui";

// «Ordenar los pasos» (rutinas, con título) y «En orden» (números, letras o
// palabras): tocar en orden; cada toque que corresponde pasa la tarjeta a
// la fila ordenada. Uno que no corresponde no mueve nada.
export function JuegoOrdenar({ ejercicio: ej, ctl }: { ejercicio: EjercicioOrdenar; ctl: Control }) {
  const [colocadas, setColocadas] = useState<number[]>([]);
  const [devuelta, setDevuelta] = useState<number | null>(null);
  const [marcada, setMarcada] = useState<number | null>(null);
  const L = ctl.large;
  const pasos = !!ej.titulo;

  usePista(ctl.pista, () => {
    const id = siguienteCorrecta(ej, colocadas);
    setMarcada(id);
    if (id !== null) ctl.aviso(pasos ? "El paso marcado es el que sigue." : "La tarjeta marcada es la que sigue.");
  });

  function tocar(id: number) {
    setMarcada(null);
    if (!esSiguienteValida(ej, colocadas, id)) {
      setDevuelta(id);
      return ctl.reintento(pasos ? "Ese paso viene más adelante. Probemos otra vez." : "Esa va más adelante. Probemos otra vez.");
    }
    const sig = [...colocadas, id];
    setColocadas(sig);
    setDevuelta(null);
    if (sig.length === ej.tarjetas.length) ctl.listo();
    else ctl.acierto();
  }

  const porId = (id: number) => ej.tarjetas.find((t) => t.id === id)!;
  const faltan = ej.tarjetas.filter((t) => !colocadas.includes(t.id));
  const pregunta = colocadas.length === 0 ? (pasos ? "¿Qué se hace primero?" : "¿Cuál va primero?") : faltan.length ? (pasos ? "¿Y después?" : "¿Cuál sigue?") : "¡Todo en orden!";

  return (
    <div className="grid gap-4">
      {ej.titulo && <p className={`m-0 font-serif text-verde-profundo leading-tight ${L ? "text-[28px]" : "text-[26px]"}`}>{ej.titulo}</p>}
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>{pregunta}</p>

      {/* Fila ordenada */}
      {colocadas.length > 0 &&
        (pasos ? (
          <ol className="list-none m-0 p-0 grid gap-2" aria-label="Pasos en orden">
            {colocadas.map((id, k) => (
              <li key={id} className={`flex items-start gap-3 rounded-2xl bg-campo border-2 border-semaforo-verde-texto px-3 py-2.5 text-tinta motion-safe:animate-[clara-entra_300ms_ease-out] ${L ? "text-[22px]" : "text-[20px]"}`}>
                <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full bg-semaforo-verde-texto text-white font-semibold flex items-center justify-center text-[18px]">
                  {k + 1}
                </span>
                <span className="pt-0.5">
                  <span className="sr-only">Paso {k + 1}: </span>
                  {porId(id).texto}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="list-none m-0 p-0 flex flex-wrap gap-3" aria-label="En orden">
            {colocadas.map((id) => (
              <li key={id} className={`relative min-w-14 min-h-14 px-3 rounded-2xl bg-campo border-2 border-semaforo-verde-texto flex items-center justify-center font-semibold text-tinta motion-safe:animate-[clara-entra_300ms_ease-out] ${L ? "text-[26px]" : "text-[24px]"}`}>
                {porId(id).texto}
                <Check />
              </li>
            ))}
          </ol>
        ))}

      {/* Por ordenar */}
      {faltan.length > 0 && (
        <ul className={`list-none m-0 p-0 ${pasos ? "grid gap-3" : "flex flex-wrap gap-3"}`} aria-label={pasos ? "Pasos por ordenar" : "Tarjetas por ordenar"}>
          {faltan.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => tocar(t.id)}
                aria-label={`${t.texto}${marcada === t.id ? ". Es la que sigue" : ""}`}
                className={`${claseFicha({ reintento: devuelta === t.id, pista: marcada === t.id })} ${pasos ? `w-full text-left px-4 py-3 font-normal ${L ? "text-[22px]" : "text-[20px]"}` : `px-4 ${L ? "text-[28px] min-w-16" : "text-[26px]"}`}`}
              >
                {t.texto}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
