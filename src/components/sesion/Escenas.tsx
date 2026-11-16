import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cuandoParar } from "../../lib/bloquesGerontogimnasia";
import { moduloLabel } from "../../lib/modulos";
import { LIBRE, opcionDe, opcionesSegun, plantilla, puedeSeguir, valorLista, valorUno, type Escena, type Opcion } from "../../lib/sesiones";
import type { NombreIcono } from "../../lib/sesiones/iconos";
import { Icono } from "./Icono";
import { MaterialDeApoyo } from "../ui/ResourceDetailView";
import { Ceja, Marca, Nota, Pie, Titulo } from "./comun";
import { useSesion, useTam } from "./contexto";

type De<T extends Escena["tipo"]> = Extract<Escena, { tipo: T }>;

// Mientras no se apruebe la versión compacta (decisión de la clínica), el
// texto completo de «Cuándo parar» se lee en cada sesión, con los dibujos.
const SEGURIDAD_COMPACTA = false;

// Círculo con el dibujo grande de una escena, en el color del módulo.
function Medallon({ icono, tam = "grande" }: { icono: NombreIcono; tam?: "grande" | "medio" }) {
  const { tema, large } = useSesion();
  const caja = tam === "grande" ? (large ? "w-48 h-48" : "w-40 h-40 sm:w-44 sm:h-44") : large ? "w-32 h-32" : "w-28 h-28";
  return (
    <div
      className={`${caja} shrink-0 rounded-full flex items-center justify-center shadow-[inset_0_-10px_24px_rgba(0,0,0,0.06)]`}
      style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${tema.claro} 75%)` }}
    >
      <Icono nombre={icono} className="w-[62%] h-[62%] text-tinta" relleno="#fff" />
    </div>
  );
}

// ─── Portada ───
export function Portada() {
  const { guion, datos, tema } = useSesion();
  const t = useTam();
  return (
    <>
      <div className="flex flex-col items-center text-center pt-4 sm:pt-8">
        <div className="ses-sube">
          <Medallon icono={guion.icono} />
        </div>
        {datos.modulo && (
          <p className={`m-0 mt-6 mb-2 tracking-[0.16em] uppercase font-semibold ${t.ceja}`} style={{ color: tema.tinta }}>
            {moduloLabel[datos.modulo]}
          </p>
        )}
        <Titulo>{datos.titulo}</Titulo>
        <p className={`m-0 mt-3 max-w-md leading-relaxed text-tinta-suave ${t.cuerpo}`}>{guion.frase}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {guion.etiquetas.map((e) => (
            <span key={e} className={`rounded-full bg-white border border-borde px-3.5 py-1.5 font-semibold text-tinta-suave ${t.chico}`}>
              {e}
            </span>
          ))}
        </div>
        {guion.cuidado && (
          <p className={`m-0 mt-6 max-w-md flex items-start gap-2.5 text-left rounded-2xl bg-aviso px-4 py-3 leading-snug text-semaforo-amarillo-texto ${t.chico}`}>
            <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 4l9 16H3z" />
              <path d="M12 10v4M12 17v.1" />
            </svg>
            {guion.cuidado}
          </p>
        )}
      </div>
      <Pie etiqueta="Empezar" solo />
    </>
  );
}

// ─── Seguridad (gerontogimnasia) ───
const SENALES: { icono: NombreIcono; texto: string }[] = [
  { icono: "dolor", texto: "Dolor nuevo" },
  { icono: "mareo", texto: "Mareo" },
  { icono: "equilibrio", texto: "Inestabilidad" },
  { icono: "cansancio", texto: "Fatiga inusual" },
  { icono: "aire", texto: "Falta de aire" },
  { icono: "confusion", texto: "Confusión o angustia" },
  { icono: "rechazo", texto: "Si no quiere seguir" },
];

export function Seguridad() {
  const { tema } = useSesion();
  const t = useTam();
  const [completo, setCompleto] = useState(!SEGURIDAD_COMPACTA);
  return (
    <>
      <Ceja>Antes de empezar</Ceja>
      <Titulo>Cuándo parar</Titulo>
      <Nota className="mt-2">Si aparece alguna de estas señales, paren.</Nota>
      <ul className="m-0 mt-5 p-0 list-none grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SENALES.map((s, i) => (
          <li
            key={s.texto}
            className="ses-sube flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-borde px-2 py-3 text-center"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Icono nombre={s.icono} className="w-11 h-11 text-tinta" relleno={tema.relleno} />
            <span className={`font-semibold leading-tight text-tinta ${t.chico}`}>{s.texto}</span>
          </li>
        ))}
      </ul>
      <div className={`mt-4 flex items-start gap-3 rounded-2xl bg-alerta border border-alerta-borde px-4 py-3.5 text-alerta-texto ${t.chico}`}>
        <Icono nombre="urgente" className="w-9 h-9 shrink-0" />
        <p className="m-0 leading-snug">
          <strong>Urgente:</strong> dolor en el pecho, desmayo, mucha falta de aire o un síntoma súbito. Pedí ayuda de inmediato.
        </p>
      </div>
      {completo ? (
        <p className={`m-0 mt-4 leading-relaxed text-tinta-suave ${t.chico}`}>{cuandoParar}</p>
      ) : (
        <button type="button" onClick={() => setCompleto(true)} className="mt-4 self-start border-0 bg-transparent p-0 font-semibold text-verde-profundo underline decoration-dotted cursor-pointer">
          Leer el texto completo
        </button>
      )}
      <Pie etiqueta="Entendido" />
    </>
  );
}

// ─── Preparar: tocar cada cosa cuando esté lista ───
export function Preparar({ e }: { e: De<"preparar"> }) {
  const { tema } = useSesion();
  const t = useTam();
  const [listos, setListos] = useState<boolean[]>(() => e.items.map(() => false));
  const todos = listos.every(Boolean);
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {e.items.map((it, i) => (
          <button
            key={it.texto}
            type="button"
            aria-pressed={listos[i]}
            onClick={() => setListos((l) => l.map((v, k) => (k === i ? !v : v)))}
            className={`relative flex flex-col items-center gap-2 rounded-[22px] border-2 px-3 py-4 text-center cursor-pointer transition-colors ${
              listos[i] ? "bg-verde-tenue border-verde-serenidad" : "bg-white border-borde hover:border-verde-serenidad/60"
            }`}
          >
            <Icono nombre={it.icono} className={`w-12 h-12 text-tinta transition-opacity ${listos[i] ? "opacity-60" : ""}`} relleno={tema.relleno} />
            <span className={`font-semibold leading-tight text-tinta ${t.chico}`}>{it.texto}</span>
            {listos[i] && <Marca className="absolute top-2 right-2" />}
          </button>
        ))}
      </div>
      <Pie etiqueta={todos ? "Todo listo" : "Seguir"} tono={todos ? "principal" : "suave"} />
    </>
  );
}

// ─── Video ───
export function Video({ e }: { e: De<"video"> }) {
  const { datos } = useSesion();
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      {datos.videoUrl ? (
        <video
          controls
          playsInline
          preload="metadata"
          poster={datos.posterUrl}
          src={datos.videoUrl}
          className="mt-5 w-full rounded-[24px] bg-tinta object-contain shadow-elevada"
          style={{ maxHeight: "58vh" }}
        />
      ) : (
        <Nota className="mt-5">El video no está disponible ahora. Pueden seguir con las consignas.</Nota>
      )}
      <Pie etiqueta="Ya lo vimos" />
    </>
  );
}

// ─── Consigna: una instrucción, grande ───
export function Consigna({ e }: { e: De<"consigna"> }) {
  const { guion, respuestas } = useSesion();
  const t = useTam();
  return (
    <>
      <div className="flex flex-col items-center text-center pt-2">
        {e.icono && (
          <div className="ses-sube">
            <Medallon icono={e.icono} />
          </div>
        )}
        {e.paso && (
          <div className="mt-6 flex items-center gap-1.5" aria-label={`Paso ${e.paso.n} de ${e.paso.de}`}>
            {Array.from({ length: e.paso.de }, (_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i + 1 === e.paso!.n ? "w-7 bg-tinta" : i + 1 < e.paso!.n ? "w-2 bg-tinta/50" : "w-2 bg-borde"}`} />
            ))}
          </div>
        )}
        <p className={`m-0 mt-4 mb-2 tracking-[0.16em] uppercase font-semibold text-tinta-tenue ${t.ceja}`}>{e.titulo}</p>
        <p className={`m-0 max-w-md font-serif leading-snug text-tinta ${t.grande}`}>{plantilla(e.texto, guion, respuestas)}</p>
        {e.nota && <Nota className="mt-3 max-w-md">{e.nota}</Nota>}
      </div>
      <Pie etiqueta={e.paso ? "Hecho" : "Siguiente"} />
    </>
  );
}

