import { Link } from "react-router-dom";
import { contacto, guiaProfesionales, whatsappHome } from "../../lib/landingContenido";
import { WHATSAPP_EQUIPO_VISIBLE } from "../../lib/whatsapp";

// Pie de página del sitio público (home y páginas para médicos).
export function SitioFooter() {
  return (
    <footer id="pie" className="bg-tinta text-[#d3dcdd]">
      <div className="max-w-[1280px] mx-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-14 grid gap-8 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-serif text-xl lg:text-2xl text-white mb-3 flex items-center gap-2.5">
            <img src="/marca/isotipo.png" alt="" className="h-8 w-auto" />
            <span>IntegraMente</span>
            <span className="font-sans text-[11px] tracking-[0.16em] uppercase text-[#a9b9bb]">en Casa</span>
          </div>
          <p className="m-0 text-[15px] leading-relaxed max-w-[26em]">
            Salud cerebral en casa, con el equipo de IntegraMente.
          </p>
          <a
            href={contacto.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2.5 min-h-11 px-4 rounded-full border border-[#4a5f63] text-white text-[15px] font-semibold no-underline hover:border-[#9cc2c6] transition-colors"
          >
            <InstagramIcon /> Seguinos en Instagram
          </a>
          <a
            href={contacto.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 sm:mt-5 sm:ml-2.5 inline-flex items-center gap-2.5 min-h-11 px-4 rounded-full border border-[#4a5f63] text-white text-[15px] font-semibold no-underline hover:border-[#9cc2c6] transition-colors"
          >
            <FacebookIcon /> Seguinos en Facebook
          </a>
        </div>
        <div className="grid gap-2.5 text-[15px] content-start">
          <span className="text-[#a9b9bb] text-xs tracking-[0.14em] uppercase">Contacto</span>
          <span>{contacto.telefono}</span>
          <a href={whatsappHome.general} target="_blank" rel="noreferrer" className="text-[#d3dcdd] py-2 md:py-0">
            WhatsApp · {WHATSAPP_EQUIPO_VISIBLE}
          </a>
          <span>{contacto.correo}</span>
          <span>Costa Rica</span>
        </div>
        <div className="grid gap-2.5 text-[15px] content-start">
          <span className="text-[#a9b9bb] text-xs tracking-[0.14em] uppercase">Legal</span>
          <Link to="/legal/condiciones" className="text-[#d3dcdd] py-2 md:py-0">
            Condiciones de uso
          </Link>
          <Link to="/legal/privacidad" className="text-[#d3dcdd] py-2 md:py-0">
            Privacidad y datos
          </Link>
          <Link to="/legal/emergencias" className="text-[#d3dcdd] py-2 md:py-0">
            Emergencias
          </Link>
          <Link to={guiaProfesionales} className="text-[#d3dcdd] py-2 md:py-0">
            Para médicos
          </Link>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-5 pb-8 sm:px-8 lg:px-12 lg:pb-11">
        <p className="m-0 text-[13.5px] leading-relaxed text-[#a9b9bb] max-w-[60em]">
          No sustituye la consulta médica ni la valoración neuropsicológica. Ante una emergencia, llamá al 9-1-1.
        </p>
      </div>
    </footer>
  );
}

export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
    </svg>
  );
}
