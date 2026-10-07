# IntegraMente en Casa: Manual Maestro de Contenidos (Módulos 1-4)

Fuente de verdad del contenido de las 34 actividades de la app **IntegraMente en Casa**. Convertido desde `Manual_de_recursos_para_la_app.docx`. El texto de las actividades se conserva literal (solo se corrigió una duplicación "a a" en SEN-006).

## Instrucciones para Claude Code

- Este archivo es **contenido clínico validado**. No reescribir, resumir ni inventar texto de actividades, instrucciones, precauciones o afirmaciones científicas. Si falta algo, dejar `TODO` y preguntar.
- El bloque `yaml` de cada actividad es la configuración estructurada (usar para seeds, modelos o JSON). El resto es contenido para mostrar en la UI.
- Las **Precauciones** son obligatorias: deben mostrarse siempre al familiar antes de iniciar la actividad.
- Restricciones de lenguaje que la app debe respetar:
  - No presentar actividades como estrategias demostradas para prevenir Alzheimer (SEN-001).
  - No etiquetar actividades musicales domiciliarias como "musicoterapia" (MUS-007, REM-005).
  - No llamar a SEN-008 "sesión Snoezelen".
- Requisitos funcionales que se derivan de las precauciones:
  - MOV-007 exige filtro de riesgo de caída; ante duda, asignar versión sentada.
  - MOV-005: no prescribir repeticiones fijas; usar rangos y criterios de detención.
  - REM-004: nunca asignar degustación sin filtros de disfagia, alergias y dieta.
  - REM-007: requiere consentimiento y protección de privacidad para fotos e historias.
  - La seguridad motora tiene prioridad absoluta en todo el Módulo 2.

## Modelo de datos

| Campo | Descripción |
| --- | --- |
| `id` | Código único: `SEN`, `MOV`, `MUS`, `REM` + número de 3 dígitos |
| `modulo` | `sentidos`, `movimiento`, `musica`, `reminiscencia` |
| `tipo` | Categoría de intervención (primer valor de las etiquetas originales) |
| `dominios` | Funciones estimuladas ("¿Qué estamos estimulando?") |
| `duracion_min` | Rango en minutos `[min, max]` |
| `frecuencia` | Frecuencia recomendada |
| `perfil` | Población objetivo ("¿Para quién?") |
| `requisito` | Condición mínima para asignar la actividad |

**Niveles cognitivos usados en `perfil`:** Preventivo, DCL (deterioro cognitivo leve), demencia leve, moderada y avanzada.

**Niveles motores:** Motor Verde, Motor Amarillo (requiere supervisión/apoyo), Motor Rojo (versión sentada).

**Texto de introducción común** (idéntico en las 34 actividades, generarlo con plantilla):

```
Hoy realizaremos «{nombre}». Lo importante es facilitar la participación, no convertir la actividad en un examen.
```

**Bloque "La ciencia detrás de esta actividad"** tiene 3 partes: `gancho` (pregunta "¿Sabías que...?"), `evidencia` (dato de respaldo) y `cierre` ("¡Por eso hoy...!").

## Índice

- **Módulo 1: Cerebro y Sentidos**
  - `SEN-001` Entrenamiento olfativo de cuatro aromas
  - `SEN-002` ¿Igual o diferente?
  - `SEN-003` Aroma → palabra
  - `SEN-004` Un aroma, una historia
  - `SEN-005` La bolsa de las texturas
  - `SEN-006` Objeto → gesto → historia
  - `SEN-007` Café y lluvia
  - `SEN-008` Escena sensorial personalizada
- **Módulo 2: Cerebro y Movimiento**
  - `MOV-001` Caminar y nombrar
  - `MOV-002` Palma, cruce y señal
  - `MOV-003` Pelota y categorías
  - `MOV-004` Secuencia en movimiento
  - `MOV-005` Sentarse, levantarse y recordar
  - `MOV-006` Ruta con instrucciones
  - `MOV-007` Equilibrio y búsqueda mental
  - `MOV-008` Tarea funcional doble
- **Módulo 3: Cerebro y Música**
  - `MUS-001` Mi canción, mi historia
  - `MUS-002` Completa la canción
  - `MUS-003` Eco de ritmos
  - `MUS-004` Ritmo y movimiento
  - `MUS-005` Categorías al compás
  - `MUS-006` Percusión por secuencias
  - `MUS-007` Playlist para regular el estado de ánimo
  - `MUS-008` Conversación musical guiada
- **Módulo 4: Reminiscencia, Identidad y Regulación Emocional**
  - `REM-001` Mi línea de vida
  - `REM-002` Una fotografía, una conversación
  - `REM-003` Objetos de mi historia
  - `REM-004` La receta de mi familia
  - `REM-005` Mi música, mi momento
  - `REM-006` Un recuerdo que me da calma
  - `REM-007` Álbum digital de vida
  - `REM-008` Celebraciones y tradiciones
  - `REM-009` Historia de fortalezas
  - `REM-010` Reminiscencia compartida con la familia

---

## Módulo 1: Cerebro y Sentidos

### SEN-001 Entrenamiento olfativo de cuatro aromas

```yaml
id: SEN-001
nombre: "Entrenamiento olfativo de cuatro aromas"
modulo: sentidos
tipo: "olfativa"
dominios: ["olfato", "atención sostenida", "discriminación", "acceso semántico"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve con capacidad para seguir una rutina breve."
requisito: "Puede identificar o describir sensaciones y tolera aromas sin malestar."
```

**Objetivo:** Entrenar discriminación olfativa y atención mediante exposición repetida y estructurada.

**Materiales:** Cuatro aromas seguros y diferenciables: por ejemplo café, limón/naranja, canela y vainilla.

**Cómo realizarla:**

1. Presentar un aroma a la vez, sin acercarlo excesivamente a la nariz.
2. Pedir que lo huela durante unos segundos y describa intensidad, agrado y familiaridad.
3. Repetir con los cuatro aromas, evitando corregir de inmediato.
4. Registrar cuáles reconoce y cuáles discrimina con mayor facilidad.
5. Repetir con regularidad según el plan asignado por la app.

**Progresión:** De describir sensaciones → discriminar aromas → identificar → recordar el orden de presentación.

**Adaptación:** En demencia leve reducir a dos aromas y ofrecer opciones. Si no puede nombrar, aceptar descripciones o asociaciones.

**⚠️ Precauciones:** No comunicarlo como una estrategia demostrada para prevenir Alzheimer. Utilizar aromas seguros y conocidos.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que entrenar el olfato también puede ayudarnos a mantener la atención y reconocer diferentes aromas?
- Evidencia: Un estudio de TU Dresden con 91 adultos mayores encontró mejoras en la capacidad olfativa después de varios meses de entrenamiento. 👃✨
- Cierre: ¡Por eso hoy vamos a ejercitar nuestra atención y nuestro olfato descubriendo y diferenciando diferentes aromas!

**🎯 Objetivo esperado:** Favorecer el entrenamiento de discriminación olfativa y atención mediante exposición repetida y estructurada.

### SEN-002 ¿Igual o diferente?

```yaml
id: SEN-002
nombre: "¿Igual o diferente?"
modulo: sentidos
tipo: "olfativa"
dominios: ["discriminación", "atención selectiva", "decisión"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve."
requisito: "Comprende comparación simple entre dos estímulos."
```

**Objetivo:** Trabajar discriminación sensorial, atención y comparación.

**Materiales:** Dos a cuatro recipientes con pares de aromas.

**Cómo realizarla:**

1. Presentar dos aromas consecutivos.
2. Preguntar únicamente: ¿son iguales o diferentes?
3. Después pedir que explique en qué se parecen o diferencian.
4. En una segunda ronda, mezclar pares iguales y diferentes.

**Progresión:** Dos aromas claramente distintos → aromas más parecidos → cuatro presentaciones con recuerdo de posición.

**Adaptación:** En demencia leve usar contrastes muy claros y respuestas binarias.

