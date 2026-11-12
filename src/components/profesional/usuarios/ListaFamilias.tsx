import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import type { ManagedAccount } from "../../../lib/adminAccounts";
import { patientHaystack } from "../../../lib/usuariosSearch";
import type { PatientRow } from "../../../lib/patients";
import { planTiers } from "../../../lib/mockData";
import { useCuentaPorPaciente } from "../../../lib/usePanelCuentas";
import { ORDEN_PASOS, enVista, siguientePaso, type Paso, type Vista } from "../../../lib/siguientePaso";
import { Pagination } from "../../ui/Pagination";
import { RowMenu } from "../../ui/RowMenu";
import { AlDia, Avatar, BotonPaso, CuentaCelda, EjesChips, FamiliaAvatares } from "./piezas";
import { useFamiliaAcciones } from "./useFamiliaAcciones";

// Familias de la clínica: vistas rápidas con conteo (lo urgente primero),
// una fila por familia con su siguiente paso, y la vista rápida al tocarla.

type Orden = "urgente" | "nombre" | "recientes";
const modalidad = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

const VISTAS: { id: Vista; label: string; aviso?: boolean }[] = [
  { id: "accion", label: "Necesitan acción" },
  { id: "aprobar", label: "Por aprobar", aviso: true },
  { id: "evaluar", label: "Por evaluar", aviso: true },
  { id: "revisar", label: "Revisar semana", aviso: true },
  { id: "asignar", label: "Asignar semana", aviso: true },
  { id: "gratis", label: "Semana gratis por terminar" },
  { id: "inactivas", label: "Inactivas" },
  { id: "todas", label: "Todas" },
];

