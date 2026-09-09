# IntegraMente en Casa: Especificación de Implementación
## Cuestionario de Perfilamiento (Módulo Autoguiado)

> Fuente: "PROGRAMA_INTEGRAMENTE_Arquitectura_General_del_Flujo_y_Cuestionario_de_Perfilamiento (Módulo Autoguiado)". Este documento reorganiza ese contenido en una especificación accionable para implementación. No es un resumen: conserva textos exactos de UI, nombres de variables, opciones y reglas de ramificación tal como están definidos en el documento original.

---

## 0. Cómo usar este documento

Este documento tiene tres tipos de contenido, diferenciados para que la implementación sea fiel:

1. **Copy exacto de UI** (preguntas, opciones, mensajes): debe implementarse literal, no parafrasearse. Está en cursiva o en tablas marcadas como "Texto UI".
2. **Reglas de negocio y ramificación**: lógica que debe quedar codificada en el motor de flujo (condiciones de entrada, siguiente pantalla, efectos).
3. **Notas de implementación**: recomendaciones mías (no del documento original) sobre arquitectura técnica, marcadas explícitamente como "Nota de implementación".

Al final hay una sección **§13 Ambigüedades y huecos detectados** con puntos del documento fuente que no quedan resueltos y deben confirmarse antes o durante la implementación. No los inventé ni los resolví por mi cuenta.

**Regla de oro:** el semáforo (verde/amarillo/rojo) nunca se muestra al usuario. Ninguna alerta detiene el registro completo salvo que se indique explícitamente. El texto libre nunca dirige el algoritmo por sí solo, solo las respuestas estructuradas lo hacen.

---

## 1. Arquitectura general del flujo

El sistema procesa las respuestas del cuestionario autoguiado para generar, al final, perfiles independientes en 7 áreas:

- Cognitivo (semáforo verde/amarillo/rojo)
- Emocional y bienestar (modificador, sin semáforo propio)
- Funcional (semáforo)
- Físico (semáforo)
- Nutricional (semáforo)
- Nivel de acompañamiento (modificador)
- Preferencias e intereses (modificador)

Los componentes **emocional, conductual, sueño, vida social, acompañamiento e intereses NO generan un color independiente**. Funcionan como modificadores de actividades, alertas, etiquetas de personalización o condiciones de supervisión.

Una persona puede presentar niveles distintos simultáneamente (ej.: cognitivo amarillo, físico verde, funcional amarillo, nutricional rojo). El modelo de datos debe permitir 4 semáforos independientes por persona, no un score único.

---

## 2. Orden obligatorio de procesamiento

Implementar como pipeline secuencial, en este orden exacto:

1. Detectar alertas de salud o seguridad.
2. Calcular cada nivel (cognitivo, físico, funcional, nutricional) por separado.
3. Aplicar la regla de "mayor apoyo": **rojo prevalece sobre amarillo, amarillo prevalece sobre verde**. Nunca promediar ni combinar semáforos entre sí.
4. Cruzar el resultado con la disponibilidad de acompañamiento (variable `disponibilidad_acompañante`, pantalla INT-04).
5. Filtrar recursos incompatibles (restricciones médicas, alergias, seguridad para tragar, restricciones de movimiento, etc.).
6. Personalizar por intereses, historia de vida y rutina.

**Las alertas nunca modifican automáticamente el color de un semáforo.** Una alerta puede suspender temporalmente contenidos específicos aunque el perfil general sea verde. Ambos sistemas (semáforo + alertas) deben almacenarse y evaluarse por separado.

---

## 3. Reglas globales de voz y tono (aplican a toda la interfaz)

- Cálida y respetuosa.
- Adulta, nunca infantilizante.
- Cercana, pero no excesivamente informal.
- Centrada en capacidades y apoyos, no únicamente en dificultades.
- **Nunca** mencionar puntajes, escalas o clasificaciones internas (ej.: nunca decir "usted obtuvo un perfil rojo").
- **Nunca** confirmar diagnósticos.
- Uso natural del nombre de la persona: fluido, no repetitivo, para evitar sonar automatizado.
- **Nunca** usar en la interfaz orientada a la persona/familia términos clínicos crudos como "delirios", "alucinaciones", "desinhibición". Cuando el diagnóstico (demencia/Alzheimer) pueda generar angustia, usar expresiones como "plan de salud cerebral", "actividades para mantenerse activo" o "rutina de bienestar" en vez del nombre clínico. No mentir ni confrontar.

### 3.1 Tratamiento según el rol del respondente

| Quién responde | Forma de dirigirse en la interfaz |
|---|---|
| La propia persona | "Queremos conocerte mejor..." (segunda persona, "vos") |
| Familiar o cuidador | "Queremos conocer mejor a [nombre]..." |
| Profesional | "Queremos conocer mejor a su paciente..." |
| Nombre no ingresado | "Queremos conocer mejor a la persona que realizará las actividades..." |

**Nota de implementación:** construir un motor de plantillas de texto (no hardcodear cada variante) que resuelva expresiones como "vos", "don Juan", "doña Ana", "tu familiar", "su paciente" a partir de las variables de sistema del §4. Cada pantalla que use `[nombre]` en este documento debe resolverse dinámicamente contra `nombre_participante` + `tratamiento_preferido`, y cada pantalla con variantes "si responde la propia persona / si responde otra persona" debe ramificar por `rol_respondente` y `participante_es_respondente`.

---

## 4. Variables del sistema (backend) — núcleo de identidad

| Variable | Descripción |
|---|---|
| `rol_respondente` | Quién completa el cuestionario (pantalla 2) |
| `participante_es_respondente` | Booleano derivado: ¿la persona que responde es la evaluada? |
| `nombre_participante` | Nombre de la persona evaluada (pantalla 3) |
| `tratamiento_preferido` | Nombre simple / Don-Doña + nombre / sin tratamiento (pantalla 3) |
| `referencia_persona` | Forma de referirse a la persona, construida dinámicamente |
| `relacion_otro` | Solo si `rol_respondente` = "Otra persona" |

Estas variables permiten construir automáticamente frases como "vos", "don Juan", "doña Ana", "tu familiar", "su paciente".

---

## 5. Perfiles principales de clasificación

El sistema genera **cuatro clasificaciones independientes**, cada una verde / amarillo / rojo:

- `nivel_cognitivo`
- `nivel_fisico`
- `nivel_funcional`
- `nivel_nutricional`

Regla general de prioridad para las tres clasificaciones que la usan explícitamente:
1. Evaluar primero criterios rojos.
2. Si no hay rojo, evaluar amarillos.
3. Si no hay rojo ni amarillo, asignar verde.
4. Las alertas agudas se almacenan aparte, nunca sustituyen este cálculo.
5. Un diagnóstico informado (ej. demencia) **no determina por sí solo** ningún color; el color se calcula siempre de las respuestas funcionales.

Las reglas de corte de cada semáforo están detalladas en la sección de cada bloque (§7 a §10) y consolidadas en §11.

---

## 6. Flujo de pantallas: Etapas 1-3 (identificación)

### Etapa 1. Bienvenida y definición de quién responde

**Pantalla 1. Bienvenida**
- Texto UI: "Nos alegra acompañarte. Antes de comenzar, queremos conocer un poco más sobre la persona que realizará las actividades. Esto nos permitirá preparar recomendaciones que realmente se ajusten a sus necesidades, capacidades e intereses. Solo tomará unos minutos."
- Botón: Comenzar.
- No guarda variable clínica.

**Pantalla 2. ¿Quién está respondiendo?**
- Texto UI: "Para comenzar, cuéntanos: ¿quién está completando esta información?"
- Opciones: (1) Estoy respondiendo para mí. (2) Soy familiar de la persona. (3) Soy su cuidador o cuidadora. (4) Soy un profesional. (5) Otra persona.
- Variable: `rol_respondente`.
- Ramificación de voz: "Para mí" → segunda persona ("vos"); "Familiar" → voz cercana; "Cuidador" → voz de acompañamiento cotidiano; "Profesional" → voz neutra ("su paciente"); "Otra persona" → abre `relacion_otro`.

### Etapa 2. Conocer a la persona

**Transición de entrada** (según rol):
- Propia persona: "Queremos conocerte un poco mejor. Con esta información podremos preparar actividades y recomendaciones más cercanas a tu realidad."
- Familiar/cuidador: "Queremos conocer un poco mejor a tu familiar. Con esta información podremos preparar actividades y recomendaciones que se ajusten a su vida cotidiana."
- Profesional: "Queremos conocer un poco mejor a su paciente. La información permitirá adaptar el contenido a sus características y necesidades actuales."
- Botón: Continuar.

**Pantalla 3. Nombre**
- Pregunta (propia persona): "¿Cómo te gustaría que te llamemos?" / (otra persona): "¿Cómo se llama la persona para quien prepararemos el plan?"
- Campo: texto corto, opcional. Variable: `nombre_participante`.
- Sub-pregunta (tratamiento preferido): "¿Cómo prefieres que nos refiramos a él o ella?" Opciones: Nombre simple (ej. Juan) / Don-Doña + Nombre (ej. Don Juan) / Sin tratamiento específico. Variable: `tratamiento_preferido`.

**Pantalla 4. Edad**
- Pregunta: "¿Cuántos años tiene [nombre]?" / "¿Cuántos años tienes?"
- Campo: número, con opción "No conozco la edad exacta". Variable: `edad`.

**Pantalla 5. Escolaridad**
- Pregunta: "¿Cuál es el nivel educativo más alto que completó [nombre]?"
- Opciones: No asistió a educación formal / Primaria incompleta / Primaria completa / Secundaria incompleta / Secundaria completa / Formación técnica / Universidad / Posgrado / No lo sé. Variable: `escolaridad`.

**Pantalla 6A. Situación ocupacional actual**
- Pregunta: "¿Actualmente [nombre] trabaja, está pensionado o realiza principalmente actividades en casa?"
- Opciones: Trabaja actualmente / Está pensionado o jubilado / Se dedica principalmente al hogar / Realiza trabajo voluntario / No trabaja actualmente / Otro. Variable: `situacion_ocupacional_actual`.

**Pantalla 6B. Ocupación e historia laboral**
- Pregunta: "¿A qué se dedicó la mayor parte de su vida?"
- Campo: texto corto. Ejemplo visible: "Por ejemplo: docente, agricultor, comerciante, ama de casa, secretaria, profesional en salud..." Opciones adicionales: Escribir ocupación / Prefiero responderlo después / No lo sé. Variable: `ocupacion_principal`.
- **Uso posterior:** la ocupación se usa para generar actividades significativas (ej.: "Como don Juan trabajó durante muchos años como comerciante, incluiremos algunas actividades relacionadas con organización, cálculo cotidiano y toma de decisiones"). Es fuente de identidad, memoria autobiográfica y habilidades preservadas, no solo un dato demográfico: debe quedar disponible para el motor de personalización de actividades, no solo para reporting.

**Pantalla 7. Convivencia**
- Pregunta: "¿Con quién vive actualmente [nombre]?" (permite varias respuestas)
- Opciones: Vive solo / Con su pareja / Con hijos u otros familiares / Con una persona cuidadora / En una residencia o centro / Otro. Variable: `convivencia_actual[]` (multi).
- **Condicional:** si marca "vive solo" → "¿Cuenta con alguien que lo visite o le ayude con regularidad?" Opciones: Sí, todos los días / Sí, varias veces por semana / Ocasionalmente / No cuenta con apoyo habitual / No lo sé. Variable: `frecuencia_apoyo`. Este dato influye en qué actividades pueden asignarse con acompañamiento.

**Pantalla 8. Momento de mejor funcionamiento**
- Pregunta: "¿En qué momento del día suele sentirse o desenvolverse mejor [nombre]?"
- Opciones: En la mañana / Al mediodía / En la tarde / En la noche / Varía mucho / No lo sé. Variable: `mejor_momento_dia`.
- **Uso:** permite sugerir horarios de actividades (ej.: concentrar actividades que requieren mayor concentración en el momento reportado).

### Etapa 3. Transición hacia los bloques clínicos
- Texto UI: "Gracias. Ya conocemos un poco mejor a [nombre]. Ahora te haremos algunas preguntas sobre su salud, su vida cotidiana y las actividades que disfruta. No hay respuestas correctas o incorrectas: queremos comprender qué le resulta fácil, en qué necesita apoyo y qué cosas son importantes para él o ella."
- Botón: Continuar.

---

## 7. Bloque 1 — Salud general, antecedentes médicos y cambios cognitivos

**Objetivo interno:** conocer el estado general de salud; identificar condiciones que modifican recomendaciones; detectar cambios recientes que requieren consulta profesional; registrar si existe diagnóstico cognitivo formal; diferenciar entre DCL, síndrome demencial, otro diagnóstico, ausencia de diagnóstico o desconocimiento; conocer evolución y preocupaciones principales; activar preguntas específicas de demencia cuando corresponda; **evitar que la aplicación interprete síntomas como diagnóstico**.

