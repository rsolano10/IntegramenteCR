import { passwordRules, passwordStrength } from "../../lib/useChangePassword";

// Live checklist under a new-password field — each rule ticks over as soon
// as it's met, so nobody has to submit just to find out what the server
// would reject.
export function PasswordRequirements({ password }: { password: string }) {
  const strength = passwordStrength(password);
  const allMet = passwordRules.every((r) => r.test(password));

  return (
    <div className="grid gap-1.5 font-normal" aria-live="polite">
      <ul className="list-none m-0 p-0 grid gap-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={`flex items-center gap-2 text-[13px] ${ok ? "text-semaforo-verde-texto" : "text-tinta-tenue"}`}>
              <span
                aria-hidden="true"
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] leading-none shrink-0 ${
                  ok ? "bg-semaforo-verde-claro text-tinta" : "border border-borde-campo"
                }`}
              >
                {ok ? "✓" : ""}
              </span>
              {rule.label}
              <span className="sr-only">{ok ? " — cumplido" : " — pendiente"}</span>
            </li>
          );
        })}
      </ul>
      {password && allMet && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-tinta-tenue">
          <span className="flex gap-1" aria-hidden="true">
            {(["aceptable", "fuerte"] as const).map((lvl, i) => (
              <span
                key={lvl}
                className={`h-1.5 w-8 rounded-full ${i === 0 || strength === "fuerte" ? "bg-verde-serenidad" : "bg-beige-serenidad"}`}
              />
            ))}
          </span>
          Seguridad: <strong className="text-tinta-suave">{strength}</strong>
          {strength !== "fuerte" && <span className="basis-full">Sumá mayúsculas o símbolos para hacerla más fuerte.</span>}
        </div>
      )}
    </div>
  );
}
