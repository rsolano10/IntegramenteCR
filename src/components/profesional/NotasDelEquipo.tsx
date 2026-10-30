import { useQuery } from "@tanstack/react-query";
import { fetchResourceInterno, type ResourceInterno } from "../../lib/mediaResources";

const CAMPOS: { key: keyof ResourceInterno; label: string }[] = [
  { key: "objetivo", label: "Objetivo" },
  { key: "objetivo_esperado", label: "Objetivo esperado" },
  { key: "areas_trabajo", label: "Áreas de trabajo / qué estimula" },
  { key: "reglas", label: "Reglas y asignación" },
  { key: "progresion", label: "Progresión" },
  { key: "etiquetas", label: "Etiquetas" },
  { key: "fuente", label: "Fuente" },
  { key: "video_notas", label: "Video" },
  { key: "revision", label: "Revisión" },
  { key: "pendientes", label: "Pendientes" },
];

// Notas internas del recurso (media_resources_interno). Solo la clínica las
// puede leer; la familia nunca recibe estos campos.
export function NotasDelEquipo({ resourceId }: { resourceId: string }) {
  const { data: interno } = useQuery({ queryKey: ["recurso-interno", resourceId], queryFn: () => fetchResourceInterno(resourceId) });
  if (!interno) return null;
  const filas = CAMPOS.map(({ key, label }) => {
    const v = interno[key];
    const texto = Array.isArray(v) ? v.join(", ") : v;
    return texto ? { label, texto, url: key === "fuente" ? interno.fuente_url : null } : null;
  }).filter((x): x is { label: string; texto: string; url: string | null } => !!x);
  if (filas.length === 0) return null;
  return (
    <div className="mt-5 pt-4 border-t border-borde grid gap-3">
      <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue">Notas del equipo · solo visible para la clínica</p>
      {filas.map((f) => (
        <p key={f.label} className="m-0 text-[14px] leading-relaxed text-tinta-suave whitespace-pre-line">
          <strong className="text-tinta">{f.label}:</strong> {f.texto}
          {f.url && (
            <>
              {" "}
              <a href={f.url} target="_blank" rel="noreferrer" className="text-verde-profundo">
                Ver fuente ↗
              </a>
            </>
          )}
        </p>
      ))}
    </div>
  );
}