### 7.1 Transición e introducción

**SG-00** (transición, 3 variantes por rol):
- Propia persona: "Ahora queremos conocer un poco sobre tu salud general y saber si has notado cambios en tu memoria o en tu manera de desenvolverte. Esta información nos ayudará a seleccionar recomendaciones adecuadas y seguras para vos."
- Familiar/cuidador: "Ahora queremos conocer un poco sobre la salud general de [nombre] y saber si han observado cambios en su memoria o en su manera de desenvolverse. Esta información nos ayudará a seleccionar recomendaciones adecuadas y seguras para [referencia_persona]."
- Profesional: "Ahora queremos conocer algunos antecedentes de salud de [nombre] y su situación cognitiva actual. Esta información permitirá adaptar el plan a sus necesidades y condiciones de seguridad."
- Botón: Continuar → SG-01.

### 7.2 Salud general y antecedentes médicos

| ID | Pregunta (UI) | Opciones | Variable | Tipo | Siguiente / Ramificación |
|---|---|---|---|---|---|
| SG-01 | "En general, ¿cómo describirías la salud actual de [nombre]?" | Muy buena / Buena / Regular / Delicada / No lo sé | `salud_general_percibida` | única | → SG-02. *No determina color por sí sola; "Delicada" aumenta la prudencia y debe cruzarse con diagnósticos, síntomas y restricciones.* |
| SG-02 | "¿Tiene [nombre] alguna de las siguientes condiciones de salud?" (multi) | Presión alta / Diabetes / Colesterol o triglicéridos elevados / Enfermedad del corazón / Antecedentes de derrame o microinfartos / Parkinson / Epilepsia o convulsiones / Enfermedad renal / Enfermedad respiratoria / Enfermedad de tiroides / Dolor crónico, artritis o artrosis / Problemas de visión / Problemas de audición / Cáncer / Depresión / Trastorno de ansiedad / Otra condición / Ninguna de las anteriores / No lo sé | `antecedentes_medicos[]` | múltiple | "Ninguna" y "No lo sé" no combinables entre sí ni con otras. Si "Otra condición" → SG-02A. Si no → SG-03. |
| SG-02A | "¿Cuál otra condición de salud deberíamos tomar en cuenta?" | texto corto, opcional | `otro_antecedente_medico` | texto | → SG-03 |
| SG-03 | "Durante el último año, ¿ha vivido [nombre] alguna de estas situaciones?" (multi) | Derrame o evento cerebrovascular / Golpe importante en la cabeza / Convulsiones / Cirugía importante / Hospitalización prolongada / Infección o enfermedad grave / Caída con lesión / Ninguna / No lo sé | `eventos_salud_ultimo_año[]` | múltiple | Cualquier evento → SG-03A. "Ninguna"/"No lo sé" → SG-04. |
| SG-03A | "Después de esa situación, ¿notaron algún cambio en [nombre]?" | Sí, memoria/pensamiento / Sí, ánimo o conducta / Sí, movimiento o equilibrio / Sí, independencia / Sí, en varias áreas / No notaron cambios / No lo sé | `cambios_posteriores_evento[]` | múltiple | → SG-04. Se cruza después con bloques cognitivo, emocional, físico y funcional. |
| SG-04 | "¿Toma [nombre] medicamentos de manera regular?" | Sí, los organiza y toma por sí mismo / Sí, pero necesita recordatorios / Sí, otra persona los prepara o supervisa / Sí, otra persona debe administrárselos / No toma regularmente / No lo sé | `manejo_medicamentos` | única | Necesita recordatorios/supervisión/administración → SG-04A. Independiente, no toma o no sabe → SG-05. |
| SG-04A | "En los últimos meses, ¿ha olvidado dosis, repetido medicamentos o cometido algún error al tomarlos?" | No / Ocurrió una vez / Ha ocurrido varias veces / No lo sé | `errores_medicacion` | única | Regla: "una vez" → recomendar organización y supervisión; "varias veces" → **alerta funcional**, recomendar revisión del sistema de administración. La app nunca modifica horarios, dosis o medicamentos. → SG-05. |
| SG-05 | "En los últimos meses, ¿[nombre] ha presentado un cambio repentino en su memoria, orientación, conducta, estado de alerta o manera de desenvolverse?" | No / Sí / No estoy seguro | `cambio_agudo_reportado` | única | No → SG-06. Sí → SG-05A. No seguro → SG-05B. |

**SG-05A. Características del cambio** — "¿El cambio apareció en horas o en pocos días?" Opciones: Sí / No, ha ocurrido de manera gradual / No lo sé. Variable: `inicio_cambio_agudo`.
- Si "Sí": mostrar inmediatamente el mensaje "Gracias por indicarlo. Los cambios repentinos en la memoria, la conducta o el nivel de alerta pueden estar relacionados con una situación de salud que necesita atención. Recomendamos consultar con un profesional antes de iniciar actividades que requieran esfuerzo físico o cognitivo." Botones: "Entendido, continuar" / "Guardar y continuar después". **Acción interna:** `alerta_cambio_agudo = true`; NO bloquear el registro completo; no generar actividades exigentes; permitir completar el perfil; destacar la recomendación en el resumen final. → SG-06.
- Si "gradual": no activa alerta aguda. → SG-06.

**SG-05B. Ayuda para reconocer un cambio agudo** — "Para orientarte mejor: ¿has notado que [nombre] está mucho más confundido, somnoliento, agitado o diferente de lo habitual desde hace pocos días?" Opciones: Sí / No / Todavía no estoy seguro. Variable: `indicadores_cambio_agudo`. Sí → activar alerta (mismo efecto que SG-05A/Sí). No → continuar. No seguro → mostrar recomendación preventiva de consulta si el cambio continúa.

### 7.3 Primera gran bifurcación: diagnóstico cognitivo

**SG-06. Existencia de diagnóstico** — "¿Algún profesional le ha indicado a [nombre] un diagnóstico relacionado con su memoria, pensamiento o funcionamiento cognitivo?" Opciones y rutas:

| Respuesta | Ruta |
|---|---|
| Sí | SG-07 (identificar diagnóstico) |
| No | Ruta SD (sin diagnóstico) |
| No lo sé | Ruta ND (diagnóstico desconocido) |
| Está en proceso de valoración | Ruta EV (en proceso de valoración) |

Variable: `estado_diagnostico_cognitivo`.

### 7.4 Ruta "Sí": tipo de diagnóstico

**SG-07** — "¿Cuál diagnóstico le indicó el profesional? Selecciona la opción más cercana a lo que les explicaron." Opciones y ruteo:

| Opción | Ruta destino |
|---|---|
| Deterioro cognitivo leve | DCL-01 |
| Enfermedad de Alzheimer / Demencia vascular / con cuerpos de Lewy / frontotemporal / asociada a Parkinson / mixta / otro tipo de deterioro o demencia | DEM-01 |
| Otro diagnóstico que afecta memoria o pensamiento | OD-01 |
| No recuerdo el nombre del diagnóstico | ND-01 |

Variable: `diagnostico_cognitivo_informado`. **Debe guardarse explícitamente como diagnóstico informado por el usuario, no verificado clínicamente** (campo booleano o enum, ej. `origen_diagnostico = "informado_usuario"`).

**SG-07A** (opcional, aparece solo después de elegir diagnóstico) — "Si lo deseas, puedes escribir cómo aparece el diagnóstico en el informe o cómo se lo explicó el profesional." Campo texto libre breve. Botones: Guardar / Omitir. Variable: `diagnostico_texto_usuario`.

### 7.5 Ruta DCL

| ID | Pregunta | Opciones | Variable | Siguiente |
|---|---|---|---|---|
| DCL-01 | "¿Hace cuánto recibió [nombre] el diagnóstico de deterioro cognitivo leve?" | Menos de 6 meses / Entre 6 meses y 2 años / Entre 2 y 5 años / Más de 5 años / No lo sé | `tiempo_desde_diagnostico` | DCL-02 |
| DCL-02 | "Actualmente, ¿[nombre] continúa realizando la mayoría de sus actividades cotidianas por sí mismo?" | Sí, mantiene independencia / Sí, pero utiliza recordatorios o estrategias / Necesita ayuda en algunas actividades / Necesita ayuda frecuente / No lo sé | `autonomia_reportada_dcl` | EVOL-01 |

**Regla clínica DCL-02:** si se selecciona "ayuda frecuente", NO se cambia el diagnóstico. Se activa una revisión funcional más profunda, porque esa dependencia podría no ser congruente con un DCL informado o relacionarse con factores físicos, emocionales o ambientales (flag interno, ej. `revision_funcional_profunda = true`).

### 7.6 Ruta síndrome demencial

| ID | Pregunta | Opciones | Variable | Siguiente |
|---|---|---|---|---|
| DEM-01 | "¿Les han explicado en qué etapa se encuentra actualmente [nombre]?" | Etapa leve o inicial / Etapa moderada / Etapa avanzada / Les explicaron otra clasificación / No conocen la etapa | `etapa_demencia_informada` | "Otra clasificación" → DEM-01A; el resto → DEM-02 |
| DEM-01A | "¿Cómo les explicaron la etapa o el nivel de avance?" (ej.: GDS 4, CDR 1, etapa intermedia...) | campo opcional | `otra_clasificacion_demencia` | DEM-02 |
| DEM-02 | "¿Hace cuánto recibió el diagnóstico?" | Menos de 6 meses / Entre 6 meses y 2 años / Entre 2 y 5 años / Más de 5 años / No lo sé | `tiempo_desde_diagnostico` | DEM-03 |
| DEM-03 | "¿[nombre] conoce o comprende el diagnóstico que recibió?" *(importante para decidir cómo dirigirse a la persona y qué lenguaje usar)* | Sí, lo conoce y puede hablar del tema / Lo conoce pero le genera malestar / Parece comprenderlo solo parcialmente / No reconoce o no recuerda el diagnóstico / La familia prefiere no hablar del diagnóstico / No lo sé | `conciencia_diagnostico` | DEM-04 |
| DEM-04 | "Actualmente, ¿en cuáles áreas necesita más apoyo [nombre]?" (multi) | Recordar información reciente / Ubicarse en el día o fecha / Orientarse en lugares / Comprender instrucciones / Expresarse o encontrar palabras / Tomar decisiones / Organizar actividades cotidianas / Manejar emociones o conducta / Moverse con seguridad / Cuidar su alimentación / Aún no necesita apoyo importante / No lo sé | `areas_apoyo_demencia[]` | *Ver nota de ambigüedad en §13 (documento fuente indica "Siguiente: DEM-05" pero esa pantalla no está definida; ruta razonable es continuar a EVOL-01, confirmar antes de implementar).* |

**Uso interno DEM-03:** no mostrar palabras como "demencia" o "Alzheimer" en la interfaz personal si pueden generar angustia; usar "plan de salud cerebral", "actividades para mantenerse activo" o "rutina de bienestar"; no mentir ni confrontar; respetar permisos, consentimiento y configuración familiar/profesional al mostrar esta información.

### 7.7 Ruta "otro diagnóstico"

| ID | Pregunta | Variable | Siguiente |
|---|---|---|---|
| OD-01 | "¿Cuál diagnóstico le indicaron?" (ej.: secuelas de derrame, Parkinson, depresión, lesión cerebral...) — campo texto | `otro_diagnostico_cognitivo` | OD-02 |
| OD-02 | "¿Les explicaron si este diagnóstico puede estar relacionado con los cambios en la memoria o el pensamiento?" — Sí / No / No están seguros / No lo sé | `relacion_diagnostico_cognicion` | EVOL-01 |

### 7.8 Ruta sin diagnóstico

**SD-01** — "Aunque [nombre] no tiene un diagnóstico, ¿qué los motivó a buscar actividades para su salud cerebral?" Opciones y ruteo:

| Opción | Ruta |
|---|---|
| Desea prevenir y mantenerse activo | SD-02 |
| Ha notado algunos olvidos / La familia ha observado cambios / Dificultades de atención o concentración | SD-03 |
| Ha tenido cambios emocionales o mucho estrés | activar bloque emocional ampliado |
| Un profesional recomendó realizar actividades | SD-04 |
| Otro motivo | campo texto → SD-03 |
| No lo sé | SD-03 |

Variable: `motivo_sin_diagnostico`.

