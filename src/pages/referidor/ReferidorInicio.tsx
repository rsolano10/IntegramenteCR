import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { ESTADO_REFERIDO, enlaceReferido, useMisReferidos } from "../../lib/referidos";
import { planTiers } from "../../lib/mockData";
import { areas } from "../../lib/landingContenido";
import { Caja, CajaAviso, CajaCuerpo, CajaPestanas, Pagina, type PestanaCaja } from "../../components/profesional/Caja";
import { Button } from "../../components/ui/Button";

// Inicio del profesional referidor: a quién refirió y cómo va (con permiso
// de cada familia), cómo referir a alguien más y qué es el programa.
type Vista = "personas" | "referir" | "programa";

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

export function ReferidorInicio() {
  const session = useSession();
  const [vista, setVista] = useState<Vista>("personas");
  const [aviso, setAviso] = useState<{ text: string; error?: boolean } | null>(null);
  const nombre = session.status === "authed" ? session.profile.nombre : "";
  const { data: personas } = useMisReferidos();
  const pestanas: PestanaCaja<Vista>[] = [
    { id: "personas", label: personas?.length ? `Mis personas (${personas.length})` : "Mis personas" },
    { id: "referir", label: "Referir a alguien" },
    { id: "programa", label: "El programa" },
  ];
  return (
    <Pagina ancho="max-w-[1000px]">
      <Caja
        eyebrow="Profesional referidor"
        titulo={`Hola${nombre ? `, ${nombre.split(" ")[0]}` : ""}`}
        descripcion="Las personas que referiste a IntegraMente en Casa y cómo van con sus actividades en casa."
        pie={<CajaPestanas etiqueta="Secciones" pestanas={pestanas} activa={vista} onCambiar={setVista} />}
      >
        {aviso && <CajaAviso texto={aviso.text} error={aviso.error} onCerrar={() => setAviso(null)} />}
        <CajaCuerpo>
          {vista === "personas" && <Personas />}
          {vista === "referir" && <Referir onAviso={(text, error) => setAviso({ text, error })} />}
          {vista === "programa" && <Programa />}
        </CajaCuerpo>
      </Caja>
    </Pagina>
  );
}

