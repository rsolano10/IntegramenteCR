import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { semaforoData } from "../../lib/rules";
import { computeProfiles, overallTier } from "../../lib/clinicalEngine";
import { getPatientName, getPatientAge, summarizeProfile } from "../../lib/patient";
import { planTiers } from "../../lib/mockData";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EditBasicInfoModal } from "../../components/ui/EditBasicInfoModal";

export function Ficha() {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const modalidad = useAppStore((s) => s.modalidad);
  const sem = overallTier(computeProfiles(onboarding2));
  const d = semaforoData[sem];
  const notaInterna = useAppStore((s) => s.notaInterna);
  const setNotaInterna = useAppStore((s) => s.setNotaInterna);
  const mensajeBorrador = useAppStore((s) => s.mensajeBorrador);
  const setMensajeBorrador = useAppStore((s) => s.setMensajeBorrador);
  const mensajes = useAppStore((s) => s.mensajes);
  const sendMensajeFamilia = useAppStore((s) => s.sendMensajeFamilia);
  const perfilValidado = useAppStore((s) => s.perfilValidado);
  const validarPerfil = useAppStore((s) => s.validarPerfil);
  const planStatus = useAppStore((s) => s.planStatus);
  const asignarPrograma = useAppStore((s) => s.asignarPrograma);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const rosaModalidad = planTiers.find((t) => t.id === modalidad)?.nombre ?? "Orientado";
  const perfil = summarizeProfile(onboarding2);
  const nombrePaciente = getPatientName(onboarding2);

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      <Link to="/app/profesional/panel" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver al panel
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="bg-white border border-borde rounded-3xl p-5 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-5.5">
            <div>
              <h1 className="font-serif font-normal text-[28px] sm:text-[34px] m-0 mb-1">{getPatientName(onboarding2)}</h1>
              <p className="m-0 text-[16px] text-tinta-tenue">
                {getPatientAge(onboarding2)} años · {rosaModalidad} · familiar administradora: Marcela
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {planStatus === "pendiente" && (
                <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[15px] font-bold bg-aviso text-semaforo-amarillo-texto">
                  <span className="w-2.5 h-2.5 rounded-full bg-mostaza-vital" />
                  Pendiente de revisión
                </span>
              )}
              <span className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[15px] font-bold ${d.bg} ${d.ink}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
                {d.short}
              </span>
            </div>
          </div>
          {planStatus === "pendiente" && (
            <div className="border-[1.5px] border-mostaza-vital bg-aviso rounded-2xl p-4.5 mb-5.5 flex items-center justify-between gap-3 flex-wrap">
              <p className="m-0 text-[15px] leading-relaxed text-[#4a3a1b]">
                {nombrePaciente} y su familia todavía no ven ningún programa — están viendo la pantalla de "en revisión".
              </p>
              <Button dense onClick={() => setAssignOpen(true)}>
                Asignar programa
              </Button>
            </div>
          )}
          <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Perfil funcional declarado por la familia</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6.5">
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Autonomía</strong>
              {perfil.autonomia}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Movilidad</strong>
              {perfil.movilidad}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Comprensión</strong>
              {perfil.comprension}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Intereses</strong>
              {perfil.intereses}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button dense onClick={validarPerfil} disabled={perfilValidado}>
              {perfilValidado ? "Perfil validado ✓" : "Validar perfil"}
            </Button>
            <Button variant="secondary" dense to="/app/profesional/editor">
              Ajustar el plan
            </Button>
            <Button variant="secondary" dense onClick={() => setEditOpen(true)}>
              Editar datos básicos
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="bg-[#f4f2e7] border-[1.5px] border-dashed border-[#c7be9a] rounded-2xl p-6">
            <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-[#7a5c1c]">Nota interna · no visible para la familia</p>
            <textarea
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              className="w-full min-h-[120px] rounded-xl border-[1.5px] border-[#d8d2b8] bg-white p-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
            />
          </div>
          <div className="bg-white border border-borde rounded-2xl p-6">
            <p className="m-0 mb-2 text-[13px] tracking-[0.14em] uppercase text-verde-profundo">Mensaje para la familia</p>
            <textarea
              value={mensajeBorrador}
              onChange={(e) => setMensajeBorrador(e.target.value)}
              placeholder="Escribí un mensaje para Marcela…"
              className="w-full min-h-[100px] rounded-xl border-[1.5px] border-verde-serenidad bg-campo p-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
            />
            <Button dense variant="ink" className="mt-3" onClick={sendMensajeFamilia} disabled={!mensajeBorrador.trim()}>
              Enviar a la familia
            </Button>
            {mensajes.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#efeada] grid gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue">Historial enviado</p>
                {mensajes.map((m) => (
                  <div key={m.id} className="bg-campo rounded-xl px-3.5 py-3">
                    <p className="m-0 text-[12.5px] text-tinta-tenue">{m.fecha}</p>
                    <p className="m-0 mt-0.5 text-[14.5px] text-tinta leading-snug">{m.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="m-0 text-sm leading-relaxed text-tinta-tenue">
            Toda edición queda registrada con autor, fecha y versión del contenido mostrado a la familia.
          </p>
        </div>
      </div>
      {editOpen && <EditBasicInfoModal onClose={() => setEditOpen(false)} />}
      {assignOpen && (
        <AsignarProgramaModal nombrePaciente={nombrePaciente} onClose={() => setAssignOpen(false)} onConfirm={asignarPrograma} />
      )}
    </div>
  );
}

function AsignarProgramaModal({
  nombrePaciente,
  onClose,
  onConfirm,
}: {
  nombrePaciente: string;
  onClose: () => void;
  onConfirm: (mensaje: string) => void;
}) {
  const [mensaje, setMensaje] = useState(
    `¡Hola! Ya revisamos el perfil de ${nombrePaciente} y le armamos su primer programa personalizado. Cualquier duda, escribime por acá.`,
  );

  function confirm() {
    onConfirm(mensaje);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Asignar programa</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        {nombrePaciente} y su familia van a poder ver la app en cuanto confirmes. Este mensaje les aparece como bienvenida la primera
        vez que entren.
      </p>
      <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
        Mensaje de bienvenida para la familia
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full min-h-[110px] rounded-xl border-[1.5px] border-verde-serenidad bg-campo p-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
        />
      </label>
      <div className="flex gap-3 mt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="ink" onClick={confirm}>
          Asignar y notificar a la familia
        </Button>
      </div>
    </Modal>
  );
}