| ID | Pregunta | Opciones | Variable | Siguiente |
|---|---|---|---|---|
| SD-02 | "¿Qué le gustaría cuidar o fortalecer principalmente?" | Memoria / Atención y concentración / Agilidad mental / Organización y planificación / Lenguaje / Bienestar emocional / Mantenerse activo en general / Hábitos neuroprotectores (ejercicio físico y cognitivo, alimentación) / No está seguro | `objetivo_preventivo` | EVOL-01 |
| SD-03 | "En comparación con años anteriores, ¿han notado cambios en la memoria, el pensamiento o la manera de desenvolverse de [nombre]?" | No se han observado cambios / Cambios leves / Cambios evidentes / Los cambios interfieren con algunas actividades cotidianas / No lo sé | `cambio_cognitivo_sin_diagnostico` | SD-05. Regla: "no cambios" → perfil preventivo provisional; "leves" → continuar evaluación funcional; "evidentes"/"interfieren" → recomendar valoración profesional sin diagnosticar; mientras no haya alertas, la app puede generar actividades conservadoras. |
| SD-04 | "¿Qué tipo de profesional recomendó realizar actividades?" | Médico general / Geriatra / Neurólogo / Psiquiatra / Psicólogo o neuropsicólogo / Terapeuta / Otro / No lo sé | `profesional_referente` | SD-05 |
| SD-05 | "¿[nombre] ha recibido alguna valoración por sus cambios de memoria o pensamiento?" | Sí, resultados normales / Sí, continúa en seguimiento / Tiene cita pendiente / No ha sido valorado / No lo sé | `estado_valoracion_cognitiva` | EVOL-01. Si hay cambios evidentes y no ha sido valorado, mostrar: "Las actividades para la salud cerebral pueden ser beneficiosas, pero no sustituyen una valoración. Como nos indicaste que existen cambios evidentes, sería recomendable comentarlos con un profesional. Si gustas te podemos ayudar con esto y ponerte en contacto con alguno de nuestros profesionales." |

### 7.9 Ruta "No lo sé"

**ND-01** — "Está bien si no conoces el diagnóstico. ¿Alguna vez [nombre] ha sido valorado por cambios en su memoria o pensamiento?" Opciones: Sí / Tiene una valoración pendiente / No / No lo sé. Variable: `valoracion_cognitiva_conocida`.
- Cuando el respondente no conoce el diagnóstico, dirigir al bloque común **COG-01** (§8.1). Las respuestas del bloque cognitivo personalizan actividades, pero **no producen un diagnóstico**.

### 7.10 Ruta "En proceso de valoración"

| ID | Pregunta | Opciones | Variable | Siguiente |
|---|---|---|---|---|
| EV-01 | "¿Qué motivó la valoración de [nombre]?" | Quejas de la propia persona / Cambios observados por la familia / Recomendación médica / Cambios en actividades cotidianas / Cambios emocionales o conductuales / Otro motivo / No lo sé | `motivo_valoracion_actual` | EV-02 |
| EV-02 | "¿En qué etapa se encuentra la valoración?" | Cita pendiente / Ya realizó pruebas o exámenes / Esperando resultados / En seguimiento / No lo sé | `etapa_proceso_valoracion` | EVOL-01 |

### 7.11 Evolución cognitiva común

Aparece en todas las rutas, **excepto** cuando la persona eligió prevención y afirmó no tener cambios (en ese caso puede omitirse o mostrarse en versión abreviada).

| ID | Pregunta | Opciones | Variable | Siguiente |
|---|---|---|---|---|
| EVOL-01 | "¿Hace cuánto comenzaron a notar cambios en la memoria, el pensamiento o la forma de desenvolverse de [nombre]?" | No se han observado cambios / Menos de 6 meses / Entre 6 meses y 2 años / Entre 2 y 5 años / Más de 5 años / No lo sé | `tiempo_evolucion_cognitiva` | EVOL-02 |
| EVOL-02 | "Pensando en el último año, ¿cómo han evolucionado estos cambios?" | Se ha mantenido estable / Avanzado lentamente / Avanzado con rapidez / Periodos de mejoría y empeoramiento / Ha mejorado / No lo sé | `patron_evolucion_cognitiva` | EVOL-03. Regla: "avanzado con rapidez" NO implica urgencia automática, debe cruzarse con `tiempo_evolucion_cognitiva`: en horas/días → **alerta aguda**; en semanas/pocos meses → recomendación prioritaria de valoración; gradual durante el año → continuar flujo regular. |
| EVOL-03 | Propia persona: "En este momento, ¿qué es lo que más te preocupa o te gustaría fortalecer?" / Familiar-cuidador: "En este momento, ¿qué es lo que más les preocupa o les gustaría fortalecer en [nombre]?" | Memoria / Atención o concentración / Orientación / Comunicación / Independencia / Estado de ánimo / Conducta / Movilidad / Alimentación / Desea prevenir y mantenerse activo / Otra preocupación / No está seguro | `preocupacion_principal` | fin del bloque. Si "otra": campo texto opcional "¿Qué otra situación te gustaría que tomemos en cuenta?" |

### 7.12 Cierre del bloque (SG-CIERRE), 4 variantes

- Sin alertas: "Gracias. Ya conocemos mejor la salud general de [nombre] y el motivo por el que utilizará IntegraMente en Casa. Ahora queremos comprender cómo se desenvuelve en aspectos como la memoria, la atención y la comunicación." → Bloque Cognición y comunicación.
- Diagnóstico de demencia: "Gracias. Ya comprendemos mejor la condición actual de [nombre] y algunos de los apoyos que puede necesitar. A continuación conoceremos cómo se comunica, comprende y participa en las actividades cotidianas."
- Sin diagnóstico pero con cambios: "Gracias. Los cambios que nos compartiste nos ayudarán a adaptar las actividades. IntegraMente en Casa no realiza diagnósticos, pero sí puede ofrecer recomendaciones acordes con la información que nos brindaste."
- Modalidad preventiva: "Gracias. Tomaremos en cuenta que el objetivo de [nombre] es mantenerse activo y cuidar su salud cerebral de forma preventiva."

### 7.13 Reglas técnicas esenciales del Bloque 1

| Regla | Comportamiento |
|---|---|
| Diagnóstico informado | Guardarlo como información reportada, no como diagnóstico verificado |
| Sin diagnóstico | Nunca deducir "DCL" o "demencia" a partir del cuestionario |
| Diagnóstico desconocido | Personalizar por funcionamiento y sugerir valoración cuando corresponda |
| DCL con dependencia alta | No cambiar el diagnóstico; activar revisión funcional profunda |
| Síndrome demencial | Preguntar etapa, conciencia del diagnóstico y presencia de conducta |
| Cambio agudo | Generar alerta separada del nivel cognitivo |
| Evolución rápida | Recomendar valoración prioritaria según el tiempo de aparición |
| Errores de medicación | Recomendar supervisión; nunca modificar tratamientos |
| Antecedentes médicos | Convertirlos en etiquetas de adaptación para movimiento y nutrición |
| Texto libre | No debe modificar automáticamente el semáforo sin una regla estructurada |

---

## 8. Bloque 2 — Cognición, comunicación, bienestar y funcionalidad

### 8.1 Cognición y comunicación

**COG-00** (transición, 2 variantes):
- Propia persona: "Ahora queremos conocer cómo te desenvolvés en actividades que requieren recordar, concentrarte, comunicarte u organizarte. No hay respuestas correctas o incorrectas. Lo importante es comprender qué te resulta fácil y en qué momentos podrías beneficiarte de apoyo."
- Otra persona: "Ahora queremos conocer cómo se desenvuelve [nombre] en actividades que requieren recordar, concentrarse, comunicarse u organizarse. No hay respuestas correctas o incorrectas. Queremos comprender sus fortalezas y los apoyos que pueden resultarle útiles."
- Botón: Continuar.

| ID | Pregunta (UI) | Opciones | Variable | Notas |
|---|---|---|---|---|
| COG-01 | "En comparación con años anteriores, ¿cómo está la memoria de [nombre] para conversaciones, citas o situaciones recientes?" | Se mantiene igual / Ha presentado algunos olvidos pero los resuelve con recordatorios / Olvida información con frecuencia / Necesita que le recuerden la información constantemente / No lo sé | `memoria_reciente_funcional` | La frase "en comparación con años anteriores" distingue un cambio respecto al funcionamiento previo (lógica clínica tipo AD8). |
| COG-02 | "¿[nombre] repite preguntas o pierde el hilo de lo que estaba haciendo?" | Casi nunca / Algunas veces / Con frecuencia / Muchas veces durante el día / No lo sé | `repeticion_perdida_hilo` | Combina memoria reciente y memoria prospectiva. |
| COG-03 | "¿Cuánto tiempo puede mantenerse atento en una conversación o actividad?" | Se mantiene atento sin dificultad / Se distrae algunas veces pero puede continuar / Necesita recordatorios para retomar / Solo se mantiene atento durante periodos muy cortos / No lo sé | `atencion_funcional` | Adaptación: sin dificultad → duración habitual; se distrae → menos distractores y pausas; necesita retomar → instrucciones breves y claves; periodos muy cortos → actividades de 5-10 min. |
| COG-04 | "Cuando [nombre] realiza una actividad, ¿qué tipo de explicación suele comprender mejor?" | Puede seguir varios pasos / Comprende mejor uno o dos pasos a la vez / Necesita una instrucción por vez y una demostración / Otra persona debe guiarle durante toda la actividad / No lo sé | `comprension_consignas` | Una de las variables principales para el nivel cognitivo. |
| COG-05 | "Cuando debe organizar una actividad o resolver una situación cotidiana, ¿qué apoyo necesita?" | Puede hacerlo por sí mismo / Lo logra si tiene tiempo, recordatorios o una lista / Necesita que le expliquen las opciones / Otra persona debe organizar o decidir por él o ella / No lo sé | `organizacion_decisiones` | |
| COG-06 | "¿Cómo se comunica actualmente [nombre]?" | Conversa y expresa sus ideas con facilidad / A veces tarda en encontrar palabras / Se comunica mejor con frases cortas o preguntas sencillas / Utiliza principalmente palabras sueltas, sonidos o gestos / Tiene muchas dificultades para expresar lo que necesita / No lo sé | `comunicacion_expresiva` | Personalización: "tarda en encontrar palabras" → dar tiempo, no completar de inmediato; "frases cortas" → preguntas concretas y opciones; "palabras/gestos" → aceptar respuestas no verbales; "muchas dificultades" → contenido dirigido al acompañante, centrado en conexión y bienestar. |
| COG-07 | "Cuando realiza actividades que requieren pensar o concentrarse, ¿qué suele ocurrir?" | Las realiza sin cansarse / Se cansa después de un rato / Se frustra o se sobrecarga con facilidad / Generalmente evita este tipo de actividades / No lo sé | `respuesta_demanda_cognitiva` | **No interpretar como "falta de capacidad".** Se usa solo para ajustar duración, número de ejercicios, dificultad inicial, cantidad de pausas y orden de presentación. **No determina el color por sí sola.** |

#### Clasificación cognitiva

El nivel cognitivo se determina con **COG-01 a COG-06**. COG-07 (fatiga) modifica duración/pausas pero no el color.

| Nivel | Criterios |
|---|---|
| Verde | Memoria estable u olvidos resueltos con recordatorios ocasionales; atención preservada o distracción leve; comprende instrucciones de varios pasos; organiza por sí mismo o con lista; conversa con facilidad o dificultad ocasional para encontrar palabras; ningún criterio amarillo o rojo presente. |
| Amarillo | Al menos uno de: olvida con frecuencia; necesita recordatorios para retomar; comprende mejor uno o dos pasos o necesita demostración; necesita opciones para decidir; se comunica mejor con frases cortas; presenta fatiga o frustración frecuente. Sin ningún criterio rojo. |
| Rojo | Al menos uno de: necesita recordatorios constantes; atención muy breve; otra persona debe guiar toda la actividad; otra persona organiza o decide; se comunica principalmente con palabras sueltas/gestos; dificultad importante para expresar necesidades. |

**Regla programable:**
```
SI existe cualquier criterio rojo → nivel_cognitivo = rojo
SI NO hay rojo Y existe cualquier criterio amarillo → nivel_cognitivo = amarillo
SI NO hay rojo NI amarillo → nivel_cognitivo = verde
```
Rojo cognitivo = máxima simplificación y acompañamiento, **no urgencia**.

### 8.2 Estado emocional, conducta y sueño

