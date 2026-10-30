# IntegraMente en Casa: carga de recursos y correcciones (oct 2026)

Especificación para implementar en el repositorio de **IntegraMente en Casa** (web app tipo calendario, app.integramentecr.com). Contiene cuatro bloques de trabajo:

1. Gerontogimnasia (GER-001 a GER-010) con sus videos
2. Nutrición (PRE-xxx)
3. Recursos cognitivos (Actividades 01 a 16, con huecos)
4. Revisión de la landing page

**Decisión del dueño del producto:** todo el contenido de este documento está validado manualmente y se publica ahora. Ningún recurso queda bloqueado por estado clínico. Las inconsistencias de la sección 6 se registran para revisión posterior del equipo y no bloquean el deploy.

## 0. Antes de empezar

### 0.1 Fuentes de contenido

Los textos completos ya están en el repo:

```
docs/content-source/
  gerontogimnasia-manual-2026-10-23.txt
  nutricion-recursos.txt
  cognitivo-manual.txt
  landing-revision.txt
```

Verifica que existan y léelos completos antes de empezar. No reconstruyas textos clínicos de memoria ni los resumas.

### 0.2 Reglas de trabajo

- Explora primero el repo: stack, modelo de datos actual de actividades/recursos, cómo se asignan al calendario, cómo se sirven hoy los videos (si hay), i18n, seeds y tests. Adapta esta especificación a lo que exista; no dupliques modelos.
- Usa plan mode: presenta el plan (archivos a tocar, migraciones, esquema, estrategia de video) antes de editar.
- **El texto clínico se transcribe literal.** Solo se aplican las correcciones de la sección 5. No unifiques registro (vos/usted/ustedes): se respeta el de cada documento fuente.
- No inventes recursos para los códigos faltantes (ver 3.1 y 4.1).
- Separa siempre contenido **visible para la familia** de contenido **interno del equipo**. Lo interno nunca debe llegar al cliente (ni en el payload de la API, no solo ocultarlo en la UI).
- Commits pequeños por bloque (modelo, GER, videos, PRE, COG, landing).

## 1. Modelo de datos común

Propuesta; ajústala al esquema existente.

```ts
type CognitiveStage =
  | "preventivo"            // envejecimiento normal
  | "dcl"                   // deterioro cognitivo leve
  | "demencia_leve"
  | "demencia_moderada"
  | "demencia_severa";      // "avanzada" en el manual de gerontogimnasia

type PhysicalRoute = "verde" | "amarillo" | "rojo";

type SupervisionLevel =
  | "autonomia_comprobada"
  | "guia_verbal"
  | "acompanamiento_presencial_continuo"
  | "ayuda_fisica_entrenada";

type ClinicalStatus = "aprobado" | "en_revision" | "bloqueado";

interface Resource {
  code: string;                       // GER-001, PRE-004, COG-001
  domain: "gerontogimnasia" | "nutricion" | "cognitivo";
  category?: string;                  // p.ej. "reminiscencia", "lenguaje"
  title: string;
  audience: CognitiveStage[];
  physicalRoutes?: PhysicalRoute[];   // solo GER
  public: {                           // lo que ve la familia
    paraQuien: string;
    sabiasQue?: string;
    materiales?: string;
    actividad: string;                // pasos, markdown
    dosis?: string;                   // GER: "Dosis propuesta del terapeuta"
    adaptacion?: string | Partial<Record<CognitiveStage, string>>;
    tenEnCuenta?: string;
    paraCerrar?: string;
    cards?: { inicio: string; continuacion: string; pregunta: string }[]; // COG-013
  };
  internal: {                         // solo equipo / CRM
    objetivo?: string;
    objetivoEsperado?: string;
    areasTrabajo?: string[];
    fuente?: string;
    fuenteUrl?: string;
    progresion?: string;
    reglas?: string;
    etiquetas?: string[];
    videoNotas?: string;
    revision?: string;
    pendientes?: string;
  };
  duracionMin?: [number, number];
  frecuencia?: string;
  video?: { driveFileId: string; url?: string; posterUrl?: string };
  allowsDualTask: boolean;            // solo GER; default false
  requiresIndividualPlan: boolean;    // informativo, NO bloquea
  rotationGroup?: string;             // PRE, ver 3.4
  clinicalStatus: ClinicalStatus;     // todos "aprobado" en esta carga
  sortOrder: number;
}
```

