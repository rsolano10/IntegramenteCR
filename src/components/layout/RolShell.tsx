import { Outlet } from "react-router-dom";

// El marco de los perfiles del equipo clínico y de los referidores: el
// encabezado común (AppHeader) arriba y el contenido, sin menú lateral.
export function RolShell() {
  return (
    <main className="min-w-0 bg-fondo-papel px-4 sm:px-6 lg:px-8 py-6">
      <Outlet />
    </main>
  );
}