**EMO-00** (transición): "El estado de ánimo y el descanso también pueden influir en la memoria, la energía y las ganas de participar. Queremos conocer cómo se ha sentido [nombre] últimamente."

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| EMO-01 | "Durante las últimas semanas, ¿cómo ha estado [nombre] la mayor parte del tiempo?" (máx. 2 respuestas) | Tranquilo y estable / Preocupado o ansioso / Triste o desanimado / Irritable / Emocionalmente cambiante / No lo sé | `estado_emocional_actual[]` | Límite de 2 opciones para identificar el estado predominante. |
| EMO-02 | "¿Mantiene interés por conversar, participar o realizar actividades?" | Sí, conserva sus intereses y suele iniciar actividades / Participa cuando alguien lo invita / Ha perdido interés en varias actividades / Casi no muestra iniciativa ni interés / No lo sé | `interes_iniciativa` | "Participa si invitan" → recordatorios y actividades acompañadas; "pérdida de interés" → actividades significativas de baja exigencia; "apatía marcada" → sugerir consulta si es cambio reciente. |
| EMO-03 | "En general, ¿cómo está durmiendo [nombre]?" (hasta 2 opciones) | Duerme bien y suele descansar / Le cuesta dormirse / **Se despierta varias veces** *(corregir typo del documento fuente: "Se de COG-07spierta varias veces")* / Duerme mucho durante el día / Se levanta o camina durante la noche / Duerme pocas horas / Su sueño cambia mucho / No lo sé | `patron_sueño[]` | No preguntar horas exactas; la calidad y el impacto funcional aportan más y reducen una pantalla. |
| EMO-03A | (condicional, si se marcó cualquier dificultad de sueño) "¿Estas dificultades de sueño afectan su energía, su ánimo o su funcionamiento durante el día?" | No parecen afectarlo / Lo afectan algunas veces / Lo afectan con frecuencia / No lo sé | `impacto_diurno_sueño` | |

### 8.3 Cambios conductuales (subbloque condicional)

Aparece **únicamente** cuando: existe síndrome demencial, o se reportaron cambios conductuales en el bloque anterior, o existe irritabilidad marcada, o la familia indicó que la conducta es una preocupación principal.

**COND-00** (transición): "Algunas condiciones pueden producir cambios en la manera de reaccionar o comportarse. Conocerlos nos ayudará a evitar actividades que generen malestar y a ofrecer estrategias más adecuadas."

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| COND-01 | "¿Han observado alguno de estos cambios en [nombre]?" (multi) | Se muestra más agitado o inquieto / Se irrita o enoja con facilidad / Se resiste a algunas actividades o cuidados / Camina sin rumbo o intenta salir de casa / Desconfía de otras personas / Cree que ocurren cosas que los demás no observan / Ve o escucha cosas que otras personas no perciben / Realiza preguntas, movimientos o acciones repetitivas / Se desinhibe o actúa de manera poco habitual / Ninguno / Prefiero no responder / No lo sé | `cambios_conductuales[]` | "Ninguno", "prefiero no responder" y "no lo sé" no se combinan entre sí ni con otras opciones. **El sistema nunca debe usar en la interfaz familiar términos como "delirios", "alucinaciones" o "desinhibición"** aunque esas sean las opciones clínicas subyacentes (mapear a copy neutro). |
| COND-02 | (condicional, si se seleccionó alguna conducta) "¿Con qué frecuencia estos cambios dificultan la rutina o generan preocupación?" | Ocasionalmente, se pueden manejar / Varias veces por semana / Todos o casi todos los días / Generan una preocupación importante / No lo sé | `impacto_cambios_conductuales` | |
| COND-03 | "¿Alguno de estos cambios podría poner en riesgo a [nombre] o a otra persona?" | No / Tal vez, requiere supervisión / Sí, existe un riesgo actual / No lo sé | `riesgo_conductual` | Si "riesgo actual": mostrar "Gracias por indicarlo. Por seguridad, algunas recomendaciones deberán revisarse antes de ser incluidas en el plan. También sería conveniente conversar sobre esta situación con el profesional que acompaña a [nombre]." **Acción interna:** `alerta_conductual = true`; bloquear actividades sin acompañamiento; evitar sobreestimulación; priorizar regulación emocional y estrategias para el cuidador; NO bloquear contenidos tranquilos y seguros de forma indiscriminada. |

### 8.4 Actividades instrumentales de la vida diaria (AVDI)

**AVDI-00** (transición): "Ahora queremos conocer cómo se desenvuelve [nombre] en algunas actividades cotidianas. Si nunca ha realizado una actividad por costumbre o por la forma en que se organizaba su familia, puedes indicarlo. Esto no significa que tenga una dificultad."

**Escala común fija** (usar siempre estas 6 opciones, visualmente consistentes): Lo realiza por sí mismo / Lo realiza con recordatorios o supervisión / Necesita ayuda directa / Otra persona debe hacerlo por completo / Nunca ha realizado esta actividad / No lo sé.

| ID | Pregunta | Variable | Notas |
|---|---|---|---|
| AVDI-01 | "¿Cómo maneja [nombre] el dinero, los pagos o los asuntos bancarios?" | `avdi_finanzas` | Si necesita ayuda: preguntar después si la dificultad es nueva; no asumir deterioro en quien nunca administró finanzas. |
| AVDI-02 | "¿Cómo realiza compras o prepara lo que necesita para una actividad cotidiana?" | `avdi_compras_organizacion` | Valora planificación, memoria y toma de decisiones. |
| AVDI-03 | "¿Cómo prepara alimentos o utiliza la cocina?" | `avdi_preparacion_alimentos` | Condicional AVDI-03A si requiere ayuda/supervisión: "¿Han observado alguna situación de riesgo al utilizar la cocina?" → Opciones: No / Ha olvidado apagar la cocina o algún electrodoméstico / Ha quemado alimentos / Ha utilizado utensilios de manera insegura / Ya no utiliza la cocina por seguridad / No lo sé. Variable: `riesgo_cocina[]`. |
| AVDI-04 | "¿Cómo utiliza el teléfono para llamar, responder mensajes o comunicarse con otras personas?" | `avdi_telefono` | Valorar uso habitual previo, no exigir apps que la persona nunca usó (varía generacionalmente). |
| AVDI-05 | "¿Cómo organiza citas, horarios o actividades pendientes?" | `avdi_agenda_responsabilidades` | Medicamentos no se repite (ya evaluado en Bloque 1). |
| AVDI-06 | (condicional, si marcó necesidad de recordatorios/ayuda/dependencia en cualquiera de las anteriores) "¿Esta necesidad de ayuda representa un cambio respecto a cómo se desenvolvía antes?" | `origen_cambio_funcional` | Opciones: Sí, antes lo hacía con mayor independencia / No, siempre ha necesitado este apoyo / La dificultad se relaciona principalmente con una condición física / La dificultad se relaciona tanto con aspectos físicos como cognitivos / No lo sé. Una de las preguntas más importantes del bloque: la dependencia actual no siempre implica deterioro cognitivo. |

### 8.5 Actividades básicas de la vida diaria (AVDB) — bloque condicional

Mostrar **únicamente** cuando: se informó demencia moderada o avanzada, o necesita ayuda directa en 2+ actividades instrumentales, o otra persona guía todas las actividades, o se reportó dependencia frecuente, o existen dificultades físicas importantes. **No mostrar** en perfiles preventivos, DCL independiente o demencia leve autónoma, salvo que otra respuesta lo justifique.

**AVDB-00** (transición): "Para seleccionar actividades cómodas y realistas, necesitamos conocer si [nombre] requiere apoyo en algunos cuidados personales."

**Escala común fija:** Lo realiza por sí mismo / Necesita recordatorios o supervisión / Necesita ayuda parcial / Otra persona debe hacerlo / No lo sé.

| ID | Pregunta | Variable | Notas |
|---|---|---|---|
| AVDB-01 | "¿Qué apoyo necesita [nombre] para bañarse y realizar su aseo personal?" | `avdb_baño_aseo` | Baño y aseo unidos para reducir una pantalla. |
| AVDB-02 | "¿Qué apoyo necesita para elegir su ropa y vestirse?" | `avdb_vestido` | |
| AVDB-03 | "¿Qué apoyo necesita para comer?" | `avdb_alimentacion` | Valora el acto de alimentarse; preparación y condiciones nutricionales se analizan por separado (Bloque 4). |
| AVDB-04 | "¿Qué apoyo necesita para ir al baño y realizar su higiene?" | `avdb_uso_baño` | No preguntar todavía por continencia; no es indispensable para la personalización inicial y puede ser invasivo. Podría incorporarse después como pregunta condicional del módulo clínico. |
| AVDB-05 | (condicional, si necesita supervisión o ayuda) "¿Esta necesidad de apoyo ha aumentado durante el último año?" | `evolucion_dependencia_basica` | Opciones: No, se ha mantenido estable / Ha aumentado poco a poco / Ha aumentado con rapidez / Varía según el día / No lo sé. Una progresión rápida debe señalarse para revisión profesional. |

#### Clasificación funcional

| Nivel | Criterios |
|---|---|
| Verde | Actividades instrumentales independientes (o nunca realizadas por razones históricas, que no cuentan como dependencia); actividades básicas independientes. |
| Amarillo | Necesita recordatorios/supervisión en 1+ actividad instrumental, o ayuda directa en solo 1 actividad instrumental; actividades básicas independientes o solo con recordatorios. |
| Rojo | Necesita ayuda directa o dependencia completa en 2+ actividades instrumentales; necesita ayuda parcial o total en alguna actividad básica; otra persona organiza la mayor parte de la rutina. |

Guardar además: `origen_dependencia_funcional` = Cognitiva / Física / Mixta / Siempre ha recibido ese apoyo / Desconocida. **La causa no cambia el nivel de independencia actual**, pero sí el tipo de contenido y recomendaciones.

**Extensión aproximada del recorrido de este bloque** (referencia de UX, no regla dura):

| Perfil | Preguntas aproximadas |
|---|---|
| Preventivo o independiente | 15 |
| DCL o cambios leves | 16-18 |
| Demencia leve | 18-20 |
| Demencia moderada/avanzada | 22-25 |
| Conducta o alertas | +3-5 adicionales |

**Información que este bloque debe dejar disponible al finalizar:** capacidad para recordar/seguir instrucciones; duración cognitiva inicial; complejidad del lenguaje; necesidad de claves o demostración; modalidad verbal/no verbal; estado emocional predominante; calidad e impacto del sueño; presencia de cambios conductuales; nivel de independencia instrumental; necesidad de valorar actividades básicas; grado de acompañamiento requerido.

**Cierre del bloque:** "Gracias. Ya comprendemos mejor cómo se comunica [nombre], qué tipo de instrucciones le resultan más útiles y en cuáles actividades cotidianas puede necesitar apoyo. Ahora queremos conocer cómo se mueve y qué actividades físicas puede realizar con seguridad."

---

## 9. Bloque 3 — Movimiento, ejercicio y seguridad física

7 a 10 preguntas según respuestas. Debe determinar: cómo se moviliza actualmente; si puede hacer actividades de pie o solo sentada; nivel de acompañamiento requerido; riesgo de caídas; presencia de dolor u otros síntomas; restricciones profesionales; frecuencia y preferencias de ejercicio; nivel de gerontogimnasia (verde/amarillo/rojo).

**MOV-00** (transición, 2 variantes):
- Propia persona: "Ahora queremos conocer cómo te movés y qué actividades físicas realizás. Esto nos ayudará a seleccionar ejercicios cómodos, útiles y seguros para vos."
- Otra persona: "Ahora queremos conocer cómo se mueve [nombre] y qué actividades físicas realiza. Esto nos ayudará a seleccionar ejercicios adecuados a sus capacidades y condiciones de seguridad."

### 9.1 Movilidad habitual

**MOV-01** — "¿Cómo se moviliza habitualmente [nombre] dentro de la casa?" Opciones y ruteo:

| Opción | Ruta |
|---|---|
| Camina sin ayuda / con bastón / con andadera / si otra persona lo acompaña o sostiene | MOV-02 |
| Se moviliza principalmente en silla de ruedas / permanece la mayor parte en cama | MOV-S01 |
| No lo sé | MOV-02 |

Variable: `movilidad_dentro_casa`.

**MOV-02** (solo si camina) — "¿Cómo se moviliza [nombre] fuera de la casa?" Opciones: Sale y camina sin ayuda / Sale con bastón o andadera / Necesita ir acompañado / Solo camina distancias cortas / Generalmente no sale / No lo sé. Variable: `movilidad_fuera_casa`. → MOV-03.

### 9.2 Transferencias y equilibrio

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| MOV-03 | "¿Puede [nombre] levantarse de una silla?" | Sí, sin usar las manos / Sí, apoyándose en brazos de la silla o mueble / Necesita supervisión o ayuda mínima / Necesita que otra persona lo levante / No logra hacerlo / No lo sé | `levantarse_silla` | Uso: sin apoyo → ejercicios funcionales de mayor desafío; con brazos/mueble → ejercicios con apoyo estable; supervisión → acompañante obligatorio; ayuda física → principalmente sentado; no logra → actividad completamente sentada o en cama. |
| MOV-04 | "Cuando está de pie, ¿cómo es el equilibrio de [nombre]?" | Estable sin apoyo / Estable con apoyo cerca / Estable y puede colocar un pie delante del otro / Estable con pies juntos y ojos cerrados por 10s / Pierde el equilibrio algunas veces / Necesita que otra persona lo sostenga / No puede mantenerse de pie / No lo sé | `equilibrio_de_pie` | **Esta respuesta pesa más que el uso de bastón** para definir el nivel motor. Usar bastón NO significa automáticamente nivel rojo. |