// ─── Decir: la frase para la persona, en grande ───
export function Decir({ e }: { e: De<"decir"> }) {
  const { guion, respuestas, participante, tema } = useSesion();
  const t = useTam();
  const frases = [e.frase, ...(e.otras ?? [])];
  const [i, setI] = useState(0);
  const [cuenta, setCuenta] = useState(0);
  const frase = plantilla(frases[i], guion, respuestas);
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <div className="mt-5">
        <div className="relative rounded-[28px] rounded-tl-lg bg-white border border-borde px-6 py-6 shadow-elevada">
          {e.icono && (
            <span className="absolute -top-6 right-5 w-14 h-14 rounded-full bg-white border border-borde flex items-center justify-center" aria-hidden="true">
              <Icono nombre={e.icono} className="w-10 h-10 text-tinta" relleno={tema.relleno} />
            </span>
          )}
          {!participante && <p className={`m-0 mb-2 tracking-[0.16em] uppercase font-semibold ${t.ceja}`} style={{ color: tema.tinta }}>Decile</p>}
          <p key={i} className={`ses-sube m-0 font-serif leading-snug text-tinta ${t.grande}`}>
            {participante ? frase : `«${frase}»`}
          </p>
        </div>
      </div>
      {frases.length > 1 && (
        <button
          type="button"
          onClick={() => setI((k) => (k + 1) % frases.length)}
          className={`mt-4 self-start inline-flex items-center gap-2 min-h-11 px-4 rounded-full border-[1.5px] border-borde bg-white font-semibold text-tinta cursor-pointer hover:border-verde-serenidad ${t.chico}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />
          </svg>
          Otra pregunta
        </button>
      )}
      {e.contar && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCuenta((n) => n + 1)}
            className={`min-h-12 px-5 inline-flex items-center gap-2 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta ${t.chico}`}
          >
            <Icono nombre="estrella" className="w-6 h-6" relleno="#f4c372" />
            {e.contar}
          </button>
          {cuenta > 0 && (
            <span key={cuenta} className={`ses-marca font-serif text-tinta ${t.grande}`} aria-live="polite">
              {cuenta}
            </span>
          )}
        </div>
      )}
      {!participante && e.nota && <Nota className="mt-4">{e.nota}</Nota>}
      <Pie etiqueta="Siguiente" />
    </>
  );
}

// Tarjeta de una opción (elegir, lista, ordenar).
function TarjetaOpcion({ o, elegida, onClick, numero, chica = false }: { o: Opcion; elegida: boolean; onClick: () => void; numero?: number; chica?: boolean }) {
  const { tema } = useSesion();
  const t = useTam();
  return (
    <button
      type="button"
      aria-pressed={elegida}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-[22px] border-2 px-3 text-center cursor-pointer transition-[background-color,border-color,transform] active:scale-[0.97] ${
        chica ? "py-3 min-h-[112px]" : "py-4 min-h-[132px]"
      } ${elegida ? "bg-verde-tenue border-verde-profundo shadow-[0_8px_20px_-14px_rgba(31,51,56,0.6)]" : "bg-white border-borde hover:border-verde-serenidad/60"}`}
    >
      <Icono nombre={o.icono} className={`${chica ? "w-11 h-11" : "w-14 h-14"} text-tinta`} relleno={tema.relleno} />
      <span className={`font-semibold leading-tight text-tinta ${t.chico}`}>{o.texto}</span>
      {numero !== undefined ? (
        <span className="ses-marca absolute top-2 left-2 w-8 h-8 inline-flex items-center justify-center rounded-full bg-tinta text-white font-bold text-[15px]">{numero}</span>
      ) : (
        elegida && <Marca className="absolute top-2 right-2" />
      )}
    </button>
  );
}

// Campo para escribir una opción propia.
function CampoLibre({ etiqueta, valor, onCambio, onAgregar }: { etiqueta: string; valor: string; onCambio: (v: string) => void; onAgregar?: () => void }) {
  const t = useTam();
  return (
    <div className="flex gap-2">
      <input
        value={valor}
        onChange={(ev) => onCambio(ev.target.value)}
        onKeyDown={(ev) => ev.key === "Enter" && onAgregar?.()}
        placeholder={etiqueta}
        aria-label={etiqueta}
        className={`flex-1 min-w-0 min-h-[52px] rounded-2xl border-[1.5px] border-borde-campo bg-white px-4 font-sans text-tinta ${t.chico}`}
      />
      {onAgregar && (
        <button
          type="button"
          onClick={onAgregar}
          disabled={!valor.trim()}
          className={`shrink-0 min-h-[52px] px-5 rounded-2xl border-0 bg-tinta text-white font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.chico}`}
        >
          Agregar
        </button>
      )}
    </div>
  );
}

// ─── Elegir una opción ───
export function Elegir({ e }: { e: De<"elegir"> }) {
  const { respuestas, responder } = useSesion();
  const elegido = valorUno(respuestas, e.clave);
  const claveTexto = `${e.clave}_texto`;
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {e.opciones.map((o) => (
          <TarjetaOpcion key={o.id} o={o} elegida={elegido === o.id} onClick={() => responder(e.clave, o.id)} />
        ))}
        {e.libre && <TarjetaOpcion o={{ id: "otra", texto: e.libre, icono: "otra" }} elegida={elegido === "otra"} onClick={() => responder(e.clave, "otra")} />}
      </div>
      {elegido === "otra" && (
        <div className="ses-sube mt-3">
          <CampoLibre etiqueta={e.libre ?? "Escribila acá"} valor={valorUno(respuestas, claveTexto) ?? ""} onCambio={(v) => responder(claveTexto, v)} />
        </div>
      )}
      <Pie etiqueta="Siguiente" habilitado={puedeSeguir(e, respuestas)} />
    </>
  );
}

