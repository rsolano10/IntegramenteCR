import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { marcarCalendarioSuscrito } from "../../lib/calendarPrompt";

// The .ics feed itself lives in supabase/functions/calendar-feed — these
// components just surface the subscribe link. `calendar_feed_token` is
// covered by the existing "patients: linked read" RLS policy.
function useCalendarUrls(patientId: string) {
  const { data: token } = useQuery({
    queryKey: ["calendar-feed-token", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("calendar_feed_token").eq("id", patientId).single();
      if (error) throw error;
      return data.calendar_feed_token as string;
    },
  });
  if (!token) return null;
  const httpsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-feed?token=${token}`;
  // webcal:// opens the phone's own "add subscription" screen directly
  // instead of downloading a file — same live feed, different scheme.
  return { httpsUrl, webcalUrl: httpsUrl.replace(/^https:\/\//, "webcal://") };
}

export function CalendarSyncActions({ patientId, onAdded }: { patientId: string; onAdded?: () => void }) {
  const urls = useCalendarUrls(patientId);
  const [copied, setCopied] = useState(false);
  if (!urls) return <div className="min-h-12" />;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(urls!.httpsUrl);
      setCopied(true);
      onAdded?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be denied — nothing else to do.
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2.5 flex-wrap">
        {/* Button only routes internally (`to`) — a webcal:// href stays an
            <a>, styled exactly like the "ink" Button. */}
        <a
          href={urls.webcalUrl}
          onClick={onAdded}
          className="inline-flex items-center justify-center rounded-full font-sans font-semibold transition-colors cursor-pointer min-h-[48px] px-5 text-[15px] bg-tinta text-white hover:bg-verde-profundo no-underline"
        >
          Agregar a mi calendario
        </a>
        <Button variant="secondary" dense onClick={copyLink}>
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </Button>
      </div>
      <p className="m-0 text-[12.5px] leading-relaxed text-tinta-tenue">
        Se agregan las actividades que tienen hora, con un aviso a esa hora. En Google Calendar desde la computadora, pegá el enlace en "Otros
        calendarios → Desde URL".
      </p>
    </div>
  );
}

// Desde el menú del nombre — para quien dijo "ahora no" o cambió de teléfono.
export function CalendarModal({ patientId, userId, onClose }: { patientId: string; userId: string; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <CalendarIllustration />
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Las actividades en tu calendario</h2>
      <p className="m-0 mb-5 text-[15px] leading-relaxed text-tinta-suave">
        Agregalo una sola vez: cada semana nueva aparece sola, con un aviso en tu teléfono a la hora de cada actividad.
      </p>
      <CalendarSyncActions patientId={patientId} onAdded={() => marcarCalendarioSuscrito(userId)} />
    </Modal>
  );
}

export function CalendarIllustration() {
  return (
    <div aria-hidden="true" className="w-16 h-16 rounded-2xl bg-verde-tenue border border-borde flex flex-col overflow-hidden mb-4">
      <div className="h-4 bg-verde-serenidad" />
      <div className="flex-1 grid grid-cols-3 gap-1 p-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`rounded-sm ${i === 4 ? "bg-mostaza-vital" : "bg-beige-serenidad"}`} />
        ))}
      </div>
    </div>
  );
}

// Inline variant — the participant's avatar menu (ParticipantShell).
export function CalendarSyncCard({ patientId }: { patientId: string }) {
  return (
    <div className="border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-2xl p-4.5">
      <p className="m-0 mb-1 text-[13px] tracking-[0.1em] uppercase text-verde-profundo">Avisos en tu teléfono</p>
      <p className="m-0 mb-3 text-[14px] leading-relaxed text-tinta">
        Agregá el plan a tu calendario para recibir un aviso a la hora exacta de cada actividad.
      </p>
      <CalendarSyncActions patientId={patientId} />
    </div>
  );
}