**⚠️ Precauciones:** Evitar sesiones largas: la adaptación olfativa puede disminuir la percepción de los aromas.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que entrenar el olfato puede ayudarnos a mejorar nuestra capacidad para distinguir diferentes aromas?
- Evidencia: Las revisiones actuales muestran que el entrenamiento olfativo mejora de forma consistente la capacidad para reconocer y diferenciar olores. 👃✨
- Cierre: ¡Por eso hoy vamos a poner a prueba nuestra atención selectiva, comparación y capacidad de decisión descubriendo si dos aromas son iguales o diferentes!

**🎯 Objetivo esperado:** Favorecer discriminación sensorial, atención y comparación.

### SEN-003 Aroma → palabra

```yaml
id: SEN-003
nombre: "Aroma → palabra"
modulo: sentidos
tipo: "olfativa + lenguaje"
dominios: ["acceso léxico", "fluencia semántica", "atención", "olfato"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve."
requisito: "Puede producir lenguaje espontáneo o responder con claves."
```

**Objetivo:** Usar el olor como vehículo para trabajar acceso léxico, semántica y fluencia.

**Materiales:** Café, canela, cítrico, vainilla u otros aromas culturalmente familiares.

**Cómo realizarla:**

1. Presentar el aroma sin mostrar su fuente.
2. Preguntar: ¿le resulta familiar?, ¿cómo lo describiría?
3. Solicitar el nombre solo después de explorar sensaciones y asociaciones.
4. Una vez identificado o revelado, pedir tres palabras relacionadas con ese aroma.

**Progresión:** Pedir más asociaciones → categorías semánticas → 30 segundos de producción de palabras relacionadas.

**Adaptación:** Ofrecer dos opciones o una pista semántica si no aparece la palabra.

**⚠️ Precauciones:** Evitar corregir con rapidez. Reconocer un olor y poder nombrarlo no son procesos equivalentes.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que un aroma puede ayudarnos a encontrar palabras con mayor facilidad?
- Evidencia: Un estudio de 2025 con 128 adultos mayores encontró mejoras en la fluidez verbal después del entrenamiento olfativo. 👃🗣️✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención y nuestras palabras a través de los aromas y sus asociaciones!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### SEN-004 Un aroma, una historia

```yaml
id: SEN-004
nombre: "Un aroma, una historia"
modulo: sentidos
tipo: "reminiscencia olfativa"
dominios: ["memoria autobiográfica", "lenguaje", "emoción", "identidad", "conexión familiar"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve y moderada; también preventivo con objetivo autobiográfico."
requisito: "Existe información biográfica suficiente para escoger aromas significativos."
```

**Objetivo:** Facilitar evocación autobiográfica, conversación e identidad mediante claves olfativas.

**Materiales:** Un aroma significativo: café, jabón, perfume, especia, flor, alimento, madera, etc.

**Cómo realizarla:**

1. Presentar el aroma sin pedir que lo identifique.
2. Preguntar qué sensación le produce.
3. Explorar si aparece un lugar, persona, época o actividad.
4. Si no recuerda, ofrecer una clave: «Este era el café que tomábamos en casa…».
5. Validar palabras, gestos, emociones y expresiones, no solo historias completas.

**Progresión:** Una asociación → varias preguntas contextuales → combinar con foto u objeto relacionado.

**Adaptación:** En demencia moderada usar preguntas concretas, una a la vez, y aportar información en lugar de examinar.

**⚠️ Precauciones:** Si el aroma provoca tristeza o angustia sostenida, retirarlo y cambiar a un estímulo neutro/agradable.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que un aroma puede ayudarnos a despertar recuerdos y emociones de momentos importantes de nuestra vida?
- Evidencia: La investigación muestra que la estimulación olfativa puede favorecer el bienestar y la conexión con experiencias personales. 👃❤️✨
- Cierre: ¡Por eso hoy vamos a estimular nuestros recuerdos, emociones y conversación a través de un aroma especial!

**🎯 Objetivo esperado:** Favorecer evocación autobiográfica, conversación e identidad mediante claves olfativas.

### SEN-005 La bolsa de las texturas

```yaml
id: SEN-005
nombre: "La bolsa de las texturas"
modulo: sentidos
tipo: "táctil"
dominios: ["tacto", "reconocimiento", "lenguaje descriptivo", "memoria semántica", "praxias"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Todos los niveles, con adaptación."
requisito: "Puede explorar objetos con la mano y mantener atención al menos brevemente."
```

**Objetivo:** Trabajar reconocimiento táctil, lenguaje descriptivo, función del objeto y asociaciones autobiográficas.

**Materiales:** Bolsa opaca; squishy, cuchara de madera, algodón, tela, esponja, objeto metálico grande y seguro.

**Cómo realizarla:**

1. Introducir una mano sin mirar.
2. Pedir que describa primero la sensación: suave, duro, frío, blando, rugoso, etc.
3. Preguntar qué podría ser o para qué podría servir.
4. Extraer el objeto y conversar sobre la asociación que haya aparecido.

**Progresión:** Texturas muy distintas → objetos de función similar → recordar el orden de los objetos.

**Adaptación:** En demencia moderada no pedir el nombre: mostrar el objeto, modelar el gesto y preguntar por su uso o historia.

**⚠️ Precauciones:** Usar objetos grandes, limpios y no cortantes. Supervisar si existe conducta de exploración oral.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que explorar diferentes texturas puede activar nuestros sentidos y ayudarnos a reconocer y describir lo que tocamos?
- Evidencia: Las revisiones recientes sobre estimulación multisensorial han encontrado beneficios en la participación y el bienestar de personas con demencia. ✋✨
- Cierre: ¡Por eso hoy vamos a estimular el tacto, el reconocimiento, el lenguaje y nuestras habilidades para manipular objetos a través de diferentes texturas!

**🎯 Objetivo esperado:** Favorecer reconocimiento táctil, lenguaje descriptivo, función del objeto y asociaciones autobiográficas.

### SEN-006 Objeto → gesto → historia

```yaml
id: SEN-006
nombre: "Objeto → gesto → historia"
modulo: sentidos
tipo: "táctil + praxias + reminiscencia"
dominios: ["praxias", "memoria semántica", "reconocimiento", "reminiscencia", "comunicación"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Demencia leve, moderada y avanzada con objetos muy familiares."
requisito: "Conserva capacidad de manipular o imitar gestos simples."
```

**Objetivo:** Acceder a conocimiento funcional y recuerdos aun cuando el nombre del objeto no aparezca.

**Materiales:** Cuchara de madera, peine, cartera, brocha, paño, utensilio de oficio seguro.

**Cómo realizarla:**

1. Entregar el objeto y permitir exploración.
2. Preguntar: «¿Qué hacemos con esto?» antes de preguntar su nombre.
3. Si no responde, modelar el gesto asociado.
4. Conectar con una pregunta biográfica sencilla: «¿Quién cocinaba en su casa?».

**Progresión:** Objeto visible → objeto solo por tacto → secuencia de dos objetos y acciones.

**Adaptación:** En demencia avanzada centrarse en manipulación, gesto y emoción; omitir demandas verbales.

**⚠️ Precauciones:** Elegir objetos ligados a la historia de vida y evitar elementos que puedan producir daño.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que un objeto conocido puede ayudarnos a recordar cómo se usa, incluso cuando cuesta encontrar su nombre?
- Evidencia: La estimulación multisensorial puede favorecer la participación, la comunicación y el bienestar, incluso cuando la respuesta verbal es limitada. ✋🧠✨
- Cierre: ¡Por eso hoy vamos a estimular el reconocimiento, la memoria, las acciones y la comunicación a través de objetos conocidos!

**🎯 Objetivo esperado:** Favorecer el acceso a conocimiento funcional y recuerdos aun cuando el nombre del objeto no aparezca.

### SEN-007 Café y lluvia

```yaml
id: SEN-007
nombre: "Café y lluvia"
modulo: sentidos
tipo: "multisensorial"
dominios: ["integración multisensorial", "memoria autobiográfica", "lenguaje", "emoción", "atención"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Todos los niveles; especialmente DCL y demencia leve-moderada."
requisito: "Tolera varios estímulos cuando se presentan de manera gradual."
```

**Objetivo:** Integrar claves visuales, auditivas, táctiles y olfativas para facilitar asociaciones y conversación.

