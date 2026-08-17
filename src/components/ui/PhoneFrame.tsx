import type { ReactNode } from "react";

export function PhoneFrame({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="bg-white border border-borde rounded-[32px] overflow-hidden shadow-marco">
      {header}
      {children}
    </div>
  );
}