// ─── Lista: tocar lo que va diciendo ───
export function Lista({ e }: { e: De<"lista"> }) {
  const { guion, respuestas, responder, participante, tema } = useSesion();
  const t = useTam();
  const elegidos = valorLista(respuestas, e.clave);
  const opciones = opcionesSegun(e.sugerencias, e.segun, respuestas);
  const [libre, setLibre] = useState("");
  const alternar = (id: string) => responder(e.clave, elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id]);
  const agregar = () => {
    const v = libre.trim();
    if (!v) return;
    responder(e.clave, [...elegidos, `${LIBRE}${v}`]);
    setLibre("");
  };
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {!participante && e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      {/* Lo que ya va: la «bolsa» que se llena. */}
      <div className="mt-5 rounded-[22px] border-2 border-dashed border-borde-campo bg-campo px-4 py-3 min-h-[64px]" aria-live="polite">
        {elegidos.length === 0 ? (
          <p className={`m-0 py-2 text-tinta-tenue italic ${t.chico}`}>Todavía nada. Tocá lo que diga.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {elegidos.map((v) => {
              const o = opcionDe(guion, e.clave, v, respuestas);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => alternar(v)}
                  aria-label={`Quitar ${o?.texto ?? v}`}
                  className={`ses-marca inline-flex items-center gap-1.5 rounded-full bg-white border border-borde pl-2 pr-3 py-1.5 font-semibold text-tinta cursor-pointer ${t.chico}`}
                >
                  {o && <Icono nombre={o.icono} className="w-6 h-6" relleno={tema.relleno} />}
                  {o?.texto ?? v}
                  <span aria-hidden="true" className="text-tinta-tenue">×</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {opciones.map((o) => (
          <TarjetaOpcion key={o.id} o={o} chica elegida={elegidos.includes(o.id)} onClick={() => alternar(o.id)} />
        ))}
      </div>
      {e.libre && (
        <div className="mt-3">
          <CampoLibre etiqueta={e.libre} valor={libre} onCambio={setLibre} onAgregar={agregar} />
        </div>
      )}
      <Pie etiqueta="Siguiente" habilitado={puedeSeguir(e, respuestas)} />
    </>
  );
}

// ─── Ordenar: tocar en el orden en que lo haría ───
const ORDINAL = ["Primero", "Después", "Luego", "Más tarde", "Después", "Al final"];

export function Ordenar({ e }: { e: De<"ordenar"> }) {
  const { guion, respuestas, responder, participante } = useSesion();
  const t = useTam();
  const orden = valorLista(respuestas, e.clave);
  const items = opcionesSegun(e.items, e.segun, respuestas);
  const tocar = (id: string) => responder(e.clave, orden.includes(id) ? orden.filter((x) => x !== id) : [...orden, id]);
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {!participante && e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      {orden.length > 0 && (
        <ol className="m-0 mt-5 p-0 list-none grid gap-1.5" aria-live="polite">
          {orden.map((id, i) => {
            const o = opcionDe(guion, e.clave, id, respuestas);
            return (
              <li key={id} className={`ses-sube flex items-center gap-3 ${t.cuerpo}`}>
                <span className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full bg-tinta text-white font-bold text-[15px]">{i + 1}</span>
                <span className="text-tinta-tenue">{ORDINAL[Math.min(i, ORDINAL.length - 1)]},</span>
                <span className="font-semibold text-tinta">{o?.texto.toLowerCase()}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((o) => {
          const n = orden.indexOf(o.id);
          return <TarjetaOpcion key={o.id} o={o} chica elegida={n >= 0} numero={n >= 0 ? n + 1 : undefined} onClick={() => tocar(o.id)} />;
        })}
      </div>
      {orden.length > 0 && (
        <button
          type="button"
          onClick={() => responder(e.clave, [])}
          className={`mt-3 self-start border-0 bg-transparent p-0 font-semibold text-verde-profundo underline decoration-dotted cursor-pointer ${t.chico}`}
        >
          Empezar de nuevo
        </button>
      )}
      <Pie etiqueta="Siguiente" habilitado={puedeSeguir(e, respuestas)} />
    </>
  );
}

// ─── Leer: un texto breve para leerle despacio ───
export function Leer({ e }: { e: De<"leer"> }) {
  const { guion, respuestas, participante, tema } = useSesion();
  const t = useTam();
  const texto = plantilla(e.texto, guion, respuestas);
  // La palabra resaltada, en todas sus apariciones (sin distinguir mayúsculas).
  const partes = e.resaltar ? texto.split(new RegExp(`(${e.resaltar})`, "gi")) : [texto];
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {!participante && <Ceja><span className="block mt-4">{e.resaltar ? "Leele despacio" : "Leele despacio, con pausas"}</span></Ceja>}
      <div className="relative rounded-[28px] bg-white border border-borde px-6 py-6 shadow-elevada">
        {e.icono && (
          <span className="absolute -top-6 right-5 w-14 h-14 rounded-full bg-white border border-borde flex items-center justify-center" aria-hidden="true">
            <Icono nombre={e.icono} className="w-10 h-10 text-tinta" relleno={tema.relleno} />
          </span>
        )}
        <p className={`m-0 font-serif leading-relaxed text-tinta ${t.grande}`}>
          {partes.map((p, i) =>
            e.resaltar && p.toLowerCase() === e.resaltar.toLowerCase() ? (
              <mark key={i} className="rounded-md px-1 text-tinta" style={{ background: `${tema.fuerte}40` }}>
                {p}
              </mark>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </p>
      </div>
      {e.nota && <Nota className="mt-4">{e.nota}</Nota>}
      <Pie etiqueta="Siguiente" />
    </>
  );
}

// ─── Material de apoyo del recurso (tabla, tarjetas, temporizador) ───
export function Material({ e }: { e: De<"material"> }) {
  const { datos, large } = useSesion();
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      <div className="mt-5">{datos.extras ? <MaterialDeApoyo extras={datos.extras} large={large} /> : <Nota>El material no está disponible ahora.</Nota>}</div>
      <Pie etiqueta="Siguiente" />
    </>
  );
}

// ─── Repeticiones: un anillo que se completa ───
function Anillo({ hechas, min, max, onTocar }: { hechas: number; min: number; max: number; onTocar: () => void }) {
  const { tema, large } = useSesion();
  const tam = large ? 260 : 232;
  const r = 100;
  const c = 2 * Math.PI * r;
  const hueco = 10;
  const tramo = c / max - hueco;
  return (
    <button
      type="button"
      onClick={onTocar}
      aria-label={`Sumar una. Van ${hechas}`}
      className="relative rounded-full border-0 bg-transparent p-0 cursor-pointer active:scale-[0.97] transition-transform"
      style={{ width: tam, height: tam }}
    >
      <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="120" cy="120" r="84" fill="#fff" />
        {Array.from({ length: max }, (_, i) => (
          <circle
            key={i}
            cx="120"
            cy="120"
            r={r}
            fill="none"
            strokeWidth="18"
            strokeLinecap="round"
            stroke={i < hechas ? tema.fuerte : i < min ? "#e4dfc7" : "#efeada"}
            strokeDasharray={`${tramo} ${c - tramo}`}
            strokeDashoffset={-i * (tramo + hueco) - hueco / 2}
            style={{ transition: "stroke 300ms ease" }}
          />
        ))}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span key={hechas} className={`ses-marca font-serif leading-none text-tinta ${large ? "text-[84px]" : "text-[72px]"}`}>
          {hechas}
        </span>
        <span className="mt-1 text-[14px] font-semibold text-tinta-tenue">{hechas === 0 ? "tocá acá" : hechas === 1 ? "vez" : "veces"}</span>
      </span>
    </button>
  );
}

// Etiqueta del lado cuando el ejercicio se hace de los dos lados.
function Lado({ lado }: { lado: number }) {
  const { tema } = useSesion();
  const t = useTam();
  return (
    <span className={`ses-marca inline-flex items-center gap-2 rounded-full px-3.5 py-1 font-semibold ${t.chico}`} style={{ background: `${tema.fuerte}26`, color: tema.tinta }}>
      {lado === 0 ? "Primer lado" : "Ahora, el otro lado"}
    </span>
  );
}

function IndicacionEquipo() {
  const { datos } = useSesion();
  const t = useTam();
  if (!datos.indicacionIndividual) return null;
  return (
    <p className={`m-0 mt-4 rounded-2xl bg-verde-tenue border border-verde-serenidad/40 px-4 py-3 text-tinta ${t.chico}`}>
      <strong>Indicación de su equipo:</strong> {datos.indicacionIndividual}
    </p>
  );
}

export function Repeticiones({ e }: { e: De<"repeticiones"> }) {
  const { datos } = useSesion();
  const t = useTam();
  const [lado, setLado] = useState(0);
  const [hechas, setHechas] = useState(0);
  const tope = datos.indicacionIndividual ? 99 : e.max;
  const falta = e.lados && lado === 0;
  const recordatorio = e.recordatorios[hechas % e.recordatorios.length];
  const mensaje =
    hechas >= e.max
      ? falta
        ? "¡Listo este lado!"
        : "¡Serie completa!"
      : hechas >= e.min
        ? `Ya van ${hechas}. Pueden seguir hasta ${e.max} si se siente bien.`
        : recordatorio;
  const terminado = !falta && hechas >= e.min;
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.nota}</Nota>
      <IndicacionEquipo />
      <div className="mt-6 flex flex-col items-center">
        {e.lados && (
          <div className="mb-4" key={`lado-${lado}`}>
            <Lado lado={lado} />
          </div>
        )}
        <Anillo key={`anillo-${lado}`} hechas={hechas} min={e.min} max={e.max} onTocar={() => setHechas((h) => Math.min(h + 1, tope))} />
        <p key={mensaje} className={`ses-sube m-0 mt-5 min-h-[2.8em] max-w-sm text-center font-semibold leading-snug text-tinta ${t.cuerpo}`} aria-live="polite">
          {mensaje}
        </p>
        {falta && hechas >= e.min && (
          <button
            type="button"
            onClick={() => {
              setLado(1);
              setHechas(0);
            }}
            className={`ses-sube min-h-12 px-6 rounded-full border-[1.5px] border-verde-profundo bg-verde-tenue text-verde-profundo font-semibold cursor-pointer ${t.chico}`}
          >
            Pasar al otro lado
          </button>
        )}
        {hechas > 0 && !(falta && hechas >= e.min) && (
          <button type="button" onClick={() => setHechas((h) => h - 1)} className={`mt-1 border-0 bg-transparent p-0 text-tinta-tenue underline decoration-dotted cursor-pointer ${t.chico}`}>
            Me equivoqué, restar una
          </button>
        )}
      </div>
      <Pie etiqueta={terminado ? "Terminamos" : "Terminar acá"} tono={terminado ? "principal" : "suave"} />
    </>
  );
}

// ─── Tiempo: sostener una posición o hacer un recorrido ───
export function Tiempo({ e }: { e: De<"tiempo"> }) {
  const { tema, large } = useSesion();
  const t = useTam();
  const [lado, setLado] = useState(0);
  const [intento, setIntento] = useState(0); // intentos ya hechos en este lado
  const [corriendo, setCorriendo] = useState(false);
  const [seg, setSeg] = useState(0);
  const sostener = e.modo === "sostener";
  useEffect(() => {
    if (!corriendo) return;
    if (sostener && seg >= e.segundos) {
      setCorriendo(false);
      setIntento((i) => i + 1);
      return;
    }
    const id = setTimeout(() => setSeg((x) => x + 1), 1000);
    return () => clearTimeout(id);
  }, [corriendo, seg, sostener, e.segundos]);

  const ladosTotales = e.lados ? 2 : 1;
  const ladoListo = intento >= e.intentos;
  const todo = ladoListo && lado === ladosTotales - 1;
  const empezar = () => {
    setSeg(0);
    setCorriendo(true);
  };
  const parar = () => {
    setCorriendo(false);
    setIntento((i) => i + 1);
  };
  const frac = Math.min(1, seg / e.segundos);
  const tam = large ? 250 : 224;
  const c = 2 * Math.PI * 100;
  const centro = corriendo ? (sostener ? Math.max(0, e.segundos - seg) : seg) : null;
  const recordatorio = e.recordatorios[(intento + lado) % e.recordatorios.length];
  const mensaje = corriendo
    ? sostener
      ? recordatorio
      : e.minimo && seg >= e.minimo
        ? "Pueden terminar cuando quieran."
        : recordatorio
    : todo
      ? "¡Muy bien! Terminaron."
      : ladoListo
        ? "¡Listo este lado!"
        : intento > 0
          ? "Bien. Descansen un momento y sigan."
          : sostener
            ? `Tocá «Empezar» y sostengan ${e.segundos} segundos.`
            : "Tocá «Empezar» cuando arranquen.";

  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.nota}</Nota>
      <IndicacionEquipo />
      <div className="mt-5 flex flex-col items-center">
        <div className="mb-3 flex items-center gap-3">
          {e.lados && <Lado key={lado} lado={lado} />}
          {e.intentos > 1 && (
            <span className="flex gap-1.5" aria-label={`Intento ${Math.min(intento + 1, e.intentos)} de ${e.intentos}`}>
              {Array.from({ length: e.intentos }, (_, i) => (
                <span key={i} className="w-3 h-3 rounded-full" style={{ background: i < intento ? tema.fuerte : "#e4dfc7" }} />
              ))}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={corriendo ? parar : ladoListo ? undefined : empezar}
          disabled={ladoListo && !corriendo}
          aria-label={corriendo ? (sostener ? `Quedan ${centro} segundos. Tocá para terminar antes` : "Llegamos") : "Empezar"}
          className="relative rounded-full border-0 bg-transparent p-0 cursor-pointer disabled:cursor-default"
          style={{ width: tam, height: tam }}
        >
          <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="120" cy="120" r="84" fill="#fff" />
            <circle cx="120" cy="120" r="100" fill="none" stroke="#efeada" strokeWidth="18" />
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke={tema.fuerte}
              strokeWidth="18"
              strokeLinecap="round"
              opacity={corriendo || ladoListo ? 1 : 0}
              strokeDasharray={`${c * (corriendo ? frac : ladoListo ? 1 : 0)} ${c}`}
              style={{ transition: "stroke-dasharray 1s linear" }}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            {centro !== null ? (
              <>
                <span className={`font-serif leading-none text-tinta ${large ? "text-[76px]" : "text-[66px]"}`}>{centro}</span>
                <span className="mt-1 text-[14px] font-semibold text-tinta-tenue">{sostener ? "segundos" : "tocá al llegar"}</span>
              </>
            ) : ladoListo ? (
              <Marca className="w-16 h-16 [&_svg]:w-8 [&_svg]:h-8" />
            ) : (
              <span className={`font-semibold text-tinta ${large ? "text-[24px]" : "text-[21px]"}`}>Empezar</span>
            )}
          </span>
        </button>
        <p key={mensaje} className={`ses-sube m-0 mt-5 min-h-[2.8em] max-w-sm text-center font-semibold leading-snug text-tinta ${t.cuerpo}`} aria-live="polite">
          {mensaje}
        </p>
        {ladoListo && !todo && (
          <button
            type="button"
            onClick={() => {
              setLado(1);
              setIntento(0);
              setSeg(0);
            }}
            className={`ses-sube min-h-12 px-6 rounded-full border-[1.5px] border-verde-profundo bg-verde-tenue text-verde-profundo font-semibold cursor-pointer ${t.chico}`}
          >
            Pasar al otro lado
          </button>
        )}
      </div>
      <Pie etiqueta={todo ? "Terminamos" : "Terminar acá"} tono={todo ? "principal" : "suave"} />
    </>
  );
}

// ─── Descanso: un círculo que respira ───
export function Descanso({ e }: { e: De<"descanso"> }) {
  const { tema, large } = useSesion();
  const t = useTam();
  const [restante, setRestante] = useState(e.segundos);
  useEffect(() => {
    if (restante <= 0) return;
    const id = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [restante]);
  // Ciclo de 10 s: 4 para tomar aire, 6 para soltarlo (igual que la animación).
  const fase = (e.segundos - restante) % 10 < 4 ? "Tomá aire…" : "Soltalo despacio…";
  const mmss = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, "0")}`;
  const tam = large ? 240 : 210;
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.texto}</Nota>
      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex items-center justify-center" style={{ width: tam, height: tam }}>
          <span className={`absolute inset-0 rounded-full opacity-35 ${restante > 0 ? "ses-respira" : ""}`} style={{ background: tema.claro }} aria-hidden="true" />
          <span
            className={`absolute inset-[14%] rounded-full ${restante > 0 ? "ses-respira" : ""}`}
            style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tema.claro})`, animationDelay: "-0.3s" }}
            aria-hidden="true"
          />
          <span className={`relative font-serif text-tinta ${large ? "text-[46px]" : "text-[40px]"}`} aria-live="off">
            {restante > 0 ? mmss : "Listo"}
          </span>
        </div>
        <p className={`m-0 mt-6 font-semibold text-tinta-suave ${t.cuerpo}`} aria-live="polite">
          {restante > 0 ? fase : "Bien. Seguimos cuando quieran."}
        </p>
      </div>
      <Pie etiqueta={restante > 0 ? "Saltar el descanso" : "Seguir"} tono={restante > 0 ? "suave" : "principal"} />
    </>
  );
}

// ─── ¿Cómo se siente? ───
export function Sentir({ e }: { e: De<"sentir"> }) {
  const { respuestas, responder, siguiente, abrirParar, tema } = useSesion();
  const t = useTam();
  const v = valorUno(respuestas, "sentir");
  const opciones: { id: string; texto: string; icono: NombreIcono }[] = [
    { id: "bien", texto: "Bien", icono: "bien" },
    { id: "cansado", texto: "Con cansancio", icono: "cansado" },
    { id: "molestia", texto: "Con molestia", icono: "molestia" },
  ];
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={v === o.id}
            onClick={() => {
              responder("sentir", o.id);
              if (o.id === "bien") setTimeout(siguiente, 250);
              if (o.id === "molestia") abrirParar();
            }}
            className={`flex flex-col items-center gap-2 rounded-[22px] border-2 px-2 py-5 cursor-pointer transition-colors ${
              v === o.id ? "bg-verde-tenue border-verde-profundo" : "bg-white border-borde hover:border-verde-serenidad/60"
            }`}
          >
            <Icono nombre={o.icono} className="w-16 h-16 text-tinta" relleno={o.id === "molestia" ? "#f0c3b3" : tema.relleno} />
            <span className={`font-semibold leading-tight text-tinta ${t.chico}`}>{o.texto}</span>
          </button>
        ))}
      </div>
      {v === "cansado" && (
        <p className={`ses-sube m-0 mt-5 rounded-2xl bg-fila-fria px-4 py-3.5 leading-relaxed text-tinta ${t.cuerpo}`}>Bien hecho. Por hoy alcanza; descansen un rato.</p>
      )}
      {v === "molestia" && (
        <p className={`ses-sube m-0 mt-5 rounded-2xl bg-alerta px-4 py-3.5 leading-relaxed text-alerta-texto ${t.cuerpo}`}>Paren acá. Si la molestia sigue, contale a su equipo.</p>
      )}
      <Pie etiqueta="Siguiente" habilitado={!!v} />
    </>
  );
}