**Materiales:** Imagen de cocina/mesa tradicional, audio de lluvia, taza de cerámica, aroma de café.

**Cómo realizarla:**

1. Mostrar únicamente la imagen y preguntar qué sugiere.
2. Agregar el sonido de lluvia y observar qué cambia en la historia.
3. Entregar la taza y explorar la sensación.
4. Agregar el aroma de café.
5. Preguntar qué lugar, persona o momento aparece ahora.

**Progresión:** Dos sentidos → tres → cuatro; en niveles altos pedir después recordar qué elementos se presentaron.

**Adaptación:** En demencia moderada usar solo dos estímulos coherentes y permitir respuestas emocionales o gestuales.

**⚠️ Precauciones:** Más estímulos no significa mejor estimulación. Introducirlos uno por uno y detener ante signos de sobrecarga.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que combinar diferentes sentidos puede ayudarnos a despertar recuerdos, emociones y asociaciones?
- Evidencia: Un meta-análisis de 2025 con 974 personas con demencia encontró beneficios de la estimulación multisensorial en la función mental general. ☕🌧️🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención, memoria, lenguaje y emociones a través de una experiencia llena de sensaciones!

**🎯 Objetivo esperado:** Favorecer la integración de claves visuales, auditivas, táctiles y olfativas para facilitar asociaciones y conversación.

### SEN-008 Escena sensorial personalizada

```yaml
id: SEN-008
nombre: "Escena sensorial personalizada"
modulo: sentidos
tipo: "multisensorial + reminiscencia"
dominios: ["regulación", "orientación afectiva", "atención", "vínculo", "reminiscencia"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Demencia moderada/avanzada y personas con lenguaje limitado."
requisito: "Familia conoce una actividad significativa de la vida de la persona."
```

**Objetivo:** Crear una experiencia sensorial segura que favorezca conexión y regulación, sin exigir rendimiento.

**Materiales:** 2-3 estímulos coherentes con una escena biográfica: jardín, cocina, playa, misa, trabajo, etc.

**Cómo realizarla:**

1. Elegir una escena significativa.
2. Preparar máximo tres estímulos relacionados.
3. Presentarlos lentamente y observar respuestas.
4. Nombrar la experiencia por la persona: «Esto es olor a café…», «Escuche la lluvia…».
5. Conversar solo si la persona muestra interés; no forzar evocación.

**Progresión:** En personas con mayor capacidad agregar elección o preguntas autobiográficas.

**Adaptación:** En demencia avanzada mantener 1-2 estímulos, voz calmada y tiempo de observación.

**⚠️ Precauciones:** No llamar a esta actividad «sesión Snoezelen» si no se realiza en un entorno/protocolo especializado; es una experiencia domiciliaria inspirada en principios multisensoriales.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que una experiencia sensorial personalizada puede ayudarnos a conectar con recuerdos, emociones y momentos significativos?
- Evidencia: Las revisiones sobre estimulación multisensorial han encontrado beneficios especialmente relacionados con el bienestar, el estado de ánimo y la conducta. 🌿❤️✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención, emociones, recuerdos y vínculo a través de una experiencia sensorial especial!

**🎯 Objetivo esperado:** Favorecer una experiencia que permita una experiencia sensorial segura que favorezca conexión y regulación, sin exigir rendimiento. `TODO: redacción a revisar`

---

## Módulo 2: Cerebro y Movimiento

### MOV-001 Caminar y nombrar

```yaml
id: MOV-001
nombre: "Caminar y nombrar"
modulo: movimiento
tipo: "dual task motor-cognitivo"
dominios: ["atención dividida", "fluencia", "función ejecutiva", "marcha"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL, demencia leve. Motor Verde o Amarillo."
requisito: "Camina de forma segura con o sin supervisión y puede producir categorías simples."
```

**Objetivo:** Entrenar atención dividida, fluencia y control de marcha en tarea dual.

**Materiales:** Espacio despejado; opcional conos.

**Cómo realizarla:**

1. Caminar a ritmo cómodo.
2. Agregar una categoría sencilla: animales, frutas, ciudades, nombres.
3. Priorizar marcha segura y palabras correctas; no competir.
4. Detener la tarea cognitiva si la marcha se vuelve insegura.

**Progresión:** Categorías fáciles → alternar categorías → caminar entre conos → cambiar dirección por señal.

**Adaptación:** Motor Amarillo: acompañamiento cercano. Motor Rojo: marcha sentada alternando pies mientras nombra.

**⚠️ Precauciones:** Seguridad motora tiene prioridad absoluta. Si hablar altera notablemente la marcha, reducir dificultad.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que combinar caminar con una tarea mental puede ayudar a entrenar la atención y la capacidad para realizar dos cosas a la vez?
- Evidencia: Una revisión de 32 ensayos encontró beneficios de este tipo de entrenamiento en habilidades mentales y en la forma de caminar. 🚶‍♀️🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención, fluidez, organización y forma de caminar mientras caminamos y nombramos palabras!

**🎯 Objetivo esperado:** Favorecer el entrenamiento de atención dividida, fluencia y control de marcha en tarea dual.

### MOV-002 Palma, cruce y señal

```yaml
id: MOV-002
nombre: "Palma, cruce y señal"
modulo: movimiento
tipo: "coordinación + inhibición"
dominios: ["coordinación bilateral", "secuenciación", "inhibición", "flexibilidad"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve. Puede realizarse sentado."
requisito: "Comprende secuencias de 2-3 pasos."
```

**Objetivo:** Trabajar coordinación bilateral, secuenciación, inhibición y flexibilidad.

**Materiales:** Ninguno.

**Cómo realizarla:**

1. Realizar una palma.
2. Tocar con mano derecha rodilla izquierda y luego mano izquierda rodilla derecha.
3. Agregar una señal verbal: cuando el familiar diga «cambio», invertir el orden.
4. Practicar lento antes de aumentar velocidad.

**Progresión:** Dos movimientos → tres → respuesta a señal → alternar regla cada 30-60 segundos.

**Adaptación:** Demencia leve: imitación frente a frente. Motor Rojo: toda la secuencia sentada.

**⚠️ Precauciones:** Evitar velocidad excesiva. El objetivo es coordinación correcta, no rendimiento deportivo.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que realizar movimientos coordinados siguiendo diferentes señales puede ayudarnos a mejorar nuestra capacidad para adaptarnos y cambiar de una acción a otra?
- Evidencia: Las revisiones sobre ejercicio en personas con deterioro cognitivo muestran que combinar movimiento y retos mentales puede favorecer habilidades como la atención y el control de nuestras respuestas. 👐🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra coordinación, memoria, atención y capacidad para adaptarnos con diferentes movimientos!

**🎯 Objetivo esperado:** Favorecer coordinación bilateral, secuenciación, inhibición y flexibilidad.

### MOV-003 Pelota y categorías

```yaml
id: MOV-003
nombre: "Pelota y categorías"
modulo: movimiento
tipo: "dual task sentado o de pie"
dominios: ["atención", "fluencia", "coordinación óculo-manual", "inhibición"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL, demencia leve-moderada; Motor Verde/Amarillo/Rojo."
requisito: "Puede lanzar/recibir una pelota blanda o rodarla sobre mesa."
```

**Objetivo:** Combinar coordinación visomotora con acceso semántico y atención.

**Materiales:** Pelota blanda.

**Cómo realizarla:**

1. Lanzar o pasar la pelota entre dos personas.
2. Cada vez que recibe, decir una palabra de una categoría.
3. Si se repite una palabra, simplemente dar una pista y continuar.
4. En demencia moderada usar nombres de personas conocidas o colores.

**Progresión:** Aumentar distancia → alternar dos categorías → cambiar dirección de pase por señal.

**Adaptación:** Motor Rojo: rodar pelota sobre mesa. Cognitivo moderado: familiar dice la categoría y ofrece dos opciones.