export function ListaFamilias({
  search,
  vistaInicial,
  onChanged,
  onOpenAccount,
}: {
  search: string;
  vistaInicial?: Vista;
  onChanged: (message: string, isError?: boolean) => void;
  onOpenAccount: (account: ManagedAccount) => void;
}) {
  const { data: patients, isLoading, error: loadError } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });
  const { porPaciente: cuentas } = useCuentaPorPaciente();
  const fam = useFamiliaAcciones({ patients, cuentas, onChanged, onOpenAccount });
  const { cuentasPorId, accion, menuDe } = fam;

  const [vista, setVista] = useState<Vista | null>(vistaInicial ?? null);
  const [orden, setOrden] = useState<Orden>("urgente");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cada familia con su siguiente paso.
  const filas = useMemo(() => (patients ?? []).map((p) => ({ p, f: cuentas.get(p.id), paso: siguientePaso(p, cuentas.get(p.id)) })), [patients, cuentas]);
  const conteo = useMemo(() => Object.fromEntries(VISTAS.map((v) => [v.id, filas.filter((x) => enVista(v.id, x.paso, x.f)).length])) as Record<Vista, number>, [filas]);
  // Se abre en «Necesitan acción» si hay algo; si no, en «Todas».
  const vistaActual: Vista = vista ?? (conteo.accion > 0 ? "accion" : "todas");

  useEffect(() => setPage(1), [search, vistaActual, orden]);

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rango = (paso: Paso | null) => (paso ? ORDEN_PASOS.indexOf(paso.tipo) : 99);
    return filas
      .filter((x) => (!q || patientHaystack(x.p).includes(q)) && (q ? true : enVista(vistaActual, x.paso, x.f)))
      .sort((a, b) => {
        if (orden === "nombre") return a.p.nombre.localeCompare(b.p.nombre);
        if (orden === "recientes") return +new Date(b.p.created_at) - +new Date(a.p.created_at);
        return rango(a.paso) - rango(b.paso) || +new Date(b.p.created_at) - +new Date(a.p.created_at);
      });
  }, [filas, search, vistaActual, orden]);

  const pageCount = Math.max(1, Math.ceil(lista.length / pageSize));
  const pagina = Math.min(page, pageCount);
  const visibles = lista.slice((pagina - 1) * pageSize, pagina * pageSize);

  const meta = (p: PatientRow) => `${p.edad ? `${p.edad} años` : "Edad sin registrar"} · ${modalidad[p.modalidad] ?? p.modalidad}`;

  return (
    <>
      {/* Vistas rápidas y orden */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div role="group" aria-label="Vistas" className="flex gap-2 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0 [scrollbar-width:none]">
          {VISTAS.filter((v) => v.id === "accion" || v.id === "todas" || conteo[v.id] > 0).map((v) => {
            const activa = vistaActual === v.id && !search.trim();
            const aviso = v.aviso && conteo[v.id] > 0;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={activa}
                onClick={() => setVista(v.id)}
                className={`shrink-0 h-[38px] px-3.5 rounded-full font-sans text-[13.5px] cursor-pointer inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
                  activa
                    ? "border-0 bg-tinta text-white font-bold"
                    : aviso
                      ? "border-[1.5px] border-riesgo-borde bg-aviso text-[#6b5726] font-semibold hover:border-semaforo-amarillo"
                      : "border-[1.5px] border-borde bg-white text-tinta font-semibold hover:border-verde-serenidad"
                }`}
              >
                {v.label}
                <span className={`font-extrabold ${activa ? "text-mostaza-vital" : "text-tinta-suave"}`}>{conteo[v.id]}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-[13.5px] font-semibold text-tinta-suave">
          Orden
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="h-[38px] px-2.5 rounded-[10px] border-[1.5px] border-borde-campo bg-white font-sans text-[13.5px] font-bold text-tinta cursor-pointer"
          >
            <option value="urgente">Lo urgente primero</option>
            <option value="nombre">Nombre (A-Z)</option>
            <option value="recientes">Más recientes</option>
          </select>
        </label>
      </div>

      {search.trim() && (
        <p className="m-0 mb-3 text-[13.5px] text-tinta-suave">
          {lista.length} {lista.length === 1 ? "resultado" : "resultados"} para «{search.trim()}» en todas las familias.
        </p>
      )}

      {isLoading && <p className="m-0 text-sm text-tinta-suave">Cargando…</p>}
      {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar los pacientes.</p>}

      {!isLoading && visibles.length > 0 && (
        <section aria-label="Familias" className="bg-white border border-borde rounded-[20px] overflow-hidden">
          {/* Encabezado de la tabla (escritorio) */}
          <div className="hidden lg:grid grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.15fr)_minmax(0,1.5fr)_40px] gap-4 px-5 py-3 bg-[#fbf9f1] border-b border-borde-suave text-[12.5px] font-bold text-tinta-suave">
            <span>Paciente</span>
            <span>Siguiente paso</span>
            <span>Cuenta</span>
            <span>Evaluación</span>
            <span>Familia</span>
            <span />
          </div>
          <ul className="list-none m-0 p-0">
            {visibles.map(({ p, f, paso }) => (
              <li key={p.id} className="border-b border-borde-suave last:border-b-0">
                {/* Escritorio: una fila */}
                <div className="hidden lg:grid grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.15fr)_minmax(0,1.5fr)_40px] gap-4 items-center px-5 py-3.5 hover:bg-[#fcfbf6]">
                  <button type="button" onClick={() => fam.abrir(p.id)} className="flex items-center gap-3 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer font-sans group">
                    <Avatar id={p.id} nombre={p.nombre} />
                    <span className="min-w-0">
                      <span className="block font-serif text-[18px] leading-tight text-tinta group-hover:text-verde-profundo group-hover:underline decoration-1 underline-offset-4 truncate">{p.nombre}</span>
                      <span className="block text-[13px] text-tinta-suave truncate">{meta(p)}</span>
                    </span>
                  </button>
                  <div className="min-w-0">
                    {paso ? (
                      <>
                        <BotonPaso paso={paso} onClick={() => accion(paso, p, f)} ocupado={fam.ocupado === p.id} />
                        <span className="block mt-1 text-[12.5px] text-tinta-suave leading-snug">{paso.porque}</span>
                      </>
                    ) : (
                      <AlDia />
                    )}
                  </div>
                  <CuentaCelda f={f} />
                  <EjesChips p={p} />
                  <FamiliaAvatares p={p} cuentas={cuentasPorId} />
                  <RowMenu items={menuDe(p, f)} />
                </div>

                {/* Celular y tableta: una tarjeta */}
                <div className="lg:hidden p-4 grid gap-3">
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => fam.abrir(p.id)} className="flex flex-1 items-center gap-3 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer font-sans">
                      <Avatar id={p.id} nombre={p.nombre} size={42} />
                      <span className="min-w-0">
                        <span className="block font-serif text-[19px] leading-tight text-tinta">{p.nombre}</span>
                        <span className="block text-[13px] text-tinta-suave">{meta(p)}</span>
                      </span>
                    </button>
                    <RowMenu items={menuDe(p, f)} />
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <CuentaCelda f={f} />
                    <EjesChips p={p} />
                  </div>
                  <FamiliaAvatares p={p} cuentas={cuentasPorId} />
                  {paso ? (
                    <div className="grid gap-1">
                      <BotonPaso paso={paso} onClick={() => accion(paso, p, f)} ocupado={fam.ocupado === p.id} grande />
                      <span className="text-[12.5px] text-tinta-suave text-center">{paso.porque}</span>
                    </div>
                  ) : (
                    <AlDia />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isLoading && visibles.length === 0 && (
        <div className="rounded-[20px] border-[1.5px] border-dashed border-borde-campo bg-white/50 py-12 px-6 text-center">
          <p className="m-0 font-serif text-[22px] text-tinta">{vistaActual === "accion" && !search.trim() ? "Todo al día" : "Ninguna familia coincide"}</p>
          <p className="m-0 mt-1 text-[14px] text-tinta-suave">{vistaActual === "accion" && !search.trim() ? "No hay nada pendiente por ahora." : "Probá con otra vista o con otra búsqueda."}</p>
        </div>
      )}

      <Pagination
        page={pagina}
        pageSize={pageSize}
        totalCount={lista.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      {fam.elementos}
    </>
  );
}
