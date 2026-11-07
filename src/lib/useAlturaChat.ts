import { useEffect, useState } from "react";

// Alto disponible para una pantalla tipo chat (Ayuda / Clara): lo que el
// teléfono muestra de verdad (visualViewport, que se achica cuando abre el
// teclado) menos el encabezado fijo de la app y, en el celular, el menú
// inferior cuando está a la vista. Mientras está activo, la página no se
// desplaza: solo la conversación tiene scroll, como en WhatsApp.
export function useAlturaChat(activo: boolean): number | null {
  const [alto, setAlto] = useState<number | null>(null);

  useEffect(() => {
    if (!activo) {
      setAlto(null);
      return;
    }
    const raiz = document.documentElement;
    const overflowAntes = raiz.style.overflow;
    raiz.style.overflow = "hidden";

    const medir = () => {
      const vv = window.visualViewport;
      const visible = vv ? vv.height : window.innerHeight;
      const encabezado = document.querySelector<HTMLElement>("#root header");
      const altoEncabezado = encabezado ? encabezado.getBoundingClientRect().height : 0;
      // El menú inferior (solo celular) cuenta si está dentro de lo visible;
      // con el teclado abierto en iPhone queda tapado y no se resta.
      const menu = document.querySelector<HTMLElement>("nav[data-menu-inferior]");
      let altoMenu = 0;
      if (menu && getComputedStyle(menu).display !== "none") {
        const r = menu.getBoundingClientRect();
        if (r.top < visible) altoMenu = r.height;
      }
      setAlto(Math.max(320, Math.round(visible - altoEncabezado - altoMenu)));
      // iOS desplaza la página al enfocar el campo: se la devuelve arriba.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    medir();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", medir);
    vv?.addEventListener("scroll", medir);
    window.addEventListener("resize", medir);
    const ro = new ResizeObserver(medir);
    const encabezado = document.querySelector("#root header");
    if (encabezado) ro.observe(encabezado);
    return () => {
      raiz.style.overflow = overflowAntes;
      vv?.removeEventListener("resize", medir);
      vv?.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      ro.disconnect();
    };
  }, [activo]);

  return alto;
}
