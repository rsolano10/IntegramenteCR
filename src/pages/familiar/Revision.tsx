import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { Button } from "../../components/ui/Button";

export function Revision() {
  const navigate = useNavigate();
  const weekMood = useAppStore((s) => s.weekMood);
  const setWeekMood = useAppStore((s) => s.setWeekMood);

  return (
    <div>
      <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Revisión semanal</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Tres preguntas y listo</h3>
      <div className="grid gap-5 mb-5">
        <div>
          <p className="m-0 mb-2.5 text-[16px] font-semibold">¿Cómo estuvo el ánimo esta semana?</p>
          <OptionGroup
            value={weekMood}
            onChange={setWeekMood}
            options={[
              { value: "better", label: "Mejor" },
              { value: "same", label: "Igual" },
              { value: "worse", label: "Peor" },
            ]}
          />
        </div>
        <div>
          <p className="m-0 mb-2.5 text-[16px] font-semibold">¿Qué actividad le gustó más?</p>
          <input
            type="text"
            defaultValue="Ordenar las fotos"
            className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px]"
          />
        </div>
        <div>
          <p className="m-0 mb-2.5 text-[16px] font-semibold">¿Hubo algo que te preocupó?</p>
          <input
            type="text"
            placeholder="Opcional"
            className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px]"
          />
        </div>
      </div>
      <Button variant="ink" fullWidth onClick={() => navigate("/app/resumen")}>
        Ver resumen de la semana
      </Button>
    </div>
  );
}