**⚠️ Precauciones:** Usar pelota liviana y espacio libre de obstáculos.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que combinar una actividad física con un reto mental puede ayudarnos a trabajar nuestras habilidades mentales y físicas al mismo tiempo?
- Evidencia: Los meta-análisis en adultos mayores con deterioro cognitivo han encontrado beneficios de este tipo de entrenamiento en la cognición y el desempeño físico. 🏐🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención, fluidez, coordinación y capacidad para controlar nuestras respuestas mientras jugamos con la pelota!

**🎯 Objetivo esperado:** Favorecer la combinación de coordinación visomotora con acceso semántico y atención.

### MOV-004 Secuencia en movimiento

```yaml
id: MOV-004
nombre: "Secuencia en movimiento"
modulo: movimiento
tipo: "memoria de trabajo + coordinación"
dominios: ["memoria de trabajo", "secuenciación", "praxias", "atención"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL, demencia leve."
requisito: "Puede imitar 2 movimientos consecutivos."
```

**Objetivo:** Entrenar memoria de trabajo, secuenciación y aprendizaje motor.

**Materiales:** Ninguno o tarjetas con movimientos.

**Cómo realizarla:**

1. Familiar realiza dos movimientos: palma + tocar hombros.
2. Persona los imita en el mismo orden.
3. Agregar un tercer movimiento cuando domine la secuencia.
4. Repetir y luego cambiar la secuencia.

**Progresión:** 2 → 3 → 4 movimientos; después invertir el orden.

**Adaptación:** Demencia leve: mantener 1-2 movimientos y utilizar aprendizaje por imitación sin error.

**⚠️ Precauciones:** No aumentar longitud si cae la precisión. Volver al último nivel exitoso.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que recordar y repetir una secuencia de movimientos puede ayudarnos a entrenar nuestra memoria?
- Evidencia: La investigación sobre entrenamiento motor-cognitivo ha encontrado beneficios en diferentes habilidades mentales y físicas. 🧠🙌✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra memoria, atención, capacidad para seguir pasos y coordinación mientras aprendemos y repetimos movimientos!

**🎯 Objetivo esperado:** Favorecer el entrenamiento de memoria de trabajo, secuenciación y aprendizaje motor.

### MOV-005 Sentarse, levantarse y recordar

```yaml
id: MOV-005
nombre: "Sentarse, levantarse y recordar"
modulo: movimiento
tipo: "funcional + memoria"
dominios: ["fuerza funcional", "memoria de trabajo/reciente", "atención"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL; Motor Verde o Amarillo con capacidad segura de sit-to-stand."
requisito: "Puede levantarse de una silla estable sin dolor importante."
```

**Objetivo:** Combinar fuerza funcional de miembros inferiores con memoria de trabajo.

**Materiales:** Silla firme con respaldo, idealmente contra pared.

**Cómo realizarla:**

1. Mostrar 2-3 palabras u objetos.
2. Realizar 3-5 repeticiones lentas de sentarse y levantarse.
3. Al finalizar, pedir que recuerde los elementos.
4. Dar claves si es necesario y registrar nivel de ayuda.

**Progresión:** Más elementos → mayor intervalo → categoría distractora durante el movimiento.

**Adaptación:** Motor Amarillo: apoyo de brazos/supervisión. Motor Rojo: extensión alterna de rodillas sentado y luego evocación.

**⚠️ Precauciones:** No prescribir número de repeticiones rígido desde la app si no se conoce la capacidad física. Usar rangos y criterios de detención.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que la actividad física regular también puede beneficiar la salud de nuestro cerebro?
- Evidencia: La OMS recomienda que las personas mayores realicen ejercicios de fortalecimiento y actividades que combinen diferentes tipos de movimiento, adaptadas a sus capacidades. 🪑🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra fuerza, memoria y atención mientras nos sentamos, nos levantamos y recordamos!

**🎯 Objetivo esperado:** Favorecer la combinación de fuerza funcional de miembros inferiores con memoria de trabajo.

### MOV-006 Ruta con instrucciones

```yaml
id: MOV-006
nombre: "Ruta con instrucciones"
modulo: movimiento
tipo: "orientación + funciones ejecutivas"
dominios: ["planificación", "orientación espacial", "memoria de trabajo", "movilidad"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL, demencia leve; Motor Verde/Amarillo."
requisito: "Puede desplazarse en casa con seguridad."
```

**Objetivo:** Trabajar planificación, memoria de instrucciones y orientación espacial funcional.

**Materiales:** 3 puntos seguros de la casa.

**Cómo realizarla:**

1. Dar una instrucción funcional de dos pasos: «Vaya a la mesa y luego a la puerta».
2. Cuando la complete, agregar un tercer punto.
3. Después pedir que explique qué ruta realizó.

**Progresión:** 2 pasos → 3 pasos → incorporar un objeto a transportar → cambio de regla.

**Adaptación:** Demencia leve: una instrucción a la vez y apoyo gestual.

**⚠️ Precauciones:** Usar únicamente rutas familiares, iluminadas y sin desniveles.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que combinar movimiento y retos mentales puede ayudarnos a practicar habilidades que usamos todos los días?
- Evidencia: Este tipo de entrenamiento se acerca a situaciones reales en las que necesitamos caminar, recordar y tomar decisiones al mismo tiempo. 🚶‍♀️🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra planificación, memoria, orientación y movilidad mientras seguimos una ruta!

**🎯 Objetivo esperado:** Favorecer planificación, memoria de instrucciones y orientación espacial funcional.

### MOV-007 Equilibrio y búsqueda mental

```yaml
id: MOV-007
nombre: "Equilibrio y búsqueda mental"
modulo: movimiento
tipo: "balance + cognición"
dominios: ["balance", "atención dividida", "función ejecutiva", "fluencia"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo y DCL; Motor Verde o Amarillo."
requisito: "Puede mantener postura con base reducida de manera segura o con apoyo."
```

**Objetivo:** Combinar control postural con búsqueda semántica y atención.

**Materiales:** Superficie firme; respaldo de silla o baranda.

**Cómo realizarla:**

1. Adoptar postura segura con pies juntos o semitándem, con apoyo disponible.
2. Nombrar elementos de una categoría durante 20-30 segundos.
3. Descansar y repetir.
4. El familiar observa estabilidad y prioriza seguridad.

**Progresión:** Base amplia → pies juntos → semitándem; categorías fáciles → alternancia.

**Adaptación:** Motor Amarillo: mano en apoyo. Motor Rojo: sentado, elevar alternadamente talones/puntas mientras nombra.

**⚠️ Precauciones:** Esta actividad requiere filtros de riesgo de caída en la app. Si existe duda, asignar versión sentada.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que combinar el equilibrio con una tarea mental puede ayudarnos a trabajar nuestras habilidades físicas y mentales al mismo tiempo?
- Evidencia: Las revisiones sobre entrenamiento dual han encontrado beneficios en el equilibrio y otras habilidades relacionadas con el movimiento. ⚖️🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestro equilibrio, atención, fluidez y capacidad para organizar nuestras respuestas mientras buscamos palabras!

**🎯 Objetivo esperado:** Favorecer la combinación de control postural con búsqueda semántica y atención.

### MOV-008 Tarea funcional doble

```yaml
id: MOV-008
nombre: "Tarea funcional doble"
modulo: movimiento
tipo: "dual task ecológico"
dominios: ["funciones ejecutivas", "atención dividida", "autonomía funcional", "memoria"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL y demencia leve; Motor Verde/Amarillo."
requisito: "Realiza actividades domésticas simples con seguridad."
```

**Objetivo:** Transferir el entrenamiento a actividades cotidianas reales.

**Materiales:** Actividad segura: doblar paños, ordenar cubiertos no filosos, regar plantas, guardar objetos.

**Cómo realizarla:**

1. Elegir una tarea doméstica conocida.
2. Agregar una demanda cognitiva simple: conversar sobre una categoría, recordar 2 elementos o seguir una regla.
3. Observar si la tarea funcional pierde precisión.
4. Reducir la carga cognitiva si aparecen errores o frustración.

**Progresión:** Tarea simple → doble regla → secuencia funcional de varios pasos.

**Adaptación:** Demencia leve: una regla y modelado. Moderada: mantener solo el componente funcional acompañado.

