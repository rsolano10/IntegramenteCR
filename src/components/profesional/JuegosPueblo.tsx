import { Suspense, lazy, useState } from "react";
import { NIVELES, nivelDe, nivelLabel, type Nivel } from "../../lib/actividades/contrato";
import { actividadPorTipo, resumenNivel } from "../../lib/actividades/registro";
import { nivelCognitivoLabel, type MediaResource } from "../../lib/mediaResources";
import { moduloTheme } from "../../lib/modulos";
import { Modal } from "../ui/Modal";
import { RowMenu, type RowMenuItem } from "../ui/RowMenu";

const ActividadInteractiva = lazy(() => import("../actividades/interactivas/Marco"));
const PortadaDeJuego = lazy(() => import("../actividades/interactivas/Marco").then((m) => ({ default: m.PortadaDeJuego })));

// «Juegos del pueblo» en la Biblioteca. Un juego no se crea como un PDF o un
// video: es un producto fijo (un lugar del pueblo) y la clínica elige cuál y
// en qué nivel para cada persona. Cada tarjeta abre la ficha del juego, con
// el juego jugable en los tres niveles.

function datos(r: MediaResource) {
  const ex = r.extras?.modo === "interactiva" ? r.extras : null;
  const def = ex ? actividadPorTipo(ex.tipo) : undefined;
  return { ex, def };
}

