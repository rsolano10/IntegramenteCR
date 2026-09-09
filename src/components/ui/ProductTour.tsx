import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface TourStep {
  title: string;
  body: string;
}

// Sequential click-through tour — shown once per account, the first time
// it reaches its home dashboard (see the three Shell components). Reuses
// the same Modal chrome as every other one-off dialog in the app instead
// of inventing new overlay/positioning logic (no anchored tooltips —
// plain "siguiente" steps, matching what was asked for).
export function ProductTour({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const isLast = idx === steps.length - 1;

  return (
    <Modal onClose={onFinish}>
      <p className="m-0 mb-2 text-[12px] tracking-[0.12em] uppercase text-tinta-tenue">
        Paso {idx + 1} de {steps.length}
      </p>
      <h2 className="font-serif font-normal text-2xl m-0 mb-3">{step.title}</h2>
      <p className="m-0 mb-6 text-[15px] sm:text-[16px] leading-relaxed text-tinta-suave">{step.body}</p>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onFinish}
          className="border-none bg-transparent font-sans text-sm text-tinta-tenue cursor-pointer underline p-0"
        >
          Saltar tutorial
        </button>
        <div className="flex gap-2.5">
          {idx > 0 && (
            <Button variant="secondary" dense onClick={() => setIdx((i) => i - 1)}>
              Atrás
            </Button>
          )}
          <Button variant="ink" dense onClick={() => (isLast ? onFinish() : setIdx((i) => i + 1))}>
            {isLast ? "¡Empezar!" : "Siguiente"}
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 justify-center mt-6" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-verde-serenidad" : "bg-[#e3ddc4]"}`} />
        ))}
      </div>
    </Modal>
  );
}