`clinicalStatus` existe para uso futuro. En esta carga todos los recursos van como `aprobado`. Los recursos `en_revision` (futuros) se siguen mostrando; solo `bloqueado` impide asignar.

### 1.1 Perfil de la persona

El perfil debe guardar **por separado**: etapa cognitiva, ruta física (verde/amarillo/rojo) y nivel de supervisión. El diagnóstico no determina la ruta física. Si ya existe el perfil, agrega solo lo que falte.

Para nutrición, el perfil (o el plan individual) debe poder indicar: alergias, disfagia y textura prescrita, restricción de líquidos, de potasio, de sodio, de fósforo/proteína (renal), diabetes, warfarina/anticoagulantes, celiaquía, riesgo de desnutrición o bajo peso, gota. Si no existen, créalos como flags opcionales; la lógica de 3.3 depende de ellos. Un flag vacío significa "sin dato", no "sin restricción": en ese caso el recurso se asigna y el texto "Tené en cuenta" cumple la función de advertencia.

## 2. Gerontogimnasia

Fuente: `gerontogimnasia-manual-2026-10-23.txt` (dirección clínica: MSc. Guiselle Solano Asenjo).

### 2.1 Qué se muestra

- Visible para la familia: desde **¿Para quién?** hasta **Para cerrar**, incluidos materiales ("Prepará"), la dosis y el video.
- Interno: "Notas del equipo" (Fuente, Áreas de trabajo, Video, Progresión, Revisión, Estado).
- La UI muestra la **dosis individual autorizada** si existe en el plan de la persona; si no, la dosis propuesta con la etiqueta "Dosis propuesta del terapeuta".

### 2.2 Bloques generales (contenido compartido)

Crea estos textos como contenido reutilizable que se muestra con cualquier GER:

- **Antes de empezar** (luz, calzado, silla sin ruedas, no retirar bastón/andador, no tirar de los brazos).
- **Cuándo parar** (incluye síntomas de atención urgente). Debe ser visible y destacado en cada ejercicio, antes del video y de las consignas, no escondido en un acordeón cerrado.
- **Cómo incorporar doble tarea**.
- Descripción de rutas verde/amarillo/rojo y de supervisión (para el onboarding/perfil, con la aclaración de que los colores son rutas editoriales, no una escala clínica validada).

### 2.3 Reglas de asignación GER

Estas reglas son de seguridad y se mantienen aunque el contenido esté aprobado:

- `rojo` solo recibe ejercicios sentados (GER-001, GER-002) y GER-010.
- GER-003 a GER-009: rutas `verde` y `amarillo`, nunca `rojo`.
- `allowsDualTask = false` por defecto en todos. Marcha, giros, escalones y apoyo en un pie (GER-004, 005, 006, 007, 009) nunca llevan doble tarea por defecto. GER-009 lo prohíbe explícitamente.
- Demencia severa/avanzada: no asignar doble tarea; no asignar ejercicios GER automáticamente (requiere pauta individual cargada por el equipo).
- GER-009 solo se asigna si `supervision = ayuda_fisica_entrenada`.
- GER-010 (Introducción): todas las rutas, sin dosis. **Se muestra antes del primer ejercicio** sin importar su numeración, y queda disponible para consulta posterior.

### 2.4 Ejercicios y videos

Carpeta de Drive: `1E6-AfzZNiI4JCYGn1nbTyiyqawCoa5RT` (propietaria: guisasenjo@gmail.com).

