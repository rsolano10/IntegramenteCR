import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// The .ics feed itself lives in supabase/functions/calendar-feed — this
// card just surfaces the subscribe link. `calendar_feed_token` is already
// covered by the existing "patients: linked read" RLS policy, so a plain
// select works with no new policy.
export function CalendarSyncCard({ patientId }: { patientId: string }) {
  const { data: token } = useQuery({
    queryKey: ["calendar-feed-token", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("calendar_feed_token").eq("id", patientId).single();
      if (error) throw error;
      return data.calendar_feed_token as string;
    },
  });
  const [copied, setCopied] = useState(false);

  if (!token) return null;

  const functionsBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-feed`;
  const httpsUrl = `${functionsBase}?token=${token}`;
  // webcal:// is what makes tapping the link open the phone's own "add
  // subscription" screen directly, instead of just downloading a file —
  // same URL, different scheme, both point at the same live feed.
  const webcalUrl = httpsUrl.replace(/^https:\/\//, "webcal://");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (permissions, non-secure context) —
      // the link is still visible/selectable below, so this fails quietly.
    }
  }

  return (
    <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4.5">
      <p className="m-0 mb-1 text-[13px] tracking-[0.1em] uppercase text-verde-profundo">Notificaciones en tu teléfono</p>
      <p className="m-0 mb-3 text-[14px] leading-relaxed text-tinta">
        Agregá el plan a tu calendario para recibir un aviso en tu teléfono a la hora exacta de cada actividad.
      </p>
      <div className="flex gap-2.5 flex-wrap">
        <a
          href={webcalUrl}
          className="inline-flex items-center justify-center rounded-full font-sans font-semibold cursor-pointer min-h-[48px] px-5 text-[15px] bg-tinta text-white hover:bg-verde-profundo"
        >
          Agregar a tu calendario
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center rounded-full font-sans font-semibold cursor-pointer min-h-[48px] px-5 text-[15px] bg-transparent border-[1.5px] border-borde text-tinta hover:border-verde-serenidad"
        >
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>
      <p className="m-0 mt-3 text-[12.5px] leading-relaxed text-tinta-tenue">
        Solo se sincronizan las actividades que tienen una hora exacta asignada. Si usás Google Calendar desde la computadora, pegá el enlace
        copiado en "Otros calendarios → Desde URL".
      </p>
    </div>
  );
}
