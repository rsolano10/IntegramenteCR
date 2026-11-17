import { useState } from "react";
import { etiquetaHora, franjaFija, franjasDe, revisarAgenda, type EjercicioAgenda, type Problema } from "../../../lib/actividades/agenda";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { P } from "./paleta";
import { Letrero } from "./Ornamento";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La pizarra de la cocina» (agenda). El tablero de corcho de la cocina con
// las franjas del día, la taza de café y el almanaque. Las tareas son
// papelitos: se toca uno y después la franja donde se haría. Las reglas
// están siempre a la vista. Al terminar, el almanaque pasa al día siguiente.

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioAgenda; ctl: Control }) {
  const [ubicacion, setUbicacion] = useState<Record<string, number | undefined>>({});
  const [elegida, setElegida] = useState<string | null>(null);
  const [marcadas, setMarcadas] = useState<Problema[]>([]);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const franjas = franjasDe(ej.franjas);
  const sinPoner = ej.tareas.filter((t) => ubicacion[t.id] === undefined);
  const tarea = (id: string) => ej.tareas.find((t) => t.id === id)!;

  usePista(ctl.pista, () => {
    // Primero, una tarea con hora fija que no está en su hora.
    const fija = ej.tareas.find((t) => t.hora !== null && ubicacion[t.id] !== franjaFija(t.hora, ej.franjas));
    if (fija) {
      setUbicacion((u) => ({ ...u, [fija.id]: franjaFija(fija.hora!, ej.franjas) }));
      setElegida(null);
      return ctl.aviso(`Puse «${fija.texto}» en su hora.`);
    }
    const p = revisarAgenda(ej, ubicacion).find((x) => x.tipo !== "falta");
    if (p) {
      setMarcadas([p]);
      return ctl.aviso(p.texto);
    }
    ctl.aviso("Va muy bien. Ubicá lo que falta donde te parezca.");
  });

  function tocarTarea(id: string) {
    if (hecho) return;
    setMarcadas([]);
    setElegida((e) => (e === id ? null : id));
  }

  function tocarFranja(f: number) {
    if (hecho || !elegida) return;
    setUbicacion((u) => ({ ...u, [elegida]: f }));
    setElegida(null);
    setMarcadas([]);
  }

  function listo() {
    const problemas = revisarAgenda(ej, ubicacion);
    if (!problemas.length) {
      setHecho(true);
      return ctl.listo();
    }
    setMarcadas(problemas);
    ctl.reintento(problemas[0].texto);
  }

  const marcada = (id: string) => marcadas.some((p) => p.tarea === id);
  const reglaMarcada = (texto: string) => marcadas.some((p) => p.regla?.texto === texto);

  const papel = (id: string, enPizarra = false) => {
    const t = tarea(id);
    const est = estiloPieza(elegida === id ? "elegida" : marcada(id) ? "pista" : "reposo");
    return (
      <button
        type="button"
        onClick={() => tocarTarea(id)}
        disabled={hecho}
        aria-pressed={elegida === id}
        aria-label={`${t.texto}${t.hora !== null ? `, a las ${etiquetaHora(t.hora)}` : ""}${enPizarra ? ". Tocá para moverla" : ""}`}
        className={`${clasePieza} ${est.className} rounded-[8px] text-left px-3 py-2 leading-tight font-bold ${L ? "text-[18px]" : "text-[15.5px]"}`}
        style={{ ...est.style, background: "#fffdf6", color: P.tierra }}
      >
        {t.texto}
        {t.hora !== null && (
          <span className="ml-1.5 inline-block rounded-full px-2 py-0.5 text-[13px] font-bold align-middle" style={{ background: P.mostaza, color: P.tierra }}>
            {etiquetaHora(t.hora)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Encabezado titulo={ej.titulo} final={hecho} />
        <div className="pueblo-grano px-3 py-3 grid gap-3" style={{ backgroundColor: "#C9A26B" }}>
          {/* Las reglas, siempre a la vista */}
          {ej.reglas.length > 0 && (
            <ul className="list-none m-0 p-0 grid gap-1.5" aria-label="Para tener en cuenta">
              {ej.reglas.map((r) => (
                <li
                  key={r.texto}
                  className={`rounded-[6px] px-3 py-1.5 leading-snug ${L ? "text-[17px]" : "text-[15px]"}`}
                  style={{ background: reglaMarcada(r.texto) ? P.mostaza : P.cal, color: P.tierra, boxShadow: "0 2px 0 rgba(51,36,28,0.25)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" className="inline-block mr-1.5 -mt-0.5" aria-hidden="true">
                    <circle cx="7" cy="5" r="4" fill={P.grano} />
                    <path d="M7 9v5" stroke={P.tierra} strokeWidth="1.5" />
                  </svg>
                  {r.texto}
                </li>
              ))}
            </ul>
          )}
          {/* Las tareas por ubicar, arriba, para no tener que bajar y subir */}
          {!hecho && sinPoner.length > 0 && (
            <div className="rounded-[10px] px-2.5 py-2.5 grid gap-2" style={{ background: "rgba(51,36,28,0.12)" }}>
              <p className={`m-0 font-bold ${L ? "text-[18px]" : "text-[15px]"}`} style={{ color: P.tierra }}>
                {elegida ? "Ahora tocá la franja donde va." : "Tocá una tarea:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {sinPoner.map((t) => (
                  <span key={t.id}>{papel(t.id)}</span>
                ))}
              </div>
            </div>
          )}
          {/* Las franjas del día */}
          <ol className="list-none m-0 p-0 grid gap-1.5" aria-label="Franjas del día">
            {franjas.map((f, i) => {
              const aqui = ej.tareas.filter((t) => ubicacion[t.id] === i);
              return (
                <li key={f}>
                  <div
                    role="button"
                    tabIndex={elegida ? 0 : -1}
                    onClick={() => tocarFranja(i)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && tocarFranja(i)}
                    aria-label={`Franja ${f}${elegida ? `: poner aquí «${tarea(elegida).texto}»` : ""}`}
                    className={`flex items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors ${elegida ? "cursor-pointer" : ""} ${ej.franjas === "momentos" ? "min-h-[72px]" : "min-h-[46px]"}`}
                    style={{ background: elegida ? "rgba(246,241,228,0.55)" : "rgba(246,241,228,0.3)", outline: elegida ? `2px dashed ${P.cal}` : "none" }}
                  >
                    <span className={`shrink-0 font-rotulo leading-tight whitespace-nowrap ${ej.franjas === "momentos" ? "w-[72px]" : "w-[84px]"} ${L ? "text-[17px]" : "text-[14px]"}`} style={{ color: P.tierra }}>
                      {f}
                    </span>
                    <span className="flex flex-wrap gap-1.5 flex-1">
                      {aqui.map((t) => (
                        <span key={t.id} onClick={(e) => e.stopPropagation()}>
                          {papel(t.id, true)}
                        </span>
                      ))}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <Letrero large={L} clavado>
        {hecho ? "¡El día quedó bien organizado!" : sinPoner.length ? "" : "Cuando te parezca bien, tocá «Listo»."}
      </Letrero>

      {!hecho && (
        <Acciones ctl={ctl}>
          <Boton onClick={listo} disabled={sinPoner.length > 0} large={L}>
            Listo
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => {
              setUbicacion({});
              setElegida(null);
              setMarcadas([]);
            }}
            disabled={!Object.keys(ubicacion).length}
            large={L}
          >
            Empezar de nuevo
          </Boton>
        </Acciones>
      )}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Encabezado titulo="Un día en casa" final={final} />
      <div className="pueblo-grano h-10" style={{ backgroundColor: "#C9A26B" }} />
    </div>
  );
}

// El marco del tablero: el título del día, la taza y el almanaque.
function Encabezado({ titulo, final }: { titulo: string; final: boolean }) {
  const hoy = new Date().getDate();
  const manana = new Date(Date.now() + 86400000).getDate();
  return (
    <div className="pueblo-grano flex items-center gap-3 px-3 py-3" style={{ backgroundColor: P.cal, borderBottom: `6px solid ${P.madera}` }}>
      <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
        <path d="M8 18h26v12a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 30z" fill={P.serenidad} stroke={P.tierra} strokeWidth="2" />
        <path d="M34 21h3a4 4 0 0 1 0 8h-3" fill="none" stroke={P.tierra} strokeWidth="2" />
        <path d="M17 8c-2 3 2 5 0 8M25 6c-2 3 2 5 0 8" stroke={P.tierra} strokeOpacity="0.4" strokeWidth="2" fill="none" className="motion-safe:animate-[pueblo-vapor_3.2s_ease-in-out_infinite]" />
      </svg>
      <p className="m-0 flex-1 font-rotulo text-[20px] leading-tight" style={{ color: P.tierra }}>
        {titulo}
      </p>
      {/* El almanaque: al terminar se arranca la hoja y aparece el día siguiente */}
      <div className="relative w-[52px] h-[58px] shrink-0">
        <div className="absolute inset-0 rounded-[4px] flex flex-col overflow-hidden" style={{ background: "#fff", boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
          <span className="h-4 text-[10px] font-bold text-center leading-4 text-white" style={{ background: P.grano }}>
            DÍA
          </span>
          <span className="flex-1 flex items-center justify-center font-rotulo text-[24px]" style={{ color: P.tierra }}>
            {final ? manana : hoy}
          </span>
        </div>
        {final && (
          <div className="absolute inset-0 rounded-[4px] flex flex-col overflow-hidden motion-safe:animate-[pueblo-arranque_700ms_ease-in_both]" style={{ background: "#fff" }}>
            <span className="h-4" style={{ background: P.grano }} />
            <span className="flex-1 flex items-center justify-center font-rotulo text-[24px]" style={{ color: P.tierra }}>
              {hoy}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