**⚠️ Precauciones:** Excluir actividades con fuego, cuchillos, escaleras o riesgo de derrame/caída.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que practicar una tarea cotidiana mientras realizamos una actividad mental puede ayudarnos a entrenar habilidades que usamos en la vida diaria?
- Evidencia: Las revisiones recientes sobre entrenamiento dual han encontrado beneficios en la cognición y la movilidad. 🏠🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención, memoria, autonomía y capacidad para organizar nuestras acciones mientras realizamos una tarea cotidiana!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

---

## Módulo 3: Cerebro y Música

### MUS-001 Mi canción, mi historia

```yaml
id: MUS-001
nombre: "Mi canción, mi historia"
modulo: musica
tipo: "música + reminiscencia"
dominios: ["memoria autobiográfica", "emoción", "lenguaje", "identidad"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL y demencia leve-moderada; también preventivo."
requisito: "Existe información sobre preferencias musicales o canciones significativas."
```

**Objetivo:** Facilitar recuerdos autobiográficos, conversación, emoción e identidad.

**Materiales:** 1-3 canciones significativas de distintas etapas.

**Cómo realizarla:**

1. Elegir una canción conocida y reproducir un fragmento breve.
2. Preguntar qué sensación genera antes de preguntar por recuerdos.
3. Explorar lugar, época, personas o actividades asociadas.
4. Si no recuerda, aportar contexto y permitir escuchar sin exigencia.

**Progresión:** Una canción → comparar dos épocas → crear una pequeña línea de vida musical.

**Adaptación:** Demencia moderada: preguntas cerradas o comentarios del familiar; aceptar canto, movimiento o expresión facial.

**⚠️ Precauciones:** Personalizar la selección. La música «de la época» no sustituye conocer las preferencias reales de la persona.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que escuchar una canción significativa puede ayudarnos a conectar con recuerdos y emociones de nuestra historia?
- Evidencia: Una revisión sistemática de 2026 encontró beneficios de la reminiscencia musical especialmente en el bienestar, la participación y la conexión con los demás. 🎵❤️
- Cierre: ¡Por eso hoy vamos a estimular nuestros recuerdos, emociones, lenguaje e identidad a través de una canción especial!

**🎯 Objetivo esperado:** Favorecer recuerdos autobiográficos, conversación, emoción e identidad.

### MUS-002 Completa la canción

```yaml
id: MUS-002
nombre: "Completa la canción"
modulo: musica
tipo: "música + lenguaje"
dominios: ["lenguaje", "atención auditiva", "memoria remota", "participación"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve y moderada con canciones muy familiares."
requisito: "Puede seguir melodías o producir palabras/frases conocidas."
```

**Objetivo:** Facilitar acceso verbal mediante melodía y memoria musical familiar.

**Materiales:** Canción muy conocida para la persona.

**Cómo realizarla:**

1. Reproducir/cantar una canción conocida.
2. Detenerse antes de una palabra o frase familiar sin mostrar la letra completa.
3. Dar tiempo para que la persona continúe.
4. Si no aparece, completar juntos y seguir cantando sin corregir.

**Progresión:** Pausas muy predecibles → menos predecibles → cantar sin apoyo de grabación.

**Adaptación:** Demencia moderada: el familiar canta y deja solo la última palabra; avanzada: cantar juntos sin exigir completar.

**⚠️ Precauciones:** No transformar la actividad en prueba de memoria de letras.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que cantar canciones conocidas puede ayudarnos a recordar palabras y mantener la atención?
- Evidencia: La investigación ha encontrado pequeños beneficios en algunas habilidades mentales cuando las personas mayores participan activamente en actividades musicales. 🎶🧠✨
- Cierre: ¡Por eso hoy vamos a cantar juntos, completar las canciones y disfrutar de esos recuerdos que la música nos trae!

**🎯 Objetivo esperado:** Favorecer acceso verbal mediante melodía y memoria musical familiar.

### MUS-003 Eco de ritmos

```yaml
id: MUS-003
nombre: "Eco de ritmos"
modulo: musica
tipo: "ritmo + atención"
dominios: ["atención auditiva", "memoria de trabajo", "secuenciación", "coordinación"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve-moderada."
requisito: "Puede imitar una secuencia de palmadas o golpes suaves."
```

**Objetivo:** Entrenar atención, memoria de trabajo, secuenciación e inhibición.

**Materiales:** Manos o instrumento de percusión sencillo.

**Cómo realizarla:**

1. Realizar un patrón de dos golpes/palmadas.
2. Pedir que lo imite.
3. Aumentar a tres golpes cuando lo domine.
4. Alternar intensidad o pausa para crear una regla.

**Progresión:** 2 pulsos → 3-4 → patrones con pausa → respuesta inversa.

**Adaptación:** Demencia moderada: mantener patrones de 1-2 pulsos y hacerlo simultáneamente.

**⚠️ Precauciones:** Usar volumen bajo/moderado. Si se acelera o agita, volver a un ritmo regular y simple.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que repetir un ritmo que escuchamos ayuda a trabajar la atención y la memoria?
- Evidencia: Los estudios sobre actividades musicales han encontrado beneficios en diferentes habilidades mentales en personas mayores con deterioro cognitivo. 🥁🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra atención, memoria, coordinación y capacidad para seguir secuencias mientras imitamos diferentes ritmos!

**🎯 Objetivo esperado:** Favorecer el entrenamiento de atención, memoria de trabajo, secuenciación e inhibición.

### MUS-004 Ritmo y movimiento

```yaml
id: MUS-004
nombre: "Ritmo y movimiento"
modulo: musica
tipo: "música + dual task"
dominios: ["ritmo", "inhibición", "coordinación", "atención", "movimiento"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL, demencia leve; cualquier nivel motor con adaptación."
requisito: "Puede realizar movimientos rítmicos simples."
```

**Objetivo:** Combinar sincronización rítmica, coordinación motora y atención.

**Materiales:** Música con pulso claro.

**Cómo realizarla:**

1. Marcar el pulso con palmas o pies.
2. Agregar movimiento alterno de brazos.
3. Cuando la música se detenga, detener el movimiento.
4. Reiniciar cuando vuelva el sonido.

**Progresión:** Sentado → de pie → cambio de movimiento por señal → añadir categoría verbal.

**Adaptación:** Motor Rojo: toda la actividad sentada. Demencia moderada: imitación simultánea.

**⚠️ Precauciones:** Controlar volumen, velocidad y seguridad postural.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que seguir el ritmo de una canción mientras nos movemos nos ayuda a trabajar la atención y la coordinación?
- Evidencia: La investigación ha encontrado beneficios tanto en las actividades musicales activas como en las actividades que combinan movimiento y retos mentales. 🎵🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestro ritmo, atención, coordinación, control de nuestras respuestas y movimiento mientras seguimos la música!

**🎯 Objetivo esperado:** Favorecer la combinación de sincronización rítmica, coordinación motora y atención.

### MUS-005 Categorías al compás

```yaml
id: MUS-005
nombre: "Categorías al compás"
modulo: musica
tipo: "música + fluencia"
dominios: ["fluencia", "atención", "velocidad de procesamiento", "inhibición"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo y DCL; demencia leve con adaptación."
requisito: "Puede producir palabras por categoría."
```

**Objetivo:** Trabajar acceso semántico, velocidad de procesamiento y control rítmico.

**Materiales:** Metrónomo suave o canción instrumental con pulso estable.

**Cómo realizarla:**

1. Elegir una categoría sencilla.
2. Decir una palabra cada dos o cuatro pulsos, sin buscar velocidad alta.
3. Si se queda en blanco, ofrecer una pista.
4. Cambiar de categoría después de un bloque corto.

**Progresión:** Ritmo lento → moderado → alternar categorías por señal.

**Adaptación:** Demencia leve: familiar y persona alternan respuestas.

**⚠️ Precauciones:** El ritmo debe ayudar a organizar, no presionar. Disminuir velocidad si aumenta el error.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que combinar música y palabras nos ayuda a trabajar la rapidez para encontrar respuestas y mantener la atención?
- Evidencia: Las revisiones en personas con deterioro cognitivo han encontrado mejoras en algunas habilidades mentales y, en algunos estudios, en la fluidez verbal. 🎵🗣️✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra fluidez, atención, rapidez para responder y control de nuestras respuestas mientras seguimos el compás!