// ─── Repaso de lo que armaron juntos ───
export function Repaso({ e }: { e: De<"repaso"> }) {
  const { guion, respuestas, participante, tema } = useSesion();
  const t = useTam();
  const tipoDe = (clave: string) => guion.escenas.find((s) => "clave" in s && s.clave === clave)?.tipo;
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {!participante && e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      <div className="ses-sube mt-5 rounded-[26px] bg-white border border-borde px-5 py-5 shadow-elevada grid gap-5">
        {e.partes.map((p) => {
          const tipo = tipoDe(p.clave);
          if (tipo === "elegir") {
            const v = valorUno(respuestas, p.clave);
            const o = v ? opcionDe(guion, p.clave, v, respuestas) : null;
            if (!o) return null;
            return (
              <div key={p.clave} className="flex items-center gap-4">
                <span className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: tema.claro }}>
                  <Icono nombre={o.icono} className="w-11 h-11 text-tinta" relleno="#fff" />
                </span>
                <div>
                  <p className={`m-0 tracking-[0.14em] uppercase font-semibold text-tinta-tenue ${t.ceja}`}>{p.etiqueta}</p>
                  <p className={`m-0 font-serif text-tinta leading-tight first-letter:uppercase ${t.grande}`}>{o.dicho ?? o.texto}</p>
                </div>
              </div>
            );
          }
          const lista = valorLista(respuestas, p.clave)
            .map((v) => opcionDe(guion, p.clave, v, respuestas))
            .filter((o): o is Opcion => !!o);
          if (!lista.length) return null;
          return (
            <div key={p.clave}>
              <p className={`m-0 mb-2 tracking-[0.14em] uppercase font-semibold text-tinta-tenue ${t.ceja}`}>{p.etiqueta}</p>
              {tipo === "ordenar" ? (
                <ol className="m-0 p-0 list-none grid gap-2">
                  {lista.map((o, i) => (
                    <li key={o.id} className={`flex items-center gap-3 text-tinta ${t.cuerpo}`}>
                      <span className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full bg-tinta text-white font-bold text-[15px]">{i + 1}</span>
                      <Icono nombre={o.icono} className="w-8 h-8 shrink-0" relleno={tema.relleno} />
                      {o.texto}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lista.map((o) => (
                    <span key={o.id} className={`inline-flex items-center gap-1.5 rounded-full bg-campo border border-borde pl-2 pr-3 py-1.5 font-semibold text-tinta ${t.chico}`}>
                      <Icono nombre={o.icono} className="w-6 h-6" relleno={tema.relleno} />
                      {o.texto}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Pie etiqueta="Siguiente" />
    </>
  );
}

// ─── Misión de la semana ───
export function Mision({ e }: { e: De<"mision"> }) {
  const { guion, respuestas, marcas, marcar, participante, tema } = useSesion();
  const t = useTam();
  // El dibujo de lo elegido antes (la hoja), si hay.
  const icono = useMemo<NombreIcono>(() => {
    if (e.icono) return e.icono;
    for (const s of guion.escenas) {
      if (s.tipo !== "elegir") continue;
      const v = valorUno(respuestas, s.clave);
      const o = v ? opcionDe(guion, s.clave, v, respuestas) : null;
      if (o && o.icono !== "otra") return o.icono;
    }
    return "estrella";
  }, [guion, respuestas, e.icono]);
  const hechas = marcas.filter(Boolean).length;
  return (
    <>
      <Ceja>{e.titulo}</Ceja>
      <Titulo>{plantilla(e.texto, guion, respuestas)}</Titulo>
      <div className={`mt-7 flex flex-wrap justify-center ${e.veces > 3 ? "gap-2 sm:gap-3" : "gap-3 sm:gap-5"}`}>
        {Array.from({ length: e.veces }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={!!marcas[i]}
            aria-label={`Vez ${i + 1}${marcas[i] ? ", hecha" : ""}`}
            onClick={() => marcar(i)}
            className={`relative ${e.veces > 3 ? "w-[54px] h-[54px] sm:w-[76px] sm:h-[76px]" : "w-[92px] h-[92px] sm:w-[108px] sm:h-[108px]"} rounded-full cursor-pointer transition-[background-color,border-color] border-[3px] ${
              marcas[i] ? "border-verde-profundo" : "border-dashed border-borde-campo bg-white hover:border-verde-serenidad"
            }`}
            style={marcas[i] ? { background: `radial-gradient(circle, #fff 0 52%, ${tema.claro} 53%)` } : undefined}
          >
            {marcas[i] ? (
              <>
                <Icono nombre={icono} className="ses-marca absolute inset-[22%] text-tinta" relleno={tema.relleno} />
                <Marca className="absolute -top-1 -right-1" />
              </>
            ) : (
              <span className={`font-semibold text-tinta-tenue ${t.chico}`}>{i + 1}</span>
            )}
          </button>
        ))}
      </div>
      <p className={`m-0 mt-4 text-center font-semibold text-tinta ${t.cuerpo}`} aria-live="polite">
        {hechas === e.veces ? "¡Misión cumplida!" : hechas === 0 ? "Tocá un círculo cada vez que lo hagan." : `${hechas} de ${e.veces}`}
      </p>
      {!participante && e.nota && <Nota className="mt-4 text-center">{e.nota}</Nota>}
      <Pie etiqueta="Siguiente" />
    </>
  );
}

// ─── Cuidados ───
export function Cuidados({ e }: { e: De<"cuidados"> }) {
  const { tema } = useSesion();
  const t = useTam();
  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {e.nota && <Nota className="mt-2">{e.nota}</Nota>}
      <ul className="m-0 mt-5 p-0 list-none grid gap-2.5">
        {e.items.map((it, i) => (
          <li key={it.texto} className="ses-sube flex items-center gap-4 rounded-[22px] bg-white border border-borde px-4 py-4" style={{ animationDelay: `${i * 70}ms` }}>
            <Icono nombre={it.icono} className="w-12 h-12 shrink-0 text-tinta" relleno={tema.relleno} />
            <p className={`m-0 leading-snug text-tinta ${t.cuerpo}`}>{it.texto}</p>
          </li>
        ))}
      </ul>
      <Pie etiqueta="Entendido" />
    </>
  );
}

// ─── Cierre: festejo y un dato para llevarse ───
const COLORES_PETALO = ["#58979d", "#f4c372", "#ede8d0", "#c0664f", "#6a969c"];

function Petalos() {
  const petalos = useRef(
    Array.from({ length: 16 }, (_, i) => {
      const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 120 + Math.random() * 90;
      return {
        dx: `${Math.cos(ang) * dist}px`,
        dy: `${Math.sin(ang) * dist - 40}px`,
        rot: `${Math.random() * 360}deg`,
        color: COLORES_PETALO[i % COLORES_PETALO.length],
        delay: `${Math.random() * 180}ms`,
      };
    }),
  ).current;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[88px] w-0 h-0" aria-hidden="true">
      {petalos.map((p, i) => (
        <span
          key={i}
          className="ses-petalo absolute w-4 h-4 -ml-2 -mt-2 opacity-0"
          style={{ background: p.color, borderRadius: "50% 50% 50% 0", animationDelay: p.delay, "--dx": p.dx, "--dy": p.dy, "--rot": p.rot } as CSSProperties}
        />
      ))}
    </div>
  );
}

function Dato({ texto }: { texto: string }) {
  const t = useTam();
  const [vuelta, setVuelta] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setVuelta(true)}
      aria-label={vuelta ? undefined : "Ver un dato para hoy"}
      className="ses-carta mt-7 w-full max-w-md border-0 bg-transparent p-0 cursor-pointer text-left"
      data-vuelta={vuelta}
    >
      <span className="ses-carta-interior grid min-h-[150px]">
        <span className="ses-carta-cara [grid-area:1/1] flex flex-col items-center justify-center gap-2 rounded-[24px] bg-beige-serenidad border border-borde px-5 py-5 text-center">
          <Icono nombre="luz" className="w-11 h-11 text-tinta" relleno="#f4c372" />
          <span className={`font-semibold text-tinta ${t.cuerpo}`}>Tocá para ver un dato</span>
        </span>
        <span className="ses-carta-cara ses-carta-dorso [grid-area:1/1] flex flex-col justify-center rounded-[24px] bg-white border border-borde px-5 py-5 shadow-elevada">
          <span className={`block mb-1.5 tracking-[0.14em] uppercase font-semibold text-tinta-tenue ${t.ceja}`}>¿Sabías que…?</span>
          <span className={`block leading-relaxed text-tinta ${t.chico}`}>{texto}</span>
        </span>
      </span>
    </button>
  );
}

export function Cierre({ e }: { e: De<"cierre"> }) {
  const { datos, terminar, textoTerminar } = useSesion();
  const t = useTam();
  return (
    <>
      <div className="relative flex flex-col items-center text-center pt-6">
        <Petalos />
        <div className="ses-sube w-[150px] h-[150px] rounded-full bg-white border border-borde flex items-center justify-center shadow-elevada">
          <Icono nombre="estrella" className="w-20 h-20 text-tinta" relleno="#f4c372" />
        </div>
        <Ceja>
          <span className="block mt-6">¡Lo lograron!</span>
        </Ceja>
        <p className={`m-0 max-w-md font-serif italic leading-snug text-verde-profundo ${t.grande}`}>{e.texto}</p>
        {e.dato && datos.sabiasQue && <Dato texto={datos.sabiasQue} />}
      </div>
      <Pie etiqueta={textoTerminar} onClick={() => terminar()} solo />
    </>
  );
}

export function VistaEscena({ e }: { e: Escena }) {
  switch (e.tipo) {
    case "seguridad":
      return <Seguridad />;
    case "preparar":
      return <Preparar e={e} />;
    case "video":
      return <Video e={e} />;
    case "consigna":
      return <Consigna e={e} />;
    case "decir":
      return <Decir e={e} />;
    case "elegir":
      return <Elegir e={e} />;
    case "lista":
      return <Lista e={e} />;
    case "ordenar":
      return <Ordenar e={e} />;
    case "repeticiones":
      return <Repeticiones e={e} />;
    case "tiempo":
      return <Tiempo e={e} />;
    case "leer":
      return <Leer e={e} />;
    case "material":
      return <Material e={e} />;
    case "descanso":
      return <Descanso e={e} />;
    case "sentir":
      return <Sentir e={e} />;
    case "repaso":
      return <Repaso e={e} />;
    case "mision":
      return <Mision e={e} />;
    case "cuidados":
      return <Cuidados e={e} />;
    case "cierre":
      return <Cierre e={e} />;
  }
}