### 9.3 Ruta para personas en silla o cama (sustituye MOV-02 y MOV-04)

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| MOV-S01 | "Cuando está sentado, ¿[nombre] puede mantener el cuerpo estable?" | Sí, sin apoyo / Necesita respaldo o apoyabrazos / Tiende a inclinarse o perder la postura / Necesita que otra persona lo acomode / No lo sé | `control_postural_sentado` | |
| MOV-S02 | "Mientras está sentado o acostado, ¿puede mover los brazos y las piernas?" | Sí, con facilidad / Dificultad en una extremidad / Dificultad en varias extremidades / Movimientos muy limitados / No lo sé | `movilidad_extremidades` | Diferencia entre: gerontogimnasia sentada activa / movilidad suave y asistida / actividades de manos y coordinación / contenido que debe revisarse antes de asignarse. → MOV-05. |

### 9.4 Caídas

| ID | Pregunta | Opciones | Variable | Ramificación |
|---|---|---|---|---|
| MOV-05 | "Durante los últimos seis meses, ¿[nombre] se ha caído o ha estado a punto de caerse?" | No / Casi se cae pero no cayó / Se ha caído una vez / Se ha caído varias veces / No lo sé | `caidas_ultimos_6_meses` | No → MOV-06. Cualquier caída o casi caída → MOV-05A. No lo sé → MOV-06 con precaución moderada. |
| MOV-05A | "¿Alguna caída le provocó una lesión o un cambio importante?" (multi) | No / Dolor o moretones que ya mejoraron / Dolor que continúa / Una fractura / Un golpe en la cabeza / Mayor dificultad para caminar / Más miedo de caminar o salir / No lo sé | `consecuencias_caida[]` | Dolor persistente, fractura reciente, golpe en la cabeza o dificultad nueva → **`alerta_caida`**. Miedo de caminar → actividades de seguridad/confianza sin aumentar desafío automáticamente. Caídas repetidas → acompañamiento obligatorio en ejercicios de pie. |
| MOV-05B | (condicional: fractura, golpe en cabeza, dolor persistente o dificultad nueva) "¿Esta situación fue valorada por un profesional?" | Sí, ya puede realizar actividad física / Sí, pero mantiene restricciones / Todavía en valoración o recuperación / No fue valorada / No lo sé | `valoracion_posterior_caida` | Restricciones o recuperación → mostrar MOV-08. No valorada → recomendar consulta antes de actividades de pie. Mientras se aclara, ofrecer solo movimiento suave compatible. |

### 9.5 Síntomas durante el movimiento

| ID | Pregunta | Opciones | Variable | Ramificación |
|---|---|---|---|---|
| MOV-06 | "Cuando [nombre] camina o realiza algún esfuerzo, ¿presenta alguna de estas molestias?" (multi) | Dolor / Mareo / Falta de aire / Dolor o presión en el pecho / Debilidad / Cansancio intenso / Pérdida de equilibrio / Ninguna / No lo sé | `sintomas_durante_movimiento[]` | "Ninguna" y "no lo sé" no combinables con otras. Cualquier síntoma → MOV-06A. Sin síntomas → MOV-07. |
| MOV-06A | "¿Con qué frecuencia o intensidad aparecen estas molestias?" | Leves y ocasionales / Frecuentes / Con esfuerzos pequeños / Están presentes en este momento / No lo sé | `intensidad_sintomas_movimiento` | Ver tabla de seguridad abajo. |

**Clasificación de seguridad MOV-06A:**

| Respuesta | Acción |
|---|---|
| Leves y ocasionales | Adaptar intensidad y ofrecer pausas |
| Frecuentes | Actividades suaves; recomendar consulta |
| Con esfuerzo pequeño | Bloquear ejercicio de pie hasta revisión |
| Presentes actualmente | Mostrar orientación prioritaria |
| No lo sé | Actividad conservadora y supervisada |

Mensaje cuando existe alerta: "Gracias por indicarlo. Por seguridad, antes de recomendar ejercicios que requieran esfuerzo, sería importante consultar estas molestias con un profesional. Mientras tanto, el plan podrá incluir únicamente actividades suaves y compatibles con la información disponible." *(La prudencia aquí no es negociable: nunca asignar ejercicio de esfuerzo a quien reporta dolor en el pecho.)*

### 9.6 Dolor y limitaciones

**MOV-07** (condicional: si se reportó dolor, artritis, artrosis, cirugía, fractura o limitación física) — "¿En qué parte del cuerpo presenta dolor o dificultad para moverse?" (multi) Opciones: Cuello / Hombros o brazos / Manos / Espalda / Cadera / Rodillas / Tobillos o pies / En un lado del cuerpo / En varias zonas / Otra / No lo sé. Variable: `zonas_limitacion_fisica[]`.

**Uso:** cada ejercicio del catálogo de contenidos debe tener etiquetas corporales: `requiere_hombros`, `requiere_manos`, `requiere_flexion_rodilla`, `requiere_apoyo_pies`, `requiere_movilidad_tronco`. El sistema excluye o adapta ejercicios según la zona reportada.

### 9.7 Indicaciones y restricciones profesionales

| ID | Pregunta | Opciones | Variable | Ramificación |
|---|---|---|---|---|
| MOV-08 | "¿Algún profesional le ha indicado a [nombre] que debe evitar o modificar ciertos movimientos o ejercicios?" | No / Sí / En recuperación, aún sin indicaciones claras / No lo sé | `restriccion_profesional_ejercicio` | Sí → MOV-08A. Recuperación sin indicaciones → limitar a actividades suaves y recomendar confirmación profesional. No → MOV-09. No lo sé → MOV-09 con mensaje de detener ante síntomas. |
| MOV-08A | "¿Qué movimiento, zona del cuerpo o tipo de ejercicio debe evitar?" (multi) | Ejercicios de pie / Levantar peso / Agacharse / Subir o bajar gradas / Levantar los brazos / Movimientos de cuello / Movimientos de espalda / Movimientos de cadera o rodillas / Ejercicio intenso / Otra indicación / No lo sé | `movimientos_restringidos[]` | Si "otra": campo opcional `restriccion_texto_usuario`. **Las restricciones estructuradas modifican automáticamente la asignación; el texto libre queda visible pero no dirige el algoritmo por sí solo.** |

### 9.8 Ejercicio actual

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| MOV-09 | "En una semana habitual, ¿cuántos días realiza [nombre] alguna actividad física o movimiento intencional?" (ej.: caminar, bailar, ejercicios, jardinería) | Ningún día / Uno o dos días / Tres o cuatro días / Cinco días o más / Varía mucho / No lo sé | `frecuencia_actividad_fisica` | No utilizar para definir capacidad física, solo punto de partida de progresión. |
| MOV-10 | (condicional: si realiza alguna actividad) "Cuando realiza actividad física, ¿cuánto tiempo suele mantenerse activo?" | Menos de 10 min / 10-20 min / 20-30 min / Más de 30 min / Depende mucho del día / No lo sé | `duracion_actividad_fisica` | Ayuda a definir duración inicial de los videos/rutinas. |

### 9.9 Actividades disfrutadas

**MOV-11** — "¿Qué tipos de movimiento realiza o disfruta [nombre]?" (multi) Opciones: Caminar / Bailar / Ejercicios sentado / Estiramientos / Ejercicios de fuerza / Yoga o respiración y movimiento / Bicicleta / Natación / Jardinería / Tareas del hogar / Juegos con pelota / Otro / Actualmente no realiza actividad física / No lo sé. Variable: `preferencias_actividad_fisica[]`. *No afirmar que el ejercicio sustituye la actividad real (ej. jardinería) ni que podrá realizarla sin riesgo.*

### 9.10 Confianza y disposición

**MOV-12** — "¿Cómo se siente [nombre] ante la idea de realizar actividades de movimiento?" Opciones y adaptación:

| Respuesta | Estrategia |
|---|---|
| Le gusta y suele participar | Progresión gradual |
| Participa si alguien lo invita | Recordatorios y acompañamiento |
| Tiene poca motivación | Actividades breves vinculadas con intereses |
| Siente temor de caerse o lastimarse | Rutinas sentadas o con apoyo |
| Suele rechazar este tipo de actividades | No forzar; probar música, juego o movimiento funcional |

Variable: `disposicion_movimiento`.

### 9.11 Clasificación motora (nunca mostrada al usuario)

| Nivel | Perfil / criterios | Contenido |
|---|---|---|
| Verde | Camina independiente; se levanta y permanece de pie con seguridad; sin caídas repetidas; sin síntomas de alerta; sin restricciones relevantes | Rutinas de pie, fuerza funcional, coordinación, equilibrio adaptado, dual task según nivel cognitivo, actividades sentadas y de pie |
| Amarillo | Cualquier combinación de: bastón/andadera; necesita supervisión; se apoya para levantarse; inseguridad ocasional; una caída o casi caída; dolor o síntomas leves; miedo de caerse; restricción parcial | Acompañamiento cercano, apoyo estable, menor desafío postural, rutinas combinadas sentadas/de pie, ritmo lento y pausas, dual task simplificado o separado |
| Rojo funcional | Cualquier combinación de: necesita ayuda física para caminar; no se mantiene de pie con seguridad; usa silla de ruedas; permanece principalmente en cama; caídas repetidas; movilidad muy reducida | Actividad completamente sentada; movilidad de brazos/manos/piernas según capacidad; coordinación simple; movimiento asistido solo con recurso diseñado para ello; priorizar participación, comodidad y seguridad |

**Importante:** rojo funcional no significa urgencia ni exclusión, significa usar la versión de máxima adaptación.

**Regla programable:**
```
1. Procesar alertas físicas.
2. SI necesita ayuda física para caminar, no se mantiene de pie,
   usa silla de ruedas o permanece en cama → rojo físico.
3. SI NO es rojo, PERO usa bastón/andadera, requiere supervisión,
   se apoya para levantarse, tuvo caída o presenta síntomas leves → amarillo físico.
4. SI no cumple criterios rojos ni amarillos → verde físico.
```

### 9.12 Alertas separadas del nivel motor

| Alerta | Acción |
|---|---|
| Dolor o presión en el pecho | No asignar ejercicio; orientar consulta |
| Falta de aire con esfuerzo mínimo | No asignar ejercicio exigente |
| Mareo actual | Pausar movimiento |
| Debilidad nueva | Recomendar atención profesional |
| Golpe reciente en la cabeza | Pausar y orientar valoración |
| Fractura o lesión en recuperación | Respetar restricciones |
| Dificultad nueva para caminar | Recomendar valoración |
| Dolor intenso o persistente | Evitar movimientos relacionados |

Una persona puede tener nivel motor rojo sin ninguna alerta médica, y puede ser físicamente verde pero tener una alerta que obligue a pausar temporalmente el ejercicio. Los dos sistemas son independientes.

### 9.13 Cruce cognitivo × físico (doble tarea)

| Cognitivo | Físico | Asignación |
|---|---|---|
| Verde | Verde | Dual task de pie y progresivo |
| Verde | Amarillo | Tarea cognitiva sencilla con apoyo físico |
| Verde | Rojo | Actividad cognitiva durante movimiento sentado |
| Amarillo | Verde | Movimiento sencillo y una tarea cognitiva |
| Amarillo | Amarillo | Dual task simplificado, con apoyo y supervisión |
| Amarillo | Rojo | Actividad sentada con demanda cognitiva sencilla |
| Rojo | Verde | Movimiento sencillo; evitar doble demanda autónoma |
| Rojo | Amarillo | Movimiento con apoyo y cuidador; cognición mínima |
| Rojo | Rojo | Movimiento sentado, conexión y seguimiento de una instrucción |

Para actividades de doble tarea, usar siempre **el nivel más restrictivo de los dos ejes**.

**Cierre del bloque** (3 variantes):
- Sin alertas: "Gracias. Ya conocemos mejor cómo se mueve [nombre], qué actividades disfruta y qué apoyos necesita para realizarlas con seguridad. Utilizaremos esta información para adaptar la posición, la duración y la dificultad de sus ejercicios."
- Con restricciones: "Gracias. Tomaremos en cuenta las molestias y restricciones que nos indicaste. Seleccionaremos únicamente actividades compatibles con esta información y señalaremos cuándo es recomendable contar con acompañamiento."
- Con alerta: "Antes de incluir algunos ejercicios, necesitaremos tomar en cuenta la situación de salud que nos indicaste. Mientras se consulta con un profesional, el plan evitará actividades que puedan representar un riesgo."

---

## 10. Bloque 4 — Alimentación, hidratación y condiciones nutricionales

6 a 9 preguntas. **No es una valoración nutricional completa**: su función es conocer hábitos generales, detectar necesidades de apoyo, filtrar contenidos inadecuados e identificar situaciones que ameriten consulta profesional.

