import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useEsAdmin } from "../../lib/useEsAdmin";
import { semaforoData } from "../../lib/rules";
import { patientPath, usePatients, type PatientRow } from "../../lib/patients";
import { useCuentaPorPaciente } from "../../lib/usePanelCuentas";
import { ORDEN_PASOS, siguientePaso, type Paso, type TipoPaso, type Vista } from "../../lib/siguientePaso";
import type { FilaCuenta } from "../../lib/cuentas";
import type { ManagedAccount } from "../../lib/adminAccounts";
import { motivoLabel, usePendientesAsistente, type PendienteRevision } from "../../lib/asistenteRevision";
import type { Semaforo } from "../../lib/mockData";
import { AlertasRiesgoBanner } from "../../components/profesional/AlertasRiesgoBanner";
import { AccountDetailModal } from "../../components/profesional/AccountDetailModal";
import { Avatar, BotonPaso } from "../../components/profesional/usuarios/piezas";
import { useFamiliaAcciones } from "../../components/profesional/usuarios/useFamiliaAcciones";
import { BadgeRol } from "../../components/ui/AccountMenu";
import { RowMenu } from "../../components/ui/RowMenu";

// Panel de la clínica: una sola cola de pendientes, agrupada por tipo y en
// orden de urgencia, con la acción de cada familia a un toque. El
// administrador ve además las métricas generales del programa.

type GrupoId = TipoPaso | "asistente";

type Item =
  | { kind: "familia"; id: string; p: PatientRow; f: FilaCuenta | undefined; paso: Paso }
  | { kind: "asistente"; id: string; r: PendienteRevision; urgente: boolean };

const GRUPOS: Record<GrupoId, { titulo: string; corto: string; desc: string; vista?: Vista; icono: ReactNode; tinta: string }> = {
  aprobar: {
    titulo: "Cuentas por aprobar",
    corto: "Por aprobar",
    desc: "Completaron el cuestionario y esperan tu aprobación para empezar la semana gratis.",
    vista: "aprobar",
    tinta: "bg-verde-profundo text-white",
    icono: <path d="M5 12.5l4.2 4.2L19 7" />,
  },
  duplicado: {
    titulo: "Posibles duplicados",
    corto: "Duplicados",
    desc: "Revisá si es la misma persona antes de seguir.",
    vista: "accion",
    tinta: "bg-aviso text-aviso-texto",
    icono: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
  },
  pagar: {
    titulo: "Semana gratis por terminar",
    corto: "Cobros",
    desc: "Confirmá el pago para que la familia siga sin interrupciones.",
    vista: "gratis",
    tinta: "bg-aviso text-aviso-texto",
    icono: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
  },
  asistente: {
    titulo: "Conversaciones del asistente",
    corto: "Asistente",
    desc: "Lo que el asistente marcó para que lo leás.",
    tinta: "bg-[#e6eeef] text-verde-profundo",
    icono: <path d="M5 18.5V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8.5L5 18.5Z" />,
  },
  evaluar: {
    titulo: "Pacientes por evaluar",
    corto: "Por evaluar",
    desc: "Falta su evaluación inicial para armar el plan.",
    vista: "evaluar",
    tinta: "bg-[#e6eeef] text-verde-profundo",
    icono: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
      </>
    ),
  },
  revisar: {
    titulo: "Semanas por revisar",
    corto: "Revisar semana",
    desc: "Registraron toda la semana: mirá cómo les fue.",
    vista: "revisar",
    tinta: "bg-aviso text-aviso-texto",
    icono: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
      </>
    ),
  },
  asignar: {
    titulo: "Semanas por asignar",
    corto: "Asignar semana",
    desc: "Terminaron la semana y todavía no tienen la próxima.",
    vista: "asignar",
    tinta: "bg-[#e6eeef] text-verde-profundo",
    icono: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4M12 13v4M10 15h4" />
      </>
    ),
  },
  contactar: {
    titulo: "Familias inactivas",
    corto: "Inactivas",
    desc: "Llevan tiempo sin registrar actividad. Un mensaje a tiempo ayuda.",
    vista: "inactivas",
    tinta: "bg-campo text-tinta-suave border border-borde",
    icono: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2" />
      </>
    ),
  },
};

