import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { describeAnswer, groupAnswerableByModule } from "../../lib/onboardingSchema";
import { getPatientName } from "../../lib/patient";
import { Button } from "../../components/ui/Button";

export function PerfilResumen() {
  const navigate = useNavigate();
  const answers = useAppStore((s) => s.onboarding2);
  const startModuleEdit = useAppStore((s) => s.startModuleEdit);
  const groups = groupAnswerableByModule(answers);

  function editModule(moduleName: string, firstQuestionId: string) {
    startModuleEdit(moduleName);
    navigate(`/app/perfil/${firstQuestionId}`);
  }

  return (
    <div className="im-in max-w-[760px] mx-auto px-5 py-10 pb-16 sm:px-8 lg:py-14 lg:pb-20">
      <Link to="/app/hoy" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver a Hoy
      </Link>
      <p className="m-0 mb-2.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Perfil funcional</p>
      <h1 className="font-serif font-normal text-[28px] sm:text-[36px] leading-[1.15] m-0 mb-3">
        Lo que respondiste sobre {getPatientName(answers)}
      </h1>
      <p className="m-0 mb-8 text-base sm:text-[17px] leading-relaxed text-tinta-suave max-w-[52em]">
        Esto es lo que usamos para armar el plan y el filtro de seguridad. Si algo cambió, podés corregir cualquier sección —
        no hace falta repetir todo el cuestionario.
      </p>

      <div className="grid gap-4">
        {groups.map((g) => (
          <div key={g.module} className="bg-white border border-borde rounded-3xl p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-serif font-normal text-xl sm:text-[22px] m-0">{g.module}</h2>
              <Button variant="secondary" dense onClick={() => editModule(g.module, g.questions[0].id)}>
                Editar
              </Button>
            </div>
            <div className="grid gap-3">
              {g.questions.map((q) => (
                <div key={q.id} className="grid sm:grid-cols-[1.1fr_1fr] gap-1 sm:gap-4 py-2.5 border-t border-[#efeada] first:border-t-0 first:pt-0">
                  <span className="text-[14.5px] text-tinta-tenue leading-snug">{q.title}</span>
                  <span className="text-[15px] text-tinta font-medium leading-snug">{describeAnswer(q, answers)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
