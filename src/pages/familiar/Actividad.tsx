import { Link } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { todayFeaturedTask } from "../../lib/patient";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { Button } from "../../components/ui/Button";

export function Actividad() {
  const plan = useAppStore((s) => s.plan);
  const featured = todayFeaturedTask(plan);

  if (!featured) {
    return (
      <div>
        <Link to="/app/hoy" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-3.5">
          ‹ Volver a Hoy
        </Link>
        <p className="m-0 text-[16px] text-tinta-suave">No hay actividad pendiente para hoy.</p>
      </div>
    );
  }

  const { task } = featured;
  const pasos = task.pasos && task.pasos.length > 0 ? task.pasos : task.detalle ? [task.detalle] : [];

  return (
    <div>
      <Link to="/app/hoy" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-3.5">
        ‹ Volver a Hoy
      </Link>
      <h3 className="font-serif font-normal text-[26px] m-0 mb-3.5">{task.titulo}</h3>
      <div className="mb-4.5">
        <ImagePlaceholder label={`${task.tipo}${task.duracion ? ` · ${task.duracion}` : ""}`} height={150} />
      </div>
      {pasos.length > 0 && (
        <>
          <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Cómo acompañar</p>
          <div className="grid gap-2.5 mb-4.5 text-[16px] leading-relaxed text-tinta-suave">
            {pasos.map((p, i) => (
              <span key={p}>
                {i + 1}. {p}
              </span>
            ))}
          </div>
        </>
      )}
      {task.porQue && (
        <div className="bg-fila-fria rounded-2xl p-4 mb-4">
          <p className="m-0 mb-1.5 text-[15px] font-bold text-verde-profundo">¿Por qué esta actividad?</p>
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">{task.porQue}</p>
        </div>
      )}
      <Button variant="ink" fullWidth to="/app/hoy">
        Registrar y volver
      </Button>
    </div>
  );
}
