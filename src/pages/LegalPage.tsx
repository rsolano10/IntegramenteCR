import { Link, Navigate, useParams } from "react-router-dom";
import { legalContent } from "../lib/legalContent";

export function LegalPage() {
  const { doc } = useParams();
  const content = doc && doc in legalContent ? legalContent[doc as keyof typeof legalContent] : null;

  if (!content) return <Navigate to="/" replace />;

  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen">
      <header className="max-w-[760px] mx-auto px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-baseline gap-2 font-serif text-xl text-tinta no-underline">
          Integra<em className="italic text-verde-profundo">Mente</em>
        </Link>
      </header>

      <div className="max-w-[760px] mx-auto px-5 pb-20 sm:px-8">
        <Link to="/" className="inline-block mb-6 text-[15px] text-verde-profundo">
          ‹ Volver al inicio
        </Link>
        <p className="m-0 mb-2.5 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-tenue">{content.updated}</p>
        <h1 className="font-serif font-normal text-[32px] sm:text-[40px] leading-tight m-0 mb-5">{content.title}</h1>
        <p className="text-base sm:text-lg leading-relaxed text-tinta-suave m-0 mb-10">{content.intro}</p>

        <div className="grid gap-8">
          {content.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-serif font-normal text-xl sm:text-2xl m-0 mb-3 pb-2.5 border-b border-borde">{s.heading}</h2>
              <div className="grid gap-3">
                {s.body.map((p, i) => (
                  <p key={i} className="m-0 text-base leading-relaxed text-tinta-suave">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
