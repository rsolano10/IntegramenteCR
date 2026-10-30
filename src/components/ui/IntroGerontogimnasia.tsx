import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { resourceUrl, type MediaResource } from "../../lib/mediaResources";
import { CODIGO_INTRO_GER } from "../../lib/reglasRecursos";

const VISTO_KEY = "im.ger-introduccion-vista";

function leerVisto(): boolean {
  try {
    return localStorage.getItem(VISTO_KEY) === "1";
  } catch {
    return false;
  }
}

// GER-010 «Introducción»: se muestra antes del primer ejercicio de
// gerontogimnasia, sin importar su numeración (business/integramente-recursos-spec.md
// §2.3), y después queda plegada para volver a consultarla.
export function IntroGerontogimnasia({ large = false }: { large?: boolean }) {
  const [visto, setVisto] = useState(leerVisto);
  const [abierta, setAbierta] = useState(!visto);
  const { data: intro } = useQuery({
    queryKey: ["recurso", CODIGO_INTRO_GER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_resources")
        .select("id, titulo, storage_path, external_url, poster_path, sabias_que, actividad")
        .eq("codigo", CODIGO_INTRO_GER)
        .eq("activo", true)
        .maybeSingle();
      if (error) throw error;
      return data as Pick<MediaResource, "id" | "titulo" | "storage_path" | "external_url" | "poster_path" | "sabias_que" | "actividad"> | null;
    },
    staleTime: 30 * 60 * 1000,
  });
  if (!intro) return null;
  const url = resourceUrl({ storage_path: intro.storage_path, external_url: intro.external_url }) ?? undefined;
  const poster = intro.poster_path ? (resourceUrl({ storage_path: intro.poster_path, external_url: null }) ?? undefined) : undefined;

  function marcarVisto() {
    setVisto(true);
    try {
      localStorage.setItem(VISTO_KEY, "1");
    } catch {
      // solo recuerda el plegado; si no se puede guardar, se vuelve a mostrar
    }
  }

  return (
    <details
      open={abierta}
      onToggle={(e) => setAbierta((e.target as HTMLDetailsElement).open)}
      className="rounded-2xl border-[1.5px] border-mostaza-vital bg-white px-4 py-3"
    >
      <summary className={`cursor-pointer font-semibold text-tinta ${large ? "text-[18px]" : "text-[15.5px]"}`}>
        {visto ? "Volver a ver la introducción a la gerontogimnasia" : "Antes del primer ejercicio: Introducción"}
      </summary>
      <div className="grid gap-3 mt-3">
        {intro.sabias_que && <p className={`m-0 leading-relaxed text-tinta-suave ${large ? "text-[17px]" : "text-[15px]"}`}>{intro.sabias_que}</p>}
        {url && (
          <video controls playsInline preload="metadata" poster={poster} src={url} onEnded={marcarVisto} onPlay={marcarVisto} className="w-full rounded-2xl bg-tinta object-contain" style={{ maxHeight: large ? 560 : 480 }} />
        )}
      </div>
    </details>
  );
}
