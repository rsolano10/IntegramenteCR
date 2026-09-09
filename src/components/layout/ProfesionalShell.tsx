import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ProfesionalNav } from "./ProfesionalNav";
import { ProductTour } from "../ui/ProductTour";
import { profesionalTourSteps } from "../../lib/tourSteps";
import { useSession } from "../../lib/useSession";
import { supabase } from "../../lib/supabase";

export function ProfesionalShell() {
  const session = useSession();
  const [tourSeen, setTourSeen] = useState(false);

  function dismissTour() {
    setTourSeen(true);
    if (session.status === "authed") {
      supabase.from("profiles").update({ onboarding_tour_seen: true }).eq("id", session.session.user.id);
    }
  }

  return (
    <div className="im-in flex flex-1 flex-col lg:flex-row min-h-full">
      <ProfesionalNav />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
      {session.status === "authed" && !session.profile.onboarding_tour_seen && !tourSeen && (
        <ProductTour steps={profesionalTourSteps} onFinish={dismissTour} />
      )}
    </div>
  );
}
