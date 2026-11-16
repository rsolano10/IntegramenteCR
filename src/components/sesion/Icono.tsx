import type { CSSProperties, ReactNode } from "react";
import type { NombreIcono } from "../../lib/sesiones/iconos";

// Dibujos de la sesión guiada: trazo redondo en tinta y un relleno suave del
// color del módulo (variable --relleno), sobre una grilla de 48. Simples a
// propósito: se leen de un vistazo, también en un teléfono chico.

const R = "var(--relleno, #f4d096)";
const B = "#fff";

const D: Record<NombreIcono, ReactNode> = {
  silla: (
    <>
      <path d="M15 8v32M15 26h18v14M15 26v-4h18v4" />
      <rect x="15" y="21" width="18" height="5" rx="1.5" fill={R} />
      <path d="M15 8h3v13h-3z" fill={R} />
    </>
  ),
  apoyo: (
    <>
      <rect x="8" y="14" width="32" height="5" rx="2.5" fill={R} />
      <path d="M12 19v21M36 19v21M8 40h8M32 40h8" />
    </>
  ),
  zapato: (
    <>
      <path d="M7 32c0-6 2-14 2-14h10l2 6c6 1 14 3 18 6 2 1.5 2 4 2 6H7z" fill={R} />
      <path d="M7 36h34M15 18v6M19 24h-4" />
    </>
  ),
  luz: (
    <>
      <path d="M24 8a11 11 0 0 0-6 20c1.5 1.2 2 2.6 2 4h8c0-1.4.5-2.8 2-4a11 11 0 0 0-6-20z" fill={R} />
      <path d="M20 36h8M21 40h6" />
    </>
  ),
  suelo: (
    <>
      <path d="M6 32h36M10 38h28" />
      <path d="M14 26l3-8 3 8M30 26l2-5 2 5" opacity=".35" />
      <path d="M33 14l4 4M37 14l-4 4" />
      <circle cx="35" cy="16" r="6.5" fill={R} opacity=".55" stroke="none" />
    </>
  ),
  baston: (
    <>
      <path d="M26 12c0-3 2-5 5-5s5 2 5 5v2" />
      <path d="M26 12v30" strokeWidth="3.4" />
      <rect x="23" y="39" width="6" height="3" rx="1" fill={R} />
    </>
  ),
  reloj: (
    <>
      <circle cx="24" cy="25" r="15" fill={R} />
      <path d="M24 17v8l6 4M20 6h8" />
    </>
  ),
  corazon: <path d="M24 39S8 30 8 18a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 12-16 21-16 21z" fill={R} />,
  estrella: <path d="M24 7l5.2 10.6 11.6 1.7-8.4 8.2 2 11.6L24 33.6 13.6 39.1l2-11.6-8.4-8.2 11.6-1.7z" fill={R} />,
  conversar: (
    <>
      <path d="M7 12a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H17l-7 6v-6a4 4 0 0 1-3-4z" fill={R} />
      <path d="M33 18h4a4 4 0 0 1 4 4v8a4 4 0 0 1-3 4v5l-6-5h-8a4 4 0 0 1-4-4v-2" />
    </>
  ),
  mapa: (
    <>
      <path d="M6 12l11-4 14 4 11-4v28l-11 4-14-4-11 4z" fill={R} />
      <path d="M17 8v28M31 12v28" />
    </>
  ),
  dolor: (
    <>
      <circle cx="24" cy="24" r="16" fill={R} />
      <path d="M26 12l-6 12h8l-6 12" stroke="#8c3f2a" />
    </>
  ),
  mareo: (
    <>
      <circle cx="24" cy="24" r="16" fill={R} />
      <path d="M24 24a3 3 0 1 1 3 3 6 6 0 1 1-6-6 9 9 0 1 1-9 9" />
    </>
  ),
  equilibrio: (
    <>
      <path d="M8 40h32" />
      <path d="M24 16l-2 12-6 12M22 28l6 12" />
      <circle cx="24" cy="11" r="4" fill={R} />
      <path d="M12 20l12-2 12 6" />
      <path d="M36 9l3 3M39 9l-3 3" opacity=".6" />
    </>
  ),
  cansancio: (
    <>
      <rect x="8" y="15" width="28" height="18" rx="3" fill="none" />
      <path d="M36 21h3v6h-3" />
      <rect x="11" y="18" width="6" height="12" rx="1" fill={R} />
    </>
  ),
  aire: (
    <>
      <path d="M8 18h20a5 5 0 1 0-5-5M8 26h28a5 5 0 1 1-5 5M8 34h14" />
      <circle cx="38" cy="12" r="5" fill={R} stroke="none" opacity=".7" />
    </>
  ),
  confusion: (
    <>
      <circle cx="24" cy="24" r="16" fill={R} />
      <path d="M19 19a5 5 0 1 1 7 4.5c-1.5.8-2 1.8-2 3.5" />
      <circle cx="24" cy="32" r="0.6" strokeWidth="3" />
    </>
  ),
  rechazo: (
    <>
      <path d="M17 40V20a3 3 0 0 1 6 0v-6a3 3 0 0 1 6 0v6-2a3 3 0 0 1 6 0v12c0 6-4 10-10 10h-2c-4 0-6-2-8-5l-4-7a3 3 0 0 1 5-3l1 2" fill={R} />
    </>
  ),
  urgente: (
    <>
      <circle cx="24" cy="24" r="16" fill="#fbefeb" stroke="#8c3f2a" />
      <path d="M24 15v18M15 24h18" stroke="#8c3f2a" strokeWidth="4" />
    </>
  ),
  bien: (
    <>
      <circle cx="24" cy="24" r="16" fill={R} />
      <path d="M17 27c2 4 12 4 14 0" />
      <circle cx="18.5" cy="20" r="0.6" strokeWidth="3.4" />
      <circle cx="29.5" cy="20" r="0.6" strokeWidth="3.4" />
    </>
  ),
  cansado: (
    <>
      <circle cx="24" cy="24" r="16" fill={R} />
      <path d="M16 21h5M27 21h5M19 31h10" />
    </>
  ),
  molestia: (
    <>
      <circle cx="24" cy="24" r="16" fill={R} />
      <path d="M17 32c2-4 12-4 14 0M15.5 19l4.5-2M32.5 19l-4.5-2" />
      <circle cx="19" cy="23" r="0.6" strokeWidth="3" />
      <circle cx="29" cy="23" r="0.6" strokeWidth="3" />
    </>
  ),
  "figura-sentada": (
    <>
      <path d="M8 26h14v14M8 12v28" opacity=".55" />
      <circle cx="19" cy="9" r="4" fill={R} />
      <path d="M19 13v12h11v14M30 39h4" />
      <path d="M19 17l7 5" />
    </>
  ),
  "figura-inclinada": (
    <>
      <path d="M8 26h14v14M8 12v28" opacity=".55" />
      <circle cx="26" cy="12" r="4" fill={R} />
      <path d="M24 16l-4 10 10 2v11M30 39h4" />
      <path d="M23 19l9 2" />
      <path d="M36 15l3-3M37 20h4" opacity=".6" />
    </>
  ),
  "figura-de-pie": (
    <>
      <path d="M6 26h12v14M6 12v28" opacity=".55" />
      <circle cx="28" cy="8" r="4" fill={R} />
      <path d="M28 12v16l-3 12M28 28l3 12M24 40h4M29 40h5" />
      <path d="M28 16l-6 7M28 16l6 7" />
    </>
  ),
  "figura-rodilla": (
    <>
      <path d="M8 26h14v14M8 12v28" opacity=".55" />
      <circle cx="19" cy="9" r="4" fill={R} />
      <path d="M19 13v12h11l10-2M40 23l1 4" />
      <path d="M19 17l7 5" />
      <path d="M33 16l3-2M38 17l3-1" opacity=".6" />
    </>
  ),
  "figura-rodilla-arriba": (
    <>
      <path d="M8 26h14v14M8 12v28" opacity=".55" />
      <circle cx="19" cy="9" r="4" fill={R} />
      <path d="M19 13v12l10-5 1 12M30 32h4" />
      <path d="M19 25h8v14" opacity=".4" />
      <path d="M19 17l7 5" />
      <path d="M31 14v-4M28 12l3-3 3 3" opacity=".6" />
    </>
  ),
  "figura-escalon": (
    <>
      <path d="M26 40v-7h18v7z" fill={R} />
      <path d="M4 20h14M8 20v20" opacity=".55" />
      <circle cx="24" cy="8" r="4" fill={R} />
      <path d="M24 12v15l-2 13M24 27l6 2v4M20 40h4M30 33h4" />
      <path d="M24 16l-8 4" />
    </>
  ),
  "figura-un-pie": (
    <>
      <path d="M4 20h16M9 20v20" opacity=".55" />
      <circle cx="28" cy="8" r="4" fill={R} />
      <path d="M28 12v16l-2 12M24 40h4M28 28l6 4-1 5" />
      <path d="M28 16l-9 4" />
      <path d="M38 36l2 2M38 40l2-2" opacity=".5" />
    </>
  ),
  "figura-tandem": (
    <>
      <path d="M4 20h16M9 20v20" opacity=".55" />
      <circle cx="28" cy="8" r="4" fill={R} />
      <path d="M28 12v16l-5 12M28 28l5 12M20 40h4M31 40h5" />
      <path d="M28 16l-9 4" />
    </>
  ),
  "figura-camina": (
    <>
      <circle cx="22" cy="8" r="4" fill={R} />
      <path d="M22 12l1 16-6 12M23 28l6 11M14 40h4M28 39h4" />
      <path d="M22 16l-6 7M22 16l7 5" />
      <path d="M36 40l3-7 3 7z" fill={R} />
      <path d="M33 30l2-5 2 5z" fill={R} opacity=".7" />
    </>
  ),
  "figura-lado": (
    <>
      <path d="M4 20h16M9 20v20" opacity=".55" />
      <circle cx="27" cy="8" r="4" fill={R} />
      <path d="M27 12v16l-2 12M23 40h4M27 28l9 9M35 39l3-2" />
      <path d="M27 16l-8 4" />
      <path d="M24 33c3 2 7 2 10 0" stroke="#c0664f" />
    </>
  ),
  "figura-pelota": (
    <>
      <path d="M4 20h16M9 20v20" opacity=".55" />
      <circle cx="26" cy="8" r="4" fill={R} />
      <path d="M26 12v16l-1 12M22 40h4M26 28l6 5 2 3" />
      <path d="M26 16l-7 4" />
      <circle cx="38" cy="38" r="4" fill={R} />
    </>
  ),
  escalon: (
    <>
      <path d="M6 40V30h18v-8h18v18z" fill={R} />
      <path d="M8 34h14M26 26h14" opacity=".5" />
    </>
  ),
  banda: (
    <>
      <path d="M10 24c0-7 6-12 14-12s14 5 14 12-6 12-14 12-14-5-14-12z" fill="none" stroke="#c0664f" strokeWidth="4" />
      <path d="M17 24c0-4 3-6 7-6s7 2 7 6-3 6-7 6-7-2-7-6z" opacity=".25" />
    </>
  ),
  pelota: (
    <>
      <circle cx="24" cy="24" r="15" fill={R} />
      <path d="M11 18c8 4 18 4 26 0M11 30c8-4 18-4 26 0M24 9v30" opacity=".55" />
    </>
  ),
  marcas: (
    <>
      <path d="M8 38l5-14 5 14zM30 38l5-14 5 14z" fill={R} />
      <path d="M6 38h14M28 38h14M20 30c2-6 6-8 10-8" strokeDasharray="2 4" />
    </>
  ),
  volumen: (
    <>
      <path d="M8 19v10h7l9 8V11l-9 8z" fill={R} />
      <path d="M30 18a8 8 0 0 1 0 12M35 13a15 15 0 0 1 0 22" />
    </>
  ),
  lupa: (
    <>
      <circle cx="20" cy="20" r="12" fill={R} />
      <circle cx="20" cy="20" r="7" fill={B} opacity=".7" stroke="none" />
      <path d="M29 29l11 11" strokeWidth="4" />
    </>
  ),
  cajas: (
    <>
      <rect x="6" y="22" width="16" height="16" rx="2" fill={R} />
      <rect x="26" y="22" width="16" height="16" rx="2" fill={B} />
      <rect x="16" y="6" width="16" height="14" rx="2" fill={R} opacity=".6" />
      <path d="M11 28h6M31 28h6" />
    </>
  ),
  sol: (
    <>
      <circle cx="24" cy="24" r="9" fill={R} />
      <path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5L37 37M37 11l-3.5 3.5M14.5 33.5L11 37" />
    </>
  ),
  luna: <path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z" fill={R} />,
  libreta: (
    <>
      <rect x="11" y="6" width="26" height="36" rx="3" fill={R} />
      <path d="M17 6v36M22 15h10M22 21h10M22 27h7" />
      <path d="M8 12h6M8 20h6M8 28h6M8 36h6" />
    </>
  ),
  nota: (
    <>
      <path d="M9 9h30v20l-10 10H9z" fill={R} />
      <path d="M29 39V29h10M15 17h18M15 23h12" />
    </>
  ),
  bandeja: (
    <>
      <path d="M5 28h38l-4 9H9z" fill={R} />
      <circle cx="18" cy="22" r="5" fill={B} />
      <circle cx="30" cy="22" r="5" fill={B} />
      <path d="M23 22h2M13 22l-3-1M35 22l3-1" />
    </>
  ),
  control: (
    <>
      <rect x="16" y="5" width="16" height="38" rx="5" fill={R} />
      <circle cx="24" cy="13" r="3" fill={B} />
      <path d="M20 22h2M26 22h2M20 28h2M26 28h2M20 34h2M26 34h2" strokeWidth="3" />
    </>
  ),
  periodico: (
    <>
      <path d="M8 9h28v30H12a4 4 0 0 1-4-4z" fill={R} />
      <path d="M36 15h4v20a4 4 0 0 1-4 4" />
      <rect x="13" y="14" width="10" height="9" fill={B} />
      <path d="M27 15h5M27 21h5M13 28h19M13 33h19" />
    </>
  ),
  libro: (
    <>
      <path d="M24 12c-5-3-11-4-17-3v28c6-1 12 0 17 3 5-3 11-4 17-3V9c-6-1-12 0-17 3z" fill={R} />
      <path d="M24 12v28" />
    </>
  ),
  oreja: (
    <>
      <path d="M16 20a10 10 0 0 1 20 0c0 7-6 8-6 14a6 6 0 0 1-11 3" fill={R} />
      <path d="M22 20a4 4 0 0 1 8 0c0 3-3 4-3 6" />
      <path d="M40 16a4 4 0 0 1 0 8M43 12a10 10 0 0 1 0 16" opacity=".6" />
    </>
  ),
  plato: (
    <>
      <ellipse cx="24" cy="26" rx="16" ry="12" fill={R} />
      <ellipse cx="24" cy="26" rx="9" ry="6" fill={B} />
      <path d="M4 14v10M7 14v10M4 19h3M5.5 24v14M44 14c-3 2-3 8 0 10v14" />
    </>
  ),
  servilleta: (
    <>
      <path d="M10 10h28v28H10z" fill={R} />
      <path d="M10 10l28 28M24 10v14" opacity=".55" />
    </>
  ),
  vaso: (
    <>
      <path d="M13 8h22l-3 32H16z" fill={B} />
      <path d="M14.5 20h19l-1.5 20H16z" fill={R} stroke="none" />
    </>
  ),
  foto: (
    <>
      <rect x="7" y="9" width="34" height="30" rx="3" fill={B} />
      <circle cx="24" cy="21" r="6" fill={R} />
      <path d="M13 39c1-6 5-9 11-9s10 3 11 9" fill={R} />
    </>
  ),
  flor: (
    <>
      <path d="M24 26v16M24 35c-5-4-10-3-11 0 4 3 8 3 11 0z" fill={R} />
      <circle cx="24" cy="9" r="5" fill={R} />
      <circle cx="31" cy="14.5" r="5" fill={R} />
      <circle cx="28" cy="23" r="5" fill={R} />
      <circle cx="20" cy="23" r="5" fill={R} />
      <circle cx="17" cy="14.5" r="5" fill={R} />
      <circle cx="24" cy="17" r="4.5" fill="#f4c372" />
    </>
  ),
  cadena: (
    <>
      <rect x="5" y="17" width="18" height="14" rx="7" fill={R} />
      <rect x="25" y="17" width="18" height="14" rx="7" fill="none" />
      <path d="M18 24h12" strokeWidth="3" />
    </>
  ),
  tenedor: (
    <>
      <path d="M17 6v10a5 5 0 0 0 10 0V6M22 6v10M22 21v21" />
      <path d="M17 16a5 5 0 0 0 10 0" fill={R} />
      <path d="M33 6c4 3 5 10 2 14v22" opacity=".5" />
    </>
  ),
  batidor: (
    <>
      <path d="M24 30v13" strokeWidth="3.4" />
      <path d="M24 30c-8-4-10-16-5-22 3-3 7-3 10 0 5 6 3 18-5 22z" fill={R} />
      <path d="M24 30c-3-6-3-16 0-23M24 30c3-6 3-16 0-23" />
    </>
  ),
  manta: (
    <>
      <path d="M7 12h34v22c-4 3-8 3-12 0-4 3-8 3-12 0-4 3-7 3-10 0z" fill={R} />
      <path d="M7 20h34M7 26h34" opacity=".45" />
    </>
  ),
  senalar: (
    <>
      <path d="M8 19h9l3-3h18a3 3 0 0 1 0 6H26v3h1a3 3 0 0 1 0 6h-1a3 3 0 0 1 0 6H16c-5 0-8-3-8-7z" fill={R} />
      <path d="M26 28h-5M26 34h-5" />
    </>
  ),
  lapiz: (
    <>
      <path d="M32 7l9 9-23 23-11 2 2-11z" fill={R} />
      <path d="M28 11l9 9M9 30l9 9" />
    </>
  ),
  lista: (
    <>
      <rect x="9" y="6" width="30" height="36" rx="3" fill={B} />
      <rect x="14" y="13" width="7" height="7" rx="1.5" fill={R} />
      <path d="M15.5 16.5l1.5 1.5 3-3.5M26 17h8M14 26h7M26 29h8M14 33h7" />
      <rect x="14" y="26" width="7" height="7" rx="1.5" />
    </>
  ),
  perro: (
    <>
      <path d="M10 24c-3-1-4-4-3-7" />
      <rect x="9" y="21" width="24" height="11" rx="5.5" fill={R} />
      <circle cx="35" cy="18" r="6.5" fill={R} />
      <path d="M31 12c-4 0-5 5-2 8" fill={R} />
      <path d="M14 32v8M28 32v8" />
      <circle cx="37" cy="17" r="0.6" strokeWidth="2.6" />
      <circle cx="41.5" cy="19.5" r="0.6" strokeWidth="2.6" />
    </>
  ),
  fruta: (
    <>
      <path d="M24 14c-8-4-16 1-16 10 0 9 7 17 16 15 9 2 16-6 16-15 0-9-8-14-16-10z" fill={R} />
      <path d="M24 14c0-4 1-6 4-8M26 9c4-2 8-1 9 2-4 2-7 1-9-2z" />
    </>
  ),
  musica: (
    <>
      <path d="M18 34V10l20-4v24" />
      <ellipse cx="13" cy="34" rx="6" ry="5" fill={R} />
      <ellipse cx="33" cy="30" rx="6" ry="5" fill={R} />
      <path d="M18 16l20-4" />
    </>
  ),
  pescado: (
    <>
      <path d="M6 24c6-9 18-11 28-4l8-6v20l-8-6c-10 7-22 5-28-4z" fill={R} />
      <circle cx="14" cy="22" r="0.6" strokeWidth="3" />
      <path d="M22 18c2 4 2 8 0 12" opacity=".5" />
    </>
  ),
  lata: (
    <>
      <rect x="6" y="15" width="36" height="20" rx="6" fill={R} />
      <path d="M6 21h36M6 29h36" opacity=".45" />
      <path d="M16 25c3-3 7-3 10 0-3 3-7 3-10 0zM26 25l4-3v6z" fill={B} />
    </>
  ),
  nuez: (
    <>
      <path d="M24 7c-9 0-14 7-14 16 0 10 6 18 14 18s14-8 14-18c0-9-5-16-14-16z" fill={R} />
      <path d="M24 7v34M17 15c3 2 3 6 0 8M31 15c-3 2-3 6 0 8M17 29c3 2 3 6 0 7M31 29c-3 2-3 6 0 7" opacity=".55" />
    </>
  ),
  etiqueta: (
    <>
      <rect x="10" y="6" width="28" height="36" rx="3" fill={B} />
      <path d="M10 6h28v9H10z" fill={R} />
      <path d="M15 21h18M15 27h12M15 33h18" />
      <path d="M33 26h0" strokeWidth="3" />
    </>
  ),
  frijol: (
    <>
      <path d="M12 26c-3-7 3-14 10-12 4 1 5 4 9 3 6-1 10 5 7 11-3 7-12 9-18 7-4-1-7-4-8-9z" fill={R} />
      <path d="M20 22c2-2 6-2 8 0" opacity=".55" />
    </>
  ),
  aceite: (
    <>
      <path d="M21 4h6v6c4 2 7 6 7 11v17a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V21c0-5 3-9 7-11z" fill={R} />
      <path d="M24 24c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z" fill={B} />
    </>
  ),
  limon: (
    <>
      <path d="M8 24c2-9 9-14 16-14s14 5 16 14c-2 9-9 14-16 14S10 33 8 24z" fill={R} />
      <path d="M8 24l-3 0M40 24h3" />
      <path d="M17 20c2-2 5-3 8-3" opacity=".55" />
    </>
  ),
  pollo: (
    <>
      <path d="M30 8c6 0 10 5 9 11-1 7-9 9-14 13l-6 6-4-4 6-6c4-5 6-13 9-20z" fill={R} />
      <path d="M15 34l-6 2 2 2-2 2 4 1 2-4" />
    </>
  ),
  jarra: (
    <>
      <path d="M12 8h20l2 6v24a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill={B} />
      <path d="M13 20h20v18a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4z" fill={R} stroke="none" />
      <path d="M34 16h3a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-3M12 8h20l2 6v24a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" />
      <circle cx="20" cy="28" r="3" fill={B} opacity=".8" />
    </>
  ),
  frasco: (
    <>
      <rect x="14" y="6" width="20" height="6" rx="2" fill={R} />
      <path d="M12 16a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill={B} />
      <path d="M12 24h24v14a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill={R} opacity=".7" />
    </>
  ),
  cebolla: (
    <>
      <path d="M24 12c-10 4-15 10-15 17a15 12 0 0 0 30 0c0-7-5-13-15-17z" fill={R} />
      <path d="M24 12V5M21 7l3-2 3 2M24 18c-4 4-5 9-4 14M24 18c4 4 5 9 4 14" opacity=".6" />
    </>
  ),
  aguacate: (
    <>
      <path d="M24 5c-6 0-9 9-12 16-3 8 0 21 12 21s15-13 12-21C33 14 30 5 24 5z" fill={R} />
      <circle cx="24" cy="29" r="6" fill="#a87d4f" stroke="none" />
      <circle cx="24" cy="29" r="6" />
    </>
  ),
  platano: (
    <>
      <path d="M8 16c4 14 16 22 32 18-2-3-6-4-10-5-9-2-14-7-18-15z" fill={R} />
      <path d="M8 16l-2-4M40 34l3 0" />
    </>
  ),
  queso: (
    <>
      <path d="M6 22l30-12 6 12v16H6z" fill={R} />
      <path d="M6 22h36" />
      <circle cx="16" cy="30" r="3" fill={B} />
      <circle cx="30" cy="31" r="2.5" fill={B} />
    </>
  ),
  tuberculo: (
    <>
      <path d="M8 30c-2-8 6-16 16-18 10-2 18 2 17 9-1 8-10 14-20 15-6 1-12-1-13-6z" fill={R} />
      <path d="M18 22l1 1M28 18l1 1M30 28l1 1M20 31l1 1" strokeWidth="3" />
    </>
  ),
  fresa: (
    <>
      <path d="M24 16c-9-3-17 2-15 10 2 8 9 14 15 16 6-2 13-8 15-16 2-8-6-13-15-10z" fill="#f0a08c" />
      <path d="M17 12c3 0 5 2 7 4 2-2 4-4 7-4-1 3-3 5-7 5s-6-2-7-5zM24 16V8" />
      <path d="M18 25h0M24 30h0M30 25h0M21 35h0M27 35h0" strokeWidth="2.6" />
    </>
  ),
  yogur: (
    <>
      <path d="M11 14h26l-3 26H14z" fill={B} />
      <path d="M12.5 24h23l-1.6 16H14z" fill={R} stroke="none" />
      <path d="M11 14h26l-3 26H14zM9 10h30v4H9z" />
    </>
  ),
  chile: (
    <>
      <path d="M14 14c-4 4-5 14 2 21 6 6 16 7 22 5-8-3-11-8-12-14-1-5-1-9-4-12-2-2-6-2-8 0z" fill="#e2582a" opacity=".85" />
      <path d="M17 12c0-4 3-6 6-6" />
    </>
  ),
  zanahoria: (
    <>
      <path d="M34 14L10 40c-2 1-3 0-2-2l24-26z" fill="#f2a253" />
      <path d="M34 14c2-5 6-7 9-6M34 14c1-6-1-9-4-10M34 14c5-1 8 1 9 4" />
      <path d="M22 27l3 3M17 33l2 2" opacity=".55" />
    </>
  ),
  palmas: (
    <>
      <path d="M14 34l-4-14a2.5 2.5 0 0 1 5-1l3 8-2-12a2.5 2.5 0 0 1 5-1l2 10 1-12a2.5 2.5 0 0 1 5 0l-1 14 3-6a2.5 2.5 0 0 1 4 2l-5 12c-2 5-6 7-11 6-3-1-5-4-5-6z" fill={R} />
      <path d="M8 10l3 3M24 4v4M38 9l-3 3" />
    </>
  ),
  tambor: (
    <>
      <ellipse cx="24" cy="18" rx="15" ry="6" fill={B} />
      <path d="M9 18v14c0 4 7 7 15 7s15-3 15-7V18" fill={R} />
      <ellipse cx="24" cy="18" rx="15" ry="6" />
      <path d="M9 22l8 13M17 23l7 14M39 22l-8 13M31 23l-7 14" opacity=".5" />
      <path d="M14 6l8 9M36 5l-7 10" />
    </>
  ),
  maracas: (
    <>
      <ellipse cx="17" cy="15" rx="7" ry="9" fill={R} />
      <path d="M17 24v18" strokeWidth="3.4" />
      <ellipse cx="33" cy="17" rx="6" ry="8" fill={R} opacity=".7" transform="rotate(20 33 17)" />
      <path d="M30 25l-4 15" strokeWidth="3.4" />
      <path d="M14 13h0M19 17h0M15 19h0" strokeWidth="2.6" />
    </>
  ),
  nariz: (
    <>
      <path d="M24 6c-2 8-8 16-8 22a6 6 0 0 0 5 6c1 2 5 2 6 0a6 6 0 0 0 5-6" fill={R} />
      <path d="M21 30c1 1 2 1 3 0M27 30c1 1 2 1 3 0" />
      <path d="M36 12c3 1 5 3 5 6M38 6c5 2 7 6 7 10" opacity=".55" />
    </>
  ),
  torta: (
    <>
      <path d="M8 26h32v14H8z" fill={R} />
      <path d="M8 31c4 3 8 3 11 0 3 3 7 3 10 0 3 3 8 3 11 0" />
      <path d="M17 26v-6M24 26v-6M31 26v-6" />
      <path d="M17 14c-1 1-1 3 0 3s1-2 0-3zM24 14c-1 1-1 3 0 3s1-2 0-3zM31 14c-1 1-1 3 0 3s1-2 0-3z" fill="#f4c372" />
    </>
  ),
  martillo: (
    <>
      <path d="M10 10l10-4 8 8-4 4z" fill={R} />
      <path d="M22 16l18 18a3 3 0 0 1-4 4L18 20" strokeWidth="3" />
    </>
  ),
  hilo: (
    <>
      <path d="M14 8h20v6H14zM14 34h20v6H14z" fill={R} />
      <path d="M16 14h16v20H16z" fill={B} />
      <path d="M16 18h16M16 22h16M16 26h16M16 30h16" opacity=".55" />
      <path d="M34 22c4 0 6 3 8 8" />
    </>
  ),
  casa: (
    <>
      <path d="M8 22L24 9l16 13" />
      <path d="M12 19v21h24V19" fill={R} />
      <path d="M21 40v-9h6v9" fill={B} />
    </>
  ),
  parque: (
    <>
      <circle cx="18" cy="17" r="10" fill={R} />
      <path d="M18 27v13M10 40h30M28 34h12M30 34v6M38 34v6" />
      <circle cx="35" cy="12" r="3.5" opacity=".6" />
    </>
  ),
  iglesia: (
    <>
      <path d="M24 5v8M21 8h6" />
      <path d="M17 22l7-9 7 9" />
      <path d="M17 22h14v18H17z" fill={R} />
      <path d="M9 40V28l8-6M39 40V28l-8-6M6 40h36" />
      <path d="M22 40v-7a2 2 0 0 1 4 0v7" fill={B} />
    </>
  ),
  mercado: (
    <>
      <path d="M8 18h32l-3-9H11z" fill={R} />
      <path d="M8 18c0 3 3 4 5.3 4s5.4-1 5.4-4c0 3 3 4 5.3 4s5.3-1 5.3-4c0 3 3 4 5.4 4S40 21 40 18" />
      <path d="M11 22v18h26V22M20 40v-9h8v9" />
    </>
  ),
  doctor: (
    <>
      <rect x="9" y="13" width="30" height="24" rx="4" fill={R} />
      <path d="M19 13V9h10v4M24 19v12M18 25h12" />
    </>
  ),
  otra: (
    <>
      <circle cx="24" cy="24" r="15" fill={R} />
      <path d="M24 17v14M17 24h14" />
    </>
  ),
  llaves: (
    <>
      <circle cx="17" cy="17" r="8" fill={R} />
      <circle cx="17" cy="17" r="2.5" fill={B} />
      <path d="M22.5 22.5L38 38M32 32l-3 3M36 36l-3 3" />
    </>
  ),
  sombrilla: (
    <>
      <path d="M6 24a18 18 0 0 1 36 0c-2-2-4-2-6 0-2-2-4-2-6 0-2-2-4-2-6 0-2-2-4-2-6 0-2-2-4-2-6 0-2-2-4-2-6 0z" fill={R} />
      <path d="M24 6v-1M24 24v13a3 3 0 0 0 6 0" />
    </>
  ),
  cedula: (
    <>
      <rect x="6" y="12" width="36" height="24" rx="3" fill={R} />
      <circle cx="16" cy="22" r="4" fill={B} />
      <path d="M10 31c1-3 3-4 6-4s5 1 6 4M27 20h10M27 25h10M27 30h6" />
    </>
  ),
  plata: (
    <>
      <rect x="6" y="14" width="36" height="20" rx="3" fill={R} />
      <circle cx="24" cy="24" r="5" fill={B} />
      <path d="M11 19v10M37 19v10" />
    </>
  ),
  pastillas: (
    <>
      <rect x="8" y="16" width="22" height="11" rx="5.5" transform="rotate(-30 19 21.5)" fill={R} />
      <path d="M15 17l6 10" />
      <circle cx="34" cy="32" r="7" fill={B} />
      <path d="M29 37l10-10" />
    </>
  ),
  celular: (
    <>
      <rect x="14" y="6" width="20" height="36" rx="4" fill={R} />
      <rect x="17" y="11" width="14" height="22" rx="1.5" fill={B} />
      <path d="M22 38h4" />
    </>
  ),
  sueter: (
    <path d="M18 8l-10 6-2 14 6 1 1-7v18h22V22l1 7 6-1-2-14-10-6c-1 3-3 4-6 4s-5-1-6-4z" fill={R} />
  ),
  lentes: (
    <>
      <circle cx="14" cy="26" r="7" fill={R} />
      <circle cx="34" cy="26" r="7" fill={R} />
      <path d="M21 26c1-2 5-2 6 0M7 26l-2-8M41 26l2-8" />
    </>
  ),
  regalo: (
    <>
      <rect x="9" y="20" width="30" height="20" rx="2" fill={R} />
      <path d="M7 14h34v6H7zM24 14v26M24 14c-3-6-11-6-9-1 1 2 5 1 9 1zM24 14c3-6 11-6 9-1-1 2-5 1-9 1z" />
    </>
  ),
  bolso: (
    <>
      <path d="M9 18h30l-2 22H11z" fill={R} />
      <path d="M17 18v-4a7 7 0 0 1 14 0v4" />
    </>
  ),
  botella: (
    <>
      <path d="M20 6h8v5c3 2 5 5 5 9v18a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V20c0-4 2-7 5-9z" fill={R} />
      <path d="M15 24h18" />
    </>
  ),
  sombrero: (
    <>
      <ellipse cx="24" cy="31" rx="19" ry="6" fill={R} />
      <path d="M15 30c0-11 3-16 9-16s9 5 9 16" fill={R} />
      <path d="M15 26c6 2 12 2 18 0" />
    </>
  ),
  pan: (
    <>
      <path d="M8 26c0-8 7-13 16-13s16 5 16 13v8a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill={R} />
      <path d="M17 19l3 5M24 18v6M31 19l-3 5" />
    </>
  ),
  biblia: (
    <>
      <path d="M11 8h24a2 2 0 0 1 2 2v30H13a2 2 0 0 1-2-2z" fill={R} />
      <path d="M11 36a2 2 0 0 1 2-2h24M24 14v12M19 18h10" />
    </>
  ),
  ropa: (
    <>
      <path d="M17 8l-9 5 3 7 4-2v22h18V18l4 2 3-7-9-5c0 3-3 5-7 5s-7-2-7-5z" fill={R} />
      <path d="M24 13v27" opacity=".45" />
    </>
  ),
  peine: (
    <>
      <rect x="7" y="14" width="34" height="8" rx="3" fill={R} />
      <path d="M11 22v12M15 22v12M19 22v12M23 22v12M27 22v12M31 22v12M35 22v12" />
    </>
  ),
  telefono: (
    <path d="M14 7l6 1 2 8-4 3c2 5 6 9 11 11l3-4 8 2 1 6c0 3-2 6-6 6C21 40 8 27 8 13c0-4 3-6 6-6z" fill={R} />
  ),
  puerta: (
    <>
      <path d="M12 41V8h22v33" fill={R} />
      <path d="M7 41h34" />
      <circle cx="29" cy="25" r="1" strokeWidth="3" />
    </>
  ),
  bus: (
    <>
      <rect x="8" y="8" width="32" height="28" rx="5" fill={R} />
      <path d="M8 22h32M12 13h24" />
      <rect x="12" y="13" width="24" height="9" fill={B} />
      <path d="M14 36v4M34 36v4" />
      <circle cx="15" cy="29" r="1" strokeWidth="3" />
      <circle cx="33" cy="29" r="1" strokeWidth="3" />
    </>
  ),
  lluvia: (
    <>
      <path d="M13 26a7 7 0 0 1 1-14 10 10 0 0 1 19 2 6 6 0 0 1 1 12z" fill={R} />
      <path d="M16 32l-2 5M24 32l-2 5M32 32l-2 5" />
    </>
  ),
  hoja: (
    <>
      <path d="M38 8C20 8 9 17 9 30c0 4 2 8 4 10 16 0 25-12 25-32z" fill={R} />
      <path d="M13 40c6-10 13-18 21-26" />
    </>
  ),
  acelga: (
    <>
      <path d="M24 6c-9 3-14 11-12 20 1 5 6 8 12 8s11-3 12-8c2-9-3-17-12-20z" fill={R} />
      <path d="M24 10v32" stroke="#c0664f" strokeWidth="3.4" />
      <path d="M24 18l-6-4M24 24l7-5M24 28l-7-4" opacity=".6" />
    </>
  ),
  mostaza: (
    <>
      <path d="M24 6c-5 2-6 5-10 6-3 1-5 4-4 7 1 2-2 4-1 7s4 4 4 7c1 3 5 5 11 5s10-2 11-5c0-3 3-4 4-7s-2-5-1-7c1-3-1-6-4-7-4-1-5-4-10-6z" fill={R} />
      <path d="M24 12v30" />
    </>
  ),
  lechuga: (
    <>
      <path d="M8 26c0-10 7-17 16-17s16 7 16 17c0 8-7 14-16 14S8 34 8 26z" fill={R} />
      <path d="M16 18c3 4 3 10 0 16M24 13v24M32 18c-3 4-3 10 0 16" />
    </>
  ),
  lavar: (
    <>
      <path d="M6 14h16a8 8 0 0 1 8 8v3h-6v-3a2 2 0 0 0-2-2H6z" fill={R} />
      <path d="M14 14V9M10 9h8" />
      <path d="M27 30c-2 3-3 4.5-3 6a3 3 0 0 0 6 0c0-1.5-1-3-3-6z" fill={R} />
      <path d="M20 38c-1.2 1.8-2 2.7-2 3.6a2 2 0 0 0 4 0c0-.9-.8-1.8-2-3.6z" opacity=".6" />
    </>
  ),
  taza: (
    <>
      <path d="M9 16h26v12a10 10 0 0 1-10 10h-6A10 10 0 0 1 9 28z" fill={R} />
      <path d="M35 19h3a4 4 0 0 1 0 8h-4M7 42h30" />
    </>
  ),
  huevo: (
    <>
      <path d="M24 7c-8 0-14 12-14 20a14 14 0 0 0 28 0c0-8-6-20-14-20z" fill={B} />
      <circle cx="24" cy="28" r="6" fill={R} stroke="none" />
    </>
  ),
  sarten: (
    <>
      <ellipse cx="20" cy="26" rx="14" ry="10" fill={R} />
      <path d="M33 22l10-6" strokeWidth="3.4" />
      <path d="M14 24c3-2 6 2 9 0M15 29c3-2 6 2 9 0" opacity=".55" />
    </>
  ),
  sopa: (
    <>
      <path d="M6 22h36a18 18 0 0 1-36 0z" fill={R} />
      <path d="M18 8c-2 3 2 5 0 8M26 6c-2 3 2 5 0 8M34 8c-2 3 2 5 0 8" opacity=".6" />
    </>
  ),
  calendario: (
    <>
      <rect x="7" y="10" width="34" height="30" rx="4" fill={B} />
      <path d="M7 10h34v8H7z" fill={R} />
      <path d="M15 6v8M33 6v8M14 25h4M22 25h4M30 25h4M14 32h4M22 32h4" />
    </>
  ),
  rinon: (
    <>
      <path d="M28 8c-9 0-17 7-17 17s6 15 13 15 9-5 7-10c-1-3 3-4 4-6 3-5 2-16-7-16z" fill={R} />
      <path d="M30 22c-3 0-5 2-5 5" />
    </>
  ),
  cuchara: (
    <>
      <ellipse cx="17" cy="16" rx="8" ry="10" transform="rotate(-35 17 16)" fill={R} />
      <path d="M22 23l17 17" strokeWidth="3.4" />
    </>
  ),
};

export function Icono({ nombre, className = "", relleno }: { nombre: NombreIcono; className?: string; relleno?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={relleno ? ({ "--relleno": relleno } as CSSProperties) : undefined}
    >
      {D[nombre]}
    </svg>
  );
}