**NUT-00** (transición, 2 variantes + texto de apoyo):
- Propia persona: "Ahora queremos conocer un poco sobre tu alimentación e hidratación. Esta información nos ayudará a ofrecerte recomendaciones generales que se ajusten mejor a tus hábitos y condiciones de salud."
- Otra persona: "Ahora queremos conocer un poco sobre la alimentación e hidratación de [nombre]. Esta información nos ayudará a ofrecer recomendaciones generales que se ajusten mejor a sus hábitos, necesidades y condiciones de salud."
- Texto de apoyo (siempre visible): "IntegraMente en Casa no sustituye una valoración nutricional ni modifica dietas indicadas por profesionales."

### 10.1 Alimentación habitual y cambios de peso

| ID | Pregunta | Opciones | Variable | Ramificación |
|---|---|---|---|---|
| NUT-01 | "En general, ¿cómo está comiendo [nombre]?" | Come con regularidad y mantiene horarios / Algunas veces come poco o se salta comidas / Con frecuencia come poco o rechaza alimentos / Necesita que otra persona le recuerde o le ofrezca la comida / Su alimentación cambia mucho de un día a otro / No lo sé | `regularidad_alimentacion` | Uso: regular → recomendaciones preventivas; se salta comidas → rutina y planificación; come poco/rechaza → contenido para cuidador + sugerir valoración; necesita recordatorios → involucrar acompañante; variable → sugerir registro y observación. |
| NUT-02 | "Durante las últimas semanas, ¿cómo ha estado el apetito de [nombre]?" | Se mantiene como de costumbre / Ha disminuido un poco / Ha disminuido de manera importante / Ha aumentado / Varía mucho / No lo sé | `cambio_apetito` | Disminución importante → NUT-03. Cualquier otra → NUT-04. |
| NUT-03 | (también aparece si NUT-01 = "come poco o rechaza") "¿Ha perdido peso recientemente sin proponérselo?" | No / Sí, un poco / Sí, de manera evidente / La ropa le queda más holgada, pero no conocen el peso / No lo sé | `perdida_peso_no_intencional` | Si afirmativo → NUT-03A. |
| NUT-03A | "¿La disminución del apetito o la pérdida de peso ha sido consultada con un profesional?" | Sí, ya recibió recomendaciones / Sí, continúa en seguimiento / No / No lo sé | `valoracion_perdida_peso` | Ya recibió recomendaciones → pedir respetarlas, no contradecirlas. No valorado → sugerir consulta nutricional o médica. Pérdida evidente + ingesta muy baja → **`alerta_nutricional = true`**. Mensaje: "La pérdida de peso sin proponérselo puede tener diferentes causas. Por seguridad, recomendamos comentarla con un profesional antes de realizar cambios importantes en la alimentación. Te podemos ayudar con esto, poniéndote en contacto con nuestros especialistas." |

### 10.2 Hidratación

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| NUT-04 | "Durante el día, ¿[nombre] toma líquidos con regularidad?" (agua, leche, sopas, etc.) | Sí, por iniciativa propia / Toma líquidos si se le ofrecen o recuerdan / Generalmente toma muy poco / Rechaza los líquidos con frecuencia / Tiene una restricción de líquidos indicada por un profesional / No lo sé | `patron_hidratacion` | **No preguntar "¿cuántos vasos toma?"**: la estimación es poco fiable y puede llevar a recomendaciones inadecuadas con restricciones cardíacas/renales. Requiere recordatorios → generar estrategias; toma muy poco → recomendaciones generales y observación; rechaza → contenido para cuidador; restricción indicada → no recomendar cantidades específicas. |
| NUT-04A | (condicional: toma muy poco o rechaza) "¿Han notado alguna de estas situaciones?" (multi) | Boca muy seca / Orina muy oscura o escasa / Estreñimiento frecuente / Mareos o debilidad / Mayor confusión de lo habitual / Ninguna / No lo sé | `posibles_signos_baja_hidratacion[]` | Estos signos NO permiten diagnosticar deshidratación. Si hay confusión nueva, mareo intenso, debilidad marcada o ingesta casi nula → mostrar recomendación de valoración. |

### 10.3 Condiciones y restricciones alimentarias

**NUT-05** — "¿[nombre] sigue alguna alimentación especial o tiene indicaciones relacionadas con lo que puede comer o beber?" (multi) Opciones: Alimentación para diabetes / Alimentación baja en sal / Alimentación para enfermedad renal / Restricción de líquidos / Alimentación para colesterol o triglicéridos / Dieta sin gluten / Alergia o intolerancia alimentaria / Alimentos con textura modificada / Otra indicación / No sigue una alimentación especial / No lo sé. Variable: `indicaciones_alimentarias[]`. "No sigue" y "no lo sé" no combinables con otras. Si "otra indicación" → NUT-05A. Enfermedad renal o restricción de líquidos → precaución nutricional amarilla o roja, según apoyo disponible y claridad de indicaciones.

**NUT-05A** — "¿Cuál otra indicación alimentaria debemos tomar en cuenta?" Campo opcional. Variable: `otra_indicacion_alimentaria`. El texto libre debe mostrarse en el perfil pero **no dirigir automáticamente el algoritmo**; para filtrar recursos se necesitan etiquetas estructuradas.

### 10.4 Masticación y deglución

**NUT-06** — "¿[nombre] presenta alguna dificultad al comer o beber?" (multi) Opciones: Le cuesta masticar algunos alimentos / Tose mientras come o bebe / Se atraganta / Siente que los alimentos no pasan bien / Su voz cambia o suena húmeda después de comer / Guarda comida en la boca / Come muy lentamente / No presenta dificultades / No lo sé. Variable: `dificultades_alimentacion[]`. "No presenta dificultades" y "no lo sé" no combinables.

Ramificación:
- Dificultad exclusiva para masticar → NUT-06A.
- Tos, atragantamiento, cambio de voz, alimento retenido o sensación de atasco → NUT-06B.
- Solo come lentamente → adaptar duración y acompañamiento (sin pantalla adicional) → NUT-07.
- Sin dificultades → NUT-07.

**NUT-06A** — "¿La dificultad para masticar se relaciona con los dientes, una prótesis dental o la dureza de algunos alimentos?" Opciones: Sí / No están seguros / No / No lo sé. Variable: `origen_dificultad_masticacion`. Acción: recomendaciones generales sobre presentaciones más fáciles de masticar; **no indicar dietas trituradas automáticamente**; sugerir revisión dental/nutricional si la dificultad reduce la ingesta.

**NUT-06B** — "¿Esta dificultad para tragar ha sido valorada por un profesional?" Opciones: Sí, con indicaciones específicas / En proceso de valoración / No ha sido valorada / No lo sé. Variable: `valoracion_deglucion`. Si hay signos de dificultad para tragar: **`alerta_deglucion = true`**; no generar recomendaciones sobre cambios de textura; no recomendar pajillas, espesantes ni posiciones específicas automáticamente; bloquear recetas con texturas incompatibles; recomendar valoración profesional. Mensaje: "Las dificultades para tragar necesitan recomendaciones individualizadas. Antes de sugerir cambios en las texturas o líquidos, es importante contar con la orientación de un profesional."

### 10.5 Apoyo, preparación y hábitos

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| NUT-07 | "¿Qué apoyo necesita [nombre] para alimentarse?" | Elige, sirve y come por sí mismo / Come por sí mismo pero otra persona prepara o sirve / Necesita recordatorios o supervisión / Necesita ayuda física durante parte de la comida / Otra persona debe alimentarlo / No lo sé | `apoyo_durante_alimentacion` | Define destinatario del contenido: independiente → persona; preparación externa → persona + responsable; recordatorios → familiar/cuidador; ayuda física → principalmente cuidador; dependencia completa → cuidador con recomendaciones individualizadas. |
| NUT-08 | **Auto-skip:** si `avdi_preparacion_alimentos` = "lo realiza por sí mismo" (Bloque 2), registrar automáticamente a la propia persona como responsable y **omitir esta pantalla**. Si necesita ayuda, supervisión o no prepara alimentos, mostrar: "¿Quién decide o prepara habitualmente los alimentos de [nombre]?" | La propia persona / Su pareja / Otro familiar / Una persona cuidadora / Una residencia o centro / Un servicio de alimentación / Varía según el día / No lo sé | `responsable_preparacion_alimentos` | Define a quién se dirige cada recomendación ("Te sugerimos...", "Podés ofrecerle a don Juan...", "Compartí esta recomendación con la persona responsable..."). |
| NUT-09 | "Pensando en una semana habitual, ¿cómo describirías la alimentación de [nombre]?" | Variada, incluye diferentes grupos / Variedad limitada pero acepta varios alimentos / Tiende a comer siempre lo mismo / Rechaza muchos alimentos / Depende de lo que otra persona le ofrezca / No lo sé | `variedad_alimentaria` | No preguntar todavía por cada grupo alimentario (se puede incorporar en valoración nutricional o revisiones semanales). |
| NUT-10 | "¿Hay alimentos o preparaciones que [nombre] disfrute especialmente?" (multi por categorías + texto) | Frutas / Vegetales / Sopas / Arroz y frijoles / Huevos / Pescado / Pollo o carnes / Lácteos / Panes o cereales / Postres / Café u otras bebidas habituales / Otra preparación + campo opcional de texto | `preferencias_alimentarias[]` | **No asumir que una comida preferida es saludable o adecuada**: cruzar primero con restricciones y seguridad para tragar antes de usarla en recomendaciones. |

### 10.6 Clasificación nutricional

| Nivel | Características | Contenido |
|---|---|---|
| Verde | Come regularmente; mantiene apetito y peso; toma líquidos por iniciativa propia; sin dificultad para masticar/tragar; independiente o solo necesita apoyo para preparar alimentos; sin restricciones complejas | Educación general MIND/Mediterránea; variedad alimentaria; rutinas de hidratación; preparaciones sencillas; participación segura en la cocina; prevención y salud cerebral |
| Amarillo | Cualquiera de: se salta comidas ocasionalmente; necesita recordatorios; toma poco líquido; tiene diabetes/hipertensión u otra condición estable; dificultad para masticar; alimentación poco variada; otra persona controla sus alimentos; indicación nutricional que debe respetarse | Recomendaciones adaptadas; mensajes al responsable de alimentación; recordatorios y estructura de horarios; evitar recomendaciones universales; sugerir consulta cuando sea necesario |
| Rojo (alta precaución) | Cualquiera de: pérdida de peso evidente; disminución importante del apetito; ingesta muy reducida; necesita ayuda física para alimentarse; otra persona debe alimentarlo; enfermedad renal o restricción de líquidos sin indicaciones claras; signos de dificultad para tragar; rechazo frecuente | **No** generar menú terapéutico automático; priorizar recomendaciones para el cuidador; ofrecer solo contenidos compatibles con restricciones conocidas; recomendar valoración nutricional/médica/de deglución; mantener contenidos de acompañamiento seguros |

Rojo nutricional no significa que la persona no pueda recibir ningún contenido; significa que las recomendaciones generales no son suficientes y se necesita mayor cautela.

**Regla programable:**
```
1. Procesar alertas de deglución, ingesta casi nula o pérdida de peso.
2. SI presenta disfagia, pérdida evidente de peso, ingesta muy reducida,
   rechazo frecuente o necesita ayuda física para comer → rojo nutricional.
3. SI NO es rojo, PERO necesita recordatorios, come irregularmente,
   toma poco líquido o tiene restricciones estables → amarillo nutricional.
4. SI no cumple criterios rojos ni amarillos → verde nutricional.
```

### 10.7 Alertas nutricionales

| Situación | Acción |
|---|---|
| Pérdida de peso evidente | Recomendar valoración |
| Disminución importante del apetito | Observar y consultar |
| Ingesta casi nula | Orientación prioritaria |
| Rechazo frecuente de líquidos | Recomendación profesional |
| Confusión nueva con baja ingesta | Activar alerta de salud |
| Tos o atragantamiento | Bloquear recomendaciones de textura |
| Voz húmeda después de comer | Recomendar valoración de deglución |
| Restricción de líquidos | No sugerir cantidades |
| Enfermedad renal | No recomendar proteína, potasio, sodio o líquidos sin individualización |
| Alergia alimentaria | Excluir recursos con el alimento señalado |

### 10.8 Etiquetas para recursos nutricionales

Cada receta o recomendación del catálogo debe incluir: `compatible_diabetes`, `compatible_hipertension`, `compatible_renal`, `contiene_gluten`, `alergenos[]`, `requiere_masticacion`, `textura`, `requiere_cocina`, `requiere_supervision`, `dirigido_a_cuidador`, `participacion_persona`, `nivel_complejidad`, `tiempo_preparacion`.

**Regla crítica:** la palabra "compatible" nunca debe usarse sin validación nutricional real. Cuando no exista certeza, el recurso debe quedar marcado como `requiere_revision`.

