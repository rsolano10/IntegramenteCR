import { Outlet } from "react-router-dom";
import { ProfesionalNav } from "./ProfesionalNav";
import { ProductTour } from "../ui/ProductTour";
import { profesionalTourSteps } from "../../lib/tourSteps";
import { useProductTour } from "../../lib/useProductTour";

export function ProfesionalShell() {
  const tour = useProductTour();

  return (
    <div className="im-in flex flex-1 flex-col lg:flex-row min-h-full">
      <ProfesionalNav />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
      {tour.pending && <ProductTour steps={profesionalTourSteps} onFinish={tour.dismiss} />}
    </div>
  );
}