| Código | Título | Posición | Rutas | Archivo en Drive | Drive file ID | Tamaño |
|---|---|---|---|---|---|---|
| GER-001 | Extender la rodilla sentado | Sentado | V, A, R | GER-001  Extender la rodilla sentado | `1E7ozbxRTL1g3EgLKiTnnMkdnhut6e154` | 97 MB |
| GER-002 | Elevar una rodilla sentado | Sentado | V, A, R | GER-002  Elevar una rodilla sentado | `1nTS-4D8LujfY_dIw20ZobXMAKM5fw9GH` | 91 MB |
| GER-003 | Sentarse y levantarse de una silla | De pie | V, A | GER-003  Sentarse y levantarse de una silla | `1zkC11ZSI_c4PGBZXpT9TBosT5z1v--nv` | 104 MB |
| GER-004 | Subir y bajar un escalón bajo | De pie | V, A | GER-004  Subir y bajar un escalón bajo | `1ymazE-gpgP0bfdpI45cOxxUNnA690FaC` | 91 MB |
| GER-005 | Apoyo en una pierna con soporte | De pie | V, A | GER-005  Apoyo en una pierna con soporte | `1I3rl5oBNh1FbuiicQy70q7ksQ6vuKuAw` | 94 MB |
| GER-006 | Un pie delante del otro con apoyo | De pie | V, A | GER-006  Un pie delante del otro con apoyo | `155dS7RdkJU2AXbagceYDScZdy-eDbZGz` | 107 MB |
| GER-007 | Recorrido en zigzag amplio | Marcha | V, A | GER-007  Recorrido en zigzag amplio | `1c31SiJ7VOZkdcMMDzMOIaFFlaPl4Kf-f` | 101 MB |
| GER-008 | Separar la pierna con banda | De pie | V, A | GER-008  Separar la pierna con banda | `1oGAvso_BRGGTTIjEpuKW7grzS0GCMpHo` | 133 MB |
| GER-009 | Apoyo de pie sobre bola | De pie | V, A | GER-009 Apoyo de pie sobre bola | `1GEke_2pB22DLEHBzC59aKsnh-Uj0jD-7` | 115 MB |
| GER-010 | Introducción | N/A | V, A, R | Introducción Gerontogimnasia | `11i38S_xbG7djVnWxMKH9U8cQs3GUirOT` | 97 MB |

Los videos fueron editados en Drive el 25 y 26 de octubre, después de la auditoría audiovisual del manual. Las notas de "Video" del manual se guardan como `internal.videoNotas` (históricas), pero **no** se usan para bloquear ni para cambiar lo que ve la familia.

### 2.5 Estrategia de video

No embebas Drive directamente en la app: los previews de Drive dependen de los permisos de una cuenta personal, tienen cuotas de reproducción y archivos de ~100 MB cargan mal en celular.

1. Revisa cómo sirve la app los medios hoy (Supabase Storage, S3, Cloudflare, Mux, etc.) y usa eso.
2. Los MP4 originales se colocan en `assets/videos-source/` **con el mismo nombre que tienen en Drive** (más `.mp4`). No los renombres. Ojo: algunos nombres tienen dos espacios después del código y GER-009 tiene uno solo; puede haber espacios al final. Asocia cada archivo a su recurso así:
   - Archivos que empiezan con `GER-NNN` → recurso `GER-NNN`, usando el regex `^GER-(\d{3})` sobre el nombre (tolera cualquier cantidad de espacios después).
   - `Introducción Gerontogimnasia.mp4` → `GER-010`. Compara con normalización Unicode NFC, porque la "ó" puede venir descompuesta (NFD) según el sistema que descargó el archivo.
   - Si algún archivo no se puede asociar, o algún código queda sin video, detente y repórtalo.
   - Si no están los archivos, **pídemelos**; no intentes descargarlos de Drive desde el shell.

   Archivos esperados:
   ```
   GER-001  Extender la rodilla sentado.mp4
   GER-002  Elevar una rodilla sentado.mp4
   GER-003  Sentarse y levantarse de una silla.mp4
   GER-004  Subir y bajar un escalón bajo.mp4
   GER-005  Apoyo en una pierna con soporte.mp4
   GER-006  Un pie delante del otro con apoyo.mp4
   GER-007  Recorrido en zigzag amplio.mp4
   GER-008  Separar la pierna con banda.mp4
   GER-009 Apoyo de pie sobre bola.mp4
   Introducción Gerontogimnasia.mp4
   ```

   Los archivos transcodificados que se suben a storage sí usan nombres seguros para URL: `ger-001.mp4` … `ger-010.mp4` y `ger-0NN-poster.jpg`. Siempre cita las rutas entre comillas en los comandos de shell, porque tienen espacios y tildes.
