import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { waLink } from "../../lib/whatsapp";
import { computeProfiles } from "../../lib/clinicalEngine";
import { computeActiveAlerts } from "../../lib/alertsEngine";
import { semaforoData } from "../../lib/rules";
import type { Answers } from "../../lib/onboardingSchema";
import type { EstadoCuenta } from "../../lib/useMyPatient";
import { estadoInfo, validacionesCuenta, type FilaCuenta } from "../../lib/cuentas";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";
import { Button } from "../../components/ui/Button";

// Seguimiento de cuentas (Fases 4.2 y 4.3): contadores por estado, demos
// que terminan pronto, lista filtrable con contacto directo, cola de
// aprobación y ajustes (días de demo, de inactividad y límite de la IA).
// Los estados se calculan en la base (estado_cuenta_calculado); acá solo se
// muestran y se disparan las acciones manuales.

const ORDEN: EstadoCuenta[] = ["registrado", "cuestionario_pendiente", "pendiente_aprobacion", "en_demo", "demo_finalizada", "activa", "inactiva", "rechazada"];

const DIA = 86_400_000;
const diasHasta = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DIA) : null);
const diasDesde = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DIA) : null);
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" }) : "—");

function usePanelCuentas() {
  return useQuery({
    queryKey: ["panel-cuentas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("panel_cuentas");
      if (error) throw error;
      return (data ?? []) as FilaCuenta[];
    },
  });
}

function EstadoChip({ estado }: { estado: EstadoCuenta | null }) {
  if (!estado) return null;
  const e = estadoInfo[estado];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${e.clase}`}>{e.label}</span>;
}

function Contacto({ f }: { f: FilaCuenta }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {f.email && (
        <a href={`mailto:${f.email}`} className="text-[13.5px] text-verde-profundo break-all">
          {f.email}
        </a>
      )}
      {f.telefono && (
        <>
          <a href={`tel:${f.telefono}`} className="text-[13.5px] text-tinta-suave whitespace-nowrap">
            {f.telefono}
          </a>
          <a
            href={waLink(f.telefono, `Hola ${f.nombre.split(" ")[0]}, te escribimos de IntegraMente en Casa.`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp a ${f.nombre}`}
            className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-[#25d366] text-white text-[13px] font-semibold no-underline"
          >
            <WhatsAppIcon size={15} /> WhatsApp
          </a>
        </>
      )}
    </div>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────