function Personas() {
  const navigate = useNavigate();
  const { data, isLoading } = useMisReferidos();
  if (isLoading) return <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>;
  if (!data?.length)
    return (
      <p className="m-0 text-[15.5px] leading-relaxed text-tinta-suave max-w-[60ch]">
        Todavía no hay personas referidas. Cuando una familia se registre con tu enlace (en «Referir a alguien»), aparece acá.
      </p>
    );
  return (
    <ul className="list-none m-0 p-0 rounded-[20px] border border-borde bg-white overflow-hidden divide-y divide-borde-suave">
      {data.map((p) => {
        const e = ESTADO_REFERIDO[p.estado];
        const prog = planTiers.find((t) => t.id === p.programa)?.nombre;
        return (
          <li key={p.patient_id}>
            <button
              type="button"
              disabled={!p.comparte}
              onClick={() => navigate(`/app/referidor/persona/${p.patient_id}`)}
              className="w-full grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center px-4 py-3.5 border-0 bg-transparent text-left font-sans cursor-pointer disabled:cursor-default enabled:hover:bg-[#fcfbf6]"
            >
              <span className="min-w-0">
                <span className="block text-[15.5px] font-semibold text-tinta">{p.nombre}</span>
                <span className="block text-[13px] text-tinta-suave">
                  Referida el {fecha(p.referido_en)}
                  {prog ? ` · ${prog}` : ""}
                </span>
              </span>
              <span className="text-[13.5px] text-tinta-suave">
                {!p.comparte
                  ? "La familia todavía no autorizó compartir el avance."
                  : p.semana_total
                    ? `Esta semana: ${p.semana_hechas ?? 0} de ${p.semana_total} actividades`
                    : p.ultima_actividad
                      ? `Última actividad: ${fecha(p.ultima_actividad)}`
                      : "Sin actividades registradas todavía"}
              </span>
              <span className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-[12.5px] font-semibold ${e.tono}`}>{e.label}</span>
                {p.comparte && <span className="text-[13.5px] font-semibold text-verde-profundo">Ver ›</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Referir({ onAviso }: { onAviso: (t: string, error?: boolean) => void }) {
  const { data: codigo } = useQuery({
    queryKey: ["mi-codigo-referido"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("profiles").select("codigo_referido").eq("id", u.user!.id).single();
      if (error) throw error;
      return (data?.codigo_referido as string | null) ?? null;
    },
  });
  const [copiado, setCopiado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const enlace = codigo ? enlaceReferido(codigo) : "";
  const mensaje = `Le recomiendo IntegraMente en Casa: actividades semanales para hacer en casa, guiadas por un equipo clínico. La primera semana es gratis. Puede registrarse acá: ${enlace}`;
  const crear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("crear_lead_referido", { p_nombre: nombre, p_telefono: telefono, p_motivo: motivo });
      if (error) throw error;
    },
    onSuccess: () => {
      onAviso(`Listo. El equipo va a contactar a ${nombre.split(" ")[0]}.`);
      setNombre("");
      setTelefono("");
      setMotivo("");
    },
    onError: (e) => onAviso((e as Error).message, true),
  });
  const campo = "w-full min-h-11 px-3.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none";
  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Tu enlace</h2>
        <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave max-w-[62ch]">
          Compartilo con la familia. Si se registra con este enlace, queda como referida por vos y te aparece en «Mis personas». Su avance lo ves solo si la familia lo autoriza.
        </p>
        {codigo ? (
          <>
            <code className="block rounded-xl bg-campo px-4 py-3 text-[14px] text-tinta break-all">{enlace}</code>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                dense
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(enlace);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2500);
                  } catch {
                    window.prompt("Copiá el enlace:", enlace);
                  }
                }}
              >
                {copiado ? "¡Copiado!" : "Copiar enlace"}
              </Button>
              <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-[48px] px-5 rounded-full border-[1.5px] border-borde bg-white text-[15px] font-semibold text-tinta no-underline hover:border-verde-serenidad">
                Mandar por WhatsApp
              </a>
            </div>
          </>
        ) : (
          <p className="m-0 text-[14.5px] text-tinta-tenue">Tu enlace todavía no está listo. Escribile al equipo para activarlo.</p>
        )}
      </section>
      <section className="grid gap-3 max-w-[560px]">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">O dejanos el contacto</h2>
        <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave">Si preferís que el equipo la llame, dejá el nombre y un teléfono. Nada más: los datos de salud los conversa el equipo con la familia.</p>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Nombre de la persona o de su familiar
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
        </label>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Teléfono
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" placeholder="8888 8888" className={campo} />
        </label>
        <label className="grid gap-1.5 text-[14px] font-semibold text-tinta">
          Para qué te parece útil (opcional)
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: mantenerse activo en casa" className={campo} />
        </label>
        <Button onClick={() => crear.mutate()} disabled={crear.isPending || !nombre.trim() || !telefono.trim()}>
          {crear.isPending ? "Enviando…" : "Enviar al equipo"}
        </Button>
      </section>
    </div>
  );
}

function Programa() {
  return (
    <div className="grid gap-7 max-w-[760px]">
      <section className="grid gap-2">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Qué es IntegraMente en Casa</h2>
        <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
          Un plan semanal de actividades para personas mayores, para hacer en casa con la familia. Lo arma y lo revisa el equipo clínico según una evaluación inicial; la familia registra cómo le fue y el equipo ajusta la semana siguiente.
        </p>
      </section>
      <section className="grid gap-3">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Las áreas</h2>
        <ul className="m-0 p-0 list-none grid gap-2 sm:grid-cols-2">
          {areas.map((a) => (
            <li key={a.t} className="rounded-2xl border border-borde bg-white px-4 py-3">
              <span className="block text-[15px] font-semibold text-tinta">{a.t}</span>
              <span className="block text-[13.5px] leading-snug text-tinta-suave">{a.frase}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Programas</h2>
        <ul className="m-0 p-0 list-none grid gap-2 sm:grid-cols-2">
          {planTiers
            .filter((t) => t.id !== "clinico")
            .map((t) => (
              <li key={t.id} className="rounded-2xl border border-borde bg-white px-4 py-3">
                <span className="block text-[15px] font-semibold text-tinta">{t.nombre}</span>
                <span className="block text-[13.5px] text-tinta-suave">{t.tagline}</span>
                <span className="block mt-1 text-[13.5px] font-semibold text-tinta">{t.precio ? `${t.precio} ${t.periodo ?? ""}` : "Según el plan"}</span>
              </li>
            ))}
        </ul>
        <p className="m-0 text-[13.5px] text-tinta-tenue">La primera semana es gratis. Sin cobros automáticos.</p>
      </section>
      <section className="grid gap-2">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">Qué ves de cada persona</h2>
        <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
          Si la familia lo autoriza, el mismo resumen de seguimiento que puede llevarte a la consulta: actividades hechas por semana y por área, lo que contó la familia y los avisos. No ves mensajes ni el cuestionario. La familia puede retirar el permiso cuando quiera.
        </p>
      </section>
    </div>
  );
}
