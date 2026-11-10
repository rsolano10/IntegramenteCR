import { useState } from "react";
import { opcionADescartar, type EjercicioOrientacion } from "../../../lib/actividades/orientacionHoy";
import { claseFicha, usePista, type Control } from "./comun";
import { Check } from "./ui";

const mayuscula = (s: string) => s[0].toLocaleUpperCase("es") + s.slice(1);

// «El día de hoy»: opción múltiple con botones grandes. Los mensajes son
// especialmente suaves: nunca sugieren que la persona «debería saberlo».
export function JuegoOrientacion({ ejercicio: ej, ctl }: { ejercicio: EjercicioOrientacion; ctl: Control }) {
  const [descartadas, setDescartadas] = useState<string[]>([]);
  const [ultima, setUltima] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const o = opcionADescartar(ej, descartadas);
    if (o) {
      setDescartadas((d) => [...d, o]);
      ctl.aviso("Quitamos una opción para que sea más fácil.");
    }
  });

  function elegir(o: string) {
    if (hecho || descartadas.includes(o)) return;
    setUltima(o);
    if (o === ej.correcta) {
      setHecho(true);
      return ctl.listo();
    }
    ctl.reintento("Está bien, miremos juntos otra opción. Si querés, revisen un calendario.");
  }

  return (
    <div className="grid gap-4">
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[28px]" : "text-[26px]"}`}>{ej.texto}</p>
      <ul className="list-none m-0 p-0 grid gap-3" aria-label="Opciones">
        {ej.opciones.map((o) => {
          const fuera = descartadas.includes(o);
          const bien = hecho && o === ej.correcta;
          return (
            <li key={o}>
              <button
                type="button"
                onClick={() => elegir(o)}
                aria-disabled={fuera || hecho}
                aria-label={`${mayuscula(o)}${fuera ? ", descartada" : ""}`}
                className={`${claseFicha({ hecha: bien, reintento: !hecho && ultima === o && o !== ej.correcta })} w-full min-h-16 px-5 text-left ${L ? "text-[24px]" : "text-[22px]"} ${fuera ? "opacity-35 line-through cursor-default" : ""} ${hecho && !bien ? "opacity-50 cursor-default" : ""}`}
              >
                {bien && <Check />}
                {mayuscula(o)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
