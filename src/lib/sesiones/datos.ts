import { resourceUrl, type MediaResource } from "../mediaResources";
import type { PlanTask } from "../mockData";
import type { DatosSesion } from "../../components/sesion/contexto";

// Lo que la sesión guiada necesita, desde una tarea del plan (familia,
// participante) o desde el recurso de la biblioteca (prueba de la clínica).
export function datosDeTarea(t: PlanTask): DatosSesion {
  return {
    titulo: t.titulo,
    modulo: t.modulo ?? null,
    videoUrl: t.mediaKind === "video" ? resourceUrl({ storage_path: t.storagePath ?? null, external_url: t.externalUrl ?? null }) : null,
    posterUrl: t.posterPath ? (resourceUrl({ storage_path: t.posterPath, external_url: null }) ?? undefined) : undefined,
    sabiasQue: t.sabiasQue ?? null,
    indicacionIndividual: t.indicacionIndividual ?? null,
    extras: t.extras ?? null,
    ayuda: t.ayuda ?? null,
    adaptacion: t.adaptacion ?? null,
    adaptacionPorEtapa: t.adaptacionPorEtapa ?? null,
  };
}

export function datosDeRecurso(r: MediaResource): DatosSesion {
  return {
    titulo: r.titulo,
    modulo: r.modulo,
    videoUrl: r.media_kind === "video" ? resourceUrl({ storage_path: r.storage_path, external_url: r.external_url }) : null,
    posterUrl: r.poster_path ? (resourceUrl({ storage_path: r.poster_path, external_url: null }) ?? undefined) : undefined,
    sabiasQue: r.sabias_que,
    indicacionIndividual: null,
    extras: r.extras,
    ayuda: r.ayuda,
    adaptacion: r.adaptacion,
    adaptacionPorEtapa: r.adaptacion_por_etapa,
  };
}
