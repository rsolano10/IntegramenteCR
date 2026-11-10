// Figuras SVG dibujadas a mano para las actividades (sin imágenes externas ni
// emojis, que cambian según el dispositivo). Solo colores de la paleta:
// verde profundo para el trazo, mostaza y verde serenidad de relleno.

const TRAZO = "#3f6a70"; // verde profundo
const MOSTAZA = "#f4d096";
const SERENIDAD = "#6a969c";
const BEIGE = "#ebe6ce";

type P = { s: number };
const base = (s: number) => ({ width: s, height: s, viewBox: "0 0 48 48", fill: "none", stroke: TRAZO, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

const DIBUJOS: Record<string, (p: P) => React.ReactElement> = {
  // Objetos
  casa: ({ s }) => (
    <svg {...base(s)}>
      <path d="M8 22 24 9l16 13" />
      <path d="M12 19v20h24V19" fill={BEIGE} />
      <rect x="20" y="27" width="8" height="12" fill={MOSTAZA} />
    </svg>
  ),
  sol: ({ s }) => (
    <svg {...base(s)}>
      <circle cx="24" cy="24" r="9" fill={MOSTAZA} />
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.2 4.2M33.3 33.3l4.2 4.2M37.5 10.5l-4.2 4.2M14.7 33.3l-4.2 4.2" />
    </svg>
  ),
  luna: ({ s }) => (
    <svg {...base(s)}>
      <path d="M31 8a17 17 0 1 0 9 26A14 14 0 0 1 31 8z" fill={MOSTAZA} />
    </svg>
  ),
  taza: ({ s }) => (
    <svg {...base(s)}>
      <path d="M9 18h24v10a10 10 0 0 1-10 10h-4A10 10 0 0 1 9 28z" fill={BEIGE} />
      <path d="M33 21h3a5 5 0 0 1 0 10h-3.5" />
      <path d="M17 7c-2 3 2 4 0 7M24 7c-2 3 2 4 0 7" />
    </svg>
  ),
  llave: ({ s }) => (
    <svg {...base(s)}>
      <circle cx="15" cy="24" r="8" fill={MOSTAZA} />
      <circle cx="15" cy="24" r="2.5" />
      <path d="M23 24h19M36 24v6M41 24v5" />
    </svg>
  ),
  flor: ({ s }) => (
    <svg {...base(s)}>
      <path d="M24 28v16M24 37c-4-4-9-3-10-2 2 3 6 4 10 2z" />
      <circle cx="24" cy="12" r="5" fill={MOSTAZA} />
      <circle cx="16" cy="18" r="5" fill={MOSTAZA} />
      <circle cx="32" cy="18" r="5" fill={MOSTAZA} />
      <circle cx="19" cy="26" r="5" fill={MOSTAZA} />
      <circle cx="29" cy="26" r="5" fill={MOSTAZA} />
      <circle cx="24" cy="20" r="4" fill={SERENIDAD} />
    </svg>
  ),
  arbol: ({ s }) => (
    <svg {...base(s)}>
      <path d="M24 30v13M18 43h12" />
      <circle cx="24" cy="18" r="13" fill={SERENIDAD} />
    </svg>
  ),
  sombrilla: ({ s }) => (
    <svg {...base(s)}>
      <path d="M5 24a19 19 0 0 1 38 0z" fill={MOSTAZA} />
      <path d="M24 24v14a4 4 0 0 1-8 0M24 5v3" />
    </svg>
  ),
  pez: ({ s }) => (
    <svg {...base(s)}>
      <path d="M6 24c6-9 18-11 26 0-8 11-20 9-26 0z" fill={SERENIDAD} />
      <path d="M32 24l10-8v16z" fill={SERENIDAD} />
      <circle cx="14" cy="22" r="1.6" fill={TRAZO} />
    </svg>
  ),
  corazon: ({ s }) => (
    <svg {...base(s)}>
      <path d="M24 41S7 30 7 18a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 12-17 23-17 23z" fill={MOSTAZA} />
    </svg>
  ),
  // Formas (relleno parejo: se comparan por la forma, no por el color)
  circulo: ({ s }) => (
    <svg {...base(s)}>
      <circle cx="24" cy="24" r="16" fill={SERENIDAD} />
    </svg>
  ),
  cuadrado: ({ s }) => (
    <svg {...base(s)}>
      <rect x="9" y="9" width="30" height="30" rx="2" fill={SERENIDAD} />
    </svg>
  ),
  rombo: ({ s }) => (
    <svg {...base(s)}>
      <path d="M24 4 44 24 24 44 4 24z" fill={SERENIDAD} />
    </svg>
  ),
  triangulo: ({ s }) => (
    <svg {...base(s)}>
      <path d="M24 7 43 40H5z" fill={SERENIDAD} />
    </svg>
  ),
  estrella: ({ s }) => (
    <svg {...base(s)}>
      <path d="m24 5 5.6 12 13 1.4-9.8 8.8 2.8 12.8L24 33.4 12.4 40l2.8-12.8-9.8-8.8 13-1.4z" fill={SERENIDAD} />
    </svg>
  ),
  cruz: ({ s }) => (
    <svg {...base(s)}>
      <path d="M18 6h12v12h12v12H30v12H18V30H6V18h12z" fill={SERENIDAD} />
    </svg>
  ),
  "flecha-arriba": ({ s }) => <Flecha s={s} giro={0} />,
  "flecha-derecha": ({ s }) => <Flecha s={s} giro={90} />,
  "flecha-abajo": ({ s }) => <Flecha s={s} giro={180} />,
  "flecha-izquierda": ({ s }) => <Flecha s={s} giro={270} />,
  // La mesa
  cuchara: ({ s }) => (
    <svg {...base(s)}>
      <ellipse cx="24" cy="13" rx="7" ry="9" fill={BEIGE} />
      <path d="M24 22v22" strokeWidth="3.5" />
    </svg>
  ),
  tenedor: ({ s }) => (
    <svg {...base(s)}>
      <path d="M16 4v10a8 8 0 0 0 16 0V4M24 4v14M24 22v22" />
      <path d="M24 22v22" strokeWidth="3.5" />
    </svg>
  ),
  plato: ({ s }) => (
    <svg {...base(s)}>
      <circle cx="24" cy="24" r="19" fill={BEIGE} />
      <circle cx="24" cy="24" r="11" />
    </svg>
  ),
  vaso: ({ s }) => (
    <svg {...base(s)}>
      <path d="M11 6h26l-4 36H15z" fill="#fff" />
      <path d="M13.5 20h21l-2.4 22H15.9z" fill={SERENIDAD} opacity="0.55" />
    </svg>
  ),
  // Frutas
  manzana: ({ s }) => (
    <svg {...base(s)}>
      <path d="M24 15c-6-5-17-2-16 10 1 10 8 18 13 17 2 0 2-1 3-1s1 1 3 1c5 1 12-7 13-17 1-12-10-15-16-10z" fill={MOSTAZA} />
      <path d="M24 15c0-4 1-7 4-9M26 10c3-3 7-3 9-2-2 3-6 4-9 2z" />
    </svg>
  ),
  banano: ({ s }) => (
    <svg {...base(s)}>
      <path d="M9 13c2 15 14 25 30 22 2 0 3-2 1-3-12 0-21-8-24-21-1-3-7-2-7 2z" fill={MOSTAZA} />
      <path d="M9 13l-2-4" />
    </svg>
  ),
  naranja: ({ s }) => (
    <svg {...base(s)}>
      <circle cx="24" cy="26" r="16" fill={MOSTAZA} />
      <path d="M24 10V6M24 10c3-4 8-4 10-3-2 3-6 5-10 3z" fill={SERENIDAD} />
      <circle cx="19" cy="22" r="1" fill={TRAZO} />
      <circle cx="28" cy="30" r="1" fill={TRAZO} />
    </svg>
  ),
  uvas: ({ s }) => (
    <svg {...base(s)} strokeWidth={2.2}>
      <path d="M24 4v7M24 8c3-3 7-3 9-1" />
      {[
        [17, 15],
        [24, 15],
        [31, 15],
        [20.5, 22],
        [27.5, 22],
        [17, 29],
        [24, 29],
        [31, 29],
        [20.5, 36],
        [27.5, 36],
        [24, 42],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={SERENIDAD} />
      ))}
    </svg>
  ),
};

function Flecha({ s, giro }: { s: number; giro: number }) {
  return (
    <svg {...base(s)}>
      <g transform={`rotate(${giro} 24 24)`}>
        <path d="M24 5 40 22H30v20H18V22H8z" fill={SERENIDAD} />
      </g>
    </svg>
  );
}

export function Figura({ id, size = 48, className = "" }: { id: string; size?: number; className?: string }) {
  const D = DIBUJOS[id];
  return <span className={`inline-flex shrink-0 ${className}`} aria-hidden="true">{D ? <D s={size} /> : null}</span>;
}

