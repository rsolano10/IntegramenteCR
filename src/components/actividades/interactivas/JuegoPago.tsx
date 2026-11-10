import { useState } from "react";
import { colones, combinacion, esBillete, revisarPago, type EjercicioPago } from "../../../lib/actividades/pagoExacto";
import { foco, usePista, type Control } from "./comun";
import { Boton } from "./ui";

// «Pagar justo»: cada toque en la bandeja agrega una moneda o billete a «Lo
// que vas a pagar»; tocar una de esas la quita. «Listo» revisa.
export function JuegoPago({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioPago; config: { mostrarSuma: boolean }; ctl: Control }) {
  const [pago, setPago] = useState<number[]>([]);
  const [sugerida, setSugerida] = useState<number[] | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const suma = pago.reduce((s, x) => s + x, 0);

  usePista(ctl.pista, () => {
    setSugerida(combinacion(ej.monto, ej.denominaciones));
    ctl.aviso("Así se puede pagar justo. Podés armarlo igual o de otra forma.");
  });

  function listo() {
    const r = revisarPago(ej.monto, pago);
    if (r === "justo") {
      setHecho(true);
      return ctl.listo();
    }
    ctl.reintento(r === "falta" ? "Falta un poco." : "Te pasaste un poco.");
  }

  return (
    <div className="grid gap-4">
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        Pagá <strong className={`font-bold text-verde-profundo whitespace-nowrap ${L ? "text-[36px]" : "text-[32px]"}`}>{colones(ej.monto)}</strong>
      </p>

      {/* Lo que vas a pagar */}
      <section aria-label="Lo que vas a pagar" className="rounded-2xl border-2 border-dashed border-verde-serenidad bg-verde-tenue p-3 min-h-[104px]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <p className={`m-0 font-semibold text-tinta-suave ${L ? "text-[20px]" : "text-[18px]"}`}>Lo que vas a pagar</p>
          {config.mostrarSuma && (
            <p className={`m-0 font-semibold text-tinta whitespace-nowrap ${L ? "text-[22px]" : "text-[20px]"}`} aria-live="polite">
              Llevás {colones(suma)}
            </p>
          )}
        </div>
        {pago.length === 0 ? (
          <p className={`m-0 text-tinta-tenue ${L ? "text-[20px]" : "text-[18px]"}`}>Todavía nada. Tocá las monedas y billetes de abajo.</p>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-wrap gap-3" aria-label="Piezas elegidas">
            {pago.map((d, i) => (
              <li key={i}>
                <Pieza valor={d} large={L} disabled={hecho} etiqueta={`Quitar ${colones(d)}`} onClick={() => setPago((p) => p.filter((_, k) => k !== i))} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {sugerida && !hecho && (
        <div className="rounded-2xl bg-campo border border-borde p-3 opacity-80">
          <p className={`m-0 mb-2 text-tinta-suave ${L ? "text-[20px]" : "text-[18px]"}`}>Una forma de pagarlo:</p>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-2" aria-label={`Una forma de pagarlo: ${sugerida.map(colones).join(", ")}`}>
            {sugerida.map((d, i) => (
              <li key={i} aria-hidden="true">
                <Pieza valor={d} large={false} chica />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bandeja */}
      {!hecho && (
        <section aria-label="Monedas y billetes">
          <p className={`m-0 mb-2 font-semibold text-tinta-suave ${L ? "text-[20px]" : "text-[18px]"}`}>Tu monedero</p>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-3">
            {[...ej.denominaciones].reverse().map((d) => (
              <li key={d}>
                <Pieza valor={d} large={L} etiqueta={`Agregar ${colones(d)}`} onClick={() => setPago((p) => [...p, d])} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hecho && (
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Boton onClick={listo} disabled={!pago.length} large={L}>
            Listo
          </Boton>
          <Boton variante="secundario" onClick={() => setPago([])} disabled={!pago.length} large={L}>
            Vaciar
          </Boton>
        </div>
      )}
    </div>
  );
}

// Moneda (círculo mostaza) o billete (rectángulo verde): forma y texto, no solo color.
function Pieza({ valor, large, onClick, etiqueta, disabled, chica }: { valor: number; large: boolean; onClick?: () => void; etiqueta?: string; disabled?: boolean; chica?: boolean }) {
  const billete = esBillete(valor);
  const forma = billete
    ? `${chica ? "h-10 px-2.5 text-[15px]" : `h-14 px-3.5 ${large ? "text-[21px]" : "text-[19px]"}`} rounded-lg bg-seccion-fria border-2 border-verde-profundo text-verde-profundo`
    : `${chica ? "w-10 h-10 text-[13px]" : `${valor >= 100 ? "w-16 h-16" : "w-14 h-14"} ${large ? "text-[19px]" : "text-[17px]"}`} rounded-full bg-mostaza-vital border-2 border-semaforo-amarillo-texto text-tinta`;
  const cls = `inline-flex items-center justify-center font-sans font-bold leading-none whitespace-nowrap ${forma}`;
  if (!onClick) return <span className={cls}>{colones(valor)}</span>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={etiqueta} className={`${cls} cursor-pointer disabled:cursor-default hover:brightness-95 ${foco}`}>
      {colones(valor)}
    </button>
  );
}
