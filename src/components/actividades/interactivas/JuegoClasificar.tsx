import { useState } from "react";
import { esGrupoValido, type EjercicioClasificar } from "../../../lib/actividades/clasificarObjetos";
import { claseFicha, foco, usePista, type Control } from "./comun";
import { Check, Elegido } from "./ui";

// «Cada cosa en su lugar»: tocar una cosa y después el lugar donde va.
export function JuegoClasificar({ ejercicio: ej, ctl }: { ejercicio: EjercicioClasificar; ctl: Control }) {
  const [ubicados, setUbicados] = useState<Record<number, string>>({});
  const [elegido, setElegido] = useState<number | null>(null);
  const [devuelto, setDevuelto] = useState<number | null>(null);
  const [pistaGrupo, setPistaGrupo] = useState<string | null>(null);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const i = elegido ?? ej.elementos.findIndex((_, k) => ubicados[k] === undefined);
    if (i < 0) return;
    setElegido(i);
    setPistaGrupo(ej.elementos[i].validos[0]);
    ctl.aviso(`«${ej.elementos[i].texto}» va en el lugar marcado.`);
  });

  function tocarElemento(i: number) {
    if (ubicados[i] !== undefined) return;
    setDevuelto(null);
    setPistaGrupo(null);
    setElegido(elegido === i ? null : i);
  }

  function tocarGrupo(g: string) {
    if (elegido === null) return ctl.aviso("Primero tocá una cosa de arriba.");
    const e = ej.elementos[elegido];
    setPistaGrupo(null);
    if (!esGrupoValido(e, g)) {
      setDevuelto(elegido);
      setElegido(null);
      return ctl.reintento("Probemos con otro lugar.");
    }
    const sig = { ...ubicados, [elegido]: g };
    setUbicados(sig);
    setElegido(null);
    setDevuelto(null);
    if (Object.keys(sig).length === ej.elementos.length) ctl.listo();
    else ctl.acierto(`Muy bien. ${e.texto} va en ${ej.grupos.find((x) => x.id === g)!.nombre.toLowerCase()}.`);
  }

  const pendientes = ej.elementos.map((e, i) => ({ e, i })).filter(({ i }) => ubicados[i] === undefined);

  return (
    <div className="grid gap-4" onKeyDown={(e) => e.key === "Escape" && setElegido(null)}>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>{elegido === null ? "Tocá una cosa." : `Ahora tocá el lugar donde va «${ej.elementos[elegido].texto}».`}</p>

      {pendientes.length > 0 && (
        <ul className="list-none m-0 p-0 flex flex-wrap gap-3" aria-label="Cosas para ubicar">
          {pendientes.map(({ e, i }) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={elegido === i}
                onClick={() => tocarElemento(i)}
                className={`${claseFicha({ elegida: elegido === i, reintento: devuelto === i })} px-4 py-2 ${L ? "text-[22px]" : "text-[20px]"}`}
              >
                {elegido === i && <Elegido />}
                {e.texto}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`grid gap-3 ${ej.grupos.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 min-[420px]:grid-cols-2"}`}>
        {ej.grupos.map((g) => {
          const dentro = ej.elementos.map((e, i) => ({ e, i })).filter(({ i }) => ubicados[i] === g.id);
          const ejemplos = ej.ejemplos.filter((x) => x.grupo === g.id);
          const marcado = pistaGrupo === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => tocarGrupo(g.id)}
              aria-label={`${g.nombre}${elegido !== null ? `. Tocá para poner «${ej.elementos[elegido].texto}» acá` : ""}${marcado ? ". Va aquí" : ""}`}
              className={`text-left rounded-2xl overflow-hidden bg-white p-0 cursor-pointer font-sans ${marcado ? "border-[3px] border-dashed border-mostaza-vital" : "border-2 border-borde"} ${foco}`}
            >
              <span className={`flex items-center justify-between gap-2 px-4 py-3 bg-verde-profundo text-white font-semibold leading-tight ${L ? "text-[22px]" : "text-[20px]"}`}>
                {g.nombre}
                {marcado && <span className="rounded-full bg-mostaza-vital text-tinta px-2.5 py-0.5 text-[16px]">Va aquí</span>}
              </span>
              <span className={`flex flex-wrap content-start gap-2 p-3 min-h-[88px] ${elegido !== null ? "bg-verde-tenue" : ""}`}>
                {ejemplos.map((x) => (
                  <span key={x.texto} className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-verde-serenidad bg-white px-3 py-1.5 text-tinta-suave ${L ? "text-[19px]" : "text-[17px]"}`}>
                    <span className="text-[13px] uppercase tracking-wide font-semibold">Ejemplo</span> {x.texto}
                  </span>
                ))}
                {dentro.map(({ e, i }) => (
                  <span key={i} className={`relative inline-flex items-center rounded-xl border-2 border-semaforo-verde-texto bg-white px-3 py-1.5 font-semibold text-tinta motion-safe:animate-[clara-entra_300ms_ease-out] ${L ? "text-[20px]" : "text-[18px]"}`}>
                    {e.texto}
                    <Check />
                  </span>
                ))}
                {elegido !== null && dentro.length === 0 && ejemplos.length === 0 && <span className={`m-auto text-verde-profundo font-semibold ${L ? "text-[20px]" : "text-[18px]"}`}>Tocá aquí</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
