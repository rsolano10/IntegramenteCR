import { Metric } from "../../components/ui/Metric";
import { Button } from "../../components/ui/Button";

export function Resumen() {
  return (
    <div>
      <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Resumen</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Cómo fue la semana</h3>
      <div className="grid grid-cols-2 gap-3 mb-4.5">
        <Metric value="4/5" label="actividades registradas" />
        <Metric value="3" label="veces la disfrutó" tone="amarillo" />
      </div>
      <div className="grid gap-3 mb-5">
        <div className="border border-borde rounded-2xl p-4">
          <strong className="block text-[15px] mb-1">Funcionó</strong>
          <span className="text-[16px] text-tinta-suave">Las actividades de la mañana con música de fondo.</span>
        </div>
        <div className="border border-borde rounded-2xl p-4">
          <strong className="block text-[15px] mb-1">Costó</strong>
          <span className="text-[16px] text-tinta-suave">Las tareas con dos pasos seguidos.</span>
        </div>
      </div>
      <Button fullWidth to="/app/plan">
        Generar la próxima semana
      </Button>
      <p className="m-0 mt-3.5 text-[15px] leading-relaxed text-tinta-tenue">
        Se bajará la dificultad de lo rechazado dos veces y se mantendrá el objetivo.
      </p>
    </div>
  );
}