**Cierre del bloque** (4 variantes según perfil: estable / necesita apoyo / con restricciones / con alerta) — ver texto exacto en el documento fuente, sección Bloque 4 punto 14.

---

## 11. Bloque 5 — Vida social, estimulación y rutina

6 a 8 preguntas. Debe conocer: frecuencia y calidad del contacto social; posible sensación de soledad; nivel de estimulación cognitiva cotidiana; estructura de la rutina; participación en actividades del hogar y la comunidad; cantidad de tiempo pasivo; cambios recientes en la participación; oportunidades realistas para enriquecer la semana.

**RUT-00** (transición, 2 variantes):
- Propia persona: "Ahora queremos conocer cómo es tu rutina, con qué frecuencia compartís con otras personas y qué actividades realizás durante la semana. Una vida activa y significativa puede incluir muchas cosas: conversar, ayudar en casa, aprender, salir, escuchar música o participar en la comunidad."
- Otra persona: "Ahora queremos conocer cómo es la rutina de [nombre], con qué frecuencia comparte con otras personas y qué actividades realiza durante la semana. Esto nos ayudará a preparar un plan que se ajuste a su realidad y no únicamente a sus dificultades."

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| RUT-01 | "¿Con qué frecuencia [nombre] conversa o comparte con familiares, amistades u otras personas?" | Todos o casi todos los días / Varias veces por semana / Algunas veces al mes / Casi nunca / Vive acompañado pero conversa o comparte poco / No lo sé | `frecuencia_contacto_social` | Compartir la casa no garantiza interacción social significativa. |
| RUT-02 | Propia persona: "¿Sentís que tenés suficiente compañía y contacto con otras personas?" / Otra: "¿[nombre] parece sentirse acompañado y satisfecho con el contacto que tiene con otras personas?" | Sí, parece satisfecho / Algunas veces quisiera compartir más / Con frecuencia se siente solo o aislado / Prefiere estar solo y parece sentirse bien así / No logra expresar cómo se siente / No lo sé | `percepcion_compañia` | "Prefiere estar solo y está bien" no debe tratarse como problema. "Se siente solo" → sugerir contactos breves, significativos, realistas. "No logra expresarlo" → valorar señales de bienestar durante actividades. |
| RUT-03 | "¿Con qué frecuencia [nombre] realiza actividades que le hacen pensar, recordar, aprender o resolver algo?" (leer, conversar, escribir, jugar, cocinar, usar tecnología, organizar, aprender) | Todos o casi todos los días / Varias veces por semana / Algunas veces al mes / Casi nunca / No lo sé | `frecuencia_estimulacion_cognitiva` | Valora frecuencia, no dificultad ni desempeño. |
| RUT-04 | "Cuando realiza este tipo de actividades, ¿cómo suele participar?" | Las inicia y realiza por sí mismo / Participa si alguien se las propone / Necesita acompañamiento para mantener la actividad / Se cansa o pierde el interés rápidamente / Generalmente no desea participar / Actualmente no realiza estas actividades / No lo sé | `forma_participacion_cognitiva` | Independiente → autoguiadas; necesita invitación → recordatorios/propuestas semanales; necesita acompañamiento → contenido compartido; se cansa → breves con pausas; rechaza → vincular con intereses, no forzar; no realiza → inicio gradual. |
| RUT-05 | "¿Cómo es la rutina diaria de [nombre]?" | Mantiene horarios y actividades bastante estables / Tiene algunas rutinas pero los días son poco estructurados / La rutina cambia mucho de un día a otro / Pasa gran parte del día sin actividades definidas / Depende de otra persona para organizar su día / No lo sé | `estructura_rutina_diaria` | Estable → integrar actividades en momentos existentes; poco estructurada → proponer 1-2 momentos fijos; dependencia → dirigir programación al acompañante; mucho tiempo sin actividad → sugerencias breves, sin saturar el día. |
| RUT-06 | "En un día habitual, ¿en qué pasa [nombre] la mayor parte de su tiempo?" (hasta 3 opciones) | Conversando o compartiendo / Tareas del hogar / Trabajando o estudiando / Leyendo, escribiendo o aprendiendo / Escuchando música o pasatiempos / Caminando o actividad física / Viendo televisión / Usando teléfono/tableta/computadora / Descansando o durmiendo / Residencia o centro diurno / Otra actividad / No lo sé | `actividades_predominantes[]` | TV, descanso o tecnología **no son automáticamente negativos**; lo relevante es si desplazan todas las demás actividades. |
| RUT-07 | "¿Participa [nombre] en actividades sencillas del hogar o de su vida cotidiana?" (ordenar objetos, doblar ropa, regar plantas, preparar algo sencillo, cuidar mascota, etc.) | Sí, por iniciativa propia / Participa si alguien se lo propone / Participa con supervisión o ayuda / Participa muy poco / Actualmente no participa / No lo sé | `participacion_actividades_cotidianas` | Convertir actividades cotidianas en oportunidades funcionales, sin presentar todas como "ejercicios". |
| RUT-08 | "¿Con qué frecuencia [nombre] sale de casa?" | Todos o casi todos los días / Varias veces por semana / Algunas veces al mes / Casi nunca / Actualmente no puede salir / Prefiere no salir / No lo sé | `frecuencia_salidas` | Casi nunca / no puede / prefiere no salir → RUT-08A. Cualquier otra → RUT-09. |
| RUT-08A | (condicional) "¿Cuál es la principal razón por la que sale poco?" (multi) | Dificultades para caminar / Miedo de caerse / Problemas de salud / Se desorienta o necesita acompañamiento / No tiene quién lo acompañe / Falta de transporte / Ansiedad o inseguridad / Ha perdido el interés / Prefiere permanecer en casa / Otra razón / No lo sé | `barreras_para_salir[]` | La app **no debe insistir en salir** cuando hay una limitación o preferencia legítima. |
| RUT-09 | "En comparación con años anteriores, ¿[nombre] realiza menos actividades o comparte menos con otras personas?" | No, se mantiene parecido / Sí, ha disminuido un poco / Sí, ha disminuido considerablemente / Actualmente participa más que antes / No lo sé | `cambio_nivel_participacion` | Disminuyó → RUT-09A. Se mantiene/aumentó → fin de bloque. No sabe → fin con recomendaciones conservadoras. |
| RUT-09A | (condicional) "¿Qué parece haber influido en esta disminución?" (multi) | Cambios en memoria/pensamiento / Dificultades de movimiento / Problemas de salud / Estado de ánimo / Pérdida de una persona cercana / Cambio de vivienda o rutina / Dejó de trabajar o se pensionó / Menor contacto con familiares o amistades / Falta de oportunidades / Se cansa con mayor facilidad / Otro motivo / No lo sé | `motivos_disminucion_participacion[]` | No basta con sugerir "socializar más". Si existe duelo, ansiedad, dolor o limitación física, la recomendación debe reconocerlo. Metas pequeñas y alcanzables. |

### 11.1 Clasificación interna (sin semáforo visible)

Genera dos variables internas: `nivel_activacion_cotidiana` (alta / intermedia / baja) y `nivel_conexion_social` (suficiente / riesgo de aislamiento).

| nivel_activacion_cotidiana | Criterios | Recomendación |
|---|---|---|
| Alta/adecuada | Rutina relativamente estructurada; actividades cognitivas varias veces/semana; participación doméstica o comunitaria; iniciativa preservada | Mantener variedad, incorporar nuevos retos, vincular con intereses |
| Intermedia | Participa cuando se le invita; rutina parcialmente estructurada; algunas actividades durante la semana; periodos pasivos frecuentes | Actividades breves, recordatorios, participación acompañada |
| Baja | Gran parte del día sin actividades; poca estimulación cognitiva; participación mínima; otra persona organiza la rutina | Comenzar con 1-2 actividades significativas, no un horario saturado |

| nivel_conexion_social | Criterios | Recomendación |
|---|---|---|
| Suficiente | Contacto frecuente; persona satisfecha; relaciones significativas | (mantener) |
| Riesgo de aislamiento | Contacto ocasional o escaso; sensación de soledad; disminución marcada; falta de acompañamiento u oportunidades | Sugerir contactos realistas: llamada, visita breve, actividad compartida, participación familiar, grupo comunitario/religioso/recreativo cuando sea viable |

### 11.2 Cruces con otros bloques

| Hallazgo | Cruce necesario |
|---|---|
| Poca participación + tristeza | Bloque emocional |
| Poca participación + apatía | Actividades significativas; consultar si es cambio reciente |
| Pocas salidas + caídas | Movimiento y seguridad |
| Pocas salidas + desorientación | Acompañamiento obligatorio |
| Mucho sueño diurno | Bloque de sueño |
| Rechazo de actividades + demencia | Conducta, fatiga y dificultad cognitiva |
| Vive solo + baja actividad | Disponibilidad de apoyo |
| Rutina dependiente | Plan dirigido al cuidador |

**Cierre del bloque** (3 variantes: rutina activa / poco estructurada / baja conexión social) — ver texto exacto en documento fuente, Bloque 5 punto 11.

---

## 12. Bloque final — Intereses, pasatiempos e historia significativa

**INT-00** (introducción, 2 variantes):
- Propia persona: "Para terminar, queremos conocer un poco sobre las cosas que disfrutás y que han sido importantes en tu vida. Esto nos ayudará a preparar actividades que realmente tengan sentido para vos."
- Otra persona: "Ya casi terminamos. Queremos conocer un poco sobre las cosas que disfruta [nombre] y que han sido importantes en su vida. Esto nos ayudará a preparar actividades cercanas a sus gustos y experiencias."

| ID | Pregunta | Opciones | Variable | Notas |
|---|---|---|---|---|
| INT-01 | "¿Qué actividades disfruta actualmente [nombre]?" (multi) | Escuchar música / Ver fotografías o recordar momentos / Conversar y compartir / Leer / Escribir / Cocinar / Jardinería / Caminar / Bailar / Pintar, dibujar o manualidades / Juegos de mesa, cartas o pasatiempos / Ver deportes / Actividades religiosas o espirituales / Cuidar animales / Ver televisión o películas / Otra actividad / Actualmente muestra poco interés / No lo sé | `intereses_actuales[]` | "Poco interés" puede combinarse con intereses previos, pero no con varios intereses actuales. "No lo sé" no combinable con otras. Si "otra actividad" → campo `otro_interes_actual`. |
| INT-02 | "¿Hay alguna actividad que [nombre] disfrutaba mucho antes, aunque actualmente la realice menos o haya dejado de hacer?" | Sí / No / No lo sé | `existen_intereses_previos` | Si "sí", mostrar en la misma pantalla: "¿Cuál o cuáles?" (texto corto, ej.: trabajar en el jardín, coser, enseñar, cocinar, bailar, viajar, jugar fútbol, cuidar animales). Variable: `intereses_previos_texto`. Uso: adaptar la actividad, no necesariamente repetirla igual (ej.: incorporar fotografías, aromas, clasificación de plantas y movimientos relacionados con jardinería). |
| INT-03 | "¿Qué ha sido especialmente importante para [nombre] a lo largo de su vida?" (hasta 3 opciones) | Su familia / Su trabajo u ocupación / Sus amistades / Su comunidad / La vida en el campo o la naturaleza / La religión o espiritualidad / La música / La cocina / El deporte / Los viajes / El estudio o aprendizaje / Cuidar y ayudar a otras personas / Otro aspecto / No lo sé | `temas_historia_significativa[]` | Si "otro" → campo opcional `otro_tema_biografico`. Limitar a 3 opciones obliga a identificar lo verdaderamente significativo. |
| INT-04 | "Para algunas actividades, ¿hay alguien que pueda acompañar a [nombre]?" | Sí, todos o casi todos los días / Sí, varias veces por semana / Sí, pero solo ocasionalmente / No cuenta con una persona disponible / No lo sé | `disponibilidad_acompañante` | Ver tabla de asignación abajo. No abre bloque independiente: es la última pantalla antes del cierre. |

**Tabla de asignación INT-04:**

| Respuesta | Asignación |
|---|---|
| Diariamente | Puede recibir actividades acompañadas frecuentes |
| Varias veces por semana | Distribuir actividades supervisadas en esos días |
| Ocasionalmente | Priorizar contenido autónomo + una actividad compartida |
| Sin acompañante | Bloquear actividades que exijan supervisión |
| No lo sabe | Asignar únicamente contenido seguro sin supervisión |

El sistema ya conoce, por los bloques anteriores, si la persona necesita acompañamiento cognitivo, físico o nutricional; esta pregunta confirma si ese apoyo realmente está disponible.

---

## 13. Cierre del cuestionario