**🎯 Objetivo esperado:** Favorecer acceso semántico, velocidad de procesamiento y control rítmico.

### MUS-006 Percusión por secuencias

```yaml
id: MUS-006
nombre: "Percusión por secuencias"
modulo: musica
tipo: "música activa"
dominios: ["secuenciación", "coordinación", "memoria de trabajo", "atención"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL, demencia leve-moderada."
requisito: "Puede sostener o golpear un instrumento seguro."
```

**Objetivo:** Entrenar secuenciación, coordinación bilateral, memoria de trabajo y atención.

**Materiales:** Maracas, tambor pequeño, claves o superficies seguras.

**Cómo realizarla:**

1. Asignar dos sonidos diferentes a dos acciones.
2. Modelar una secuencia corta: A-B-A.
3. Pedir imitación.
4. Repetir y cambiar la secuencia.

**Progresión:** 2 sonidos → 3 sonidos → secuencia más larga → cambio de regla.

**Adaptación:** Demencia moderada: tocar al mismo tiempo que el familiar; no exigir recuerdo diferido.

**⚠️ Precauciones:** Evitar instrumentos pesados, frágiles o muy ruidosos.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que participar activamente en actividades musicales tiene beneficios para nuestras habilidades mentales?
- Evidencia: Un meta-análisis en personas con deterioro cognitivo encontró una mejora pequeña pero significativa en la cognición al participar en actividades musicales. 🥁🧠✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra memoria, atención, coordinación y capacidad para seguir secuencias mientras hacemos percusión!

**🎯 Objetivo esperado:** Favorecer el entrenamiento de secuenciación, coordinación bilateral, memoria de trabajo y atención.

### MUS-007 Playlist para regular el estado de ánimo

```yaml
id: MUS-007
nombre: "Playlist para regular el estado de ánimo"
modulo: musica
tipo: "escucha musical personalizada"
dominios: ["regulación emocional", "participación", "conexión social", "autobiográfica"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Demencia leve-moderada; también cuidadores con objetivo de interacción."
requisito: "Familia conoce música preferida y puede observar respuesta."
```

**Objetivo:** Utilizar música preferida como apoyo para conexión, calma o activación según respuesta individual.

**Materiales:** Playlist breve personalizada.

**Cómo realizarla:**

1. Seleccionar 3-5 canciones realmente preferidas por la persona.
2. Elegir una según objetivo: conexión, actividad tranquila o transición.
3. Observar conducta antes, durante y después.
4. Registrar en la app si produjo calma, activación, canto, interacción o malestar.

**Progresión:** Construir perfiles de respuesta por canción y momento del día.

**Adaptación:** En demencia avanzada usar fragmentos breves y detener si hay signos de incomodidad.

**⚠️ Precauciones:** Esta actividad domiciliaria no debe etiquetarse como musicoterapia. Individualizar siempre: una canción alegre para el cuidador puede no serlo para la persona.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que la música puede ayudarnos a mejorar nuestro bienestar emocional y conectar con los demás?
- Evidencia: Una revisión Cochrane de 2025 encontró beneficios de las intervenciones basadas en música en el bienestar emocional y la conducta de personas con demencia. 🎵❤️✨
- Cierre: ¡Por eso hoy vamos a estimular nuestra regulación emocional, participación, conexión social y recuerdos personales a través de una playlist especial!

**🎯 Objetivo esperado:** Favorecer el uso de música preferida como apoyo para conexión, calma o activación según respuesta individual.

### MUS-008 Conversación musical guiada

```yaml
id: MUS-008
nombre: "Conversación musical guiada"
modulo: musica
tipo: "música + lenguaje + vínculo"
dominios: ["lenguaje", "juicio simple", "preferencia", "emoción", "interacción social"]
duracion_min: [8, 10]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve y moderada."
requisito: "Puede escuchar y responder verbal o no verbalmente."
```

**Objetivo:** Usar música como facilitador de conversación, elección y participación social.

**Materiales:** Dos canciones contrastantes y conocidas.

**Cómo realizarla:**

1. Escuchar un fragmento breve de la primera canción.
2. Preguntar algo simple: «¿Le gusta?», «¿le da calma o energía?»
3. Escuchar la segunda y comparar.
4. Explorar cuál elegiría para bailar, descansar, viajar o celebrar.
5. Registrar preferencias para futuras asignaciones.

**Progresión:** Elección binaria → justificar elección → asociar a una etapa de vida.

**Adaptación:** Demencia moderada: respuestas sí/no, gesto, sonrisa o elección visual.

**⚠️ Precauciones:** Respetar rechazo y silencio. No mantener música de fondo permanente si la persona no la disfruta.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que la música favorece la participación y la interacción con otras personas?
- Evidencia: La investigación en personas con demencia ha encontrado beneficios en la participación y la conducta social al utilizar actividades musicales. 🎵💬❤️
- Cierre: ¡Por eso hoy vamos a estimular nuestro lenguaje, capacidad para elegir, emociones e interacción social mientras escuchamos y conversamos sobre diferentes canciones!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

---

## Módulo 4: Reminiscencia, Identidad y Regulación Emocional

### REM-001 Mi línea de vida

```yaml
id: REM-001
nombre: "Mi línea de vida"
modulo: reminiscencia
tipo: "reminiscencia autobiográfica estructurada"
dominios: ["memoria autobiográfica", "orientación temporal", "identidad", "lenguaje", "regulación emocional"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve; versión simplificada en demencia moderada."
requisito: "Puede conversar sobre al menos algunos periodos vitales o la familia dispone de información biográfica."
```

**Objetivo:** Construir una narrativa de vida centrada en experiencias significativas y recursos personales.

**Materiales:** Fotografías, fechas aproximadas, tarjetas de etapas vitales.

**Cómo realizarla:**

1. Elegir una etapa: infancia, juventud, trabajo, familia o actualidad.
2. Presentar 1-3 fotografías u objetos relacionados.
3. Preguntar por personas, lugares, actividades y emociones, sin exigir fechas exactas.
4. Resumir al final una idea positiva o significativa que haya surgido.
5. Registrar qué temas generan mayor conexión para futuras actividades.

**Progresión:** Una etapa → varias etapas → ordenar hitos → construir álbum/línea de vida digital.

**Adaptación:** Demencia moderada: trabajar una fotografía por vez, aportar nombres y contexto y usar preguntas cerradas.

**⚠️ Precauciones:** No corregir detalles autobiográficos menores si no comprometen seguridad. Si aparece angustia sostenida, cambiar de tema y priorizar contención.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que recordar momentos importantes de nuestra vida puede ayudarnos a mantener vivos nuestros recuerdos y fortalecer nuestra identidad?
- Evidencia: Los meta-análisis sobre reminiscencia han encontrado beneficios en la memoria, el bienestar emocional y la calidad de vida de personas con deterioro cognitivo. 📸❤️✨
- Cierre: ¡Por eso hoy vamos a recorrer diferentes etapas de nuestra vida, recordar momentos especiales y conversar sobre las personas, lugares y experiencias que han sido importantes para nosotros!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### REM-002 Una fotografía, una conversación

```yaml
id: REM-002
nombre: "Una fotografía, una conversación"
modulo: reminiscencia
tipo: "reminiscencia visual"
dominios: ["memoria autobiográfica", "lenguaje", "reconocimiento", "identidad", "conexión social"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve y moderada."
requisito: "Responde a imágenes familiares o puede participar verbal/no verbalmente."
```

**Objetivo:** Usar una fotografía como clave para facilitar conversación y vínculo.

**Materiales:** Una fotografía familiar o de un lugar significativo.

**Cómo realizarla:**

1. Mostrar la fotografía y dar contexto si es necesario.
2. Evitar comenzar con «¿quién es?»; preferir «Esta es Ana, su hermana…».
3. Preguntar por actividades, sensaciones o costumbres relacionadas.
4. Validar gestos, sonrisas y emociones como respuestas.
5. Finalizar con una frase de conexión: «Qué bonito recordar este paseo juntos».

