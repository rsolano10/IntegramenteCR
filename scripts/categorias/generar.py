# Genera las ilustraciones por categoría (public/categorias/*.svg), estilo isotipo.
# Uso: python3 scripts/categorias/generar.py public/categorias
import os, sys
OUT = sys.argv[1]
INK="#1f3338"; PAPEL="#f7f4e9"; BEIGE="#ebe6ce"; MOST="#f4d096"; MOSTF="#e0b45f"
VS="#6a969c"; VP="#3f6a70"; TERRA="#e8b5a1"; TERRAF="#c0664f"; SAGE="#a9c49f"

def gota(x, y, s, rot=0, fill="#fff", op=1, extra=""):
    # Gota del isotipo: tres esquinas redondas y una en punta (abajo a la derecha).
    r = s/2
    d = f"M{x+r},{y} A{r},{r} 0 0 1 {x+s},{y+r} L{x+s},{y+s} L{x+r},{y+s} A{r},{r} 0 0 1 {x},{y+r} A{r},{r} 0 0 1 {x+r},{y} Z"
    cx, cy = x+r, y+r
    return f'<path d="{d}" fill="{fill}" opacity="{op}" transform="rotate({rot} {cx} {cy})" {extra}/>'

def svg(nombre, claro, fuerte, cuerpo):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="{nombre}">
<defs>
<linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{claro}"/><stop offset="1" stop-color="{fuerte}"/></linearGradient>
<radialGradient id="luz" cx="0.22" cy="0.18" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="grano" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.2  0 0 0 0 0.22  0 0 0 0.09 0"/></filter>
</defs>
<rect width="240" height="240" fill="url(#f)"/>
<rect width="240" height="240" fill="url(#luz)"/>
{cuerpo}
<rect width="240" height="240" filter="url(#grano)"/>
</svg>'''

def escenario(op=0.36):
    # Gota grande y suave detrás del motivo, con la punta hacia abajo.
    return gota(48, 30, 144, 45, "#fff", op)

def petalo(px, py, s, ang, fill):
    # Gota cuya punta queda en (px, py); el cuerpo sale hacia «ang» grados.
    x, y = px - s, py - s
    return f'<g transform="rotate({ang - 225} {px} {py})">{gota(x, y, s, 0, fill)}</g>'

def mezcla(a, b, t):
    a=[int(a[i:i+2],16) for i in (1,3,5)]; b=[int(b[i:i+2],16) for i in (1,3,5)]
    return "#"+"".join(f"{round(x+(y-x)*t):02x}" for x,y in zip(a,b))

L = {}

# Atención y memoria: un foco (la idea, la atención encendida) con las tres
# gotas del isotipo adentro.
L["cognicion"] = ("Atención y memoria", "#d5e0e7", mezcla("#c3d2dc","#5b7489",0.45), f'''
{escenario()}
<g stroke="{MOST}" stroke-width="7" stroke-linecap="round"><path d="M120 22 V40"/><path d="M58 50 L70 62"/><path d="M182 50 L170 62"/><path d="M36 112 H54"/><path d="M186 112 H204"/></g>
<path d="M120 52 C84 52 60 78 60 110 C60 132 72 146 84 158 C92 166 94 174 94 182 H146 C146 174 148 166 156 158 C168 146 180 132 180 110 C180 78 156 52 120 52 Z" fill="{PAPEL}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<g transform="rotate(-8 120 112)">
{gota(88,80,36,0,"#4f8a91")}
{gota(128,84,30,-80,MOST)}
{gota(92,120,30,100,TERRA)}
</g>
<rect x="94" y="184" width="52" height="12" rx="4" fill="#5b7489" stroke="{INK}" stroke-width="5"/>
<rect x="98" y="198" width="44" height="12" rx="4" fill="#5b7489" stroke="{INK}" stroke-width="5"/>
<path d="M108 212 H132 L126 222 H114 Z" fill="{INK}"/>
''')

# Gerontogimnasia: persona sentada estirando los brazos.
L["gerontogimnasia"] = ("Gerontogimnasia", "#fbe6bb", mezcla("#f4d096","#c99a45",0.55), f'''
{escenario()}
<g stroke="{INK}" stroke-width="7" stroke-linecap="round" fill="none"><path d="M78 118 L78 212"/><path d="M78 162 L160 162"/><path d="M150 162 L150 212"/></g>
<path d="M98 160 C96 132 102 112 118 106 C134 112 140 132 138 160 Z" fill="{VP}"/>
<circle cx="118" cy="86" r="17" fill="{VP}"/>
<g stroke="{VP}" stroke-width="13" stroke-linecap="round" fill="none"><path d="M106 118 L82 70"/><path d="M130 118 L154 70"/><path d="M110 160 L150 168 L150 204"/></g>
<circle cx="80" cy="64" r="9" fill="{MOST}"/><circle cx="156" cy="64" r="9" fill="{MOST}"/>
<g stroke="{PAPEL}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M60 52 C54 60 54 70 58 78"/><path d="M176 52 C182 60 182 70 178 78"/></g>
{gota(176,170,30,180,TERRA)}
''')

# Movimiento: pelota en vuelo con estela.
L["movimiento"] = ("Movimiento", "#fdeccd", mezcla("#fadfa9","#e8b857",0.6), f'''
{escenario()}
<g stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85"><path d="M30 168 C60 150 84 146 104 150" stroke-dasharray="2 16"/><path d="M40 196 C70 180 96 178 116 182" stroke-dasharray="2 16"/></g>
<circle cx="150" cy="118" r="58" fill="{PAPEL}"/>
<path d="M150 60 A58 58 0 0 1 208 118 L150 118 Z" fill="{VS}"/>
<path d="M150 118 L150 176 A58 58 0 0 1 92 118 Z" fill="{TERRAF}"/>
<path d="M92 118 A58 58 0 0 1 150 60 L150 118 Z" fill="{MOST}"/>
<circle cx="150" cy="118" r="58" fill="none" stroke="{INK}" stroke-width="6"/>
<circle cx="150" cy="118" r="9" fill="{INK}"/>
{gota(54,58,28,0,VP)}
''')

# Música: maraca y notas.
L["musica"] = ("Música", "#f2d2c5", mezcla("#e8b5a1","#c0664f",0.55), f'''
{escenario()}
<g transform="rotate(-28 110 140)">
<rect x="104" y="150" width="14" height="70" rx="7" fill="{INK}"/>
<ellipse cx="111" cy="112" rx="40" ry="48" fill="{MOST}"/>
<path d="M76 100 C96 92 126 92 146 100" stroke="{TERRAF}" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M72 122 C94 130 128 130 150 122" stroke="{VP}" stroke-width="8" fill="none" stroke-linecap="round"/>
<ellipse cx="111" cy="112" rx="40" ry="48" fill="none" stroke="{INK}" stroke-width="6"/>
</g>
<g fill="{VP}"><ellipse cx="166" cy="92" rx="14" ry="11" transform="rotate(-20 166 92)"/><ellipse cx="204" cy="80" rx="14" ry="11" transform="rotate(-20 204 80)"/></g>
<path d="M178 90 L178 42 L216 30 L216 78" stroke="{VP}" stroke-width="7" fill="none" stroke-linejoin="round"/>
<path d="M178 42 L216 30 L216 44 L178 56 Z" fill="{VP}"/>
<g stroke="{PAPEL}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M40 70 C30 84 30 100 40 114"/><path d="M58 80 C52 90 52 100 58 108"/></g>
''')

# Reminiscencia: dos fotos con un paisaje y un corazón.
L["reminiscencia"] = ("Reminiscencia", "#f3eddb", mezcla("#ece3c4","#b7a06d",0.55), f'''
{escenario()}
<g transform="rotate(-12 100 120)"><rect x="42" y="56" width="112" height="128" rx="6" fill="{BEIGE}" stroke="{INK}" stroke-width="5"/><rect x="54" y="68" width="88" height="80" fill="{SAGE}"/></g>
<g transform="rotate(8 140 132)">
<rect x="84" y="64" width="116" height="134" rx="6" fill="#fffdf6" stroke="{INK}" stroke-width="5"/>
<rect x="96" y="76" width="92" height="86" fill="#cfe2e3"/>
<circle cx="164" cy="98" r="11" fill="{MOST}"/>
<path d="M96 162 L96 136 C112 122 126 124 140 136 C152 126 170 124 188 140 L188 162 Z" fill="{VS}"/>
<path d="M96 162 L96 150 C120 140 150 142 188 154 L188 162 Z" fill="{VP}"/>
<path d="M142 186 C136 178 124 180 124 188 C124 196 136 200 142 206 C148 200 160 196 160 188 C160 180 148 178 142 186 Z" fill="{TERRAF}" transform="translate(0 -6) scale(1)"/>
</g>
<rect x="118" y="48" width="44" height="16" rx="3" fill="{MOST}" opacity="0.9" transform="rotate(8 140 56)"/>
''')

# Sentidos: flor de gotas con aroma.
petalos = "".join(gota(120-16, 120-62, 32, 225 + k*72, c) for k, c in enumerate([PAPEL, MOST, TERRA, PAPEL, MOST]))
L["sentidos"] = ("Sentidos", "#b6d9dc", mezcla("#89c0c6","#3f6a70",0.55), f'''
{escenario()}
<path d="M120 132 C118 162 114 186 104 214" stroke="{VP}" stroke-width="8" fill="none" stroke-linecap="round"/>
{gota(66,160,44,90,SAGE)}
<g transform="translate(0 -18)">
{"".join(petalo(120, 116, 40, -90 + k*72, c) for k, c in enumerate([PAPEL, MOST, TERRA, PAPEL, MOST]))}
<circle cx="120" cy="116" r="13" fill="{VP}"/><circle cx="116" cy="112" r="4" fill="{MOST}"/>
</g>
<g stroke="{PAPEL}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M178 132 C170 120 186 112 178 100 C170 88 186 80 178 68"/><path d="M200 146 C194 136 206 130 200 120"/></g>
''')

# Nutrición: bol con hojas, fruta y vapor.
L["nutricion"] = ("Nutrición", "#e1ecd3", mezcla("#cfe0b8","#6f8f4e",0.5), f'''
{escenario()}
<g stroke="{PAPEL}" stroke-width="6" stroke-linecap="round" fill="none"><path d="M100 70 C92 58 108 52 100 40"/><path d="M128 66 C120 54 136 48 128 36"/></g>
{gota(118,82,44,200,"#6f8f4e")}
{gota(84,92,40,250,SAGE)}
<circle cx="150" cy="114" r="18" fill="{TERRAF}"/>
{gota(64,108,30,170,MOST)}
<path d="M44 124 L196 124 C196 170 164 200 120 200 C76 200 44 170 44 124 Z" fill="{PAPEL}"/>
<path d="M50 146 C90 154 150 154 190 146" stroke="{TERRAF}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M44 124 L196 124 C196 170 164 200 120 200 C76 200 44 170 44 124 Z" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<rect x="96" y="198" width="48" height="10" rx="5" fill="{INK}"/>
''')

# Bienvenida: el isotipo grande.
L["bienvenida"] = ("Bienvenida", "#9fbfc3", mezcla("#6a969c","#3f6a70",0.5), f'''
<g transform="rotate(-8 120 120)">
{gota(52,52,86,0,"#4f8a91")}
{gota(132,58,74,-80,BEIGE)}
{gota(56,140,66,100,MOST)}
</g>
<circle cx="190" cy="186" r="8" fill="{PAPEL}" opacity="0.8"/>
''')

os.makedirs(OUT, exist_ok=True)
for k, (nombre, claro, fuerte, cuerpo) in L.items():
    open(f"{OUT}/{k}.svg", "w").write(svg(nombre, claro, fuerte, cuerpo))
print("ok", len(L))