3. Transcodifica con ffmpeg a H.264/AAC, 720p, `-crf 23 -preset veryfast -movflags +faststart` (objetivo: menos de 25 MB cada uno) y genera un póster JPG del segundo 2.
4. Sube a storage, guarda `video.url` y `video.posterUrl`, conserva `driveFileId` como referencia.
5. Reproductor: `<video controls playsinline preload="metadata" poster=…>`, sin autoplay, con controles grandes. Los originales no se commitean (`.gitignore`).

## 3. Nutrición

Fuente: `nutricion-recursos.txt`.

### 3.1 Inventario

Códigos presentes (37): PRE-001 a PRE-016; PRE-018, PRE-019; PRE-021 a PRE-031; PRE-034; PRE-036 a PRE-039; PRE-042 a PRE-044; PRE-046; PRE-048; PRE-049.

Faltantes (no crear): PRE-017, 020, 032, 033, 035, 040, 041, 045, 047, 050.

### 3.2 Qué se muestra

- Visible: título, ¿Para quién?, ¿Sabías que…?, Tu actividad, Tené en cuenta, Para cerrar.
- Interno: Fuente para el equipo, Producción y pendientes, Notas internas, Destinatarios, Asignación y precauciones, Fundamento.
- Bloques generales internos: "Cómo usar las fichas", "Alcance de la evidencia", "Criterios comunes para asignar". No se muestran a familias.
- La app no debe prometer prevenir demencia ni mejorar memoria. Revisa que ningún copy alrededor de estos recursos (titulares, notificaciones, resúmenes generados) lo haga.

### 3.3 Reglas de asignación PRE

Todos los PRE se publican. Las siguientes reglas son exclusiones de seguridad que se aplican **solo cuando el perfil tiene el dato cargado**:

- Alergia registrada a pescado (PRE-004, 037, 044), frutos secos (PRE-006, 034 opción frutos secos), huevo (PRE-022, 048), leche (PRE-016, 019, 048) → no asignar.
- Disfagia registrada **sin textura prescrita** → no asignar PRE-006, PRE-021, PRE-025, PRE-036, PRE-038, PRE-046.
- Riesgo de desnutrición/bajo peso registrado → no asignar automáticamente PRE-009, PRE-029, PRE-030.
- `requiresIndividualPlan = true` (PRE-012, 014, 015, 021, 024, 025, 026, 027, 029, 031, 036, 037, 039, 044, 048, 049) es informativo: si la persona tiene plan individual, la UI muestra la porción del plan junto a la ficha; si no, se muestra la ficha tal cual.
- Audiencias especiales según el documento: PRE-010 sin envejecimiento normal; PRE-046 solo demencia; PRE-018 solo preventivo, DCL y demencia leve; PRE-023, 025, 030, 031, 038 sin demencia severa. Para el resto, usar el "¿Para quién?" de cada ficha.

### 3.4 Rotación semanal

Un mismo usuario no recibe dos recursos del mismo grupo en la misma semana, y las frecuencias no se suman como obligaciones:

