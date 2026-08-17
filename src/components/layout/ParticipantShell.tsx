import { Outlet } from "react-router-dom";

export function ParticipantShell() {
  return (
    <div className="im-in min-h-full flex flex-col">
      <div className="bg-beige-serenidad px-5 py-6 sm:px-8">
        <div className="max-w-xl mx-auto">
          <p className="m-0 mb-1.5 text-lg text-tinta-suave">Miércoles</p>
          <h1 className="font-serif font-normal text-[28px] sm:text-[32px] m-0">Hola, Rosa</h1>
        </div>
      </div>
      <div className="flex-1 px-5 py-6 sm:px-8 flex justify-center">
        <div className="w-full max-w-xl flex flex-col gap-5.5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