**Progresión:** Foto única → dos fotos de una época → comparar etapas → álbum temático.

**Adaptación:** Demencia moderada: aportar la información y permitir que la persona reaccione sin demanda de recuerdo.

**⚠️ Precauciones:** Evitar insistencia ante falta de reconocimiento.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que mirar fotografías significativas ayuda a despertar recuerdos y facilita la conversación?
- Evidencia: Las investigaciones sobre reminiscencia muestran mejores resultados cuando se utilizan recuerdos personales y se comparten con otras personas. 📷❤️✨
- Cierre: ¡Por eso hoy vamos a mirar una fotografía especial, recordar lo que vivimos y conversar juntos sobre las personas, lugares y momentos que aparecen en ella!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### REM-003 Objetos de mi historia

```yaml
id: REM-003
nombre: "Objetos de mi historia"
modulo: reminiscencia
tipo: "reminiscencia con objetos"
dominios: ["memoria semántica", "autobiográfica", "praxias", "identidad ocupacional", "regulación emocional"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL y demencia leve-moderada; adaptable a avanzada."
requisito: "Existe un objeto seguro ligado a un oficio, hobby, hogar o rol familiar."
```

**Objetivo:** Conectar con roles y capacidades preservadas mediante objetos significativos.

**Materiales:** Utensilio de cocina, herramienta segura, costura, cartera, brocha, libro, etc.

**Cómo realizarla:**

1. Presentar el objeto y permitir exploración.
2. Preguntar primero para qué se usaba, no necesariamente cómo se llama.
3. Modelar el gesto si no aparece.
4. Explorar quién lo usaba, dónde y en qué etapa.
5. Reconocer el rol: «Usted cocinaba mucho para su familia».

**Progresión:** Objeto visible → varios objetos de un mismo rol → ordenar una secuencia funcional.

**Adaptación:** Demencia avanzada: manipulación, gesto y comentario biográfico del familiar.

**⚠️ Precauciones:** Priorizar objetos grandes, limpios y seguros.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que los objetos que han formado parte de nuestra vida pueden ayudarnos a conectar con recuerdos, roles y experiencias importantes?
- Evidencia: La reminiscencia utiliza objetos y otras claves personales para reforzar la continuidad de nuestra identidad y la comunicación. 👜🧠❤️
- Cierre: ¡Por eso hoy vamos a explorar un objeto especial, recordar para qué lo usábamos y conversar sobre las personas, actividades y momentos relacionados con él!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### REM-004 La receta de mi familia

```yaml
id: REM-004
nombre: "La receta de mi familia"
modulo: reminiscencia
tipo: "reminiscencia sensorial y cultural"
dominios: ["memoria autobiográfica", "semántica", "secuenciación", "olfato", "identidad cultural", "emoción"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve y moderada."
requisito: "Historia familiar vinculada a cocina y tolerancia a aromas/alimentos."
```

**Objetivo:** Evocar rutinas y vínculos familiares mediante ingredientes y recetas.

**Materiales:** Fotografía de comida, especias/aromas seguros, utensilio.

**Cómo realizarla:**

1. Elegir una receta significativa.
2. Presentar un aroma o fotografía.
3. Preguntar quién la preparaba y en qué ocasiones.
4. Reconstruir algunos pasos sin exigir exactitud.
5. Si es apropiado, terminar hablando de una tradición familiar asociada.

**Progresión:** Un ingrediente → varios ingredientes → ordenar pasos → crear ficha digital de receta e historia.

**Adaptación:** Demencia moderada: ofrecer opciones y narrar juntos.

**⚠️ Precauciones:** No utilizar degustación automática desde la app sin filtros de disfagia, alergias y dieta.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que los aromas, ingredientes y recetas familiares pueden despertar recuerdos de momentos importantes y mantener vivas nuestras tradiciones?
- Evidencia: La reminiscencia ha demostrado beneficios en el bienestar emocional y la calidad de vida, especialmente cuando se relaciona con experiencias personales. 🍲❤️✨
- Cierre: ¡Por eso hoy vamos a recordar una receta especial, hablar de quién la preparaba y reconstruir juntos algunos de sus pasos y las historias que la acompañan!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### REM-005 Mi música, mi momento

```yaml
id: REM-005
nombre: "Mi música, mi momento"
modulo: reminiscencia
tipo: "reminiscencia musical + regulación"
dominios: ["memoria autobiográfica", "emoción", "identidad", "conexión", "regulación emocional"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL y demencia leve-moderada."
requisito: "Se conocen preferencias musicales reales de la persona."
```

**Objetivo:** Usar música personalmente significativa para facilitar recuerdo y observar su efecto regulador.

**Materiales:** 1-2 canciones significativas.

**Cómo realizarla:**

1. Elegir una canción vinculada a una etapa conocida.
2. Preguntar primero cómo le hace sentir.
3. Explorar si aparece una persona, lugar o actividad.
4. Observar si aumenta calma, activación, canto o interacción.
5. Registrar la respuesta para construir un perfil musical personalizado.

**Progresión:** Una canción → playlist por etapas → seleccionar música según objetivo de calma o activación.

**Adaptación:** Demencia moderada/avanzada: escuchar juntos, cantar o acompañar con movimiento sin exigir relato.

**⚠️ Precauciones:** Actividad musical domiciliaria ≠ musicoterapia profesional. No asumir que música lenta siempre calma o música alegre siempre activa.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que una canción especial puede despertar recuerdos y emociones, y favorecer momentos de conexión?
- Evidencia: La investigación ha encontrado beneficios de las intervenciones basadas en música en el bienestar emocional y la conducta de personas con demencia. 🎵❤️✨
- Cierre: ¡Por eso hoy vamos a escuchar una canción importante, recordar lo que nos hace sentir y descubrir qué personas, lugares o momentos nos trae a la memoria!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### REM-006 Un recuerdo que me da calma

```yaml
id: REM-006
nombre: "Un recuerdo que me da calma"
modulo: reminiscencia
tipo: "reminiscencia positiva guiada"
dominios: ["regulación emocional", "autobiográfica", "atención interna", "lenguaje emocional"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve; uso muy guiado en moderada."
requisito: "Puede identificar o responder a una experiencia asociada a seguridad, afecto o bienestar."
```

**Objetivo:** Utilizar un recuerdo seguro como recurso de regulación, sin negar emociones actuales.

**Materiales:** Foto, objeto o música asociada a una experiencia de seguridad/bienestar.

**Cómo realizarla:**

1. Seleccionar previamente un recuerdo que la familia sepa que suele ser agradable.
2. Presentar una sola clave.
3. Preguntar qué sensación corporal o emocional aparece.
4. Invitar a describir un detalle concreto: lugar, persona, sonido o actividad.
5. Cerrar orientando al presente: «Estamos aquí juntos y podemos volver a esta música/foto cuando quiera».

**Progresión:** Clave única → combinar dos claves → crear banco personal de recursos reguladores.

**Adaptación:** Demencia moderada: familiar narra brevemente la escena y observa respuesta.

**⚠️ Precauciones:** No usar «pensamiento positivo» para invalidar tristeza. Si aumenta angustia, detener.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que recordar experiencias agradables puede apoyar nuestro bienestar emocional?
- Evidencia: Los meta-análisis sobre reminiscencia han encontrado beneficios en el bienestar y la calidad de vida de personas con deterioro cognitivo. 🌿❤️✨
- Cierre: ¡Por eso hoy vamos a traer a la mente un recuerdo que nos haga sentir bien, hablar sobre él y conectar con las sensaciones y emociones que nos transmite!

**🎯 Objetivo esperado:** Favorecer el uso de un recuerdo seguro como recurso de regulación, sin negar emociones actuales.

### REM-007 Álbum digital de vida

```yaml
id: REM-007
nombre: "Álbum digital de vida"
modulo: reminiscencia
tipo: "reminiscencia digital personalizada"
dominios: ["identidad", "autobiográfica", "comunicación", "participación social"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL y demencia leve; moderada con acompañamiento."
requisito: "Familia puede aportar fotos, nombres, música y contexto."
```

**Objetivo:** Crear un recurso digital personalizado que facilite conversaciones recurrentes.

