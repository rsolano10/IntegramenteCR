import { Outlet } from "react-router-dom";
import { ProfesionalNav } from "./ProfesionalNav";

export function ProfesionalShell() {
  return (
    <div className="im-in flex flex-1 flex-col lg:flex-row min-h-full">
      <ProfesionalNav />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
