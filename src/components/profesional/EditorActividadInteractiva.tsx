import { Suspense, lazy, useMemo, useState } from "react";
import { EJERCICIOS, NIVELES, nivelLabel, nivelDe, resolverConfig, type Campo, type ExtrasInteractiva } from "../../lib/actividades/contrato";
import { actividadPorTipo, erroresDeActividad } from "../../lib/actividades/registro";
import { Modal } from "../ui/Modal";

const ActividadInteractiva = lazy(() => import("../actividades/interactivas/Marco"));

// Configuración de una actividad interactiva en el editor de SU recurso
// (no es una opción al crear recursos). El nivel fija los valores por
// defecto; cada campo que se complete los pisa. Nada sube ni baja de nivel
// solo.
export function EditorActividadInteractiva({ valor, onChange }: { valor: ExtrasInteractiva; onChange: (v: ExtrasInteractiva) => void }) {
  const def = actividadPorTipo(valor.tipo);
  const [probando, setProbando] = useState(false);
  const errores = useMemo(() => erroresDeActividad(valor), [valor]);
  const campo =
    "w-full min-w-0 min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta focus:border-verde-serenidad";
  const etiqueta = "grid gap-1 text-[13px] font-semibold text-tinta-suave";

  if (!def)
    return (
      <section className="rounded-2xl border border-alerta-borde bg-alerta p-4 text-[14px] text-alerta-texto">
        Este recurso tiene una actividad interactiva que no existe («{valor.tipo}»). La familia ve «Esta actividad no está disponible por ahora».
      </section>
    );

  const nivel = nivelDe(valor);
  const base = def.porNivel[nivel] as Record<string, unknown>;
  const efectiva = resolverConfig(def, valor) as Record<string, unknown>;
  const config = valor.config ?? {};
  const fijar = (clave: string, v: unknown) => {
    const c = { ...config };
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0 && !Array.isArray(base[clave]))) delete c[clave];
    else c[clave] = v;
    onChange({ ...valor, config: c });
  };

  return (
    <section className="rounded-2xl border border-borde bg-campo/60 p-4 grid gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-bold text-tinta">Ajustes avanzados del juego</p>
          <p className="m-0 text-[13px] text-tinta-suave">
            {def.nombre} · solo para el equipo: {def.area}, {def.funcion.toLowerCase()}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setProbando(true)}
          disabled={errores.length > 0}
          className="min-h-10 px-4 rounded-full border-[1.5px] border-verde-serenidad bg-white text-verde-profundo text-[13.5px] font-semibold cursor-pointer hover:bg-verde-tenue disabled:opacity-50 disabled:cursor-default"
        >
          Probar actividad
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset className="m-0 p-0 border-0 grid gap-1">
          <legend className="text-[13px] font-semibold text-tinta-suave mb-1">Nivel sugerido</legend>
          <div className="flex gap-1.5" role="radiogroup">
            {NIVELES.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nivel === n}
                onClick={() => onChange({ ...valor, nivel: n })}
                className={`flex-1 min-h-10 rounded-full text-[13.5px] font-semibold cursor-pointer border-[1.5px] ${
                  nivel === n ? "bg-verde-profundo border-verde-profundo text-white" : "bg-white border-borde-campo text-tinta-suave hover:border-verde-serenidad"
                }`}
              >
                {nivelLabel[n]}
              </button>
            ))}
          </div>
          <span className="text-[12.5px] leading-snug text-tinta-tenue">
            Solo se usa si no hay otro dato: al asignar, el nivel sale de la última vez que se le dio a esa persona o de su etapa.
          </span>
        </fieldset>
        {!def.cantidadFija && (
          <label className={etiqueta}>
            Ejercicios por sesión
            <input
              type="number"
              min={EJERCICIOS.min}
              max={EJERCICIOS.max}
              className={campo}
              value={valor.ejercicios ?? ""}
              placeholder={String(EJERCICIOS.porDefecto)}
              onChange={(e) => onChange({ ...valor, ejercicios: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {def.campos.map((c) => (
          <CampoEditor key={c.clave} c={c} valor={config[c.clave]} porDefecto={base[c.clave]} efectivo={efectiva[c.clave]} onChange={(v) => fijar(c.clave, v)} campo={campo} etiqueta={etiqueta} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[12.5px] leading-relaxed text-tinta-tenue">Los campos vacíos usan el valor del nivel (en gris). Nada se guarda del juego: la familia registra la actividad como siempre.</p>
        {Object.keys(config).length > 0 && (
          <button type="button" onClick={() => onChange({ ...valor, config: {} })} className="text-[13px] font-semibold text-verde-profundo bg-transparent border-none cursor-pointer p-0 hover:underline">
            Volver a los valores del nivel
          </button>
        )}
      </div>

      {errores.length > 0 && (
        <ul role="alert" className="m-0 pl-5 rounded-xl bg-aviso px-4 py-2.5 text-[13.5px] text-aviso-texto grid gap-1">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {probando && (
        <Modal onClose={() => setProbando(false)} size="lg">
          <p className="m-0 mb-3 pr-10 text-[13px] text-tinta-suave">Vista de prueba con la configuración actual, sin guardar.</p>
          <Suspense fallback={<div className="min-h-[240px]" />}>
            <ActividadInteractiva extras={valor} />
          </Suspense>
        </Modal>
      )}
    </section>
  );
}

function CampoEditor({
  c,
  valor,
  porDefecto,
  efectivo,
  onChange,
  campo,
  etiqueta,
}: {
  c: Campo;
  valor: unknown;
  porDefecto: unknown;
  efectivo: unknown;
  onChange: (v: unknown) => void;
  campo: string;
  etiqueta: string;
}) {
  const ayuda = c.ayuda && <span className="font-normal text-[12px] text-tinta-tenue">{c.ayuda}</span>;
  switch (c.tipo) {
    case "numero":
      return (
        <label className={etiqueta}>
          {c.etiqueta}
          <input
            type="number"
            min={c.min}
            max={c.max}
            className={campo}
            value={typeof valor === "number" ? valor : ""}
            placeholder={String(porDefecto ?? "")}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          />
          {ayuda}
        </label>
      );
    case "booleano":
      return (
        <label className="flex items-center gap-2 text-[14px] text-tinta cursor-pointer self-end min-h-11">
          <input type="checkbox" checked={!!efectivo} onChange={(e) => onChange(e.target.checked === porDefecto ? undefined : e.target.checked)} /> {c.etiqueta}
        </label>
      );
    case "opcion":
      return (
        <label className={etiqueta}>
          {c.etiqueta}
          <select className={campo} value={String(efectivo ?? "")} onChange={(e) => onChange(e.target.value === porDefecto ? undefined : e.target.value)}>
            {c.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
                {o.valor === porDefecto ? " (del nivel)" : ""}
              </option>
            ))}
          </select>
          {ayuda}
        </label>
      );
    case "multiple": {
      const actual = (Array.isArray(efectivo) ? efectivo : []).map(String);
      const numerico = Array.isArray(porDefecto) && typeof porDefecto[0] === "number";
      const conv = (xs: string[]) => (numerico ? xs.map(Number) : xs);
      return (
        <fieldset className="m-0 p-0 border-0 grid gap-1 sm:col-span-2">
          <legend className="text-[13px] font-semibold text-tinta-suave mb-1">{c.etiqueta}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {c.opciones.map((o) => (
              <label key={o.valor} className="flex items-center gap-1.5 text-[14px] text-tinta cursor-pointer">
                <input
                  type="checkbox"
                  checked={actual.includes(o.valor)}
                  onChange={(e) => onChange(conv(e.target.checked ? [...actual, o.valor] : actual.filter((x) => x !== o.valor)))}
                />
                {o.etiqueta}
              </label>
            ))}
          </div>
          {ayuda}
        </fieldset>
      );
    }
    case "lista":
      return (
        <ListaEditor
          etiqueta={c.etiqueta}
          clase={etiqueta}
          campo={campo}
          valor={Array.isArray(valor) ? (valor as unknown[]).map(String) : []}
          numerica={!!c.numerica}
          ayuda={ayuda}
          onChange={onChange}
        />
      );
  }
}

// Texto separado por comas; se guarda como lista.
function ListaEditor({
  etiqueta,
  clase,
  campo,
  valor,
  numerica,
  ayuda,
  onChange,
}: {
  etiqueta: string;
  clase: string;
  campo: string;
  valor: string[];
  numerica: boolean;
  ayuda: React.ReactNode;
  onChange: (v: unknown) => void;
}) {
  const [texto, setTexto] = useState(valor.join(", "));
  return (
    <label className={`${clase} sm:col-span-2`}>
      {etiqueta}
      <input
        className={campo}
        value={texto}
        placeholder="Ej.: Lucía, Tito, Cartago"
        onChange={(e) => {
          setTexto(e.target.value);
          const xs = e.target.value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          onChange(xs.length ? (numerica ? xs.map(Number) : xs) : undefined);
        }}
      />
      {ayuda}
    </label>
  );
}