export function GrillaJuegos({ juegos, onAbrir, menu }: { juegos: MediaResource[]; onAbrir: (r: MediaResource) => void; menu: (r: MediaResource) => RowMenuItem[] }) {
  if (!juegos.length) return <p className="m-0 text-sm text-tinta-tenue">Ningún juego coincide con la búsqueda.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {juegos.map((r) => {
        const { ex, def } = datos(r);
        const tema = moduloTheme[r.modulo];
        return (
          <article
            key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => onAbrir(r)}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onAbrir(r);
              }
            }}
            className={`group relative flex flex-col rounded-[22px] border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-elevada focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
              r.activo ? "border-borde bg-white" : "border-borde-suave bg-campo/60 opacity-70"
            }`}
          >
            <div className="relative h-[168px] overflow-hidden bg-[#efe6d2] flex items-center justify-center" aria-hidden="true">
              {ex ? (
                <div className="w-[300px] pointer-events-none transition-transform duration-300 group-hover:scale-[1.04]">
                  <Suspense fallback={null}>
                    <PortadaDeJuego tipo={ex.tipo} />
                  </Suspense>
                </div>
              ) : (
                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(135deg, ${tema.from}, ${tema.to})` }} />
              )}
              <span className="absolute top-2.5 left-2.5 inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 text-tinta text-[11px] font-bold uppercase tracking-[0.05em]">
                {ex ? `Nivel sugerido · ${nivelLabel[nivelDe(ex)]}` : "Juego"}
              </span>
            </div>
            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
              <span className="w-9 h-9 rounded-full bg-white/90 inline-flex items-center justify-center">
                <RowMenu items={menu(r)} />
              </span>
            </div>
            <div className="flex flex-col flex-1 gap-1.5 p-4.5">
              <h3 className="m-0 font-serif font-normal text-[21px] leading-tight text-tinta group-hover:text-verde-profundo">{r.titulo}</h3>
              {def && (
                <p className="m-0 text-[13.5px] leading-snug text-tinta-suave">
                  {def.area}: {def.funcion.toLowerCase()}
                </p>
              )}
              {!r.activo && <p className="m-0 text-[12.5px] font-bold text-tinta-tenue">Desactivado: no aparece al asignar</p>}
              {(r.niveles_cognitivos ?? []).length > 0 && (
                <div className="mt-auto pt-2 flex flex-wrap gap-1">
                  {(r.niveles_cognitivos ?? []).map((n) => (
                    <span key={n} className="inline-flex items-center h-6 px-2 rounded-full bg-campo border border-borde-suave text-[11.5px] font-bold text-tinta-suave">
                      {nivelCognitivoLabel[n]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

// La ficha del juego: jugarlo como la familia en cada nivel, qué estimula,
// para quién, y los ajustes avanzados (el editor del recurso).
export function FichaJuego({ r, onClose, onAjustes, menu }: { r: MediaResource; onClose: () => void; onAjustes: () => void; menu: RowMenuItem[] }) {
  const { ex, def } = datos(r);
  const [nivel, setNivel] = useState<Nivel>(ex ? nivelDe(ex) : "suave");
  const [partida, setPartida] = useState(0);
  return (
    <Modal onClose={onClose} size="xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7">
        <div className="min-w-0 grid gap-4 content-start">
          <div className="pr-10">
            <p className="m-0 mb-1 text-[12.5px] font-extrabold tracking-[0.16em] uppercase text-aviso-texto">Juego del pueblo</p>
            <h2 className="m-0 font-serif font-normal text-[28px] leading-tight">{r.titulo}</h2>
          </div>
          {ex && (
            <div role="radiogroup" aria-label="Nivel para jugar" className="inline-flex self-start p-1 rounded-full bg-campo border-[1.5px] border-borde-campo">
              {NIVELES.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={nivel === n}
                  onClick={() => {
                    setNivel(n);
                    setPartida((p) => p + 1);
                  }}
                  className={`h-10 px-4 rounded-full border-0 font-sans text-[14px] cursor-pointer ${nivel === n ? "bg-tinta text-white font-bold" : "bg-transparent text-tinta-suave font-semibold hover:text-tinta"}`}
                >
                  {nivelLabel[n]}
                </button>
              ))}
            </div>
          )}
          <div className="rounded-[24px] bg-fondo-papel border border-borde p-3 sm:p-5">
            <p className="m-0 mb-3 text-[12.5px] text-tinta-tenue text-center">Así lo juega la familia, en nivel {nivelLabel[nivel].toLowerCase()}. No se guarda nada.</p>
            <Suspense fallback={<div className="min-h-[320px]" aria-busy="true" />}>
              {ex ? <ActividadInteractiva key={`${nivel}-${partida}`} extras={{ ...ex, nivel }} /> : <p className="m-0 text-center text-tinta-suave">Abrí los ajustes para verlo.</p>}
            </Suspense>
          </div>
        </div>

        <aside className="grid gap-4 content-start lg:pt-12">
          {def && (
            <section className="rounded-2xl bg-campo border border-borde-suave p-4">
              <h3 className="m-0 mb-1 text-[13px] font-extrabold tracking-[0.06em] uppercase text-tinta-suave">Qué estimula</h3>
              <p className="m-0 text-[14.5px] leading-relaxed text-tinta">
                {def.area}: {def.funcion.toLowerCase()}.
              </p>
              <p className="m-0 mt-1 text-[12.5px] text-tinta-tenue">Solo para el equipo; la familia no ve esto.</p>
            </section>
          )}
          {ex && (
            <section className="rounded-2xl bg-campo border border-borde-suave p-4">
              <h3 className="m-0 mb-2 text-[13px] font-extrabold tracking-[0.06em] uppercase text-tinta-suave">Los tres niveles</h3>
              <ul className="list-none m-0 p-0 grid gap-2">
                {NIVELES.map((n) => (
                  <li key={n} className={`text-[13.5px] leading-snug ${n === nivel ? "text-tinta" : "text-tinta-suave"}`}>
                    <strong className="text-tinta">{nivelLabel[n]}</strong>
                    {n === nivelDe(ex) && <span className="ml-1.5 text-[11px] font-bold text-aviso-texto">SUGERIDO</span>}
                    <br />
                    {resumenNivel(ex, n)}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="rounded-2xl bg-campo border border-borde-suave p-4">
            <h3 className="m-0 mb-1 text-[13px] font-extrabold tracking-[0.06em] uppercase text-tinta-suave">Al asignarlo</h3>
            <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
              El nivel se propone solo: el de la última vez que se le dio a esa persona o, si es la primera, el de su etapa (suave con demencia, medio con
              deterioro cognitivo leve, retador en preventivo). Al terminar, la familia cuenta cómo le resultó y te sugerimos cuándo subir o bajar.
            </p>
            {(r.niveles_cognitivos ?? []).length > 0 && (
              <p className="m-0 mt-2 text-[13px] text-tinta-suave">
                <strong className="text-tinta">Pensado para:</strong> {(r.niveles_cognitivos ?? []).map((n) => nivelCognitivoLabel[n]).join(", ")}.
              </p>
            )}
          </section>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAjustes}
              className="flex-1 h-11 px-4 rounded-xl border-[1.5px] border-[#c9d8d9] bg-white text-verde-profundo font-sans text-[14px] font-bold cursor-pointer hover:border-verde-profundo"
            >
              Ajustes avanzados
            </button>
            <span className="w-11 h-11 rounded-xl border-[1.5px] border-borde-campo bg-white inline-flex items-center justify-center">
              <RowMenu items={menu} />
            </span>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
