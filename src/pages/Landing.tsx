import { useState } from "react";
import { Link } from "react-router-dom";
import { PlanRow } from "../components/ui/PlanRow";

export function Landing() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const isRegister = mode === "register";

  const tabClass = (active: boolean) =>
    `min-h-[46px] rounded-full border-none font-sans text-[16px] font-semibold cursor-pointer ${
      active ? "bg-white text-tinta shadow-[0_2px_8px_-4px_rgba(31,51,56,.6)]" : "bg-transparent text-[#6b7c80]"
    }`;

  function goToRegister() {
    setMode("register");
    document.getElementById("acceso")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-full">
      <header className="relative flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:gap-8 lg:px-12 lg:py-5.5 max-w-[1280px] mx-auto">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-xl sm:text-2xl lg:text-[27px] text-tinta">
            Integra<em className="italic text-verde-profundo">Mente</em>
          </span>
          <span className="text-[10px] lg:text-xs tracking-[0.16em] uppercase text-tinta-tenue pb-0.5">en Casa</span>
        </div>

        {/* Desktop nav — unchanged from the original computer design */}
        <nav className="hidden lg:flex items-center gap-8.5 text-[16px]">
          <a href="#como-funciona" className="text-verde-profundo">Cómo funciona</a>
          <a href="#planes" className="text-verde-profundo">Planes</a>
          <a href="#seguridad" className="text-verde-profundo">Seguridad</a>
        </nav>

        {/* Phone / tablet nav — hamburger toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-full border-[1.5px] border-borde text-tinta"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {menuOpen && (
          <div className="lg:hidden absolute top-full left-4 right-4 sm:left-8 sm:right-8 mt-2 bg-white border border-borde rounded-2xl shadow-elevada p-3 grid gap-1 z-30">
            <a
              href="#como-funciona"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3.5 rounded-xl text-tinta font-semibold text-[16px] hover:bg-fondo-papel"
            >
              Cómo funciona
            </a>
            <a
              href="#planes"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3.5 rounded-xl text-tinta font-semibold text-[16px] hover:bg-fondo-papel"
            >
              Planes
            </a>
            <a
              href="#seguridad"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3.5 rounded-xl text-tinta font-semibold text-[16px] hover:bg-fondo-papel"
            >
              Seguridad
            </a>
          </div>
        )}
      </header>

      <section
        className="max-w-[1280px] mx-auto px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16 lg:px-12 lg:pt-10 lg:pb-22 grid grid-cols-1 gap-10 items-start lg:grid-cols-[1.05fr_0.95fr] lg:gap-18"
      >
        <div className="lg:pt-6">
          <p className="m-0 mb-3 sm:mb-4 lg:mb-5.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">
            Estimulación cognitiva y acompañamiento en el hogar
          </p>
          <h1
            className="font-serif font-normal text-[36px] sm:text-[48px] lg:text-[68px] leading-[1.1] lg:leading-[1.06] tracking-[-0.015em] m-0 mb-4 lg:mb-6.5"
            style={{ textWrap: "pretty" }}
          >
            Saber qué hacer hoy,
            <br />
            <em className="italic text-verde-profundo">sin improvisar.</em>
          </h1>
          <p className="text-base sm:text-lg lg:text-[21px] leading-relaxed text-[#3b4c51] max-w-[30em] m-0 mb-6 lg:mb-9" style={{ textWrap: "pretty" }}>
            Un plan semanal breve y adaptado para acompañar en casa a una persona con cambios cognitivos: qué actividad hacer, cómo
            hacerla y cuándo pedir ayuda profesional.
          </p>
          <div className="flex flex-wrap gap-3 lg:gap-3.5 mb-6 lg:mb-10">
            <button
              type="button"
              onClick={goToRegister}
              className="inline-flex items-center min-h-12 lg:min-h-14 px-6 lg:px-8 rounded-full bg-verde-serenidad text-white font-semibold text-[15px] lg:text-[17px] hover:bg-verde-profundo transition-colors cursor-pointer"
            >
              Crear mi perfil gratuito
            </button>
            <a
              href="#como-funciona"
              className="inline-flex items-center min-h-12 lg:min-h-14 px-6 lg:px-7 rounded-full border-[1.5px] border-borde text-tinta font-semibold text-[15px] lg:text-[17px] hover:border-verde-serenidad transition-colors"
            >
              Ver cómo funciona
            </a>
          </div>
          <div className="flex flex-wrap gap-x-5 lg:gap-x-7 gap-y-2 lg:gap-y-3 text-sm lg:text-[15px] text-[#5d6e72]">
            <span>15 minutos para empezar</span>
            <span className="text-[#c7c0a4]">·</span>
            <span>Contenido revisado por profesionales</span>
            <span className="text-[#c7c0a4]">·</span>
            <span>Sin diagnóstico automático</span>
          </div>
        </div>

        <div id="acceso" className="bg-white border border-borde rounded-3xl p-6 sm:p-8 lg:p-9 shadow-elevada">
          <div className="grid grid-cols-2 gap-1.5 bg-[#f2eede] p-1.5 rounded-full mb-7">
            <button type="button" onClick={() => setMode("login")} className={tabClass(!isRegister)}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => setMode("register")} className={tabClass(isRegister)}>
              Crear cuenta
            </button>
          </div>

          {isRegister && (
            <div className="grid gap-4.5 mb-1.5">
              <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                Nombre completo
                <input
                  type="text"
                  placeholder="Ana Solano"
                  className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
                />
              </label>
            </div>
          )}

          <div className="grid gap-4.5">
            <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
              Correo electrónico
              <input
                type="email"
                placeholder="nombre@correo.com"
                className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
              />
            </label>
            <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
              Contraseña
              <input
                type="password"
                placeholder="••••••••"
                className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
              />
            </label>
            <Link
              to="/app/login"
              className="inline-flex items-center justify-center min-h-14 rounded-full bg-tinta text-white font-semibold text-[17px] hover:bg-verde-profundo transition-colors"
            >
              {isRegister ? "Crear cuenta y empezar" : "Entrar"}
            </Link>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 mt-4.5 text-[15px]">
            <Link to="/olvide-password" className="text-verde-profundo">¿Olvidaste tu contraseña?</Link>
            {isRegister ? (
              <span className="text-tinta-tenue">Gratis, sin tarjeta</span>
            ) : (
              <button type="button" onClick={() => setMode("register")} className="text-tinta-tenue underline decoration-dotted cursor-pointer">
                ¿Primera vez? Creá tu cuenta
              </button>
            )}
          </div>

          <div className="mt-6.5 pt-5.5 border-t border-[#efeada] grid gap-2.5">
            <p className="m-0 text-sm leading-relaxed text-[#6b7c80]">
              ¿Sos paciente del programa IntegraMente? Tu cuenta la crea la clínica: entrá con el correo que registraste en consulta.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-beige-serenidad">
        <div className="max-w-[1280px] mx-auto px-5 py-5 sm:px-8 lg:px-12 lg:py-6.5 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 lg:gap-5">
          <p className="m-0 font-serif text-xl sm:text-2xl italic text-verde-profundo">Preservá lo que te hace ser vos.</p>
          <p className="m-0 text-sm lg:text-[15px] text-[#5d6e72] max-w-[46em]">
            IntegraMente en Casa acompaña, educa y organiza el cuidado. No diagnostica, no interpreta pruebas y no modifica tratamientos
            médicos.
          </p>
        </div>
      </section>

      <section id="como-funciona" className="max-w-[1280px] mx-auto px-5 pt-14 pb-8 sm:px-8 lg:px-12 lg:pt-24 lg:pb-10">
        <p className="m-0 mb-2.5 lg:mb-3.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Cómo funciona</p>
        <h2 className="font-serif font-normal text-[28px] sm:text-[34px] lg:text-[44px] leading-[1.16] lg:leading-[1.12] m-0 mb-8 lg:mb-14 max-w-[16em]">
          De la recomendación general a una semana posible de cumplir.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
          {[
            {
              n: "01",
              t: "Contanos cómo está hoy",
              d: "Preguntas simples sobre autonomía, movilidad, comprensión e intereses. Sin términos clínicos y con avance guardado.",
            },
            {
              n: "02",
              t: "Revisamos la seguridad",
              d: "Un filtro de seguridad define qué actividades corresponden y cuándo conviene una revisión profesional antes de continuar.",
            },
            {
              n: "03",
              t: "Recibís la semana",
              d: "Entre tres y cinco acciones repartidas por día, con video, instrucciones y un registro que toma segundos.",
            },
          ].map((c) => (
            <div key={c.n} className="bg-white border border-[#e9e4ce] rounded-[20px] p-6 lg:p-8">
              <div className="font-serif text-2xl lg:text-[30px] text-verde-serenidad mb-3 lg:mb-4.5">{c.n}</div>
              <h3 className="text-lg lg:text-xl m-0 mb-2 lg:mb-3 font-bold">{c.t}</h3>
              <p className="m-0 text-base lg:text-[17px] leading-relaxed text-tinta-suave">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-5 pt-10 pb-12 sm:px-8 lg:px-12 lg:pt-16 lg:pb-24 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[40px] leading-[1.2] lg:leading-[1.14] m-0 mb-3 lg:mb-5">
            Una semana, no una aplicación llena de tareas.
          </h2>
          <p className="text-base lg:text-lg leading-relaxed text-tinta-suave m-0 mb-4 lg:mb-6">
            Cada plan combina movimiento, una actividad significativa, una estrategia para la familia y un cuidado neuroprotector. Nada
            más.
          </p>
          <p className="text-base lg:text-lg leading-relaxed text-tinta-suave m-0">
            La vista <strong>Hoy</strong> muestra una sola cosa a la vez, con letra grande y audio opcional para la persona participante.
          </p>
        </div>
        <div className="bg-white border border-borde rounded-3xl p-5 sm:p-6 lg:p-8.5 shadow-elevada">
          <div className="flex items-baseline justify-between mb-4 lg:mb-6">
            <span className="font-serif text-xl lg:text-2xl">Semana del 10 al 16</span>
            <span className="text-xs lg:text-sm tracking-[0.12em] uppercase text-tinta-tenue">Objetivo · Participación</span>
          </div>
          <div className="grid gap-3">
            <PlanRow dia="Lunes" titulo="Movilidad sentado · 12 min" estado="realizado" />
            <PlanRow dia="Martes" titulo="Organizar cinco fotografías y conversar" estado="parcial" />
            <PlanRow dia="Miércoles" titulo="Preparar juntos una merienda sencilla" estado="realizado" />
            <PlanRow dia="Jueves" titulo="Repetir movilidad sentado · 12 min" estado="parcial" />
            <PlanRow dia="Viernes" titulo="Paseo breve o actividad elegida" estado="realizado" />
          </div>
          <div className="mt-5 p-4.5 rounded-2xl bg-mostaza-vital">
            <p className="m-0 text-[16px] leading-relaxed text-[#4a3a1b]">
              <strong>Estrategia de la semana:</strong> dar una instrucción por vez y evitar corregir innecesariamente.
            </p>
          </div>
        </div>
      </section>

      <section id="planes" className="bg-white border-y border-[#efeada]">
        <div className="max-w-[1280px] mx-auto px-5 py-12 sm:px-8 lg:px-12 lg:py-24">
          <p className="m-0 mb-2.5 lg:mb-3.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Tres formas de acompañarte</p>
          <h2 className="font-serif font-normal text-[28px] sm:text-[34px] lg:text-[44px] leading-[1.16] lg:leading-[1.12] m-0 mb-8 lg:mb-14 max-w-[15em]">
            Elegís cuánta compañía profesional necesitás.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
            <div className="border border-borde rounded-[20px] p-6 lg:p-8.5 flex flex-col gap-4">
              <h3 className="font-serif font-normal text-2xl lg:text-[28px] m-0">Autoguiado</h3>
              <p className="m-0 text-base lg:text-[17px] leading-relaxed text-tinta-suave">
                Perfil funcional, plan semanal, biblioteca de videos y asistente guiado para las dudas más frecuentes.
              </p>
              <p className="m-0 text-sm lg:text-[15px] text-tinta-tenue">Para familias que empiezan hoy.</p>
              <Link
                to="/planes/autoguiado"
                className="mt-auto self-start inline-flex items-center min-h-12.5 px-6 rounded-full border-[1.5px] border-verde-serenidad text-tinta font-semibold hover:bg-verde-serenidad hover:text-white transition-colors"
              >
                Empezar
              </Link>
            </div>
            <div className="border-[1.5px] border-verde-serenidad rounded-[20px] p-6 lg:p-8.5 flex flex-col gap-4 bg-[#f5f9f9]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif font-normal text-2xl lg:text-[28px] m-0">Orientado</h3>
                <span className="text-xs tracking-[0.12em] uppercase bg-mostaza-vital text-[#4a3a1b] px-3 py-1.5 rounded-full font-bold">
                  Recomendado
                </span>
              </div>
              <p className="m-0 text-base lg:text-[17px] leading-relaxed text-tinta-suave">
                Todo lo anterior más una consulta inicial y ajustes periódicos hechos por el equipo clínico.
              </p>
              <p className="m-0 text-sm lg:text-[15px] text-tinta-tenue">Para quienes necesitan mayor personalización.</p>
              <Link
                to="/planes/orientado"
                className="mt-auto self-start inline-flex items-center min-h-12.5 px-6 rounded-full bg-verde-serenidad text-white font-semibold hover:bg-verde-profundo transition-colors"
              >
                Solicitar
              </Link>
            </div>
            <div className="border border-borde rounded-[20px] p-6 lg:p-8.5 flex flex-col gap-4">
              <h3 className="font-serif font-normal text-2xl lg:text-[28px] m-0">Clínico</h3>
              <p className="m-0 text-base lg:text-[17px] leading-relaxed text-tinta-suave">
                Continuidad entre sesiones para pacientes del programa: el plan lo define el equipo tratante.
              </p>
              <p className="m-0 text-sm lg:text-[15px] text-tinta-tenue">Para pacientes actuales de IntegraMente.</p>
              <Link
                to="/planes/clinico"
                className="mt-auto self-start inline-flex items-center min-h-12.5 px-6 rounded-full border-[1.5px] border-borde text-tinta font-semibold hover:border-verde-serenidad transition-colors"
              >
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="seguridad"
        className="max-w-[1280px] mx-auto px-5 py-12 sm:px-8 lg:px-12 lg:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div>
          <p className="m-0 mb-2.5 lg:mb-3.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">Seguridad primero</p>
          <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[40px] leading-[1.2] lg:leading-[1.14] m-0 mb-3 lg:mb-5">
            Antes de sugerir algo, revisamos si es seguro.
          </h2>
          <p className="text-base lg:text-lg leading-relaxed text-tinta-suave m-0">
            El semáforo no clasifica la demencia ni sustituye una valoración: define qué funciones del programa pueden usarse con
            tranquilidad y cuándo hay que hablar con un profesional.
          </p>
        </div>
        <div className="grid gap-3 lg:gap-4">
          {[
            { color: "bg-verde-serenidad", t: "Verde · seguimiento en casa", d: "Situación estable y apoyo disponible. Se habilita el plan autoguiado completo." },
            { color: "bg-semaforo-amarillo", t: "Amarillo · con acompañamiento", d: "Mayor dependencia o dudas de seguridad. Se limitan ciertas actividades y se ofrece revisión profesional." },
            { color: "bg-semaforo-rojo", t: "Rojo · atención ahora", d: "Cambio agudo, caída o riesgo. Se detienen las recomendaciones y se muestra la ruta de atención de tu país." },
          ].map((s) => (
            <div key={s.t} className="grid grid-cols-[14px_1fr] gap-4 lg:gap-5 items-start bg-white border border-[#e9e4ce] rounded-2xl px-5 py-5 lg:px-7 lg:py-6.5">
              <span className={`w-3.5 h-3.5 rounded-full mt-2 ${s.color}`} />
              <div>
                <h3 className="m-0 mb-2 text-[17px] lg:text-[19px] font-bold">{s.t}</h3>
                <p className="m-0 text-base lg:text-[17px] leading-relaxed text-tinta-suave">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-verde-profundo text-white">
        <div className="max-w-[1280px] mx-auto px-5 py-12 sm:px-8 lg:px-12 lg:py-22 grid grid-cols-1 gap-6 lg:gap-14 items-center text-center lg:text-left lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-serif font-normal text-[26px] sm:text-[32px] lg:text-[42px] leading-[1.22] lg:leading-[1.14] m-0 mb-3 lg:mb-4 text-white">
              Cuidar la mente es cuidar la vida.
            </h2>
            <p className="m-0 text-base lg:text-lg leading-relaxed text-[#dce9e9] max-w-[34em] mx-auto lg:mx-0">
              Empezá con el perfil funcional. Toma menos de quince minutos, se guarda solo y podés continuar cuando querás.
            </p>
          </div>
          <button
            type="button"
            onClick={goToRegister}
            className="inline-flex items-center justify-center min-h-13 lg:min-h-[58px] px-7 lg:px-8.5 rounded-full bg-mostaza-vital text-[#40320f] font-bold text-base lg:text-lg whitespace-nowrap hover:bg-white hover:text-tinta transition-colors w-full sm:w-auto mx-auto lg:mx-0 cursor-pointer"
          >
            Crear mi perfil gratuito
          </button>
        </div>
      </section>

      <footer className="bg-tinta text-[#c6d2d3]">
        <div className="max-w-[1280px] mx-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="font-serif text-xl lg:text-2xl text-white mb-3">
              Integra<em className="italic text-mostaza-vital">Mente</em>
            </div>
            <p className="m-0 text-sm lg:text-[15px] leading-relaxed max-w-[26em]">
              Programa integral de estimulación cognitiva y acompañamiento emocional. Dra. Guiselle Solano · Neuropsicología.
            </p>
          </div>
          <div className="grid gap-2.5 text-sm lg:text-[15px]">
            <span className="text-[#7e9294] text-xs tracking-[0.14em] uppercase">Contacto</span>
            <a href="tel:+50683435772" className="text-[#c6d2d3]">+506 8343 5772</a>
            <a href="mailto:info@integramente.com" className="text-[#c6d2d3]">info@integramente.com</a>
            <span>Costa Rica</span>
          </div>
          <div className="grid gap-2.5 text-sm lg:text-[15px] content-start">
            <span className="text-[#7e9294] text-xs tracking-[0.14em] uppercase">Legal</span>
            <Link to="/legal/condiciones" className="text-[#c6d2d3]">Condiciones de uso</Link>
            <Link to="/legal/privacidad" className="text-[#c6d2d3]">Privacidad y datos</Link>
            <Link to="/legal/emergencias" className="text-[#c6d2d3]">Emergencias</Link>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-5 pb-8 sm:px-8 lg:px-12 lg:pb-11">
          <p className="m-0 text-xs lg:text-[13px] leading-relaxed text-[#7e9294] max-w-[60em]">
            IntegraMente en Casa es un servicio de educación, organización y acompañamiento. No sustituye la consulta médica ni la
            valoración neuropsicológica. Ante una urgencia, comunicate con los servicios de emergencia de tu país.
          </p>
        </div>
      </footer>
    </div>
  );
}
