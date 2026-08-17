import { Link } from "react-router-dom";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { Button } from "../../components/ui/Button";
import { todayActivity } from "../../lib/mockData";

export function Actividad() {
  return (
    <div>
      <Link to="/app/hoy" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-3.5">
        ‹ Volver a Hoy
      </Link>
      <h3 className="font-serif font-normal text-[26px] m-0 mb-3.5">Preparar una merienda</h3>
      <div className="mb-4.5">
        <ImagePlaceholder label="video · 3:20" height={150} />
      </div>
      <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Cómo acompañar</p>
      <div className="grid gap-2.5 mb-4.5 text-[16px] leading-relaxed text-tinta-suave">
        {todayActivity.pasos.map((p, i) => (
          <span key={p}>
            {i + 1}. {p}
          </span>
        ))}
      </div>
      <div className="bg-fila-fria rounded-2xl p-4 mb-4">
        <p className="m-0 mb-1.5 text-[15px] font-bold text-verde-profundo">¿Por qué esta actividad?</p>
        <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">{todayActivity.porQue}</p>
      </div>
      <Button variant="ink" fullWidth to="/app/hoy">
        Registrar y volver
      </Button>
    </div>
  );
}