function PanelCuentas({ filas }: { filas: FilaCuenta[] }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoCuenta | "todos">("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [demoMax, setDemoMax] = useState("");
  const [sinActividad, setSinActividad] = useState("");
  const [buscar, setBuscar] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [error, setError] = useState("");

  const conteo = useMemo(() => {
    const m = new Map<EstadoCuenta, number>();
    for (const f of filas) if (f.estado) m.set(f.estado, (m.get(f.estado) ?? 0) + 1);
    return m;
  }, [filas]);

  const porTerminar = filas
    .filter((f) => f.estado === "en_demo" && (diasHasta(f.demo_fin) ?? 99) <= 2)
    .sort((a, b) => new Date(a.demo_fin!).getTime() - new Date(b.demo_fin!).getTime());

  const q = buscar.trim().toLowerCase();
  const filtradas = filas.filter((f) => {
    if (estado !== "todos" && f.estado !== estado) return false;
    if (desde && new Date(f.registrado_en) < new Date(desde)) return false;
    if (hasta && new Date(f.registrado_en) > new Date(`${hasta}T23:59:59`)) return false;
    if (demoMax !== "") {
      const d = diasHasta(f.demo_fin);
      if (f.estado !== "en_demo" || d === null || d > Number(demoMax)) return false;
    }
    if (sinActividad !== "") {
      const d = diasDesde(f.ultima_actividad);
      if (d === null || d < Number(sinActividad)) return false;
    }
    if (q && ![f.nombre, f.email, f.telefono, f.paciente_nombre].some((x) => (x ?? "").toLowerCase().includes(q))) return false;
    return true;
  });

  async function pago(f: FilaCuenta, pagada: boolean) {
    setError("");
    const nota = pagada ? window.prompt("Nota del pago (opcional): plan, monto, comprobante…") : "";
    if (nota === null) return;
    const { error: e } = await supabase.rpc("marcar_cuenta_pagada", { p_patient_id: f.patient_id, p_pagada: pagada, p_nota: nota || null });
    if (e) setError(e.message);
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
  }

  const campo = "min-h-10 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14px] text-tinta";
  return (
    <div className="grid gap-6">
      {/* Contadores */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
        {ORDEN.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEstado(estado === e ? "todos" : e)}
            aria-pressed={estado === e}
            className={`text-left rounded-2xl border-[1.5px] px-4 py-3 cursor-pointer font-sans transition-colors ${estado === e ? "border-verde-profundo bg-verde-tenue" : "border-borde bg-white hover:border-verde-serenidad"}`}
          >
            <span className="block font-serif text-[28px] leading-none text-tinta">{conteo.get(e) ?? 0}</span>
            <span className="block mt-1.5 text-[13px] font-semibold text-tinta-suave">{estadoInfo[e].label}</span>
          </button>
        ))}
      </div>

      {/* Demos por terminar */}
      <section className="rounded-3xl border-[1.5px] border-mostaza-vital bg-fila-calida p-5">
        <h2 className="m-0 mb-1 text-[16px] font-bold">Demos que terminan en los próximos 2 días</h2>
        <p className="m-0 mb-4 text-[13.5px] text-tinta-suave">Acá se hace el seguimiento manual para que activen el programa.</p>
        {porTerminar.length === 0 ? (
          <p className="m-0 text-[14px] text-tinta-tenue">Ninguna por ahora.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2.5">
            {porTerminar.map((f) => {
              const d = diasHasta(f.demo_fin)!;
              return (
                <li key={f.profile_id} className="rounded-2xl bg-white border border-borde px-4 py-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="m-0 text-[15px] font-semibold">
                      {f.nombre}
                      {f.paciente_nombre && f.paciente_nombre !== f.nombre && <span className="font-normal text-tinta-suave"> · {f.paciente_nombre}</span>}
                    </p>
                    <p className="m-0 text-[13px] text-[#7a5a1f] font-semibold">{d <= 0 ? "Termina hoy" : d === 1 ? "Termina mañana" : `Termina en ${d} días`}</p>
                    <Contacto f={f} />
                  </div>
                  <Button dense variant="secondary" onClick={() => pago(f, true)}>
                    Marcar pagada
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Filtros */}
      <section className="rounded-3xl bg-white border border-borde p-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 items-end">
        <label className="grid gap-1 text-[12.5px] font-semibold text-tinta-suave lg:col-span-2">
          Buscar
          <input className={campo} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre, correo o teléfono" />
        </label>
        <label className="grid gap-1 text-[12.5px] font-semibold text-tinta-suave">
          Estado
          <select className={campo} value={estado} onChange={(e) => setEstado(e.target.value as EstadoCuenta | "todos")}>
            <option value="todos">Todos</option>
            {ORDEN.map((e) => (
              <option key={e} value={e}>
                {estadoInfo[e].label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[12.5px] font-semibold text-tinta-suave">
          Registro desde
          <input type="date" className={campo} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="grid gap-1 text-[12.5px] font-semibold text-tinta-suave">
          Registro hasta
          <input type="date" className={campo} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:col-span-3 lg:col-span-1 lg:grid-cols-1">
          <label className="grid gap-1 text-[12.5px] font-semibold text-tinta-suave">
            Demo: quedan ≤ días
            <input type="number" min={0} className={campo} value={demoMax} onChange={(e) => setDemoMax(e.target.value)} />
          </label>
          <label className="grid gap-1 text-[12.5px] font-semibold text-tinta-suave">
            Sin actividad ≥ días
            <input type="number" min={0} className={campo} value={sinActividad} onChange={(e) => setSinActividad(e.target.value)} />
          </label>
        </div>
      </section>

      {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}

      {/* Lista */}
      <section className="rounded-3xl bg-white border border-borde overflow-hidden">
        <p className="m-0 px-5 py-3 border-b border-borde-suave text-[13.5px] text-tinta-suave">
          <strong className="text-tinta">{filtradas.length}</strong> {filtradas.length === 1 ? "cuenta" : "cuentas"}
        </p>
        <ul className="list-none m-0 p-0">
          {filtradas.map((f) => {
            const dDemo = f.estado === "en_demo" ? diasHasta(f.demo_fin) : null;
            const dAct = diasDesde(f.ultima_actividad);
            const pagable = !!f.patient_id && ["en_demo", "demo_finalizada", "inactiva", "activa"].includes(f.estado ?? "");
            return (
              <li key={f.profile_id} className="border-b border-borde-suave last:border-b-0 px-5 py-4 grid gap-2.5 lg:grid-cols-[1.3fr_1.4fr_0.9fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="m-0 text-[15px] font-semibold text-tinta">
                    {f.nombre} <span className="text-[12.5px] font-normal text-tinta-tenue">· {f.role}</span>
                  </p>
                  {f.paciente_nombre && (
                    <Link to={`/app/profesional/paciente/${f.patient_id}`} className="text-[13.5px] text-verde-profundo">
                      {f.paciente_nombre}
                    </Link>
                  )}
                </div>
                <Contacto f={f} />
                <div className="grid gap-1 text-[12.5px] text-tinta-tenue">
                  <EstadoChip estado={f.estado} />
                  <span>Registro: {fecha(f.registrado_en)}</span>
                  {dDemo !== null && <span className="text-verde-profundo font-semibold">Demo: {dDemo <= 0 ? "termina hoy" : `quedan ${dDemo} días`}</span>}
                  <span>Última actividad: {dAct === null ? "—" : dAct === 0 ? "hoy" : `hace ${dAct} días`}</span>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {pagable &&
                    (f.pagada_desde ? (
                      <Button dense variant="secondary" onClick={() => pago(f, false)}>
                        Quitar pago
                      </Button>
                    ) : (
                      <Button dense variant="secondary" onClick={() => pago(f, true)}>
                        Marcar pagada
                      </Button>
                    ))}
                  <button
                    type="button"
                    onClick={() => setAbierta(abierta === f.profile_id ? null : f.profile_id)}
                    className="min-h-9 px-3 rounded-full bg-campo border-0 text-[13px] font-semibold text-tinta-suave cursor-pointer"
                  >
                    Historial
                  </button>
                </div>
                {abierta === f.profile_id && <Historial profileId={f.profile_id} />}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Historial({ profileId }: { profileId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["cuenta-historial", profileId],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc("historial_cuenta", { p_profile_id: profileId });
      if (error) throw error;
      return (rows ?? []) as { id: number; de: EstadoCuenta | null; a: EstadoCuenta; motivo: string | null; created_at: string; responsable: string | null }[];
    },
  });
  return (
    <div className="lg:col-span-4 rounded-2xl bg-campo px-4 py-3">
      {isLoading ? (
        <p className="m-0 text-[13px] text-tinta-tenue">Cargando…</p>
      ) : (
        <ol className="list-none m-0 p-0 grid gap-1.5">
          {(data ?? []).map((h) => (
            <li key={h.id} className="text-[13px] text-tinta-suave">
              <span className="text-tinta-tenue">{new Date(h.created_at).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })}</span> ·{" "}
              {h.de ? `${estadoInfo[h.de].label} → ` : ""}
              <strong className="text-tinta">{estadoInfo[h.a].label}</strong>
              {h.motivo && ` · ${h.motivo}`} · <em>{h.responsable ?? "Sistema"}</em>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Cola de aprobación ────────────────────────────────────────────────
const AREAS = [
  { k: "cognitivo", t: "Cognitivo" },
  { k: "funcional", t: "Funcional" },
  { k: "fisico", t: "Físico" },
  { k: "nutricional", t: "Nutricional" },
] as const;

function ColaAprobacion({ filas }: { filas: FilaCuenta[] }) {
  const queryClient = useQueryClient();
  const pendientes = useMemo(() => {
    const porPaciente = new Map<string, FilaCuenta[]>();
    for (const f of filas) if (f.estado === "pendiente_aprobacion" && f.patient_id) porPaciente.set(f.patient_id, [...(porPaciente.get(f.patient_id) ?? []), f]);
    return [...porPaciente.entries()].sort((a, b) => Number(a[1][0].requiere_contacto) - Number(b[1][0].requiere_contacto));
  }, [filas]);
  const ids = pendientes.map(([id]) => id);
  const { data: respuestas } = useQuery({
    queryKey: ["cola-respuestas", ids.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("patient_id, answers").in("patient_id", ids);
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.patient_id as string, r.answers as Answers]));
    },
    enabled: ids.length > 0,
  });
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function accion(patientId: string, fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setError("");
    setOcupado(patientId);
    const { error: e } = await fn();
    setOcupado(null);
    if (e) setError(e.message);
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
  }

  if (pendientes.length === 0) return <p className="m-0 rounded-3xl bg-white border border-borde p-6 text-[15px] text-tinta-suave">No hay cuentas esperando aprobación.</p>;

  return (
    <div className="grid gap-4">
      {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
      {pendientes.map(([patientId, cuentas]) => {
        const f = cuentas[0];
        const answers = respuestas?.get(patientId) ?? null;
        const perfiles = answers ? computeProfiles(answers) : null;
        const alertas = answers ? computeActiveAlerts(answers) : [];
        const validaciones = validacionesCuenta(f, answers);
        return (
          <article key={patientId} className={`rounded-3xl bg-white border-[1.5px] p-5 sm:p-6 grid gap-4 ${f.requiere_contacto ? "border-mostaza-vital" : "border-borde"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="m-0 font-serif font-normal text-[22px]">
                  {f.paciente_nombre} {f.paciente_edad && <span className="text-[16px] text-tinta-suave">· {f.paciente_edad} años</span>}
                </h3>
                <p className="m-0 text-[13.5px] text-tinta-tenue">
                  Registró {f.nombre} el {fecha(f.registrado_en)} · {f.modalidad === "autoguiado" ? "Autoguiado" : "Con sesiones"}
                  {f.semana_gratis_solicitada && " · pidió la semana gratis"}
                </p>
              </div>
              {f.requiere_contacto && (
                <span className="rounded-full bg-fila-calida border border-mostaza-vital px-3 py-1 text-[12.5px] font-semibold text-[#7a5a1f]">
                  Requiere contacto{f.requiere_contacto_nota ? `: ${f.requiere_contacto_nota}` : ""}
                </span>
              )}
            </div>
            {cuentas.map((c) => (
              <Contacto key={c.profile_id} f={c} />
            ))}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-campo p-4">
                <p className="m-0 mb-2 text-[12px] tracking-[0.12em] uppercase font-semibold text-tinta-tenue">Niveles por área</p>
                {perfiles ? (
                  <ul className="list-none m-0 p-0 grid grid-cols-2 gap-1.5">
                    {AREAS.map((a) => (
                      <li key={a.k} className="flex items-center gap-2 text-[14px]">
                        <span className={`w-2.5 h-2.5 rounded-full ${semaforoData[perfiles[a.k]].dot}`} />
                        {a.t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-[13.5px] text-tinta-tenue">Cargando respuestas…</p>
                )}
                {alertas.length > 0 && <p className="m-0 mt-2 text-[13px] text-alerta-texto">{alertas.length} alerta(s): {alertas.map((a) => a.etiqueta).join(", ")}.</p>}
                <Link to={`/app/profesional/paciente/${patientId}?tab=evaluacion`} className="inline-block mt-2 text-[13.5px] font-semibold text-verde-profundo">
                  Ver cuestionario completo →
                </Link>
              </div>
              <div className={`rounded-2xl p-4 ${validaciones.length ? "bg-aviso/60" : "bg-[#e3efe3]"}`}>
                <p className="m-0 mb-2 text-[12px] tracking-[0.12em] uppercase font-semibold text-tinta-tenue">Validaciones</p>
                {validaciones.length === 0 ? (
                  <p className="m-0 text-[14px] text-semaforo-verde-texto font-semibold">Datos completos y coherentes.</p>
                ) : (
                  <ul className="m-0 pl-5 grid gap-1 text-[14px] text-aviso-texto">
                    {validaciones.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button dense disabled={ocupado === patientId} onClick={() => accion(patientId, () => supabase.rpc("aprobar_cuenta", { p_patient_id: patientId }))}>
                Aprobar
              </Button>
              <Button
                dense
                variant="secondary"
                disabled={ocupado === patientId}
                onClick={() => {
                  if (f.requiere_contacto) {
                    accion(patientId, () => supabase.rpc("marcar_requiere_contacto", { p_patient_id: patientId, p_valor: false }));
                    return;
                  }
                  const nota = window.prompt("¿Qué hay que aclarar con la familia?");
                  if (nota === null) return;
                  accion(patientId, () => supabase.rpc("marcar_requiere_contacto", { p_patient_id: patientId, p_valor: true, p_nota: nota }));
                }}
              >
                {f.requiere_contacto ? "Contacto resuelto" : "Requiere contacto"}
              </Button>
              <Button
                dense
                variant="caution"
                disabled={ocupado === patientId}
                onClick={() => {
                  const motivo = window.prompt("Motivo del rechazo (lo ve la familia):");
                  if (!motivo?.trim()) return;
                  accion(patientId, () => supabase.rpc("rechazar_cuenta", { p_patient_id: patientId, p_motivo: motivo }));
                }}
              >
                Rechazar
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ─── Ajustes ───────────────────────────────────────────────────────────
function Ajustes({ onCerrar }: { onCerrar: () => void }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["config-clinica"],
    queryFn: async () => {
      const { data: row, error } = await supabase.from("config_clinica").select("dias_demo, dias_inactividad, max_cambios_ia_pct").eq("id", 1).single();
      if (error) throw error;
      return row as { dias_demo: number; dias_inactividad: number; max_cambios_ia_pct: number };
    },
  });
  const [v, setV] = useState<{ dias_demo: number; dias_inactividad: number; max_cambios_ia_pct: number } | null>(null);
  const valores = v ?? data ?? null;
  const [error, setError] = useState("");
  async function guardar() {
    if (!valores) return;
    const { error: e } = await supabase.rpc("actualizar_config_clinica", {
      p_dias_demo: valores.dias_demo,
      p_dias_inactividad: valores.dias_inactividad,
      p_max_cambios_ia_pct: valores.max_cambios_ia_pct,
    });
    if (e) {
      setError(e.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["config-clinica"] });
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
    onCerrar();
  }
  const campo = "min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] w-28";
  return (
    <section className="rounded-3xl bg-white border border-borde p-5 grid gap-4">
      <h2 className="m-0 text-[16px] font-bold">Ajustes de seguimiento</h2>
      {valores && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["dias_demo", "Días de la semana gratis"],
              ["dias_inactividad", "Días sin actividad para «inactiva»"],
              ["max_cambios_ia_pct", "Máximo de cambios de la IA (%)"],
            ] as const
          ).map(([k, t]) => (
            <label key={k} className="grid gap-1 text-[13px] font-semibold text-tinta-suave">
              {t}
              <input type="number" className={campo} value={valores[k]} onChange={(e) => setV({ ...valores, [k]: Number(e.target.value) })} />
            </label>
          ))}
        </div>
      )}
      <p className="m-0 text-[13px] text-tinta-tenue">La semana gratis nueva aplica a las cuentas que se aprueben desde ahora.</p>
      {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
      <div className="flex gap-2">
        <Button dense onClick={guardar}>
          Guardar
        </Button>
        <Button dense variant="secondary" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}

export function Seguimiento() {
  const { data: filas, isLoading, error } = usePanelCuentas();
  const [tab, setTab] = useState<"panel" | "aprobacion">("panel");
  const [ajustes, setAjustes] = useState(false);
  const enCola = new Set((filas ?? []).filter((f) => f.estado === "pendiente_aprobacion" && f.patient_id).map((f) => f.patient_id)).size;

  return (
    <div className="im-in max-w-[1180px] mx-auto px-5 py-8 sm:px-8 lg:py-10 grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Seguimiento de cuentas</p>
          <h1 className="m-0 font-serif font-normal text-[30px] sm:text-[36px]">Cuentas y semana gratis</h1>
        </div>
        <Button dense variant="secondary" onClick={() => setAjustes((x) => !x)}>
          Ajustes
        </Button>
      </div>
      {ajustes && <Ajustes onCerrar={() => setAjustes(false)} />}
      <div role="tablist" className="flex gap-2">
        {(
          [
            ["panel", "Panel"],
            ["aprobacion", `Aprobación${enCola ? ` (${enCola})` : ""}`],
          ] as const
        ).map(([k, t]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-10 px-4 rounded-full border-0 font-sans font-semibold text-[14.5px] cursor-pointer ${tab === k ? "bg-tinta text-white" : "bg-campo text-tinta-suave"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="min-h-[30vh]" />
      ) : error ? (
        <p className="m-0 text-alerta-texto">No pudimos cargar las cuentas.</p>
      ) : tab === "panel" ? (
        <PanelCuentas filas={filas ?? []} />
      ) : (
        <ColaAprobacion filas={filas ?? []} />
      )}
    </div>
  );
}