**RES-00. Procesamiento** — "Gracias por compartirnos esta información. Estamos preparando el perfil de [nombre] para seleccionar actividades y recomendaciones acordes con sus capacidades, necesidades e intereses." Animación breve con frases rotativas, por ejemplo: "Revisando sus intereses." / "Adaptando el nivel de las actividades." / "Tomando en cuenta sus necesidades de apoyo." / "Preparando su Plan de Salud Cerebral." **No debe durar más de unos segundos ni mostrar un spinner indefinido.**

**RES-01. Resumen personalizado** — El sistema construye entre 4 y 6 frases mediante módulos validados (no un LLM sin restricciones generando libremente). Ejemplo de tono esperado:

> "Nos encantó conocer un poco más sobre don Juan. Es una persona que disfruta la jardinería, la música y compartir con su familia. Actualmente puede participar en varias actividades cotidianas, aunque se beneficia de instrucciones breves y recordatorios para organizar algunas tareas. También tomaremos en cuenta que utiliza bastón para caminar y que suele cansarse después de varios minutos de actividad. Como cuenta con acompañamiento familiar varias veces por semana, combinaremos actividades que puede realizar por sí mismo con otras para compartir. Prepararemos su Plan de Salud Cerebral a partir de sus capacidades actuales, sus necesidades de apoyo y las experiencias que han sido significativas para él."

**Cierre final:** "¡Listo! Ya comenzamos a crear el Plan de Salud Cerebral Personalizado de don Juan." Botón principal: "Ver su plan personalizado". Botón secundario: "Revisar mis respuestas".

### Regla de extensión del resumen (implementar como validador de contenido, no solo como guía de redacción)

**Debe mencionar únicamente:**
1. Uno o dos intereses.
2. Una fortaleza.
3. La principal necesidad de apoyo.
4. Una consideración relevante de seguridad, si existe.
5. La disponibilidad de acompañamiento.

**No debe:**
- Enumerar todas las dificultades.
- Mostrar verde, amarillo o rojo.
- Presentar un diagnóstico nuevo.
- Repetir información médica sensible innecesariamente.
- Usar un tono alarmista.
- Prometer resultados.
- Decir que el plan sustituye atención profesional.

Cualquier información adicional debe obtenerse después mediante revisiones semanales breves, **no agregando más preguntas al ingreso inicial**.

---

## 14. Sistema de alertas — consolidado

Todas las alertas se calculan de forma independiente al semáforo y se almacenan como flags separados. Ninguna bloquea el registro completo salvo que se indique.

| Alerta | Origen (pantalla) | Efecto |
|---|---|---|
| `alerta_cambio_agudo` | SG-05A / SG-05B | No bloquea el registro; no genera actividades exigentes; se destaca en el resumen final; recomienda consulta antes de esfuerzo físico/cognitivo |
| (sin nombre formal, "alerta funcional") | SG-04A | Recomendar revisión del sistema de administración de medicamentos |
| `alerta_caida` | MOV-05A | Requiere valoración posterior (MOV-05B); acompañamiento obligatorio en ejercicios de pie si hay caídas repetidas |
| Alerta por síntomas durante movimiento | MOV-06A | Bloquea ejercicio de pie o exigente según intensidad; mensaje de prudencia obligatorio |
| `alerta_conductual` | COND-03 | Bloquea actividades sin acompañamiento; evita sobreestimulación; prioriza regulación emocional |
| `alerta_nutricional` | NUT-03A | Orientación prioritaria de consulta nutricional/médica |
| `alerta_deglucion` | NUT-06B | Bloquea recomendaciones de cambio de textura, pajillas, espesantes o posiciones automáticas; bloquea recetas con texturas incompatibles |
| Alertas físicas separadas | §9.12 | Ver tabla completa en Bloque 3 |
| Alertas nutricionales adicionales | §10.7 | Ver tabla completa en Bloque 4 |

**Nota de implementación:** recomiendo normalizar todas las alertas a un mismo esquema, ej.:
```json
{
  "codigo": "alerta_cambio_agudo",
  "activa": true,
  "origen_pantalla": "SG-05A",
  "bloquea_registro": false,
  "acciones": ["no_generar_actividades_exigentes", "destacar_en_resumen"]
}
```
para que el motor de recomendaciones las consuma de forma uniforme, en vez de tener lógica ad hoc por alerta.

---

## 15. Notas de implementación técnica (no están en el documento fuente)

1. **Motor de flujo como grafo dirigido, no como formulario lineal.** Hay decenas de condiciones de "mostrar/ocultar pantalla" y "siguiente pantalla depende de la respuesta anterior". Modelarlo como state machine/grafo de pantallas con condiciones de entrada explícitas (no como un `if/else` disperso en el frontend), para poder auditar y testear cada ruta de forma aislada.
2. **Separar tres motores:** (a) motor de flujo/ramificación, (b) motor de clasificación (semáforos + alertas), (c) motor de personalización de contenido (filtrado de recursos por etiquetas + generación de resumen). El documento fuente los describe entrelazados, pero conviene desacoplarlos para poder testear la lógica de clasificación sin pasar por toda la UI.
3. **Reglas de exclusividad en preguntas multi-select.** Repetido en varias pantallas (SG-02, MOV-06, NUT-05, NUT-06, COND-01, INT-01): opciones tipo "Ninguna" / "No lo sé" / "Prefiero no responder" son mutuamente excluyentes con el resto. Implementar como una regla de validación genérica y reusable, no copiada pantalla por pantalla.
4. **Límites de selección múltiple:** EMO-01 (máx. 2), `patron_sueño` (hasta 2), RUT-06 (hasta 3), INT-03 (hasta 3). Validar en el componente de UI, no solo en backend.
5. **Motor de plantillas de texto** para resolver `[nombre]`, "vos"/"usted", tratamiento (don/doña), y las variantes por `rol_respondente` que aparecen en casi cada transición y pregunta. Ver §3.1 y §4.
6. **Modelo de datos de clasificación:** cada persona evaluada debe tener 4 semáforos independientes (`nivel_cognitivo`, `nivel_fisico`, `nivel_funcional`, `nivel_nutricional`), cada uno recalculable de forma independiente, más un conjunto de alertas activas (§14) y dos variables de activación/conexión social (§11.1) sin semáforo.
7. **Nunca combinar/promediar semáforos.** La regla de "mayor apoyo" (rojo > amarillo > verde) aplica dentro de cada eje, no entre ejes. El cruce entre ejes (ej. cognitivo × físico para dual task, §9.13) es una tabla de asignación de contenido, no una fusión de niveles.
8. **Catálogo de recursos/actividades con etiquetas estructuradas**, no texto libre: etiquetas corporales (`requiere_hombros`, etc.), nutricionales (`compatible_diabetes`, `alergenos[]`, etc.), y de nivel/participación. El texto libre del usuario (ej. `restriccion_texto_usuario`, `otra_indicacion_alimentaria`) se muestra en el perfil pero nunca filtra automáticamente el catálogo.
9. **Auditoría de tono:** dado que hay reglas duras de "nunca mostrar verde/amarillo/rojo al usuario" y "nunca usar términos como delirios/alucinaciones/desinhibición" en la interfaz familiar, conviene un lint/test automatizado que recorra todos los strings de UI en busca de esas palabras prohibidas antes de cada release.
10. **Generador de resumen (RES-01) como función restringida**, no un prompt abierto a un LLM: debe operar sobre los 5 puntos permitidos del §13 y rechazar (o recortar) cualquier salida que incluya semáforos, diagnósticos nuevos o promesas de resultado. Si se usa un LLM para la redacción final, validar la salida contra esas reglas antes de mostrarla.

---

## 16. Ambigüedades y huecos detectados en el documento fuente

Estos puntos **no los resolví por mi cuenta**; hay que confirmarlos con quien definió la arquitectura antes de implementarlos, para no introducir comportamiento no especificado.

1. **DEM-04 apunta a "DEM-05", pantalla que no existe en el documento.** Después de `areas_apoyo_demencia[]` el texto dice "Siguiente: DEM-05", pero no hay ninguna pantalla DEM-05 definida en ningún punto del documento. La sección K ("Evolución cognitiva común") indica que esas preguntas "aparecen en todas las rutas", lo que sugiere que DEM-04 debería continuar a EVOL-01, pero esto no está confirmado explícitamente. **Acción sugerida:** confirmar con el equipo si DEM-04 → EVOL-01 antes de codificar esta rama.
2. **Typo en las opciones de EMO-03:** una opción aparece como "Se de COG-07spierta varias veces", que es evidentemente un error de copiar/pegar sobre "Se despierta varias veces". Lo corregí en la tabla del §8.2, pero conviene que el equipo de contenido confirme la redacción final antes de publicar.
3. **La "tabla maestra final" del documento original solo incluye 5 filas de ejemplo** (COG-04 x3, MOV-05, NUT-06), presentadas como muestra del formato, no como tabla exhaustiva. Este documento la reemplaza por las tablas completas de cada bloque (§7 a §12), que sí cubren todas las pantallas. Si el equipo espera una tabla maestra única con todas las pantallas en una sola hoja (para QA o para un motor de reglas), hay que generarla a partir de estas secciones; no la reconstruí como archivo aparte para evitar duplicar y desincronizar la fuente de verdad.
4. **AVDI-06 no indica pantalla siguiente explícita**; por posición en el documento, sigue naturalmente al cierre del subbloque AVDI antes de evaluar si corresponde mostrar AVDB. Confirmar que AVDI-06 → (evaluación de condición para mostrar AVDB) es la transición correcta.
5. **NUT-06 (dificultad exclusiva de masticar / solo come lentamente)** no especifica pantalla siguiente explícita para el caso "solo come lentamente" más allá de "adaptar duración y acompañamiento"; asumí que continúa a NUT-07 por ser la ruta sin pantalla condicional adicional, igual que "sin dificultades". Confirmar.
6. **No se detalla el mecanismo exacto de generación de RES-01** (si es una función determinística por plantillas, un modelo de lenguaje con reglas duras, o una combinación). El documento solo da las restricciones de contenido (§13), no la arquitectura de generación. Es una decisión de producto/ingeniería pendiente, no algo que el documento fuente resuelva.
7. **Las imágenes referenciadas en el documento original** (diagramas de flujo antes de cada bloque) no se reprodujeron aquí porque no se pudo extraer su contenido visual del .docx; si contienen información de flujo no capturada en el texto (ej. algún camino adicional), habría que revisarlas directamente contra el archivo original antes de dar la especificación por completa.

---

## 17. Checklist de aceptación (QA)

- [ ] Las 7 salidas de perfil existen como entidades independientes (4 semáforos + 3 modificadores sin color).
- [ ] El pipeline de procesamiento respeta el orden de 6 pasos del §2, en ese orden.
- [ ] Ningún semáforo se muestra jamás en la interfaz de usuario (verificar en todos los textos de UI, incluido el resumen final).
- [ ] Ninguna alerta cambia automáticamente un semáforo; se almacenan y evalúan por separado.
- [ ] El flujo de voz/tratamiento se resuelve correctamente para los 5 valores de `rol_respondente`, incluyendo "Otra persona" con `relacion_otro`.
- [ ] Todas las reglas de exclusividad de multi-select (§15.3) están implementadas y testeadas con casos límite (seleccionar "Ninguna" + otra opción debe fallar la validación).
- [ ] Los límites de selección múltiple (EMO-01, `patron_sueño`, RUT-06, INT-03) se validan en UI y backend.
- [ ] Las 4 rutas de diagnóstico cognitivo (Sí/No/No sé/En valoración) llevan a sus bloques correctos y todas convergen en la sección "Evolución cognitiva común" salvo el caso preventivo sin cambios.
- [ ] AVDB solo se muestra bajo las condiciones de entrada especificadas en §8.5, nunca por defecto.
- [ ] Bloque de cambios conductuales (COND) solo se muestra bajo las 4 condiciones de entrada del §8.3.
- [ ] Las tablas de clasificación de cada semáforo (§8.1, §8.4, §9.11, §10.6) están codificadas como reglas explícitas (rojo > amarillo > verde), no como score numérico promediado.
- [ ] El cruce cognitivo × físico (§9.13) usa la tabla de 9 combinaciones exacta, no una fórmula aproximada.
- [ ] Cada alerta del §14 dispara su acción específica (bloqueo de contenido, mensaje, flag) y ninguna bloquea el registro completo salvo lo indicado.
- [ ] El generador del resumen final (RES-01) nunca produce más de los 5 elementos permitidos ni incluye ninguno de los 7 elementos prohibidos (§13).
- [ ] Ningún texto de UI usa las palabras "delirios", "alucinaciones", "desinhibición", "perfil rojo/amarillo/verde", o confirma un diagnóstico.
- [ ] El pantalla de procesamiento (RES-00) tiene una duración corta y determinada, nunca un spinner indefinido.
- [ ] Las tres ambigüedades marcadas como "confirmar" en el §16 (puntos 1, 5 y 6) fueron resueltas explícitamente con el equipo antes de dar por cerrada la implementación de esas rutas.