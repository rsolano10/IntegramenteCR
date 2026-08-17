import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { planTiers } from "../lib/mockData";

export function PlanCheckout() {
  const { plan } = useParams();
  const navigate = useNavigate();
  const tier = planTiers.find((t) => t.id === plan);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  if (!tier) return <Navigate to="/#planes" replace />;

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen">
      <header className="max-w-[1000px] mx-auto px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="inline-flex items-baseline gap-2 font-serif text-xl text-tinta no-underline">
          Integra<em className="italic text-verde-profundo">Mente</em>
        </Link>
      </header>

      <div className="max-w-[1000px] mx-auto px-5 pb-20 sm:px-8 lg:px-12">
        <Link to="/#planes" className="inline-block mb-5 text-[15px] text-verde-profundo">
          ‹ Volver a los planes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-10 items-start">
          <div className={`rounded-3xl p-6 sm:p-7 border ${tier.recomendado ? "border-[1.5px] border-verde-serenidad bg-[#f5f9f9]" : "border-borde bg-white"}`}>
            {tier.recomendado && (
              <span className="inline-block mb-3 text-xs tracking-[0.12em] uppercase bg-mostaza-vital text-[#4a3a1b] px-3 py-1.5 rounded-full font-bold">
                Recomendado
              </span>
            )}
            <h1 className="font-serif font-normal text-[32px] m-0 mb-1.5">{tier.nombre}</h1>
            <p className="m-0 mb-4 text-base text-tinta-suave">{tier.tagline}</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-serif text-4xl">{tier.precio}</span>
              <span className="text-sm text-tinta-tenue">{tier.periodo}</span>
            </div>
            <ul className="m-0 p-0 list-none grid gap-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[16px] leading-snug text-tinta-suave">
                  <span className="text-verde-serenidad font-bold mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-borde rounded-3xl p-6 sm:p-8 shadow-elevada">
            <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Creá tu cuenta</h2>
            <p className="m-0 mb-6 text-[15px] text-tinta-tenue">Sin tarjeta para empezar. Podés cancelar cuando querás.</p>
            <div className="grid gap-4.5">
              <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                Nombre completo
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ana Solano"
                  className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
                />
              </label>
              <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                Correo electrónico
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <Button variant="ink" fullWidth onClick={() => navigate("/app/login")}>
                Crear mi cuenta y continuar
              </Button>
              <p className="m-0 text-xs leading-relaxed text-tinta-tenue text-center">
                Al continuar aceptás las{" "}
                <Link to="/legal/condiciones" className="text-verde-profundo">
                  condiciones de uso
                </Link>{" "}
                y la{" "}
                <Link to="/legal/privacidad" className="text-verde-profundo">
                  política de privacidad
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
