import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ResumenSeguimiento, type ResumenDatos } from "../components/resumen/ResumenSeguimiento";
import { Logo } from "../components/ui/Logo";

// El médico abre el enlace que le compartió la familia: sin cuenta, solo
// el resumen. Si venció o lo anularon, se dice en palabras.
export function ResumenPublico() {
  const { token = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["resumen-enlace", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resumen_por_enlace", { p_token: token });
      if (error) throw error;
      return (data ?? null) as ResumenDatos | null;
    },
    retry: false,
  });
  return (
    <main className="min-h-screen bg-fondo-papel px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto grid gap-4">
        {isLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <span className="w-8 h-8 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
          </div>
        ) : data ? (
          <>
            <div className="print:hidden flex justify-end">
              <button type="button" onClick={() => window.print()} className="min-h-11 px-5 rounded-full border-[1.5px] border-borde bg-white text-[15px] font-semibold text-tinta cursor-pointer hover:border-verde-serenidad">
                Imprimir
              </button>
            </div>
            <ResumenSeguimiento datos={data} />
          </>
        ) : (
          <section className="rounded-[24px] bg-white border border-borde px-6 py-10 text-center">
            <Logo />
            <h1 className="m-0 mt-5 font-serif font-normal text-[26px] text-tinta">Este enlace ya no está disponible</h1>
            <p className="m-0 mt-2 text-[15.5px] text-tinta-suave">Venció o la familia lo anuló. Si necesita el resumen, pídale a la familia un enlace nuevo desde la app.</p>
          </section>
        )}
      </div>
    </main>
  );
}