const POR_GRUPO_EN_TODO = 4;

function Icono({ id, size = 34 }: { id: GrupoId; size?: number }) {
  const g = GRUPOS[id];
  return (
    <span className={`shrink-0 rounded-[10px] inline-flex items-center justify-center ${g.tinta}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.53} height={size * 0.53} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {g.icono}
      </svg>
    </span>
  );
}

function haceCuanto(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

function saludo(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function fechaLarga(d = new Date()) {
  const s = d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Panel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const esAdmin = useEsAdmin();
  const nombre = session.status === "authed" ? session.profile.nombre : "";

  const location = useLocation();
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(
    (location.state as { statusMsg?: { text: string; error?: boolean } } | null)?.statusMsg ?? null,
  );
  // Llega desde la ficha del paciente tras aceptar/rechazar/publicar: se
  // muestra una vez y se limpia para que un refresh no lo repita.
  useEffect(() => {
    if ((location.state as { statusMsg?: unknown } | null)?.statusMsg) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filtro, setFiltro] = useState<GrupoId | null>(null);
  const [openAccount, setOpenAccount] = useState<ManagedAccount | null>(null);

  const { data: patients, isLoading: cargandoPacientes } = usePatients();
  const { data: pendientesAsistente } = usePendientesAsistente();
  const { porPaciente: cuentas } = useCuentaPorPaciente();

  function handleChanged(text: string, error?: boolean) {
    setStatusMsg({ text, error });
    queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
  }
  const fam = useFamiliaAcciones({ patients, cuentas, onChanged: handleChanged, onOpenAccount: setOpenAccount });

  // La cola: cada familia con su siguiente paso y las conversaciones del
  // asistente, agrupadas. Si alguna conversación es urgente, va primero.
  const { grupos, alDia, total } = useMemo(() => {
    const porGrupo = new Map<GrupoId, Item[]>();
    let alDia = 0;
    for (const p of patients ?? []) {
      const f = cuentas.get(p.id);
      const paso = siguientePaso(p, f);
      if (!paso) {
        alDia++;
        continue;
      }
      const lista = porGrupo.get(paso.tipo) ?? [];
      lista.push({ kind: "familia", id: p.id, p, f, paso });
      porGrupo.set(paso.tipo, lista);
    }
    // Los que más esperan, primero.
    for (const lista of porGrupo.values()) lista.sort((a, b) => (a.kind === "familia" && b.kind === "familia" ? +new Date(a.p.created_at) - +new Date(b.p.created_at) : 0));

    const conv = (pendientesAsistente ?? []).map<Item>((r) => ({ kind: "asistente", id: r.patient_id, r, urgente: r.motivos.includes("emergencia") || r.motivos.includes("riesgo") }));
    conv.sort((a, b) => (a.kind === "asistente" && b.kind === "asistente" ? Number(b.urgente) - Number(a.urgente) || +new Date(b.r.ultimo_at) - +new Date(a.r.ultimo_at) : 0));
    if (conv.length) porGrupo.set("asistente", conv);

    const hayUrgente = conv.some((c) => c.kind === "asistente" && c.urgente);
    const orden: GrupoId[] = hayUrgente ? ["asistente", ...ORDEN_PASOS] : [...ORDEN_PASOS.slice(0, ORDEN_PASOS.indexOf("contactar")), "asistente", "contactar"];
    const grupos = orden.filter((id) => porGrupo.has(id)).map((id) => ({ id, items: porGrupo.get(id)! }));
    return { grupos, alDia, total: grupos.reduce((n, g) => n + g.items.length, 0) };
  }, [patients, cuentas, pendientesAsistente]);

  const filtroActivo = filtro && grupos.some((g) => g.id === filtro) ? filtro : null;
  const visibles = filtroActivo ? grupos.filter((g) => g.id === filtroActivo) : grupos;
  const cargando = cargandoPacientes || !pendientesAsistente;
  const primero = grupos[0];

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      {/* Encabezado */}
      <header className="mb-7">
        <p className="m-0 mb-1.5 flex flex-wrap items-center gap-2.5 text-[13.5px] font-semibold text-tinta-suave">
          {fechaLarga()}
          {esAdmin && (
            <>
              <BadgeRol texto="Administrador" />
              <button
                type="button"
                onClick={() => document.getElementById("metricas")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="border-0 bg-transparent p-0 font-sans text-[13px] font-bold text-verde-profundo underline decoration-dotted underline-offset-4 cursor-pointer"
              >
                Ver métricas generales ↓
              </button>
            </>
          )}
        </p>
        <h1 className="m-0 font-serif font-normal text-[32px] sm:text-[40px] leading-[1.1]">
          {saludo()}
          {nombre ? `, ${nombre.split(" ")[0]}` : ""}
        </h1>
        {!cargando && (
          <p className="m-0 mt-2 text-[16px] text-tinta-suave max-w-[62ch]">
            {total > 0 ? (
              <>
                Tenés <strong className="text-tinta">{total === 1 ? "1 pendiente" : `${total} pendientes`}</strong>. Empezá por {GRUPOS[primero.id].titulo.toLowerCase()}.
              </>
            ) : (
              "No hay nada pendiente. Las familias están avanzando con su semana."
            )}
          </p>
        )}
      </header>

      {statusMsg && (
        <div role="status" className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl mb-5 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-verde-tenue text-verde-profundo"}`}>
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
            Cerrar
          </button>
        </div>
      )}

      <AlertasRiesgoBanner />

      {cargando ? (
        <Esqueleto />
      ) : total === 0 ? (
        <TodoAlDia alDia={alDia} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 items-start">
          {/* Filtros: columna en escritorio, fila deslizable en celular */}
          <nav aria-label="Filtrar pendientes" className="min-w-0 lg:sticky lg:top-6">
            <div className="flex lg:grid gap-2 lg:gap-1 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 pb-1 lg:pb-0 [scrollbar-width:none]">
              <Filtro activo={!filtroActivo} onClick={() => setFiltro(null)} n={total} label="Todo" />
              {grupos.map((g) => (
                <Filtro
                  key={g.id}
                  activo={filtroActivo === g.id}
                  onClick={() => setFiltro(filtroActivo === g.id ? null : g.id)}
                  n={g.items.length}
                  label={GRUPOS[g.id].corto}
                  icono={g.id}
                  urgente={g.id === "asistente" && g.items.some((i) => i.kind === "asistente" && i.urgente)}
                />
              ))}
            </div>
            {alDia > 0 && (
              <Link
                to="/app/profesional/usuarios?vista=todas"
                className="hidden lg:flex items-center gap-2.5 mt-5 px-3.5 py-3 rounded-2xl bg-verde-tenue text-[13.5px] text-verde-profundo no-underline hover:bg-[#ebf3f3]"
              >
                <Chequecito />
                <span>
                  <strong>{alDia === 1 ? "1 familia" : `${alDia} familias`}</strong> al día, sin nada pendiente
                </span>
              </Link>
            )}
          </nav>

          {/* La cola */}
          <div className="grid gap-5 min-w-0">
            {visibles.map((g, gi) => {
              const meta = GRUPOS[g.id];
              const enTodo = !filtroActivo;
              const items = enTodo ? g.items.slice(0, POR_GRUPO_EN_TODO) : g.items;
              const resto = g.items.length - items.length;
              return (
                <section key={g.id} aria-labelledby={`grupo-${g.id}`} className="bg-white border border-borde rounded-[22px] overflow-hidden shadow-[0_1px_0_rgba(31,51,56,0.03)]">
                  <div className="flex items-start gap-3.5 px-5 pt-4.5 pb-3.5 sm:px-6">
                    <Icono id={g.id} />
                    <div className="min-w-0 flex-1">
                      <h2 id={`grupo-${g.id}`} className="m-0 text-[17px] font-extrabold text-tinta">
                        {meta.titulo}{" "}
                        <span className="ml-1 align-[2px] min-w-[24px] h-[22px] px-1.5 rounded-full bg-campo border border-borde text-[12.5px] font-extrabold text-tinta-suave inline-flex items-center justify-center">{g.items.length}</span>
                      </h2>
                      <p className="m-0 mt-0.5 text-[13.5px] text-tinta-suave leading-snug">{meta.desc}</p>
                    </div>
                    {meta.vista && !enTodo && (
                      <Link to={`/app/profesional/usuarios?vista=${meta.vista}`} className="hidden sm:inline shrink-0 mt-1 text-[13px] font-bold text-verde-profundo no-underline hover:underline">
                        Ver en Usuarios
                      </Link>
                    )}
                  </div>
                  <ul className="list-none m-0 p-0 border-t border-borde-suave">
                    {items.map((it, i) => (
                      <li key={it.id} className="border-b border-borde-suave last:border-b-0">
                        {it.kind === "familia" ? (
                          <FilaFamilia
                            it={it}
                            primero={enTodo && gi === 0 && i === 0}
                            ocupado={fam.ocupado === it.p.id}
                            onAbrir={() => fam.abrir(it.p.id)}
                            onAccion={() => fam.accion(it.paso, it.p, it.f)}
                            menu={fam.menuDe(it.p, it.f)}
                          />
                        ) : (
                          <FilaAsistente it={it} primero={enTodo && gi === 0 && i === 0} onAbrir={() => navigate(patientPath(it.r.patient_id, "asistente"))} />
                        )}
                      </li>
                    ))}
                  </ul>
                  {resto > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFiltro(g.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full px-6 py-3 border-0 border-t border-borde-suave bg-[#fcfbf6] font-sans text-[13.5px] font-bold text-verde-profundo cursor-pointer text-left hover:bg-campo"
                    >
                      Ver {resto === 1 ? "1 más" : `los ${resto} restantes`} →
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {esAdmin && <MetricasGenerales patients={patients ?? []} />}

      {fam.elementos}
      {openAccount && (
        <AccountDetailModal
          account={openAccount}
          onClose={() => setOpenAccount(null)}
          onChanged={handleChanged}
          onViewPatient={(patientId) => {
            setOpenAccount(null);
            navigate(patientPath(patientId));
          }}
        />
      )}
    </div>
  );
}

function Filtro({ activo, onClick, n, label, icono, urgente }: { activo: boolean; onClick: () => void; n: number; label: string; icono?: GrupoId; urgente?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2.5 h-[42px] lg:h-[46px] pl-2 pr-3.5 lg:pr-3 rounded-full lg:rounded-xl font-sans text-[14px] cursor-pointer whitespace-nowrap text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
        activo ? "border-0 bg-tinta text-white font-bold" : "border-[1.5px] lg:border-0 border-borde bg-white lg:bg-transparent text-tinta font-semibold hover:bg-campo"
      }`}
    >
      {icono ? (
        <span className={activo ? "[&>span]:!bg-white/15 [&>span]:!text-white [&>span]:!border-0" : ""}>
          <Icono id={icono} size={28} />
        </span>
      ) : (
        <span className={`w-7 h-7 rounded-[9px] inline-flex items-center justify-center shrink-0 ${activo ? "bg-white/15" : "bg-campo border border-borde"}`} aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 7h14M5 12h14M5 17h9" />
          </svg>
        </span>
      )}
      <span className="lg:flex-1">{label}</span>
      <span
        className={`min-w-[24px] h-[22px] px-1.5 rounded-full text-[12.5px] font-extrabold inline-flex items-center justify-center ${
          urgente ? "bg-semaforo-rojo text-white" : activo ? "text-mostaza-vital" : "text-tinta-suave"
        }`}
      >
        {n}
      </span>
    </button>
  );
}

function EmpezaPorAca() {
  return <span className="inline-flex items-center h-[20px] px-2 rounded-full bg-mostaza-vital text-tinta text-[11px] font-extrabold tracking-[0.04em] uppercase shrink-0">Empezá por acá</span>;
}

function FilaFamilia({
  it,
  primero,
  ocupado,
  onAbrir,
  onAccion,
  menu,
}: {
  it: Extract<Item, { kind: "familia" }>;
  primero: boolean;
  ocupado: boolean;
  onAbrir: () => void;
  onAccion: () => void;
  menu: ReturnType<ReturnType<typeof useFamiliaAcciones>["menuDe"]>;
}) {
  const { p, paso } = it;
  return (
    <div className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-3 px-5 py-3.5 sm:px-6 ${primero ? "bg-[#fffaf0]" : "hover:bg-[#fcfbf6]"}`}>
      <button type="button" onClick={onAbrir} className="flex flex-1 items-center gap-3.5 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer font-sans group">
        <Avatar id={p.id} nombre={p.nombre} size={42} />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-serif text-[18px] leading-tight text-tinta group-hover:text-verde-profundo group-hover:underline decoration-1 underline-offset-4">{p.nombre}</span>
            {primero && <EmpezaPorAca />}
          </span>
          <span className="block mt-0.5 text-[13.5px] text-tinta-suave leading-snug">{paso.porque}</span>
        </span>
      </button>
      <div className="flex items-center gap-1.5 basis-full sm:basis-auto shrink-0 [&>button:first-child]:flex-1 sm:[&>button:first-child]:flex-none">
        <BotonPaso paso={paso} onClick={onAccion} ocupado={ocupado} />
        <RowMenu items={menu} />
      </div>
    </div>
  );
}

function FilaAsistente({ it, primero, onAbrir }: { it: Extract<Item, { kind: "asistente" }>; primero: boolean; onAbrir: () => void }) {
  const { r, urgente } = it;
  return (
    <div className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-3 px-5 py-3.5 sm:px-6 ${urgente ? "bg-alerta" : primero ? "bg-[#fffaf0]" : "hover:bg-[#fcfbf6]"}`}>
      <button type="button" onClick={onAbrir} className="flex flex-1 items-center gap-3.5 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer font-sans group">
        <Avatar id={r.patient_id} nombre={r.patient_nombre} size={42} />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-serif text-[18px] leading-tight text-tinta group-hover:underline decoration-1 underline-offset-4">{r.patient_nombre}</span>
            {primero && !urgente && <EmpezaPorAca />}
            {urgente && <span className="inline-flex items-center h-[20px] px-2 rounded-full bg-semaforo-rojo text-white text-[11px] font-extrabold tracking-[0.04em] uppercase">Urgente</span>}
          </span>
          <span className={`block mt-0.5 text-[13.5px] leading-snug ${urgente ? "text-alerta-texto" : "text-tinta-suave"}`}>
            {r.motivos.map((m) => motivoLabel[m] ?? m).join(" · ")} · {haceCuanto(r.ultimo_at)}
          </span>
        </span>
      </button>
      <div className="flex items-center gap-1.5 basis-full sm:basis-auto shrink-0">
      <button
        type="button"
        onClick={onAbrir}
        className={`flex-1 sm:flex-none inline-flex items-center justify-center h-9 px-3.5 rounded-[10px] font-sans text-[13.5px] font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
          urgente ? "border-0 bg-semaforo-rojo-texto text-white hover:bg-tinta" : "border-[1.5px] border-[#c9d8d9] bg-white text-verde-profundo hover:border-verde-profundo"
        }`}
      >
        Leer conversación
      </button>
      <span className="w-9 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}

function Chequecito() {
  return (
    <span className="w-7 h-7 rounded-full bg-semaforo-verde text-white inline-flex items-center justify-center shrink-0" aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.2 4.2L19 7" />
      </svg>
    </span>
  );
}

function TodoAlDia({ alDia }: { alDia: number }) {
  return (
    <div className="rounded-[26px] border border-borde bg-white px-6 py-14 sm:py-16 text-center">
      <span className="mx-auto mb-4 w-16 h-16 rounded-full bg-verde-tenue text-semaforo-verde inline-flex items-center justify-center" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </span>
      <p className="m-0 font-serif text-[26px] text-tinta">Todo al día</p>
      <p className="m-0 mt-1.5 text-[15px] text-tinta-suave">
        {alDia > 0 ? `${alDia === 1 ? "La familia está" : `Las ${alDia} familias están`} al día. Cuando alguna necesite algo, aparece acá.` : "Cuando una familia necesite algo, aparece acá."}
      </p>
      <Link to="/app/profesional/usuarios?vista=todas" className="inline-block mt-5 text-[14px] font-bold text-verde-profundo">
        Ver todas las familias →
      </Link>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8" aria-busy="true" aria-label="Cargando pendientes">
      <div className="hidden lg:grid gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[46px] rounded-xl bg-campo animate-pulse" />
        ))}
      </div>
      <div className="bg-white border border-borde rounded-[22px] p-6 grid gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-full bg-campo animate-pulse" />
            <div className="flex-1 grid gap-2">
              <div className="h-4 w-1/3 rounded bg-campo animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-campo animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Solo el administrador: el programa en conjunto. Los 4 semáforos siempre
// independientes, nunca combinados (business/general_rules.md §5/§15.7).
function MetricasGenerales({ patients }: { patients: PatientRow[] }) {
  const { data: adherencia } = useQuery({
    queryKey: ["program-adherencia"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_program_adherencia").single();
      if (error) throw error;
      return data as { done: number; total: number };
    },
  });
  const done = adherencia?.done ?? 0;
  const total = adherencia?.total ?? 0;

  const ejes = (["cognitivo", "fisico", "funcional", "nutricional"] as const).map((eje) => {
    const counts = { verde: 0, amarillo: 0, rojo: 0 } as Record<Semaforo, number>;
    for (const p of patients) {
      const v = p[eje];
      if (v === "verde" || v === "amarillo" || v === "rojo") counts[v]++;
    }
    return { eje, counts };
  });
  const ejeLabel: Record<string, string> = { cognitivo: "Cognitivo", fisico: "Físico", funcional: "Funcional", nutricional: "Nutricional" };

  return (
    <section aria-labelledby="metricas" className="mt-10 pt-8 border-t border-dashed border-borde-campo">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="m-0 mb-1.5">
            <BadgeRol texto="Solo administrador" />
          </p>
          <h2 id="metricas" className="scroll-mt-24 m-0 font-serif font-normal text-[26px]">
            Métricas generales
          </h2>
        </div>
        <p className="m-0 text-[13.5px] text-tinta-suave">El programa en conjunto. El resto del equipo no ve esta sección.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_2fr_1fr] gap-4">
        <div className="bg-white border border-borde rounded-[20px] px-6 py-5">
          <div className="font-serif text-[40px] leading-none text-verde-profundo">{patients.length}</div>
          <p className="m-0 mt-2 text-[14px] text-tinta-suave">pacientes en el programa</p>
        </div>

        <div className="bg-white border border-borde rounded-[20px] px-6 py-5 sm:col-span-2 lg:col-span-1 sm:order-last lg:order-none">
          <p className="m-0 mb-3 text-[14px] text-tinta-suave">Evaluación por eje · 4 ejes independientes</p>
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-x-6 gap-y-2.5">
            {ejes.map(({ eje, counts }) => {
              const n = counts.verde + counts.amarillo + counts.rojo;
              return (
                <div key={eje} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-bold text-tinta">{ejeLabel[eje]}</span>
                    <span className="flex gap-2.5">
                      {(["verde", "amarillo", "rojo"] as Semaforo[]).map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 font-bold text-tinta-suave">
                          <span className={`w-2 h-2 rounded-full ${semaforoData[s].dot}`} />
                          {counts[s]}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-campo border border-borde-suave" aria-hidden="true">
                    {n > 0 &&
                      (["verde", "amarillo", "rojo"] as Semaforo[]).map((s) => (
                        <span key={s} className={semaforoData[s].dot} style={{ width: `${(counts[s] / n) * 100}%` }} />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-borde rounded-[20px] px-6 py-5">
          <div className="font-serif text-[40px] leading-none text-verde-profundo">{total > 0 ? `${Math.round((done / total) * 100)}%` : "—"}</div>
          <p className="m-0 mt-2 text-[14px] text-tinta-suave">
            {total > 0 ? `adherencia · ${done} de ${total} actividades realizadas` : "adherencia · todavía no hay actividades registradas"}
          </p>
        </div>
      </div>
    </section>
  );
}
