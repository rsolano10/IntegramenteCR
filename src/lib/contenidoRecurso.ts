// Arma el contenido de ResourceDetailView desde un recurso de la biblioteca
// o desde una tarea del plan, para que las seis vistas (biblioteca, editor,
// plan de la familia, actividad de familia y participante) muestren lo mismo.
import type { ResourceContent } from "../components/ui/ResourceDetailView";
import type { MediaResource, NivelCognitivo } from "./mediaResources";
import type { PlanTask } from "./mockData";

export function contenidoDeRecurso(r: MediaResource, fallbackLabel: string, etapas?: NivelCognitivo[] | null): ResourceContent {
  return {
    codigo: r.codigo,
    modulo: r.modulo,
    mediaKind: r.media_kind,
    storagePath: r.storage_path,
    externalUrl: r.external_url,
    posterPath: r.poster_path,
    intro: r.detalle,
    perfil: r.perfil,
    sabiasQue: r.sabias_que,
    materiales: r.materiales,
    actividad: r.actividad,
    dosis: r.dosis,
    requierePlanIndividual: r.requiere_plan_individual,
    adaptacion: r.adaptacion,
    adaptacionPorEtapa: r.adaptacion_por_etapa,
    ayuda: r.ayuda,
    tenEnCuenta: r.ten_en_cuenta,
    paraCerrar: r.para_cerrar,
    ciencia: r.ciencia,
    porQue: r.por_que,
    pasos: r.pasos ?? undefined,
    extras: r.extras,
    etapas,
    fallbackLabel,
  };
}

export function contenidoDeTarea(t: PlanTask, fallbackLabel: string, etapas?: NivelCognitivo[] | null, pasos?: string[]): ResourceContent {
  return {
    codigo: t.codigo,
    modulo: t.modulo,
    mediaKind: t.mediaKind,
    storagePath: t.storagePath,
    externalUrl: t.externalUrl,
    posterPath: t.posterPath,
    intro: t.intro,
    perfil: t.perfil,
    sabiasQue: t.sabiasQue,
    materiales: t.materiales,
    actividad: t.actividad,
    dosis: t.dosis,
    indicacionIndividual: t.indicacionIndividual,
    requierePlanIndividual: t.requierePlanIndividual,
    adaptacion: t.adaptacion,
    adaptacionPorEtapa: t.adaptacionPorEtapa,
    ayuda: t.ayuda,
    tenEnCuenta: t.tenEnCuenta,
    paraCerrar: t.paraCerrar,
    ciencia: t.ciencia,
    porQue: t.porQue,
    pasos: pasos ?? t.pasos,
    extras: t.extras,
    etapas,
    fallbackLabel,
  };
}
