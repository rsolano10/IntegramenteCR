import { Outlet } from "react-router-dom";
import { FamiliarNav } from "./FamiliarNav";

export function FamiliarShell() {
  return (
    <div className="im-in min-h-full pb-24 md:pb-0">
      <div className="bg-verde-profundo text-white px-5 pt-6 pb-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="m-0 mb-1 text-sm text-[#c4dbdb]">Miércoles 12 de agosto</p>
          <h1 className="font-serif font-normal text-2xl sm:text-[28px] m-0 text-white">Hola, Marcela</h1>
        </div>
      </div>

      <div className="bg-white md:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <FamiliarNav />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <Outlet />
      </div>
    </div>
  );
}