| Grupo | Recursos |
|---|---|
| pescado | PRE-004, PRE-037, PRE-044 |
| hojas_verdes | PRE-005, PRE-042 |
| aceite | PRE-012, PRE-039 |
| hidratacion | PRE-003, PRE-027 |
| ritmo_comer | PRE-023, PRE-046 |
| desayuno_proteico | PRE-022, PRE-048 |

Agrega tests unitarios para esta regla.

### 3.5 Imágenes

No existen imágenes ni videos para nutrición. No muestres placeholders ni texto que anuncie una imagen. Deja un campo opcional de imagen para PRE-005, 006, 008, 030, 034, 042, 048, 049.

## 4. Recursos cognitivos

Fuente: `cognitivo-manual.txt`.

### 4.1 Códigos

El manual no tiene códigos. Asigna `COG-NNN` según el número de actividad para conservar los huecos:

| Código | Actividad | Categoría | Audiencia | Duración | Frecuencia |
|---|---|---|---|---|---|
| COG-001 | Recuerdo el camino | Reminiscencia | prev, DCL, dem. leve | 10–15 | 2–3/sem |
| COG-002 | Mi lugar de vivienda antes y ahora | Reminiscencia | prev, DCL, dem. leve | 10–15 | 2–3/sem |
| COG-003 | Un día de trabajo, paso a paso | Reminiscencia | prev, DCL, dem. leve | 10–15 | 2–3/sem |
| COG-004 | Palabras y expresiones de mi época | Reminiscencia | prev, DCL, dem. leve | 10–15 | 2–3/sem |
| COG-005 | Organicemos una salida conocida | Reminiscencia | prev, DCL, dem. leve, dem. moderada | 10–15 | 2–3/sem |
| COG-006 | Una compra de antes | Reminiscencia | DCL, dem. leve, dem. moderada | 10–15 | 2–3/sem |
| COG-007 | Detectives de detalles | Atención/memoria/FE | prev, DCL, dem. leve, dem. moderada | 10–15 | 2–3/sem |
| COG-008 | Clasifiquemos por categorías | Atención/memoria/FE | DCL, dem. leve, dem. moderada | 5–15 | 2/sem |
| COG-010 | Un recorrido para recordar | Atención/memoria/FE | prev, DCL | 10–15 | 2–3/sem |
| COG-012 | ¿Qué necesitamos llevar? | Atención/memoria/FE | dem. leve, dem. moderada | 5–10 | 2–3/sem |
| COG-013 | Completemos el refrán | Lenguaje | prev, DCL, dem. leve | 5–15 | 1–2/sem |
| COG-014 | Mi memoria tiene un plan | Atención/memoria/FE | prev, DCL | 5–10 + consulta diaria | diaria + revisión semanal |
| COG-015 | Cuando ocurra esto, haré aquello | Atención/memoria/FE | prev, DCL | 5–10 | 1 pendiente/día según necesidad |
| COG-016 | Lo recuerdo después | Atención/memoria/FE | prev, DCL | 5–10 | 2–3/sem |

COG-009 y COG-011 no existen: no crearlos.

COG-005: la viñeta vacía del documento se interpreta como "Preventivo". En demencia moderada se muestra la nota del documento sobre acompañamiento y cambiar de tema si genera angustia.

### 4.2 Qué se muestra

- Visible: "Lo que verá el familiar en la App" (intro), ¿Para quién?, Materiales, Cómo realizarla, Ejemplos, Si necesita ayuda / Adaptación **solo de la etapa de la persona**, La ciencia detrás de esta actividad, Para cerrar (si existe).
- Interno: Objetivo, Objetivo esperado, ¿Qué estamos estimulando?, Progresión, Reglas, Etiquetas, Configuración para la App.
- Adaptación por etapa: guarda cada variante (`preventivo`, `dcl`, `demencia_leve`, `demencia_moderada`) por separado y renderiza la que corresponde al perfil. COG-001 no tiene adaptación por etapa; muestra su bloque "Si necesita ayuda" a todas.

