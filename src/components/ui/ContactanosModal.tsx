import { useState, type ReactNode } from "react";
import { BotonWhatsApp } from "./BotonWhatsApp";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { waEquipo } from "../../lib/whatsapp";
import { VentanaMarca, EncabezadoMarca, ChipMarca, PestanasMarca, TituloPestana } from "./VentanaMarca";

// WhatsApp es el único canal con el equipo (cuenta, programa, pagos y
// dudas del cuidado). Correo y teléfono quedan como alternativa. Ante una
// urgencia, el 9-1-1. En la misma ventana de la marca que «Mi cuenta».
type Tab = "escribinos" | "urgencias";

const CORREO = "programas.integramente@gmail.com";
const TELEFONO = "+506 8343 5772";
const WHATSAPP = "+506 8346 4703";

export function ContactanosModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("escribinos");
  return (
    <VentanaMarca onClose={onClose}>
      <EncabezadoMarca
        ceja="Contactanos"
        titulo="Estamos para acompañarte"
        chips={
          <>
            <ChipMarca>
              <WhatsAppIcon size={14} />
              WhatsApp {WHATSAPP}
            </ChipMarca>
            <ChipMarca>Equipo IntegraMente</ChipMarca>
          </>
        }
      />
      <PestanasMarca
        tabs={[
          { id: "escribinos", label: "Escribinos" },
          { id: "urgencias", label: "Urgencias" },
        ]}
        tab={tab}
        onTab={setTab}
      />

      {tab === "escribinos" && (
        <div className="px-5 sm:px-8 py-7 grid grid-cols-[minmax(0,1fr)] gap-6">
          <TituloPestana ceja="El equipo" detalle="Para dudas sobre el cuidado, tu cuenta, el programa o cómo funciona la app.">
            Escribinos por WhatsApp
          </TituloPestana>

          <section className="relative overflow-hidden rounded-[24px] bg-beige-serenidad/55 px-5 sm:px-6 py-5">
            <div aria-hidden="true" className="absolute -right-10 -top-12 w-32 h-32 rounded-full bg-mostaza-vital/30" />
            <div className="relative grid gap-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="w-11 h-11 shrink-0 rounded-full bg-verde-profundo text-white inline-flex items-center justify-center">
                  <WhatsAppIcon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-[21px] leading-tight text-tinta">{WHATSAPP}</span>
                  <span className="block text-[13.5px] text-tinta-suave">Es el canal principal con el equipo.</span>
                </span>
              </div>
              <BotonWhatsApp href={waEquipo()} fullWidth />
            </div>
          </section>

          <section>
            <p className="m-0 mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">También podés</p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Canal titulo="Correo" valor={CORREO} href={`mailto:${CORREO}`} icono={<IconoCorreo />} />
              <Canal titulo="Teléfono" valor={TELEFONO} href={`tel:${TELEFONO.replace(/\s/g, "")}`} icono={<IconoTelefono />} />
            </div>
          </section>

          <p className="m-0 rounded-2xl bg-verde-tenue border border-borde-suave px-4 py-3.5 text-[14px] leading-relaxed text-tinta-suave">
            ¿Una duda rápida sobre la app? Preguntale a <strong className="text-tinta">Clara</strong> en Ayuda: responde al instante.
          </p>
        </div>
      )}

      {tab === "urgencias" && (
        <div className="px-5 sm:px-8 py-7 grid grid-cols-[minmax(0,1fr)] gap-6">
          <TituloPestana ceja="Urgencias" detalle="El equipo no atiende emergencias por WhatsApp.">
            Ante una urgencia, llamá al 9-1-1
          </TituloPestana>
          <a
            href="tel:911"
            className="flex items-center gap-4 rounded-[24px] bg-alerta border-[1.5px] border-alerta-borde px-5 py-5 no-underline text-tinta hover:brightness-[0.98]"
          >
            <span aria-hidden="true" className="w-12 h-12 shrink-0 rounded-full bg-alerta-texto text-white inline-flex items-center justify-center">
              <IconoTelefono />
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-[30px] leading-none text-alerta-texto">9-1-1</span>
              <span className="block mt-1 text-[14px] text-tinta-suave">Tocá para llamar</span>
            </span>
          </a>
          <section className="rounded-2xl border border-borde px-4.5 py-4">
            <p className="m-0 text-[15px] font-semibold text-tinta">Después, avisanos</p>
            <p className="m-0 mt-1 text-[14px] leading-relaxed text-tinta-suave">
              Cuando pase la urgencia, contanos por WhatsApp qué ocurrió. Así el equipo ajusta el plan de la semana.
            </p>
            <BotonWhatsApp variant="outline" href={waEquipo("Quiero contarles algo que pasó.")} className="mt-3" />
          </section>
        </div>
      )}
    </VentanaMarca>
  );
}

function Canal({ titulo, valor, href, icono }: { titulo: string; valor: string; href: string; icono: ReactNode }) {
  return (
    <a href={href} className="flex items-center gap-3 min-w-0 rounded-[18px] bg-white border border-borde px-4 py-3.5 no-underline text-tinta hover:border-verde-serenidad transition-colors">
      <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-verde-tenue text-verde-profundo inline-flex items-center justify-center">
        {icono}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-tinta-tenue">{titulo}</span>
        <span className="block text-[15px] font-semibold break-all select-all">{valor}</span>
      </span>
    </a>
  );
}

function IconoCorreo() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />
    </svg>
  );
}
