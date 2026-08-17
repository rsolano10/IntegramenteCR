import { useAppStore } from "../../lib/store";
import { rechazoTriggered } from "../../lib/rules";
import { ActivityCard } from "../../components/ui/ActivityCard";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { Button } from "../../components/ui/Button";
import { todayActivity } from "../../lib/mockData";

const regMessages: Record<string, string> = {
  done: "Registrado. Mañana se repite para consolidar la rutina.",
  partial: "Registrado. Se acortará la próxima consigna.",
  no: "Registrado sin penalizar. Nadie tiene que justificar un día difícil.",
};

export function Hoy() {
  const reg = useAppStore((s) => s.reg);
  const noCount = useAppStore((s) => s.noCount);
  const markRegistro = useAppStore((s) => s.markRegistro);
  const rechazo = rechazoTriggered(reg, noCount);

  return (
    <div>
      <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Lo único de hoy</p>
      <div className="mb-4.5">
        <ActivityCard placeholderLabel="video · movilidad sentado" title={todayActivity.titulo} meta={`${todayActivity.duracion} · ${todayActivity.lugar} · ${todayActivity.consigna}.`}>
          <p className="m-0 mb-4 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-3.5 py-3">
            {todayActivity.precaucion}
          </p>
          <Button fullWidth to="/app/hoy/actividad">
            Abrir actividad
          </Button>
        </ActivityCard>
      </div>

      <p className="m-0 mb-2.5 text-[15px] font-semibold">¿Se realizó?</p>
      <div className="mb-4.5">
        <OptionGroup
          value={reg ?? ""}
          onChange={(v) => markRegistro(v as "done" | "partial" | "no")}
          options={[
            { value: "done", label: "Sí" },
            { value: "partial", label: "En parte" },
            { value: "no", label: "No" },
          ]}
        />
      </div>

      {reg && (
        <div className="bg-fila-fria rounded-2xl p-4 mb-4.5">
          <p className="m-0 text-[16px] leading-relaxed text-verde-profundo">{regMessages[reg]}</p>
        </div>
      )}

      {rechazo && (
        <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl p-4.5 mb-4.5">
          <p className="m-0 mb-3 text-[16px] leading-relaxed text-riesgo-texto">
            Es la tercera vez que esta actividad no se hace. Podemos cambiarla.
          </p>
          <Button variant="caution" dense to="/app/alerta/rechazo">
            Revisar el ajuste
          </Button>
        </div>
      )}

      <div className="bg-mostaza-vital rounded-2xl p-4.5 mb-4.5">
        <p className="m-0 mb-1.5 text-[13px] tracking-[0.12em] uppercase text-[#7a5c1c]">Estrategia de la semana</p>
        <p className="m-0 text-[16px] leading-snug text-[#4a3a1b]">Dar una instrucción por vez y evitar corregir innecesariamente.</p>
      </div>

      {reg && (
        <div className="border border-borde bg-white rounded-2xl p-4.5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="m-0 mb-0.5 text-[15px] font-bold">Revisión semanal disponible</p>
            <p className="m-0 text-[14px] text-tinta-tenue">Tres preguntas cortas sobre cómo fue la semana.</p>
          </div>
          <Button variant="secondary" dense to="/app/revision">
            Revisar la semana
          </Button>
        </div>
      )}
    </div>
  );
}