### 4.3 Componentes especiales

- **COG-010** y **COG-012**: tablas de ejemplo (lugar/escena; situación/respuestas/apoyo) visibles para el familiar. Tabla en desktop, tarjetas apiladas en móvil.
- **COG-012**: al mostrar las dos opciones de apoyo, alternar aleatoriamente el orden de la opción correcta (lo pide la regla del recurso).
- **COG-013**: carrusel de 10 tarjetas. Una tarjeta a la vez con el inicio del refrán; botón "Ver frase completa" que revela continuación y pregunta de conversación; botones "Anterior" y "Siguiente". Sin puntuación, sin temporizador.
- **COG-014 / COG-015**: no piden ni guardan información personal en la app. No agregar campos de texto para registrar olvidos.
- **COG-016**: temporizador opcional (30 s, 1 min, 2 min) como ayuda; nunca mostrar puntuación.
- Ningún recurso cognitivo muestra puntuaciones ni resultados como evaluación clínica.

## 5. Correcciones de texto a aplicar

| Recurso | Original | Corregido |
|---|---|---|
| GER-002 | "¿Sabías que…?" sin punto final | agregar punto final |
| GER-003 | Encabezado "Tu actividad" duplicado y pegado al final de "¿Sabías que…?" | separar párrafos; un solo "Tu actividad" |
| GER-003 | "Podés er el. video" | "Podés ver el video" |
| GER-005 | "Podés ver video" | "Podés ver el video" |
| PRE (todas las que lo tengan) | "leves y moderadas y severas" / "severas.." | "leves, moderadas y severas." |
| PRE-008 | "moderadas  y severas" (doble espacio) | "moderadas y severas" |
| PRE-027 | Falta encabezado "Tu actividad" antes de "Si su plan de líquidos lo permite…" | agregar encabezado |
| PRE-031, 038, 042 | "¿Sabías que…?" sin punto final | agregar punto final |
| COG-005 | Viñeta vacía en "¿Para quién?" | "Preventivo." |
| COG-010 | Título duplicado | un solo título |
| COG-013 | Texto residual "Principio del formulario" | eliminar |
| Landing | "Msc." / "Pablo Jimenez Meza" | "MSc." / "Pablo Jiménez Meza" |

PRE-001 tiene formato distinto al resto: separar su "Contenido visible en la app" en ¿Sabías que…? / Tu actividad / Para cerrar, y sus "Notas internas" en campos internos.

Busca también dobles espacios y dobles puntos en todos los textos y corrígelos. Cualquier otra errata que encuentres: repórtala, no la corrijas.

## 6. Registro para revisión del equipo (no bloquea)

Crea `docs/content-review/2026-10-pendientes.md` con esta lista y cualquier otra inconsistencia que encuentres al transcribir. Si el CRM interno tiene un lugar para notas por recurso, guarda cada punto también en `internal.pendientes` del recurso correspondiente.

1. Registro mezclado: GER y PRE en voseo; manual cognitivo en ustedes/usted; GER-001, 005 y 008 mezclan usted y vos dentro de la misma ficha.
2. GER-009 menciona GER-044 y GER-045 (no existen). El título no describe la consigna (tocar una pelota inmovilizada sin cargar peso). "Progresión" menciona "apoyo de la silla" aunque se prohíbe usar silla móvil como soporte.
3. Verificar que los videos editados el 25–26 oct resolvieron lo señalado en la auditoría (cargas en GER-001/002/003, pasamanos en GER-004, dos manos en GER-005, semitándem en GER-006, pelota en GER-007, dos movimientos en GER-008, superficie móvil en GER-009).
4. COG-005: confirmar que la audiencia incluye Preventivo. El "Sabías que" habla de "recordar cómo nos preparábamos" aunque la actividad es imaginar.
5. COG-007: las reglas dicen evitar imágenes recargadas, pero la actividad no usa imágenes.
6. COG-013 (y probablemente COG-004): la cita "Folia y Silva (2024)" parece confundir la revista Folia Phoniatrica et Logopaedica con autores. Verificar todas las citas de "La ciencia detrás".
7. PRE-001: "¿Para quién?" incluye demencia, pero sus notas dicen "Prevención y DCL". Referencias numeradas [1–8] sin lista de referencias.
8. PRE-002, 003, 004 sin fuente ni notas internas.
9. PRE-012 / PRE-039: unificar medida de aceite. Porciones pendientes en las 16 fichas `requiresIndividualPlan`.
10. PRE-021: no existe receta de chía/chan.
11. Fichas PRE que incluyen demencia severa en actividades que piden comparar etiquetas, decidir compras o masticar frutos secos.