**Materiales:** App IntegraMente, fotografías, audios breves, nombres y etiquetas.

**Cómo realizarla:**

1. Seleccionar 5-10 elementos significativos.
2. Añadir contexto breve: quién, dónde, etapa y por qué es importante.
3. Presentar pocos elementos por sesión.
4. Permitir que el familiar converse y aporte claves.
5. Registrar qué elementos generan mayor participación.

**Progresión:** Álbum básico → capítulos por etapa → incorporar audio/música → historias familiares compartidas.

**Adaptación:** Demencia moderada: navegación a cargo del familiar, pantalla simple y un estímulo por vez.

**⚠️ Precauciones:** No presentar la modalidad digital como superior de forma definitiva. Proteger privacidad y consentimiento para fotos/historias.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que guardar fotografías y recuerdos personales puede facilitar conversaciones y mantener viva nuestra historia?
- Evidencia: Una revisión de 2025 encontró resultados favorables para la reminiscencia digital frente a la atención habitual, especialmente cuando está personalizada y permite compartir con otras personas. 📱❤️✨
- Cierre: ¡Por eso hoy vamos a crear un álbum con fotografías y recuerdos importantes para conversar, compartir historias y mantener presentes momentos especiales de nuestra vida!

**🎯 Objetivo esperado:** Favorecer una experiencia que permita un recurso digital personalizado que facilite conversaciones recurrentes. `TODO: redacción a revisar`

### REM-008 Celebraciones y tradiciones

```yaml
id: REM-008
nombre: "Celebraciones y tradiciones"
modulo: reminiscencia
tipo: "reminiscencia cultural"
dominios: ["identidad", "orientación temporal", "autobiográfica", "pertenencia", "regulación emocional"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve y moderada."
requisito: "Tradiciones culturales/religiosas/familiares conocidas y aceptadas por la persona."
```

**Objetivo:** Conectar con rutinas y tradiciones significativas que aportan continuidad personal.

**Materiales:** Fotografías, música, objetos o aromas de una celebración.

**Cómo realizarla:**

1. Elegir una tradición significativa.
2. Presentar uno o dos estímulos relacionados.
3. Conversar sobre cómo se celebraba, con quién y qué se hacía.
4. Comparar suavemente pasado y presente sin exigir precisión.
5. Finalizar con una actividad pequeña relacionada si es apropiado.

**Progresión:** Una tradición → calendario autobiográfico anual → comparar generaciones.

**Adaptación:** Demencia moderada: narración compartida y estímulos simples.

**⚠️ Precauciones:** Personalizar según cultura y creencias; nunca asumir tradiciones por edad o procedencia.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que recordar nuestras celebraciones y tradiciones puede fortalecer el sentido de identidad y pertenencia?
- Evidencia: La investigación sobre reminiscencia ha encontrado beneficios en la calidad de vida y el bienestar emocional, especialmente cuando se adapta a la historia personal y se comparte con otras personas. 🎉❤️✨
- Cierre: ¡Por eso hoy vamos a recordar una celebración especial, conversar sobre cómo la vivíamos y compartir las costumbres, personas y momentos que forman parte de nuestra historia!

**🎯 Objetivo esperado:** Favorecer una participación segura y significativa mediante esta actividad. `TODO: texto genérico, pendiente de redactar`

### REM-009 Historia de fortalezas

```yaml
id: REM-009
nombre: "Historia de fortalezas"
modulo: reminiscencia
tipo: "revisión de vida centrada en recursos"
dominios: ["identidad", "autoestima", "metacognición", "regulación emocional", "lenguaje"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "Preventivo, DCL y demencia leve."
requisito: "Puede reflexionar sobre logros, roles o estrategias de afrontamiento."
```

**Objetivo:** Reconectar con capacidades, roles y estrategias que han sido importantes a lo largo de la vida.

**Materiales:** Tarjetas con preguntas, fotos o hitos.

**Cómo realizarla:**

1. Elegir un reto pasado que la persona haya superado.
2. Preguntar qué hizo, quién la ayudó y qué aprendió.
3. Identificar una fortaleza concreta.
4. Relacionar esa fortaleza con una situación actual sencilla.
5. Registrar la fortaleza en un banco personal.

**Progresión:** Una fortaleza → mapa de recursos → integrar a plan de bienestar.

**Adaptación:** En DCL usar preguntas concretas y apoyos visuales.

**⚠️ Precauciones:** No convertir conflictos vitales complejos en una actividad automatizada.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que recordar los retos que hemos superado puede ayudarnos a reconocer nuestras capacidades y fortalecer nuestra autoestima?
- Evidencia: La reminiscencia ha demostrado beneficios en el bienestar y la calidad de vida, además de apoyar la continuidad de nuestra identidad. 💪❤️✨
- Cierre: ¡Por eso hoy vamos a recordar un reto que superamos, descubrir qué nos ayudó a lograrlo y reconocer una fortaleza que todavía forma parte de nosotros!

**🎯 Objetivo esperado:** Favorecer la reconexión con capacidades, roles y estrategias que han sido importantes a lo largo de la vida.

### REM-010 Reminiscencia compartida con la familia

```yaml
id: REM-010
nombre: "Reminiscencia compartida con la familia"
modulo: reminiscencia
tipo: "reminiscencia social"
dominios: ["conexión social", "comunicación", "identidad", "afecto", "regulación interpersonal"]
duracion_min: [10, 15]
frecuencia: "2 veces/semana o según plan individual"
perfil: "DCL, demencia leve-moderada y familias disponibles."
requisito: "Existe un familiar capaz de acompañar sin corregir ni confrontar."
```

**Objetivo:** Convertir el recuerdo en una experiencia de vínculo, no en una prueba de memoria.

**Materiales:** Una foto, canción u objeto.

**Cómo realizarla:**

1. El familiar presenta la clave y aporta contexto.
2. Usar frases como «Yo recuerdo que…» en vez de «¿se acuerda?»
3. Compartir también su propio recuerdo.
4. Observar qué emoción aparece y ajustar el ritmo.
5. Terminar con una actividad compartida breve: escuchar, mirar fotos o tomar café.

**Progresión:** Interacción de 5 minutos → 10-15 minutos → álbum o playlist compartida.

**Adaptación:** Demencia moderada: familiar lleva la narración y permite respuestas mínimas.

**⚠️ Precauciones:** Enseñar al cuidador a no discutir por discrepancias autobiográficas no peligrosas.

**🧠 La ciencia detrás de esta actividad:**

- Gancho: 🧠 ¿Sabías que compartir recuerdos con la familia ayuda a fortalecer la comunicación y el vínculo?
- Evidencia: Las revisiones recientes muestran buena participación en formatos de reminiscencia compartidos, y la interacción social es un elemento importante en estos espacios. 👨‍👩‍👧‍👦❤️✨
- Cierre: ¡Por eso hoy vamos a compartir una fotografía, canción u objeto especial, contar nuestros propios recuerdos y disfrutar juntos de ese momento!

**🎯 Objetivo esperado:** Favorecer una experiencia que permita convertir el recuerdo en una experiencia de vínculo, no en una prueba de memoria. `TODO: redacción a revisar`

---

## Pendientes de contenido detectados en la conversión

- **Objetivo esperado genérico** ("Favorecer una participación segura y significativa mediante esta actividad."): SEN-003, MOV-008, MUS-008, REM-001, REM-002, REM-003, REM-004, REM-005, REM-008. No es un objetivo real; falta redactarlo.
- **Objetivo esperado con redacción defectuosa** ("Favorecer una experiencia que permita..."): SEN-008, REM-007, REM-010.
- **Evidencia sin referencias**: los bloques de ciencia citan estudios (TU Dresden, Cochrane 2025, meta-análisis 2025, revisión 2026, etc.) sin cita bibliográfica. Agregar referencia (autor, año, DOI) antes de publicar.
- **Redundancias eliminadas en la conversión**: en el original, "Reglas" repetía "¿Para quién?" y "Etiquetas" repetía "¿Qué estamos estimulando?". Aquí se separaron en `perfil`, `requisito`, `tipo` y `dominios` sin perder información.
