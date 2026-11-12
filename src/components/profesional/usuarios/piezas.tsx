import type { ReactNode } from "react";
import type { ManagedAccount } from "../../../lib/adminAccounts";
import { estadoFamiliar, iniciales, textoEstadoFamiliar, type EstadoFamiliar } from "../../../lib/usuariosVista";
import { relationLabel } from "../../../lib/adminAccounts";
import { detalleCuenta, estadoInfo, type FilaCuenta } from "../../../lib/cuentas";
import type { PatientRow } from "../../../lib/patients";
import type { Paso } from "../../../lib/siguientePaso";

// Piezas de la página de Usuarios (lista, tarjetas y vista rápida).

const COLORES_AVATAR = ["#3f6a70", "#8a5a36", "#5f7f84", "#9a4a3a", "#6b4f7a", "#5e3b22"];

function colorDe(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES_AVATAR[h % COLORES_AVATAR.length];
}

export function Avatar({ id, nombre, size = 40 }: { id: string; nombre: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 rounded-full text-white font-extrabold inline-flex items-center justify-center"
      style={{ width: size, height: size, background: colorDe(id), fontSize: size * 0.36 }}
    >
      {iniciales(nombre)}
    </span>
  );
}

// Los cuatro ejes de la evaluación en una línea: letra y color del semáforo.
const EJES = [
  { key: "cognitivo", letra: "C", nombre: "Cognitivo" },
  { key: "fisico", letra: "F", nombre: "Físico" },
  { key: "funcional", letra: "Fu", nombre: "Funcional" },
  { key: "nutricional", letra: "N", nombre: "Nutricional" },
] as const;
const SEM = {
  verde: { bg: "bg-semaforo-verde", text: "text-white", nivel: "bien" },
  amarillo: { bg: "bg-semaforo-amarillo", text: "text-tinta", nivel: "atención" },
  rojo: { bg: "bg-semaforo-rojo", text: "text-white", nivel: "prioridad" },
} as const;
type Sem = keyof typeof SEM;

export function EjesChips({ p }: { p: PatientRow }) {
  const evaluados = EJES.filter((e) => p[e.key]);
  if (!evaluados.length) return <span className="text-[13px] text-tinta-suave">Sin evaluar</span>;
  const aria = evaluados.map((e) => `${e.nombre}: ${SEM[p[e.key] as Sem]?.nivel ?? p[e.key]}`).join(", ");
  return (
    <span className="flex gap-1.5" role="img" aria-label={`Evaluación. ${aria}`}>
      {evaluados.map((e) => {
        const s = SEM[p[e.key] as Sem];
        return (
          <span key={e.key} title={`${e.nombre}: ${s?.nivel}`} className={`min-w-[26px] h-[26px] px-1 rounded-lg text-[11.5px] font-extrabold inline-flex items-center justify-center ${s?.bg ?? "bg-campo"} ${s?.text ?? "text-tinta"}`}>
            {e.letra}
          </span>
        );
      })}
    </span>
  );
}

export function EjesDetalle({ p }: { p: PatientRow }) {
  return (
    <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2">
      {EJES.map((e) => {
        const v = p[e.key] as Sem | null;
        return (
          <div key={e.key} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-campo">
            <span className={`w-3 h-3 rounded-full shrink-0 ${v ? SEM[v].bg : "bg-borde"}`} aria-hidden="true" />
            <span className="text-[14px] font-semibold text-tinta">{e.nombre}</span>
            <span className="ml-auto text-[13px] text-tinta-suave">{v ? SEM[v].nivel[0].toUpperCase() + SEM[v].nivel.slice(1) : "Sin evaluar"}</span>
          </div>
        );
      })}
    </div>
  );
}

const ANILLO: Record<EstadoFamiliar, string> = { confirmada: "#4c7a4c", pendiente: "#e8b857", desactivada: "#b9c1c2" };

export function FamiliaAvatares({ p, cuentas }: { p: PatientRow; cuentas: Map<string, ManagedAccount> }) {
  const fam = p.links.filter((l) => l.relation !== "profesional_asignado");
  if (!fam.length) return <span className="text-[13px] text-tinta-suave">Sin familiar vinculado</span>;
  const texto = fam.length === 1 ? (fam[0].relation === "participante" ? `${fam[0].nombre.split(" ")[0]} (participante)` : fam[0].nombre.split(" ")[0]) : fam.map((l) => l.nombre.split(" ")[0]).join(" y ");
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="flex shrink-0">
        {fam.slice(0, 3).map((l, i) => {
          const e = estadoFamiliar(cuentas.get(l.profile_id));
          return (
            <span
              key={l.profile_id}
              title={`${l.nombre} · ${relationLabel[l.relation]} · ${textoEstadoFamiliar[e]}`}
              className="w-[30px] h-[30px] rounded-full bg-beige-serenidad text-tinta text-[11px] font-extrabold inline-flex items-center justify-center"
              style={{ marginLeft: i ? -10 : 0, boxShadow: `0 0 0 2px #fff, 0 0 0 3.5px ${ANILLO[e]}` }}
            >
              {iniciales(l.nombre)}
            </span>
          );
        })}
      </span>
      <span className="text-[13px] text-tinta-suave truncate">{texto}</span>
    </span>
  );
}

// Estado de la cuenta (chip) y su detalle («Quedan 2 días»…).
export function CuentaCelda({ f }: { f: FilaCuenta | undefined }) {
  if (!f?.estado) return <span className="text-[13px] text-tinta-suave">Sin cuenta</span>;
  const e = estadoInfo[f.estado];
  const d = detalleCuenta(f);
  return (
    <span className="grid gap-1 min-w-0">
      <span className={`justify-self-start inline-flex items-center min-h-[26px] py-0.5 px-2.5 rounded-[13px] text-[12.5px] font-bold leading-tight ${e.clase}`}>
        {e.label}
        {f.pagada_desde ? " · pagada" : ""}
      </span>
      {d && <span className="text-[12.5px] text-tinta-suave leading-snug">{d}</span>}
    </span>
  );
}

// Botón del siguiente paso, con el estilo de su urgencia.
export function BotonPaso({ paso, onClick, ocupado, grande = false }: { paso: Paso; onClick: () => void; ocupado?: boolean; grande?: boolean }) {
  const tono =
    paso.tono === "principal"
      ? "border-0 bg-verde-profundo text-white hover:bg-tinta"
      : paso.tono === "aviso"
        ? "border-[1.5px] border-semaforo-amarillo bg-aviso text-[#6b5726] hover:bg-[#f7e6c2]"
        : "border-[1.5px] border-[#c9d8d9] bg-white text-verde-profundo hover:border-verde-profundo";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={ocupado}
      className={`inline-flex items-center justify-center rounded-[10px] font-sans font-bold cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${grande ? "min-h-12 px-5 text-[15px] w-full" : "h-9 px-3.5 text-[13.5px]"} ${tono}`}
    >
      {paso.label}
    </button>
  );
}

export function AlDia() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-semaforo-verde-texto">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.2 4.2L19 7" />
      </svg>
      Todo al día
    </span>
  );
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h3 className="m-0 text-[14px] font-extrabold text-tinta">{titulo}</h3>
        {accion}
      </div>
      {children}
    </section>
  );
}