## 7. Landing page

Fuente: `landing-revision.txt`.

### 7.1 Hero

- Mantener encabezado `SALUD CEREBRAL EN CASA` y título `Saber qué hacer hoy, sin improvisar.`
- Sustituir la descripción por los dos párrafos del documento ("Cuidá tu salud cerebral o acompañá…" y "Actividades explicadas paso a paso…").
- Mantener debajo `Preservá lo que te hace ser vos.`
- Conservar botones `Crear mi cuenta gratis` (jerarquía visual principal) y `Ver cómo funciona`.

### 7.2 Redes sociales

- Mantener botón flotante de WhatsApp a la derecha con texto `¿Necesitás ayuda?`.
- Agregar iconos de Instagram y Facebook flotando a la izquierda con etiqueta `Seguinos`. **Usar las URLs de Instagram y Facebook que ya existen en el repo** (footer, config o constantes). Si hay más de una, usar la del footer y reportarlo.
- `target="_blank" rel="noopener noreferrer"` y `aria-label` descriptivo.
- Verificar en 360, 390, 768 y 1280 px que los flotantes no tapen contenido, el CTA principal ni formularios.

### 7.3 Nuestro equipo

Orden y textos:

1. MSc. Guiselle Solano Asenjo: Directora clínica del programa · Neuropsicología
2. Nancy Navarro Araya: Neuropsicología
3. María Laura Garita Quesada: «Coordina las actividades y la comunicación con las familias, acompaña las sesiones de estimulación cognitiva».
4. Pablo Jiménez Meza: Gerontogimnasia y fisioterapia
5. Silvia Obregón Aguilar: Nutrición

Desktop: fila 1 = Guiselle, Nancy, María Laura; fila 2 = Pablo, Silvia (centrados). Móvil: mismo orden en una columna. No romper los vínculos a las fotos existentes.

### 7.4 Preguntas frecuentes

Reemplazar el FAQ completo por las 10 preguntas del documento, en ese orden, con el texto literal. Acordeón accesible (botón con `aria-expanded`, navegable por teclado). Si existe JSON-LD `FAQPage`, actualizarlo con el mismo contenido.

## 8. Criterios de aceptación

- [ ] Todos los recursos cargados vía seed/migración idempotente (re-ejecutable sin duplicar), con `clinicalStatus = aprobado`.
- [ ] Ningún campo `internal` aparece en respuestas de API para el rol familia (test que lo verifique).
- [ ] 10 videos transcodificados, subidos y reproduciendo en móvil; GER-010 aparece antes del primer ejercicio.
- [ ] Reglas de asignación GER (rutas, doble tarea, GER-009 con supervisión entrenada) con tests.
- [ ] Exclusiones PRE por flags y rotación semanal con tests.
- [ ] COG-013 carrusel y COG-012 orden aleatorio funcionando.
- [ ] Landing verificada en los anchos indicados; Lighthouse de accesibilidad sin regresiones.
- [ ] `docs/content-review/2026-10-pendientes.md` creado.
- [ ] Resumen final con: archivos tocados, migraciones, cómo correr el seed y subir videos, y nuevas inconsistencias encontradas.
