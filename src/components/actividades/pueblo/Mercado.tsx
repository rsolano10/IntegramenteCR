import { useState } from "react";
import { TRAMOS, productoDe } from "../../../lib/actividades/bancos/mandado";
import { revisarBolsa, type EjercicioMandado, type Formato } from "../../../lib/actividades/mandado";
import { Icono } from "../../sesion/Icono";
import { BotonEscuchar } from "../ClasificarNumeros";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { P } from "./paleta";
import { Letrero } from "./Ornamento";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «El mandado». Primero, el papelito con la lista (escrita y/o para
// escuchar). Después, el Mercado Central: los arcos de la entrada, los
// tramos con su toldo y la bolsa de manta. Lo tocado entra a la bolsa; lo
// que no iba sale con suavidad y vuelve a su puesto.

interface Config {
  formato: Formato;
  verLista: boolean;
}

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioMandado; config: Config; ctl: Control }) {
  const [fase, setFase] = useState<"lista" | "compras">("lista");
  const [bolsa, setBolsa] = useState<string[]>([]);
  const [saliendo, setSaliendo] = useState<string[]>([]);
  const [mirando, setMirando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const { faltan, sobran } = revisarBolsa(ej, bolsa);
    if (faltan.length) ctl.aviso(`Falta algo que empieza con «${productoDe(faltan[0]).nombre[0]}».`);
    else if (sobran.length) ctl.aviso("Hay algo en la bolsa que no estaba en la lista.");
  });

  function tocar(id: string) {
    if (hecho) return;
    setBolsa((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  }

  function listo() {
    const { sobran, faltan, completa } = revisarBolsa(ej, bolsa);
    if (completa) {
      setHecho(true);
      return ctl.listo();
    }
    if (sobran.length) {
      // Lo que no iba sale de la bolsa (lo correcto se queda).
      setSaliendo(sobran);
      setTimeout(() => {
        setBolsa((b) => b.filter((x) => !sobran.includes(x)));
        setSaliendo([]);
      }, 450);
      const n = sobran.map((id) => productoDe(id).nombre.toLowerCase());
      return ctl.reintento(`${n.length === 1 ? `«${n[0]}» no estaba` : "Algunas cosas no estaban"} en la lista: ${n.length === 1 ? "volvió" : "volvieron"} al puesto.${faltan.length ? " Y todavía falta algo." : ""}`);
    }
    ctl.reintento(faltan.length === 1 ? "Falta una cosa de la lista." : `Faltan ${faltan.length} cosas de la lista.`);
  }

  if (fase === "lista") {
    return (
      <div className="grid gap-4">
        <Letrero large={L} detalle="Cuando la sepas, tocá «Ya me la aprendí».">
          {config.formato === "escuchada" ? "Escuchá la lista las veces que quieras." : "Leé la lista con calma."}
        </Letrero>
        <Papelito ej={ej} formato={config.formato} large={L} />
        {config.formato !== "escrita" && (
          <div className="flex justify-center">
            <BotonEscuchar texto={ej.texto} etiqueta="Escuchar la lista" />
          </div>
        )}
        <Acciones ctl={ctl}>
          <Boton onClick={() => setFase("compras")} large={L}>
            Ya me la aprendí
          </Boton>
        </Acciones>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Letrero large={L} arriba>
        {hecho ? "¡El mandado está completo!" : bolsa.length ? "Cuando tengas todo, tocá «Listo»." : "Tocá lo que había que traer."}
      </Letrero>
      <div className="overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Entrada />
        <div className="pueblo-grano px-3 pt-3 pb-4 grid gap-3 sm:grid-cols-2" style={{ backgroundColor: P.cal }}>
          {ej.puestos.map((pu) => (
            <section key={pu.tramo} className="rounded-[14px] overflow-hidden" style={{ background: "#fff8ec", boxShadow: "0 3px 0 rgba(51,36,28,0.2)" }}>
              <Toldo color={TRAMOS[pu.tramo].toldo} nombre={TRAMOS[pu.tramo].nombre} large={L} />
              <ul className="list-none m-0 p-2.5 grid grid-cols-3 gap-2">
                {pu.items.map((id) => {
                  const pr = productoDe(id);
                  const enBolsa = bolsa.includes(id) && !saliendo.includes(id);
                  const est = estiloPieza(enBolsa ? "elegida" : "reposo");
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => tocar(id)}
                        disabled={hecho}
                        aria-pressed={enBolsa}
                        aria-label={`${pr.nombre}${enBolsa ? ", en la bolsa" : ""}`}
                        className={`${clasePieza} ${est.className} w-full rounded-[12px] flex flex-col items-center gap-1 px-1 py-2`}
                        style={{ ...est.style, background: enBolsa ? P.mostaza : P.cal, opacity: enBolsa ? 0.75 : 1 }}
                      >
                        <Icono nombre={pr.icono} className={L ? "w-12 h-12" : "w-10 h-10"} relleno={pr.color} />
                        <span className={`font-bold leading-tight text-center ${L ? "text-[17px]" : "text-[15px]"}`} style={{ color: P.tierra }}>
                          {pr.nombre}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <Bolsa ids={bolsa} saliendo={saliendo} large={L} />
      {config.verLista && !hecho && mirando && <Papelito ej={ej} formato="escrita" large={L} />}
      {!hecho && (
        <Acciones ctl={ctl}>
          <Boton onClick={listo} disabled={!bolsa.length} large={L}>
            Listo
          </Boton>
          {config.verLista && (
            <Boton variante="secundario" onClick={() => setMirando((m) => !m)} large={L}>
              {mirando ? "Guardar la lista" : "Ver la lista"}
            </Boton>
          )}
          {config.formato !== "escrita" && !config.verLista && <BotonEscuchar texto={ej.texto} etiqueta="Escuchar otra vez" />}
        </Acciones>
      )}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Entrada />
      <div className="pueblo-grano flex justify-center py-3" style={{ backgroundColor: P.maderaClara }}>
        <BolsaDibujo llena={final} />
      </div>
    </div>
  );
}

// ─── Piezas ───

function Papelito({ ej, formato, large }: { ej: EjercicioMandado; formato: Formato; large: boolean }) {
  const escondida = formato === "escuchada";
  return (
    <div className="flex justify-center">
      <div
        className="relative w-full max-w-[340px] px-6 pt-7 pb-6 rotate-[-1.5deg]"
        style={{ background: "#fffdf6", boxShadow: "0 4px 0 rgba(51,36,28,0.25)", backgroundImage: "repeating-linear-gradient(180deg, transparent 0 33px, #c3d2dc 33px 34px)" }}
      >
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 rounded-[3px] opacity-80" style={{ background: P.mostaza }} aria-hidden="true" />
        <p className={`m-0 mb-1 font-rotulo ${large ? "text-[24px]" : "text-[21px]"}`} style={{ color: P.tierra }}>
          El mandado
        </p>
        {escondida ? (
          <p className={`m-0 italic leading-relaxed ${large ? "text-[20px]" : "text-[17px]"}`} style={{ color: P.madera }}>
            Esta vez la lista se escucha.
          </p>
        ) : (
          <ul className="m-0 p-0 list-none">
            {ej.lista.map((id) => (
              <li key={id} className={`font-serif italic leading-[34px] ${large ? "text-[26px]" : "text-[23px]"}`} style={{ color: P.tierra }}>
                — {productoDe(id).nombre}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Bolsa({ ids, saliendo, large }: { ids: string[]; saliendo: string[]; large: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] px-3 py-2.5" style={{ background: "#efe4cc", boxShadow: "inset 0 2px 0 rgba(51,36,28,0.12)" }} aria-live="polite">
      <BolsaDibujo llena={ids.length > 0} chica />
      <div className="flex flex-wrap gap-1.5 min-h-10 items-center">
        {ids.length === 0 ? (
          <span className={`italic ${large ? "text-[18px]" : "text-[16px]"}`} style={{ color: P.madera }}>
            La bolsa está vacía.
          </span>
        ) : (
          ids.map((id) => {
            const pr = productoDe(id);
            const sale = saliendo.includes(id);
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1 rounded-full pl-1 pr-2.5 py-0.5 font-bold transition-[opacity,transform] duration-400 ${large ? "text-[17px]" : "text-[15px]"} ${sale ? "opacity-0 -translate-y-3" : "motion-safe:animate-[pueblo-asentar_320ms_ease-out]"}`}
                style={{ background: P.cal, color: P.tierra }}
              >
                <Icono nombre={pr.icono} className="w-7 h-7" relleno={pr.color} />
                {pr.nombre}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

function BolsaDibujo({ llena, chica = false }: { llena: boolean; chica?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" width={chica ? 48 : 120} height={chica ? 48 : 120} aria-hidden="true" className="shrink-0">
      {llena && (
        <g>
          <circle cx="30" cy="22" r="9" fill="#E2582A" />
          <path d="M44 26 c0 -14 10 -18 12 -18 c2 6 -2 16 -12 18z" fill="#9CC48A" />
          <ellipse cx="50" cy="26" rx="7" ry="9" fill="#F4D096" />
          <path d="M22 26 l6 -14 l4 2 l-6 14z" fill="#F2A253" />
        </g>
      )}
      <path d="M12 28 h56 l-5 44 h-46z" fill="#E9D9B4" stroke={P.tierra} strokeWidth="2.5" />
      <path d="M26 28 c0 -16 28 -16 28 0" fill="none" stroke={P.tierra} strokeWidth="3" />
      <path d="M18 40 h44" stroke={P.madera} strokeOpacity="0.4" strokeWidth="2" />
    </svg>
  );
}

function Toldo({ color, nombre, large }: { color: string; nombre: string; large: boolean }) {
  return (
    <div className="relative">
      <div className="h-6" style={{ background: `repeating-linear-gradient(90deg, ${color} 0 22px, ${P.cal} 22px 44px)` }} aria-hidden="true" />
      <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="block w-full h-2" aria-hidden="true">
        {Array.from({ length: 10 }, (_, k) => (
          <path key={k} d={`M${k * 10} 0 q5 6 10 0`} fill={k % 2 ? P.cal : color} />
        ))}
      </svg>
      <p className={`m-0 px-3 pt-1 font-rotulo ${large ? "text-[19px]" : "text-[17px]"}`} style={{ color: P.tierra }}>
        {nombre}
      </p>
    </div>
  );
}

// La entrada del Mercado Central: arcos de ladrillo y el rótulo.
function Entrada() {
  return (
    <div className="pueblo-grano" style={{ backgroundColor: P.rosa }}>
      <svg viewBox="0 0 360 90" className="block mx-auto w-full max-w-[560px] h-auto overflow-visible" aria-hidden="true">
        <rect x="-400" y="20" width="1160" height="70" fill="#C8644A" />
        <rect x="-400" y="16" width="1160" height="8" fill={P.tierra} opacity="0.8" />
        {[-40, 40, 120, 200, 280, 360].map((x) => (
          <path key={x} d={`M${x + 8} 90 v-34 a32 32 0 0 1 64 0 v34z`} fill={P.tierra} opacity="0.75" />
        ))}
        <rect x="118" y="28" width="124" height="24" rx="3" fill={P.cal} />
        <text x="180" y="45" textAnchor="middle" fontFamily="Caprasimo, serif" fontSize="15" fill={P.tierra}>
          Mercado Central
        </text>
      </svg>
    </div>
  );
}
