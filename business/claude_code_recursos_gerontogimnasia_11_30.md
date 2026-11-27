# Tarea para Claude Code: crear recursos de Gerontogimnasia N.º 11 al 30

## Contexto

Este documento es la instrucción de trabajo para implementar, en el repositorio
`/Users/rodolfo/git/integramente_app`, los **recursos de video N.º 11 al 30** del
programa de Gerontogimnasia de IntegraMente. Los recursos 1–10 ya existen en la
app; esta tarea agrega únicamente del **11 al 30** (no tocar ni duplicar los
recursos 1–10, ni crear nada fuera de este rango, aunque el documento fuente
original contenga guiones adicionales no numerados al final de la segunda
etapa).

Los videos ya grabados para estos recursos están en:

```
/Users/rodolfo/git/integramente_app/assets/video-resources/
```

Todos los datos de contenido (título visible en la app, instrucciones,
ciencia detrás del movimiento, adaptaciones, reto cognitivo, recomendaciones
de seguridad, información interna para el desarrollador, perfil cognitivo
recomendado, rutas compatibles, referencia científica y guion/timing del
video) están en el Apéndice de este documento, extraídos fielmente del
archivo `Guiones_de_videos_de_gerontogimnasia_revisados_con_videos_y_materiales.docx`
que Rodolfo compartió. No inventes ni completes datos que no estén en el
apéndice: si falta un dato para un recurso, repórtalo en vez de asumirlo.

## Pasos a seguir

1. **Entender el esquema existente.** Antes de crear nada, revisá cómo están
   implementados los recursos 1–10 en el repo (modelo de datos / tipos,
   archivo(s) de datos o seed, componentes `ResourceEditor` y
   `ResourceDetailView`, el campo `extras`, y cualquier convención de
   nombres de archivo de video). Replicá exactamente ese mismo esquema y
   convenciones para los recursos 11–30; no introduzcas un esquema nuevo.

2. **Emparejar cada recurso con su video.** Listá los archivos dentro de
   `assets/video-resources/` y emparejalos con los códigos `GJ-011` a
   `GJ-030` (o por título/slug, según la convención de nombres que ya usen
   los videos de los recursos 1–10). Si un video no aparece o hay ambigüedad
   entre dos archivos candidatos para el mismo recurso, **no adivines**:
   listalo como pendiente y preguntame antes de continuar con ese recurso
   específico.

3. **Verificar duración real del video.** El documento fuente trae un dato de
   "Duración del video" por recurso, pero en los recursos **24** y **25** el
   texto original del documento tiene una inconsistencia (aparecen dos
   valores de duración pegados, p. ej. "43 segundos30 segundos"). No uses el
   texto del documento como duración definitiva: calculá la duración real de
   cada archivo de video (p. ej. con `ffprobe`) y usá ese valor en el recurso.

4. **Crear los 20 recursos (11 a 30)** siguiendo el esquema detectado en el
   paso 1, usando por cada uno:
   - El contenido visible en la app (título, subtítulo, tiempo de práctica,
     materiales, instrucciones de práctica, ciencia con su enlace, 2
     adaptaciones, reto cognitivo, recomendaciones de seguridad).
   - La información interna para el desarrollador (código, área, categoría,
     duración real del video, nivel de dificultad, tipo de entrenamiento,
     objetivos motores, objetivos cognitivos, perfil cognitivo recomendado
     en tabla, rutas compatibles en tabla, criterios de exclusión,
     compatibilidad con retos cognitivos, referencia científica con DOI).
   - El guion del video (tabla de tiempos, acción visual y texto del
     terapeuta) y la lista de materiales necesarios para la grabación: si el
     esquema existente tiene un campo para esto (guion/subtítulos/notas de
     producción), guardalo ahí; si no existe tal campo, preguntame si
     querés que lo agregue al modelo de datos o que lo omita.
   - La ruta al archivo de video correspondiente dentro de
     `assets/video-resources/`.

5. **No muestres puntajes ni datos clínicos sensibles a la familia** más allá
   de lo que ya definen las reglas de producto existentes de IntegraMente en
   Casa (paleta verde serenidad/verde profundo/mostaza, sin elementos
   genéricos). La información de "perfil cognitivo recomendado" y "rutas
   compatibles" es para uso clínico/interno, igual que en los recursos 1–10;
   replicá el mismo tratamiento (visible solo donde ya se muestra ese tipo de
   dato para los recursos existentes).

6. **Al terminar**, corré lo que exista de lint/typecheck/tests del repo y
   dejame un resumen de: recursos creados, videos emparejados (con su
   duración real), cualquier recurso que quedó pendiente por falta de video o
   ambigüedad, y cualquier decisión que tomaste por tu cuenta (p. ej. dónde
   guardaste el guion) para que la revise.

---

# Apéndice: contenido extraído del documento (Recursos 11 a 30)

> Transcripción fiel del docx original, recurso por recurso. Las tablas
> "Perfil cognitivo recomendado" y "Rutas compatibles" son para uso
> clínico/interno. La sección "Guion N.º X" trae el guion de audio y la
> acción visual por tramos de tiempo, usado para producir el video — no es
> contenido que se muestre a la familia.


## RECURSO N.º 11 – MARCHA COORDINADA CON GLOBO


### A. Contenido visible en la aplicación

- Título: Marcha coordinada con globo
- Subtítulo: Entrená tu equilibrio y coordinación mientras caminás.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una silla firme, sin ruedas.
- Un globo inflado.
- Un espacio libre de obstáculos.

#### ¿Cómo practicar este ejercicio?

- Realizá 3 series de 20 a 30 segundos.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Mantené un ritmo cómodo y priorizá la estabilidad sobre la velocidad.

#### La ciencia detrás del movimiento

- ¿Sabías que caminar mientras realizamos otra actividad requiere que nuestro cerebro coordine simultáneamente el movimiento y la atención?
- Una revisión científica de 14 estudios, con 691 personas adultas mayores sanas, encontró que el entrenamiento de doble tarea puede favorecer el equilibrio.
- Con este ejercicio practicamos habilidades que utilizamos diariamente, como caminar mientras transportamos objetos o conversamos con otra persona.
- Consultar estudio científico: https://doi.org/10.1016/j.archger.2024.105368

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: caminá sosteniendo el globo con ambas manos, sin darle toques.
- Para aumentar el desafío: incrementá gradualmente el tiempo hasta 40 segundos por serie, siempre que mantengás la estabilidad.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el ejercicio, intentá nombrar frutas o animales mientras caminás y manipulás el globo.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Si necesitás apoyar tus manos para levantarte, hacelo antes de tomar el globo. No persigás el globo si se aleja ni prescindás de tus ayudas para caminar. Suspendé el ejercicio si sentís mareos, dolor o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-011
- Área: Gerontogimnasia.
- Categoría: Equilibrio y coordinación.
- Duración del video: 28 segundos.
- Nivel de dificultad: Intermedio.
- Tipo de entrenamiento: Doble tarea motora, con progresión cognitivo-motora.
- Objetivos motores: marcha funcional, equilibrio dinámico, control postural y coordinación óculo-manual.
- Objetivos cognitivos: atención dividida, control atencional y fluidez verbal semántica al incorporar el reto verbal.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado |
| Deterioro cognitivo leve | Recomendado con supervisión inicial |
| Síntomas demenciales leves | Con acompañamiento |
| Síntomas demenciales moderados | No asignar automáticamente; requiere valoración y adaptación |
| Síntomas demenciales severos | No recomendado en su formato original |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí |
| Amarilla | Sí, con supervisión directa y marcha estable sin ayudas |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, necesidad de ayudas técnicas durante la marcha o dificultad significativa para comprender las instrucciones.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Ercan Yildiz, S., Fidan, O., Gulsen, C., Colak, E., & Genc, G. A. (2024). Effect of dual-task training on balance in older adults: A systematic review and meta-analysis. Archives of Gerontology and Geriatrics, 121, 105368. https://doi.org/10.1016/j.archger.2024.105368
- Guion N.º 11: 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–07 s | El terapeuta introduce el ejercicio al lado de la participante, que está sentada con el globo en ambas manos. | «Al caminar con un vaso, coordinas tus pasos y tus manos. Vamos a practicarlo con un globo.» |
| 07–13 s | La participante se levanta con el globo, se estabiliza y camina hacia la cámara dando toques suaves con las manos alternadas. | «Levántate con el globo en ambas manos. Cuando estés firme, camina despacio y dale toques suaves, alternando las manos.» |
| 13–20 s | Continúa avanzando con el globo mientras se plantea nombrar una fruta y variar el reto con la tabla. | «Si te sientes firme, nombra una fruta mientras sigues. Cada vez, elige un reto distinto de nuestra tabla.» |
| 20–28 s | Sujeta el globo. En el plano de cierre vuelve a aparecer sentada junto al terapeuta. Logotipo de IntegraMente. | «Así practicas llevar cosas mientras caminas por casa.» |


| Materiales necesarios | Silla firme sin ruedas y un globo. |
| --- | --- |


---


## RECURSO N.º 12 – PASOS DE PRECISIÓN


### A. Contenido visible en la aplicación

- Título: Pasos de precisión.
- Subtítulo: Entrená tu equilibrio y la precisión de tus pasos.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una barra de apoyo o una superficie firme y estable, como el mostrador de la cocina o una pared.
- Marcas de colores para el suelo. Podés utilizar cinta adhesiva de color, bien adherida a la superficie.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 6 a 8 repeticiones con cada pie.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo 3 veces por semana, según tu tolerancia.
- Alterná ambos pies y procurá que cada movimiento sea lento, preciso y controlado.

#### La ciencia detrás del movimiento

- ¿Sabías que la capacidad de colocar nuestros pies con precisión es fundamental para caminar con seguridad y evitar obstáculos?
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden mejorar el equilibrio, la marcha y el tiempo de reacción, contribuyendo a reducir el riesgo de caídas en personas adultas mayores.
- Con este ejercicio practicamos habilidades que utilizamos diariamente al esquivar objetos, desplazarnos por espacios pequeños o caminar sobre diferentes superficies.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: colocá solo dos marcas más cerca de tus pies y mantené ambas manos sobre un apoyo firme.
- Para aumentar el desafío: intentá tocar las marcas siguiendo una secuencia de colores. Por ejemplo: verde, rojo, naranja y negro. Regresá a la posición inicial después de cada toque, manteniendo el apoyo y la estabilidad. Podés variar el orden de los colores en cada serie.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el movimiento, intentá nombrar objetos que podemos encontrar en la cocina mientras tocás las marcas con los pies.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Mantené al menos una mano sobre un apoyo firme durante el ejercicio. Asegurate de que las marcas estén bien adheridas al suelo. Si perdés estabilidad al incorporar el reto cognitivo, suspendelo. Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-012.
- Área: Gerontogimnasia.
- Categoría: Equilibrio y coordinación.
- Duración del video: 26 segundos.
- Nivel de dificultad: Básico-intermedio.
- Tipo de entrenamiento: Equilibrio dinámico y coordinación visomotora, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: transferencia del peso corporal, equilibrio dinámico, control postural, coordinación óculo-pedal y precisión del paso.
- Objetivos cognitivos: atención visual, procesamiento visoespacial, planificación motora, atención dividida y fluidez verbal semántica al incorporar el reto verbal.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado |
| Deterioro cognitivo leve | Recomendado |
| Síntomas demenciales leves | Con acompañamiento |
| Síntomas demenciales moderados | Con acompañamiento, modelado y adaptación; inicialmente sin reto verbal |
| Síntomas demenciales severos | No asignar automáticamente; requiere valoración individual |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí |
| Amarilla | Sí, con apoyo firme y supervisión directa |
| Roja | No |

- Criterios de exclusión del formato original: incapacidad para mantenerse de pie con apoyo, dificultad significativa para transferir el peso corporal, riesgo elevado de caída sin valoración profesional o incapacidad para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593. https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 12: 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–05 s | La participante está de pie junto a una barra, frente a varias marcas planas de colores. El terapeuta presenta el ejercicio. | «Cuando esquivas algo en el piso, eliges dónde poner el pie. Vamos a practicarlo con esta marca.» |
| 05–13 s | Se indica usar un apoyo. La participante acerca la mano a la barra y, con las manos libres durante el toque, adelanta un pie hacia la marca verde y lo devuelve al inicio. | «Sujétate del apoyo. Toca la marca con un pie y regresa. Cuando estés firme, toca la misma marca con el otro.» |
| 13–20 s | Repite con el otro pie hacia la misma referencia. Se propone nombrar algo de la cocina y variar el reto con la tabla. | «Si te sientes firme, nombra algo de la cocina mientras sigues. Cada vez, elige un reto distinto de nuestra tabla.» |
| 20–26 s | La participante y el terapeuta cierran de pie junto a las marcas. Logotipo de IntegraMente. | «Así practicas colocar el pie con más precisión.» |


| Materiales necesarios | Barra de apoyo y marcas planas de colores para el suelo. |
| --- | --- |


---


## RECURSO N.º 13 – GIROS DE TRONCO CON CONTROL POSTURAL


## A. Contenido visible en la aplicación

- Título: Giros de tronco con control postural 
- Subtítulo: Fortalecé tu estabilidad y movilidad al girar.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.
- Materiales que debés tener listos
- Un balón de ejercicio grande (fitball), adecuado a tu estatura.
- Una mancuerna liviana o una botella pequeña de agua.
- Una silla firme, sin ruedas, si necesitás realizar la versión adaptada.
- ¿Cómo practicar este ejercicio?
- Realizá 2 series de 6 a 8 giros hacia cada lado.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Mantené ambos pies apoyados en el suelo, realizá los giros lentamente y evitá forzar el movimiento. Comenzá sin peso o con una carga liviana.
- La ciencia detrás del movimiento
- ¿Sabías que los músculos del abdomen y la espalda son fundamentales para mantener el equilibrio y la estabilidad de nuestro cuerpo?
- Un estudio publicado en la revista científica Gerontology encontró que un programa de entrenamiento de la musculatura del tronco durante nueve semanas favoreció la fuerza muscular, el equilibrio y la movilidad funcional en personas adultas mayores.
- Con este ejercicio practicamos movimientos que utilizamos diariamente al alcanzar objetos a nuestro alrededor, vestirnos o girar para conversar con alguien.
- Consultar estudio científico: https://doi.org/10.1159/000343152
- Adaptá el ejercicio a tus capacidades
- Para hacerlo más sencillo: realizá el ejercicio sentado en una silla firme, sin utilizar peso y manteniendo los brazos cerca del cuerpo.
- Para aumentar el desafío: mantené la posición del giro durante 2 segundos antes de regresar lentamente al centro. Procurá conservar la estabilidad, sin aumentar la amplitud del giro ni el peso de la mancuerna.
- ¡Sumale un reto cognitivo!
- Si ya dominás el movimiento, intentá nombrar los días de la semana en orden, diciendo uno diferente con cada giro.
- Botón: Ir a nuestra tabla de retos cognitivos.
- Recomendaciones de seguridad
- Utilizá el balón únicamente si tenés experiencia previa y contás con acompañamiento. Mantené ambos pies apoyados, respirá normalmente y evitá los movimientos bruscos. Si tenés osteoporosis, antecedentes de fracturas vertebrales o problemas de columna, consultá con un profesional antes de realizar giros con peso. Detené el ejercicio si sentís dolor, mareos o inestabilidad.
- B. Información interna para el desarrollador
- Código: GJ-013.
- Área: Gerontogimnasia.
- Categoría: Movilidad y estabilidad postural.
- Duración del video: 30 segundos.
- Nivel de dificultad: Intermedio-avanzado.
- Tipo de entrenamiento: Estabilización del tronco, movilidad y equilibrio dinámico en sedestación, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: activación de la musculatura estabilizadora del tronco, movilidad torácica, control postural, equilibrio dinámico y coordinación bilateral.
- Objetivos cognitivos: atención sostenida, conciencia corporal, atención dividida y secuenciación verbal al incorporar el reto cognitivo.
- Perfil cognitivo recomendado

| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado con experiencia previa y acompañamiento capacitado |
| Deterioro cognitivo leve | Con supervisión directa y valoración funcional |
| Síntomas demenciales leves | Priorizar la variante en silla, con acompañamiento |
| Síntomas demenciales moderados | Variante en silla, sin peso, con modelado y supervisión |
| Síntomas demenciales severos | No recomendado en su formato original; requiere valoración individual |

- Rutas compatibles

| Ruta | Compatibilidad |
| --- | --- |
| Verde |  |
| Amarilla | Variante en silla con supervisión directa |
| Roja | Únicamente variante en silla, según capacidad de control del tronco |

- Criterios de exclusión del formato original: control postural insuficiente, riesgo elevado de caída, dificultad para mantenerse sentado sobre una superficie inestable o incapacidad para seguir instrucciones sencillas. Los antecedentes de fracturas vertebrales, osteoporosis y patologías de columna requieren valoración específica antes de incorporar resistencia.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y sin comprometer la estabilidad. Priorizar su incorporación en la variante sobre silla.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Granacher, U., Lacroix, A., Muehlbauer, T., Roettger, K., & Gollhofer, A. (2013). Effects of core instability strength training on trunk muscle strength, spinal mobility, dynamic balance and functional mobility in older adults. Gerontology, 59(2), 105–113. https://doi.org/10.1159/000343152
- Guion N.º 13: Guión 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está sentada sobre un balón grande, con los pies separados y apoyados. Sostiene una mancuerna con ambas manos y el terapeuta presenta el ejercicio a su lado. | «¿Tienes el control remoto a un lado? Vamos a practicar el giro que haces para alcanzarlo.» |
| 06–15 s | Eleva la mancuerna al frente con ambos brazos y gira el tronco hacia un lado. Vuelve al centro y gira hacia el otro lado, con los pies apoyados y la cadera estable. | «Apoya bien los pies. Sostén la mancuerna con ambas manos y eleva los brazos al frente. Gira el tronco hacia un lado sin mover la cadera, vuelve al centro y gira hacia el otro.» |
| 15–22 s | Repite los giros con la mancuerna al frente. Se propone decir un día de la semana y variar el reto con la tabla. | «Si quieres un reto mayor, di un día de la semana mientras giras. Cada vez, elige otro reto de nuestra tabla.» |
| 22–30 s | La participante vuelve al centro. El terapeuta se coloca a su lado para el cierre. Logotipo de IntegraMente. | «Así practicas girar con control al estar sentado.» |


| Materiales necesarios | Balón de ejercicio grande y una mancuerna. |
| --- | --- |


---


## RECURSO N.º 14 – CAMINATA GUIADA POR COLORES


### A. Contenido visible en la aplicación

- Título: Caminata guiada por colores.
- Subtítulo: Entrená tu equilibrio, coordinación y orientación espacial mientras caminás.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Seis plataformas de equilibrio de diferentes colores y alturas, como las que se muestran en el video. También podés utilizar hojas de colores bien adheridas al suelo o cinta adhesiva de color.
- Un espacio amplio y libre de obstáculos.
- Un apoyo firme, si necesitás mayor estabilidad.

#### ¿Cómo practicar este ejercicio?

- Realizá entre 4 y 6 recorridos completos.
- Descansá entre 30 y 60 segundos cada dos recorridos.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Avanzá colocando un pie sobre cada referencia de color, siguiendo el recorrido a un ritmo cómodo y controlado.

#### La ciencia detrás del movimiento

- ¿Sabías que tu cerebro utiliza la información visual para calcular dónde colocar los pies y adaptar tus pasos a las diferentes superficies del entorno?
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden mejorar el equilibrio, la marcha y el tiempo de reacción, contribuyendo a reducir el riesgo de caídas en personas adultas mayores.
- Con este ejercicio practicamos habilidades necesarias para esquivar obstáculos, superar pequeños desniveles y desplazarnos con mayor seguridad.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: utilizá cuatro o seis hojas de colores bien adheridas al suelo, eliminando los desniveles y manteniendo una distancia cómoda entre las referencias.
- Para aumentar el desafío: si dominás el recorrido sobre una superficie plana, incorporá progresivamente plataformas de diferentes alturas, como las del video, siempre con acompañamiento. Si ya utilizás las plataformas con seguridad, podés variar su distribución antes de cada recorrido, sin aumentar su altura.

#### ¡Sumale un reto cognitivo!

- Una vez que dominés el recorrido sobre una superficie plana, intentá nombrar el color de cada referencia antes de colocar el pie sobre ella.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Asegurate de que las hojas o plataformas no se deslicen. Utilizá calzado antideslizante y conservá tus apoyos habituales para caminar. Realizá la variante con plataformas elevadas únicamente con acompañamiento capacitado y si tu capacidad de equilibrio lo permite. Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-014.
- Área: Gerontogimnasia.
- Categoría: Marcha y coordinación.
- Duración del video: 25 segundos.
- Nivel de dificultad: Intermedio-avanzado con plataformas; básico-intermedio con referencias planas.
- Tipo de entrenamiento: Marcha adaptativa guiada por estímulos visuales, equilibrio dinámico e integración cognitivo-motora.
- Objetivos motores: equilibrio dinámico, coordinación óculo-pedal, transferencia del peso corporal, elevación del pie, precisión del paso y adaptación de la marcha a diferentes alturas.
- Objetivos cognitivos: atención visual, procesamiento visoespacial, lateralidad, secuenciación y planificación motora.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado con supervisión inicial |
| Síntomas demenciales leves | Con acompañamiento, priorizando referencias planas |
| Síntomas demenciales moderados | Variante plana, recorrido simplificado, modelado y supervisión directa |
| Síntomas demenciales severos | No recomendado en su formato original |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Variante con referencias planas y marcha independiente |
| Amarilla | Variante plana con supervisión directa. Plataformas elevadas únicamente tras valoración funcional y con acompañamiento capacitado |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, marcha inestable, dificultad para elevar los pies, alteraciones visuales que impidan identificar las referencias o incapacidad para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, priorizando su incorporación en la variante con referencias planas.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593. https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 14: Guión 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está de pie, con el terapeuta al lado, frente a un recorrido de plataformas de colores dispuesto en dos filas. | «Al caminar, tu cerebro usa lo que ves para guiar tus pasos. Hoy vamos a practicarlo con colores.» |
| 06–12 s | Con las manos libres, coloca el pie derecho sobre la plataforma roja y el izquierdo sobre la celeste. | «Coloca el pie derecho en el rojo y el izquierdo en el celeste.» |
| 12–18 s | Avanza hacia el azul oscuro con el pie derecho y hacia el verde con el izquierdo. Continúa hacia las plataformas naranja y amarilla, siguiendo el recorrido. | «Sigue el recorrido, avanzando hacia las siguientes plataformas de colores.» |
| 18–25 s | Termina con un pie en cada plataforma del último par. El terapeuta se acerca para el cierre. Logotipo de IntegraMente. | «Así practicas cómo dirigir tus pasos siguiendo una indicación.» |


| Materiales necesarios | Seis plataformas de colores para el suelo. |
| --- | --- |


---


## RECURSO N.º 15 – CONTROL DEL PIE CON BALÓN


### A. Contenido visible en la aplicación

- Título: Control del pie con balón.
- Subtítulo: Entrená tu equilibrio y estabilidad mientras movés los pies.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una barra de apoyo o una superficie firme y estable, como el mostrador de la cocina.
- Una pelota pequeña, liviana y fácil de controlar.
- Una silla firme, sin ruedas, si necesitás realizar la versión adaptada.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 20 a 30 segundos con cada pie.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Mové el balón lentamente hacia adelante y hacia atrás, manteniendo el peso corporal sobre la pierna de apoyo.

#### La ciencia detrás del movimiento

- ¿Sabías que cada vez que damos un paso, nuestro cuerpo debe mantener el equilibrio sobre una pierna mientras la otra se mueve?
- Una revisión científica de 23 ensayos clínicos, publicada en la revista Sports Medicine, encontró que el entrenamiento del equilibrio favorece el control postural tanto en posiciones estáticas como durante el movimiento en personas adultas mayores sanas.
- Con este ejercicio practicamos habilidades necesarias para caminar, subir escalones y realizar actividades cotidianas como vestirnos.
- Consultar estudio científico: https://doi.org/10.1007/s40279-015-0375-y

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá el ejercicio sentado en una silla firme, desplazando el balón hacia adelante y hacia atrás con cada pie.
- Para aumentar el desafío: combiná diferentes movimientos con el balón: hacia adelante, hacia atrás y en círculos en ambos sentidos. Mantené el apoyo y realizá los movimientos de manera lenta y controlada.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el movimiento, intentá nombrar diferentes prendas de vestir mientras desplazás el balón con el pie.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Mantené al menos una mano sobre un apoyo firme. No descargués el peso corporal sobre el balón. Si este se aleja, no intentés alcanzarlo mientras estás de pie sobre una sola pierna. Suspendé el reto cognitivo si afecta tu estabilidad. Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-015.
- Área: Gerontogimnasia.
- Categoría: Equilibrio y coordinación.
- Duración del video: 35 segundos.
- Nivel de dificultad: Intermedio en posición de pie y básico en posición sentada.
- Tipo de entrenamiento: Equilibrio dinámico, control motor y entrenamiento propioceptivo, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: estabilidad monopodal asistida, control postural, coordinación óculo-pedal, propiocepción, movilidad del tobillo y control selectivo de los miembros inferiores.
- Objetivos cognitivos: atención sostenida, monitorización del movimiento, planificación motora, atención dividida y fluidez verbal semántica al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado con supervisión inicial |
| Síntomas demenciales leves | Con acompañamiento directo |
| Síntomas demenciales moderados | Priorizar la variante sentada, con modelado y supervisión |
| Síntomas demenciales severos | Variante sentada únicamente tras valoración individual y con acompañamiento |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, con adecuado equilibrio y apoyo firme |
| Amarilla | Sí, con supervisión directa o variante sentada según capacidad funcional |
| Roja | Únicamente variante sentada |

- Criterios de exclusión del formato original: incapacidad para sostener el peso corporal sobre una pierna con apoyo manual, riesgo elevado de caída, dolor durante la carga de peso o dificultad significativa para controlar el balón y seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y siempre que no comprometa la estabilidad.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Lesinski, M., Hortobágyi, T., Muehlbauer, T., Gollhofer, A., & Granacher, U. (2015). Effects of balance training on balance performance in healthy older adults: A systematic review and meta-analysis. Sports Medicine, 45(12), 1721–1738. https://doi.org/10.1007/s40279-015-0375-y
- Guion N.º 15: Guión 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–05 s | La participante está de pie detrás de una barra de apoyo. Tiene un balón pequeño al frente y el terapeuta a su lado. | «Al dar un paso, una pierna te sostiene mientras el otro pie se mueve. Vamos a practicar ese control.» |
| 05–14 s | Con una mano en la barra durante el rodamiento inicial, mantiene un pie firme en el suelo y rueda el balón con el otro, hacia adelante y atrás, sin cargar peso sobre el balón. | «Sujétate de la barra. Deja un pie firme y, con el otro, rueda el balón despacio hacia adelante y atrás, sin cargar peso sobre él.» |
| 14–27 s | Se muestran giros del balón bajo el pie como progresión. Se propone nombrar una prenda y variar el reto con la tabla. | «Para aumentar la dificultad, haz giros con el balón. Si te sientes firme, nombra una prenda mientras sigues. Elige otro reto de la tabla cada vez.» |
| 27–35 s | El terapeuta vuelve junto a la participante, que permanece de pie con la barra y el balón al frente. Logotipo de IntegraMente. | «Así practicas mantenerte firme al mover un pie.» |


| Materiales necesarios | Barra de apoyo y un balón pequeño. |
| --- | --- |


---


## RECURSO N.º 16 – TOQUES DE PRECISIÓN CON LOS PIES


### A. Contenido visible en la aplicación

- Título: Toques de precisión con los pies.
- Subtítulo: Entrená tu equilibrio y el control de tus piernas al levantar los pies.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una barra de apoyo o una superficie firme y estable, como el mostrador de la cocina.
- Dos conos bajos. También podés utilizar marcas de colores bien adheridas al suelo para realizar una versión más sencilla.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 4 a 6 secuencias con cada pie. Cada secuencia incluye un toque del mismo lado y otro del lado contrario.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Levantá y bajá el pie lentamente, regresando a la posición inicial después de cada toque y manteniendo el apoyo de ambas manos.

#### La ciencia detrás del movimiento

- ¿Sabías que levantar los pies con precisión y controlar el equilibrio sobre una pierna son habilidades fundamentales para evitar tropiezos?
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden favorecer el equilibrio sobre una pierna, la movilidad y el tiempo de reacción, contribuyendo a reducir el riesgo de caídas.
- Con este ejercicio practicamos habilidades necesarias para superar pequeños obstáculos, pasar sobre el umbral de una puerta o subir escalones.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: utilizá marcas planas de colores en lugar de conos y realizá los toques únicamente hacia el mismo lado de cada pie, sin cruzar las piernas.
- Para aumentar el desafío: realizá una secuencia de tres movimientos: tocá el cono del mismo lado, el del lado contrario y nuevamente el del mismo lado. Regresá a la posición inicial después de cada toque, manteniendo el apoyo de ambas manos.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el movimiento, intentá nombrar diferentes medios de transporte mientras realizás los toques con los pies.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Mantené ambas manos sobre un apoyo firme. Utilizá conos bajos y flexibles, evitá cruzar excesivamente las piernas y no descargués el peso corporal sobre los conos. Realizá los movimientos sin prisa y suspendé el reto cognitivo si afecta tu estabilidad. Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-016.
- Área: Gerontogimnasia.
- Categoría: Equilibrio y coordinación.
- Duración del video: 38 segundos.
- Nivel de dificultad: Intermedio-avanzado.
- Tipo de entrenamiento: Equilibrio dinámico, coordinación de miembros inferiores y cruce de la línea media corporal, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: estabilidad monopodal asistida, transferencia del peso corporal, control postural, elevación del pie, coordinación óculo-pedal y precisión del movimiento.
- Objetivos cognitivos: atención visual, procesamiento visoespacial, lateralidad, planificación motora, secuenciación, atención dividida y fluidez verbal semántica al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado con supervisión inicial |
| Síntomas demenciales leves | Con acompañamiento directo e instrucciones sencillas |
| Síntomas demenciales moderados | Variante simplificada, sin movimientos cruzados, con modelado y supervisión directa |
| Síntomas demenciales severos | No recomendado en su formato original |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, con adecuado equilibrio y dominio previo del movimiento |
| Amarilla | Sí, con supervisión directa y adaptación según capacidad funcional |
| Roja | No |

- Criterios de exclusión del formato original: control postural insuficiente, incapacidad para sostener el peso corporal sobre una pierna con apoyo manual, riesgo elevado de caída, restricciones articulares que impidan los movimientos cruzados o dificultad significativa para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y siempre que no comprometa la estabilidad.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593. https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 16: Guión 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está de pie frente a dos conos, uno a cada lado, detrás de la barra de apoyo. | «Para pasar sobre el borde de una puerta, necesitas levantar el pie lo suficiente. Vamos a practicarlo.» |
| 06–16 s | Con las manos en la barra, lleva el pie derecho hacia el cono del mismo lado y después cruza hacia el cono opuesto. | «Usa la barra de apoyo. Con el pie derecho, toca el cono de ese lado y luego el del lado contrario.» |
| 16–28 s | Repite el patrón con el pie izquierdo. Se propone nombrar un medio de transporte y variar el reto con la tabla. | «Haz lo mismo con el pie izquierdo. Si te sientes estable, nombra un medio de transporte mientras sigues. Elige otro reto de la tabla cada vez.» |
| 28–38 s | El terapeuta se acerca para el cierre junto a la barra y los conos. Logotipo de IntegraMente. | «Así practicas levantar y bajar el pie con control.» |


| Materiales necesarios | Barra de apoyo y dos conos bajos. |
| --- | --- |


---


## RECURSO N.º 17 – EQUILIBRIO SOBRE SUPERFICIE INESTABLE


### A. Contenido visible en la aplicación

- Título: Equilibrio sobre superficie inestable.
- Subtítulo: Entrená tu estabilidad y control postural para moverte con mayor seguridad.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una barra de apoyo o una superficie fija, firme y resistente.
- Un balancín inflable o disco de equilibrio antideslizante.
- Si no contás con un balancín, podés realizar el ejercicio directamente sobre el suelo o utilizar un cojín que tengás en casa, siempre que sea adecuado y contés con acompañamiento.
- Si utilizás un cojín, asegurate de que:
- Sea firme, delgado y uniforme.
- Sea suficientemente amplio para apoyar ambos pies.
- No se hunda excesivamente al apoyar los pies.
- No se deslice ni se doble durante el ejercicio.
- Si el cojín no cumple estas características, realizá el ejercicio directamente sobre el suelo.

#### ¿Cómo practicar este ejercicio?

- Realizá 3 series de 15 a 20 segundos.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Con acompañamiento, subí a la superficie de equilibrio colocando un pie a la vez. Mantené ambas manos sobre el apoyo, las rodillas ligeramente flexionadas y una postura cómoda. Bajá lentamente al finalizar.

#### La ciencia detrás del movimiento

- ¿Sabías que para mantener el equilibrio tu cerebro integra información de la vista, el oído interno, los músculos y las articulaciones?
- Una revisión científica de 23 ensayos clínicos, publicada en la revista Sports Medicine, encontró que los programas de entrenamiento del equilibrio favorecen el control postural y la capacidad de responder ante cambios en la estabilidad.
- Con este ejercicio practicamos habilidades necesarias para mantenernos de pie, vestirnos y adaptarnos a diferentes superficies al caminar.
- Consultar estudio científico: https://doi.org/10.1007/s40279-015-0375-y

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá el ejercicio directamente sobre el suelo, con los pies separados al ancho de las caderas y ambas manos sobre un apoyo firme.
- Para aumentar el desafío: si dominás el ejercicio sobre el suelo y contás con acompañamiento, podés incorporar un cojín adecuado o un balancín inflable. Una vez que logrés mantenerte estable, aumentá gradualmente el tiempo de permanencia hasta alcanzar 30 segundos por serie.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el ejercicio, intentá contar hacia atrás del 10 al 1. Practicalo inicialmente sobre una superficie firme y suspendé el reto si afecta tu estabilidad.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Mantené ambas manos sobre un apoyo firme durante todo el ejercicio. Si utilizás un cojín o balancín, realizá la actividad con una persona que pueda acompañarte y ayudarte de forma segura. Evitá las superficies demasiado blandas o resbaladizas y no cierres los ojos durante el ejercicio.
- Si tenés antecedentes de caídas o dificultades de equilibrio, priorizá la versión sobre el suelo y consultá con un profesional antes de incorporar superficies inestables. Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-017.
- Área: Gerontogimnasia.
- Categoría: Equilibrio y control postural.
- Duración del video: 32 segundos.
- Nivel de dificultad: Avanzado sobre superficie inestable y básico sobre superficie firme.
- Tipo de entrenamiento: Equilibrio estático, integración sensorial y control postural, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: estabilidad postural, propiocepción, integración sensorial, ajustes posturales y activación de la musculatura estabilizadora de los miembros inferiores y del tronco.
- Objetivos cognitivos: atención sostenida, monitorización del movimiento, atención dividida, memoria de trabajo y secuenciación numérica al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado con supervisión inicial |
| Síntomas demenciales leves | Con acompañamiento, priorizando la variante sobre superficie firme |
| Síntomas demenciales moderados | Variante sobre superficie firme, con modelado y supervisión directa, inicialmente sin reto cognitivo |
| Síntomas demenciales severos | No recomendado en su formato original; requiere valoración individual |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Variante sobre superficie firme, según capacidad funcional |
| Amarilla | Variante sobre superficie firme con acompañamiento. Cojín o balancín únicamente con suficiente capacidad funcional y acompañamiento seguro |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, control postural insuficiente, vértigo activo, incapacidad para subir y bajar de la superficie de equilibrio de forma segura o dificultad significativa para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor, priorizando su incorporación sobre superficie firme.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Lesinski, M., Hortobágyi, T., Muehlbauer, T., Gollhofer, A., & Granacher, U. (2015). Effects of balance training on balance performance in healthy older adults: A systematic review and meta-analysis. Sports Medicine, 45(12), 1721–1738. https://doi.org/10.1007/s40279-015-0375-y
- Guion N.º 17: Guion

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está de pie detrás de una barra, con el balancín inflable frente a sus pies y el terapeuta al lado. | “Trabajemos tu equilibrio para que te sintás más seguro en tus actividades diarias.” |
| 06–15 s | Se sujeta con ambas manos y sube al balancín inflable, un pie a la vez, hasta apoyar ambos pies sobre él. | «Sujétate de la barra con ambas manos. Con acompañamiento, sube un pie y luego el otro al balancín inflable y mantente de pie.» |
| 15–24 s | Mantiene el equilibrio con ambas manos en la barra. Una vez estable, se propone contar hacia atrás del diez al uno y variar el reto con la tabla. | “Cuando estés estable, contá hacia atrás, del diez al uno. Revisá nuestra tabla y escogé un reto diferente cada vez.” |
| 24–32 s | En el cierre, la participante está de nuevo en suelo firme junto al terapeuta, con las manos en la barra. Logotipo de IntegraMente. | “Al vestirte o moverte por casa, tu equilibrio hace la diferencia. ¡Seguí practicando con IntegraMente!” |


| Materiales necesarios | Barra de apoyo y un balancín inflable. |
| --- | --- |


---


## RECURSO N.º 18 – COORDINACIÓN DE MANOS CON PELOTA


### A. Contenido visible en la aplicación

- Título: Coordinación de manos con pelota.
- Subtítulo: Entrená la coordinación, precisión y agilidad de tus manos.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una silla firme, sin ruedas.
- Una pelota pequeña, liviana y fácil de sujetar.
- Si no contás con una pelota, podés utilizar un par de medias enrolladas formando una bola suave y compacta.

#### ¿Cómo practicar este ejercicio?

- Realizá 3 series de 30 a 45 segundos.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 3 a 5 veces por semana, según tu tolerancia.
- Sentate cómodamente, con ambos pies apoyados en el suelo. Pasá la pelota de una mano a otra frente a tu cuerpo, procurando mantener un movimiento fluido y controlado.

#### La ciencia detrás del movimiento

- ¿Sabías que coordinar ambas manos requiere que diferentes áreas de tu cerebro trabajen en conjunto?
- Un estudio publicado en la revista científica Scientific Reports encontró que el entrenamiento de movimientos coordinados con ambas manos durante dos meses favoreció la destreza manual en personas adultas mayores y produjo cambios en el funcionamiento de las áreas cerebrales relacionadas con el control del movimiento.
- Con este ejercicio practicamos habilidades que utilizamos diariamente al vestirnos, manipular utensilios, doblar ropa o realizar actividades de higiene personal.
- Consultar estudio científico: https://doi.org/10.1038/s41598-021-02173-7

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: utilizá una pelota suave, ligeramente más grande y fácil de sujetar. Pasala lentamente de una mano a otra, manteniendo las manos cerca del cuerpo y sin lanzarla.
- Para aumentar el desafío: realizá lanzamientos cortos de una mano a otra. Una vez que dominés este movimiento, alterná dos pases directos y un lanzamiento, procurando mantener la secuencia y el control de la pelota.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el movimiento, intentá contar de dos en dos, diciendo un número cada vez que pasés la pelota de una mano a otra: 2, 4, 6, 8, 10…
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Utilizá una silla firme y mantené ambos pies apoyados en el suelo. Elegí una pelota liviana y realizá lanzamientos cortos, sin elevar excesivamente los brazos. Si la pelota cae al suelo, evitá inclinarte bruscamente para recogerla y solicitá ayuda si la necesitás.
- Detené el ejercicio si experimentás dolor, fatiga excesiva o molestias en las manos, muñecas u hombros.

### B. Información interna para el desarrollador

- Código: GJ-018.
- Área: Gerontogimnasia.
- Categoría: Coordinación y destreza manual.
- Duración del video: 34 segundos.
- Nivel de dificultad: Básico-intermedio.
- Tipo de entrenamiento: Coordinación bilateral de miembros superiores, coordinación óculo-manual y control motor, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: coordinación bilateral, coordinación óculo-manual, precisión del movimiento, control de la prensión y liberación de objetos, regulación de la fuerza y movilidad funcional de los miembros superiores.
- Objetivos cognitivos: atención sostenida, atención visual, seguimiento de objetos, planificación motora, anticipación visomotora, secuenciación, memoria de trabajo, atención dividida y cálculo mental al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado |
| Deterioro cognitivo leve | Recomendado, incluyendo retos cognitivos según tolerancia |
| Síntomas demenciales leves | Recomendado, adaptando la complejidad del movimiento y del reto cognitivo |
| Síntomas demenciales moderados | Variante simplificada, con modelado y acompañamiento. Priorizar pases directos, sin lanzamientos |
| Síntomas demenciales severos | Variante simplificada, con instrucciones de un solo paso y acompañamiento, según capacidad de comprensión y manipulación de objetos |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente |
| Amarilla | Sí, con acompañamiento según las necesidades de la persona |
| Roja | Sí, según capacidad de control postural y movilidad de los miembros superiores |

- Criterios de exclusión del formato original: dolor significativo durante el movimiento, restricciones importantes de movilidad de los miembros superiores, control postural insuficiente en sedestación o incapacidad para sujetar y transferir objetos de forma segura.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y adaptando la complejidad del reto al perfil cognitivo de la persona.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Naito, E., Morita, T., Hirose, S., Kimura, N., Okamoto, H., Kamimukai, C., & Asada, M. (2021). Bimanual digit training improves right-hand dexterity in older adults by reactivating declined ipsilateral motor-cortical inhibition. Scientific Reports, 11, 22696. https://doi.org/10.1038/s41598-021-02173-7
- Guion N.º 18: Guión

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está sentada con una pelota pequeña y el terapeuta a su lado. | “Pasar objetos entre tus manos requiere coordinación. ¡Vamos a practicarla!” |
| 06–15 s | Pasa la pelota de una mano a otra frente al cuerpo. Después la cambia de mano con un lanzamiento corto. | “Pasá la pelota de una mano a otra. Si te resulta fácil, lanzala bajito y recibila con control, sin apurarte.” |
| 15–22 s | Continúa los pases. Se propone contar de dos en dos, un número por pase, y consultar la tabla de retos. | “Cuando lo hagás con comodidad, contá de dos en dos, un número por pase. Revisá nuestra tabla y escogé otro reto cada vez.” |
| 22–34 s | Vuelve a sostener la pelota entre ambas manos mientras el terapeuta cierra el ejercicio. Logotipo de IntegraMente. | “Desde vestirte hasta pasarte el jabón al bañarte, usás la coordinación de tus manos. ¡Seguí practicando para que esas tareas te resulten más fáciles!” |


| Materiales necesarios | Silla firme y una pelota pequeña. |
| --- | --- |


---


## RECURSO N.º 19 – COORDINACIÓN DE BRAZOS Y PIERNAS CON PELOTA


### A. Contenido visible en la aplicación

- Título: Coordinación de brazos y piernas con pelota.
- Subtítulo: Entrená la coordinación de tu cuerpo y la estabilidad mientras permanecés sentado.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una silla firme, con respaldo y sin ruedas.
- Una pelota pequeña, liviana y fácil de sujetar.
- Si no contás con una pelota, podés utilizar un par de medias enrolladas formando una bola suave y compacta.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 6 a 8 pases por debajo de cada pierna.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Sentate cómodamente con ambos pies apoyados en el suelo. Levantá ligeramente una pierna y pasá la pelota por debajo, de una mano a otra. Alterná las piernas formando un ocho con la trayectoria de la pelota.
- Realizá los movimientos lentamente, sin despegarte del asiento ni lanzar la pelota.

#### La ciencia detrás del movimiento

- ¿Sabías que actividades como vestirte requieren que tus brazos, piernas y tronco trabajen de manera coordinada?
- Un estudio publicado en la revista científica Journal of Physical Therapy Science encontró que un programa de ocho semanas de ejercicios de alcance realizados en posición sentada favoreció el equilibrio y la movilidad funcional en mujeres adultas mayores.
- Con este ejercicio practicamos habilidades que utilizamos diariamente al ponernos un pantalón, colocarnos las medias o manipular objetos cerca de nuestras piernas mientras permanecemos sentados.
- Consultar estudio científico: https://pmc.ncbi.nlm.nih.gov/articles/PMC4540875/

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: mantené ambos pies apoyados en el suelo y pasá la pelota de una mano a otra por encima de los muslos, alternando el lado derecho y el izquierdo. Cuando dominés este movimiento, intentá realizar los pases por debajo de una pierna a la vez, sin formar el ocho.
- Para aumentar el desafío: realizá dos recorridos completos formando un ocho con la pelota y luego invertí la dirección del movimiento. Procurá mantener una trayectoria fluida, sin aumentar la velocidad ni la altura de las piernas.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el movimiento, intentá nombrar los meses del año en orden, diciendo un mes cada vez que pasés la pelota por debajo de una pierna.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Utilizá una silla firme, preferiblemente colocada contra una pared. Mantené siempre un pie apoyado en el suelo y evitá inclinar excesivamente el tronco hacia adelante.
- No forcés la elevación de las piernas ni la movilidad de las articulaciones. Si la pelota cae al suelo, evitá inclinarte bruscamente para recogerla.
- Si tenés dificultades para mantener el equilibrio mientras estás sentado, realizá la versión más sencilla con acompañamiento. Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-019.
- Área: Gerontogimnasia.
- Categoría: Coordinación y control postural.
- Duración del video: 39 segundos.
- Nivel de dificultad: Intermedio en su formato original y básico en su variante adaptada.
- Tipo de entrenamiento: Coordinación intersegmentaria, equilibrio dinámico en sedestación y control motor, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: coordinación bilateral, coordinación de miembros superiores e inferiores, coordinación óculo-manual, control postural dinámico, movilidad funcional de cadera, transferencia controlada del peso corporal y precisión del movimiento.
- Objetivos cognitivos: atención sostenida, conciencia corporal, lateralidad, procesamiento visoespacial, planificación motora, secuenciación, atención dividida y memoria de trabajo al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado, incorporando retos cognitivos según tolerancia |
| Síntomas demenciales leves | Recomendado con acompañamiento según necesidad y adaptación de la complejidad |
| Síntomas demenciales moderados | Variante simplificada, con modelado, instrucciones breves y acompañamiento |
| Síntomas demenciales severos | Únicamente variante simplificada, según capacidad de comprensión, control postural y manipulación de objetos, con acompañamiento |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente, según capacidad funcional |
| Amarilla | Sí, con acompañamiento y adaptación según las necesidades de la persona |
| Roja | Sí, siempre que exista suficiente control postural en sedestación y movilidad de los miembros superiores e inferiores. Priorizar la variante simplificada cuando sea necesario |

- Criterios de exclusión del formato original: control postural insuficiente en sedestación, dolor significativo durante el movimiento, restricciones importantes de movilidad de cadera o miembros superiores, restricciones posquirúrgicas o dificultad para manipular objetos de forma segura.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y adaptando la complejidad del reto al perfil cognitivo de la persona.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Kim, S. G., Goo, M., & Park, J. H. (2015). Comparison of the effectiveness of balance training using a reaching task between a sitting position and a standing position in the elderly. Journal of Physical Therapy Science.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC4540875/
- Guion N.º 19: Guión

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–08 s | La participante está sentada con los pies apoyados y una pelota pequeña en las manos. | “Para ponerte un pantalón, coordinás manos y piernas sin perder estabilidad. ¡Practiquemos esa coordinación!” |
| 08–20 s | Levanta ligeramente una pierna y pasa la pelota por debajo de una mano a la otra. Alterna las piernas formando un ocho con la trayectoria de la pelota. | «Levanta un poco una pierna y pasa la pelota por debajo, de una mano a la otra. Alterna las piernas formando un ocho con la pelota, sin despegarte del asiento ni lanzarla.» |
| 20–29 s | Continúa los pases. Se propone nombrar un mes del año por pase y variar el reto con la tabla. | “Cuando lo hagás con comodidad, nombrá un mes del año por pase. Revisá nuestra tabla y escogé un reto diferente cada vez.” |
| 29–39 s | La participante termina sentada, con los pies apoyados y las manos sobre el regazo, junto al terapeuta. Logotipo de IntegraMente. | “Vestirte con más facilidad empieza por practicar movimientos como estos. ¡Seguí con IntegraMente!” |


| Materiales necesarios | Silla firme y una pelota pequeña. |
| --- | --- |


---


## RECURSO N.º 20 – MARCHA CON ESCALERILLA


### A. Contenido visible en la aplicación

- Título: Marcha con escalerilla.
- Subtítulo: Entrená la coordinación de tus pasos, el equilibrio y la orientación espacial al caminar.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una escalerilla de entrenamiento.
- Un espacio amplio y libre de obstáculos.
- Si no contás con una escalerilla, podés utilizar cinta adhesiva de color para formar entre cuatro y seis cuadros consecutivos en el suelo. Procurá que sean suficientemente amplios para colocar ambos pies cómodamente y que la cinta quede bien adherida.

#### ¿Cómo practicar este ejercicio?

- Realizá entre 4 y 6 recorridos completos.
- Descansá entre 30 y 60 segundos cada dos recorridos.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Avanzá lentamente, colocando ambos pies dentro de cada cuadro antes de pasar al siguiente. Mantené un ritmo cómodo, sin saltar ni alargar excesivamente los pasos.
- Al finalizar cada recorrido, girá con calma sobre una superficie libre de obstáculos para regresar en sentido contrario.

#### La ciencia detrás del movimiento

- ¿Sabías que al caminar tu cerebro utiliza la información visual para calcular la distancia de los pasos y decidir dónde colocar los pies?
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden mejorar el equilibrio, la marcha y el tiempo de reacción, contribuyendo a reducir el riesgo de caídas en personas adultas mayores.
- Con este ejercicio practicamos habilidades necesarias para desplazarnos por espacios reducidos, esquivar obstáculos y adaptar nuestros pasos a diferentes situaciones de la vida cotidiana.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: utilizá cuatro cuadros amplios marcados con cinta adhesiva en el suelo. Realizá el recorrido lentamente y, si lo necesitás, ubicá los cuadros junto a una superficie de apoyo firme.
- Para aumentar el desafío: alterná el pie con el que iniciás cada cuadro. En el primero comenzá con el pie derecho, en el segundo con el izquierdo y continuá alternándolos durante todo el recorrido. No es necesario aumentar la velocidad.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el recorrido, intentá nombrar diferentes objetos que podés encontrar en tu casa, diciendo uno cada vez que completés un cuadro.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Asegurate de que la escalerilla esté completamente extendida y no se deslice. Si utilizás cinta adhesiva, verificá que sus bordes estén bien adheridos al suelo.
- Utilizá calzado antideslizante, evitá los movimientos bruscos y conservá tus apoyos habituales para caminar. Si tenés dificultades de equilibrio, priorizá la versión con cinta adhesiva y realizá el ejercicio con acompañamiento.
- Suspendé el reto cognitivo si afecta tu estabilidad o la precisión de tus pasos. Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-020.
- Área: Gerontogimnasia.
- Categoría: Marcha y coordinación.
- Duración del video: 30 segundos.
- Nivel de dificultad: Básico-intermedio, con progresión a intermedio.
- Tipo de entrenamiento: Marcha adaptativa guiada por referencias visuales, coordinación de miembros inferiores y equilibrio dinámico, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: equilibrio dinámico, coordinación óculo-pedal, precisión del paso, transferencia del peso corporal, coordinación bilateral, regulación de la longitud del paso y adaptación de la marcha al espacio.
- Objetivos cognitivos: atención visual, atención sostenida, procesamiento visoespacial, lateralidad, planificación motora, secuenciación, atención dividida y fluidez verbal semántica al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado, incorporando retos cognitivos según tolerancia |
| Síntomas demenciales leves | Con acompañamiento según necesidad, priorizando cuadros marcados con cinta adhesiva |
| Síntomas demenciales moderados | Variante simplificada, con menos cuadros, modelado y supervisión directa. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | No recomendado en su formato original; requiere valoración individual |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente, con adecuado equilibrio y marcha segura |
| Amarilla | Sí, con acompañamiento y adaptación según capacidad funcional. Priorizar cuadros marcados con cinta adhesiva |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, marcha inestable, dificultad significativa para elevar los pies, alteraciones visuales que impidan identificar los cuadros, episodios de bloqueo de la marcha no controlados o incapacidad para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y siempre que no comprometa la estabilidad ni la seguridad durante la marcha.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593. https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 20: Guión 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–05 s | La participante está de pie frente a la escalerilla de entrenamiento extendida en el suelo. | “Vamos a practicar dónde colocás los pies para caminar con más seguridad por casa.” |
| 05–13 s | Avanza despacio colocando ambos pies en cada cuadro. Se menciona la cinta adherida al suelo como alternativa a la escalerilla. | “Avanzá despacio, colocando ambos pies en cada cuadro. ¿No tenés escalerilla? Armá los cuadros con cinta bien pegada al suelo. Sin saltar ni alargar demasiado el paso.” |
| 13–21 s | Continúa el recorrido. Se propone nombrar objetos de la casa mientras camina. | “Cuando lo hagás con comodidad, nombrá objetos de la casa mientras caminás. Revisá nuestra tabla y escogé otro reto cada vez.” |
| 21–30 s | Se muestra otra toma en sentido contrario mientras se sugiere variar el reto. Logotipo de IntegraMente. | «Revisa nuestra tabla y escoge otro reto cada vez.» |


| Materiales necesarios | Escalerilla de entrenamiento. Alternativa mencionada: cinta adhesiva para marcar los cuadros en el suelo. |
| --- | --- |


---


## RECURSO N.º 21 – COORDINACIÓN VISOESPACIAL CON STEP


### A. Contenido visible en la aplicación

- Título: Coordinación visoespacial con step.
- Subtítulo: Entrená tu equilibrio y la precisión de tus pasos al subir y bajar escalones.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Un step bajo, firme y antideslizante.
- Dos aros de diferentes colores.
- Una barra lateral de apoyo o una superficie fija y resistente que permita mantener el apoyo durante todo el recorrido.
- Si no contás con aros, podés marcar dos espacios de diferentes colores utilizando cinta adhesiva bien adherida al suelo.
- Si no tenés un step, podés realizar el recorrido directamente sobre el suelo, colocando una tercera referencia entre las dos marcas de colores.

#### ¿Cómo practicar este ejercicio?

- Realizá entre 4 y 6 recorridos completos.
- Descansá entre 30 y 60 segundos cada dos recorridos.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Colocá ambos pies dentro de la primera referencia de color. Sujetándote del apoyo, subí un pie y luego el otro al step. Hacé una breve pausa, observá la siguiente referencia y bajá hacia adelante, un pie a la vez.
- Al finalizar, girá lentamente sobre el suelo firme y repetí el recorrido en sentido contrario.

#### La ciencia detrás del movimiento

- ¿Sabías que al subir o bajar un escalón tu cerebro utiliza la información visual para calcular su altura, la distancia y el lugar donde debés colocar los pies?
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden favorecer el equilibrio, la marcha y el tiempo de reacción, contribuyendo a reducir el riesgo de caídas en personas adultas mayores.
- Con este ejercicio practicamos habilidades necesarias para subir y bajar escalones, superar pequeños desniveles y desplazarnos con mayor seguridad en diferentes espacios.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: eliminá el step y utilizá tres referencias de colores bien adheridas al suelo. Avanzá colocando ambos pies sobre cada referencia y realizando una breve pausa antes de continuar.
- Para aumentar el desafío: alterná el pie con el que iniciás cada recorrido. Comenzá el primero con el pie derecho y el siguiente con el izquierdo. Mantené el apoyo y evitá aumentar la altura del step o la velocidad del movimiento.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el recorrido, intentá contar en voz alta cada paso que realizás.
- Comenzá practicando este reto sobre el suelo firme antes de incorporarlo al ejercicio con step.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Asegurate de que el step sea firme, bajo y antideslizante. Utilizá calzado adecuado y mantené un apoyo firme durante la subida y el descenso.
- Si utilizás aros, verificá que no se deslicen. Si no podés asegurarlos correctamente, sustituílos por marcas de cinta adhesiva.
- Realizá la variante con step con el acompañamiento de una persona que pueda ayudarte de forma segura. No utilicés cajas, libros, bancos domésticos u otros objetos inestables como sustitutos.
- Si tenés dificultades de equilibrio o antecedentes de caídas, priorizá la versión sobre el suelo y consultá con un profesional antes de incorporar desniveles.
- Detené el ejercicio si experimentás dolor, mareos o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-021.
- Área: Gerontogimnasia.
- Categoría: Marcha, equilibrio y coordinación visoespacial.
- Duración del video: 37 segundos.
- Nivel de dificultad: Intermedio-avanzado con step y básico-intermedio sobre superficie plana.
- Tipo de entrenamiento: Marcha adaptativa, equilibrio dinámico, coordinación óculo-pedal e integración visoespacial y motora, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: equilibrio dinámico, transferencia del peso corporal, coordinación bilateral, estabilidad monopodal asistida, elevación del pie, precisión del paso, activación de la musculatura de los miembros inferiores y control del movimiento durante el ascenso y descenso.
- Objetivos cognitivos: atención visual, procesamiento visoespacial, percepción de profundidad y distancia, lateralidad, planificación motora, secuenciación, monitorización del movimiento y atención dividida al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado con acompañamiento para la variante con step |
| Síntomas demenciales leves | Con acompañamiento, priorizando referencias planas según capacidad funcional |
| Síntomas demenciales moderados | Variante sobre superficie plana, con modelado, instrucciones sencillas y supervisión directa. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | No recomendado en su formato original; requiere valoración individual |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Variante sobre superficie plana, con marcha independiente y equilibrio adecuado |
| Amarilla | Variante plana con acompañamiento. Step únicamente con suficiente capacidad funcional y acompañamiento seguro |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, marcha inestable, debilidad significativa de los miembros inferiores, dificultad para subir o bajar escalones de forma segura, alteraciones visuales que impidan identificar las referencias o calcular los desniveles, dolor significativo durante el movimiento o incapacidad para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y siempre que no comprometa la estabilidad. Priorizar su incorporación sobre superficie plana.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593. https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 21

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–07 s | Se ven un aro rojo antes del step, uno amarillo después y una barra lateral al alcance. El terapeuta acompaña a la participante. | «Al bajar un escalón, tu cerebro usa lo que ves para calcular dónde apoyar el pie. Vamos a practicarlo.» |
| 07–17 s | Coloca ambos pies dentro del aro rojo. Tiene la barra lateral al alcance y la usa al iniciar la subida. Sube un pie y luego el otro, y hace una pausa con ambos pies en el step. | «Colócate dentro del primer aro y usa la barra si necesitas apoyo. Sube un pie y luego el otro. Haz una pausa arriba.» |
| 17–23 s | Mira el aro amarillo y baja hacia adelante, un pie a la vez, hasta quedar con ambos pies dentro. El terapeuta permanece cerca durante el descenso. | «Mira el aro al frente. Baja un pie a la vez hasta quedar con los dos pies dentro del aro.» |
| 23–37 s | Repite el recorrido en sentido contrario, desde el aro amarillo hacia el rojo. Se propone contar los pasos como reto. Cierre con el terapeuta y logotipo de IntegraMente. | «Si quieres aumentar la dificultad, cuenta los pasos que vas dando.» |


| Materiales necesarios | Step, dos aros de piso (rojo y amarillo) y una barra lateral de apoyo. |
| --- | --- |


---


## RECURSO N.º 22 – MARCHA LATERAL CON BANDA ELÁSTICA


### A. Contenido visible en la aplicación

- Título: Marcha lateral con banda elástica.
- Subtítulo: Fortalecé tus piernas y mejorá tu estabilidad al desplazarte de lado.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una banda elástica circular de resistencia ligera.
- Una barra de apoyo o una superficie fija, firme y resistente, como el mostrador de la cocina.
- Un espacio libre de obstáculos que permita desplazarte lateralmente.
- Si no contás con una banda elástica, podés realizar el ejercicio sin resistencia adicional.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 6 a 8 pasos hacia cada lado.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Colocá la banda elástica alrededor de los muslos, por encima de las rodillas. Mantené una postura cómoda, con las rodillas ligeramente flexionadas.
- Dá un paso hacia un lado y acercá el otro pie, sin cruzar las piernas. Repetí el movimiento hacia el lado contrario, manteniendo un ritmo lento y controlado.

#### La ciencia detrás del movimiento

- ¿Sabías que los músculos ubicados a los lados de tus caderas ayudan a mantener la pelvis estable cada vez que caminás?
- Una revisión científica de 59 estudios, publicada en la revista Archives of Physical Medicine and Rehabilitation, encontró que una mayor fuerza de estos músculos se relaciona con un mejor desempeño en actividades de equilibrio y movilidad.
- Con este ejercicio practicamos habilidades necesarias para desplazarnos por espacios estrechos, movernos alrededor de los muebles y cambiar de dirección con mayor estabilidad.
- Consultar estudio científico: https://doi.org/10.1016/j.apmr.2021.12.008

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá los desplazamientos laterales sin banda elástica, dando pasos cortos y manteniendo ambas manos sobre una superficie de apoyo firme.
- Para aumentar el desafío: incorporá una banda elástica de resistencia ligera cuando dominés el movimiento sin ella. Si ya realizás el ejercicio con banda, aumentá progresivamente hasta alcanzar 10 pasos hacia cada lado por serie, sin perder el control del movimiento.

#### ¡Sumale un reto cognitivo!

- Si ya dominás el movimiento, intentá nombrar diferentes animales mientras te desplazás lateralmente, diciendo uno cada vez que completés un paso lateral.
- Comenzá practicando este reto sin banda elástica antes de combinarlo con la resistencia.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Asegurate de que la banda elástica esté en buen estado y no presente roturas. Colocala por encima de las rodillas y evitá utilizar una resistencia excesiva.
- Mantené los pies orientados hacia adelante, evitá cruzar las piernas y procurá que las rodillas no se desplacen hacia adentro.
- Utilizá calzado antideslizante y mantené una superficie de apoyo firme al alcance durante todo el recorrido. Si tenés dificultades de equilibrio, realizá la variante sin banda elástica y con acompañamiento.
- Suspendé el reto cognitivo si afecta tu estabilidad. Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-022.
- Área: Gerontogimnasia.
- Categoría: Fortalecimiento muscular, marcha y equilibrio.
- Duración del video: 34 segundos.
- Nivel de dificultad: Básico-intermedio sin banda elástica e intermedio con resistencia.
- Tipo de entrenamiento: Fortalecimiento de miembros inferiores mediante resistencia elástica, marcha lateral, equilibrio dinámico y control postural, con progresión a doble tarea cognitivo-motora.
- Objetivos motores: fortalecimiento de la musculatura abductora de la cadera, especialmente del glúteo medio, estabilidad pélvica, equilibrio dinámico lateral, transferencia del peso corporal, coordinación bilateral y control postural durante los desplazamientos.
- Objetivos cognitivos: atención sostenida, lateralidad, conciencia corporal, orientación espacial, planificación motora, secuenciación, atención dividida y fluidez verbal semántica al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado, incorporando retos cognitivos según tolerancia |
| Síntomas demenciales leves | Con acompañamiento según necesidad, priorizando inicialmente la variante sin banda elástica |
| Síntomas demenciales moderados | Variante sin banda elástica, con modelado, instrucciones sencillas y supervisión directa. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | No recomendado en su formato original; requiere valoración individual |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente, con adecuado equilibrio y marcha segura |
| Amarilla | Sí, con acompañamiento y adaptación de la resistencia según capacidad funcional. Priorizar inicialmente la variante sin banda elástica |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, control postural insuficiente, incapacidad para desplazarse lateralmente de forma segura, debilidad significativa de los miembros inferiores, dolor durante el movimiento de cadera o rodilla, restricciones articulares o posquirúrgicas que impidan realizar el ejercicio, o dificultad significativa para seguir instrucciones sencillas.
- Compatible con retos cognitivos: sí, una vez dominado el ejercicio motor y siempre que no comprometa la estabilidad durante el desplazamiento.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Systematic Review of the Importance of Hip Muscle Strength, Activation, and Structure in Balance and Mobility Tasks. (2022). Archives of Physical Medicine and Rehabilitation, 103(8), 1651–1662.
- https://doi.org/10.1016/j.apmr.2021.12.008
- Artículo completo: https://pmc.ncbi.nlm.nih.gov/articles/PMC10089299/
- Guion N.º 22: 

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está de pie frente a las barras, con una banda elástica alrededor de los muslos, por encima de las rodillas. | «Vamos a caminar de medio lado. Coloca la banda por encima de las rodillas. Si necesitas apoyo, usa la barra.» |
| 06–17 s | Usa la barra como referencia de apoyo y camina hacia la izquierda. Separa un pie y acerca el otro sin cruzarlos. | “Dá un paso hacia la izquierda y acercá el otro pie, sin cruzarlos. Seguí de medio lado, despacio.” |
| 17–25 s | Cambia de dirección y repite el patrón hacia la derecha. Las barras quedan al alcance durante el recorrido. | «Ahora hacia la derecha. Separa un pie y acerca el otro, sin cruzarlos. Usa la barra si necesitas apoyo.» |
| 25–34 s | Se detiene junto a la barra con ambos pies apoyados. El terapeuta se reúne con ella para el cierre. Logotipo de IntegraMente. | “¡Muy bien! Moverte de lado también es parte de tu día. ¡Seguí practicando con IntegraMente!” |


| Materiales necesarios | Banda elástica circular y barras de apoyo. |
| --- | --- |


---


## RECURSO N.º 23 – UN PASO ADELANTE Y REGRESO


### A. Contenido visible en la aplicación

- Título: Un paso adelante y regreso.
- Subtítulo: Entrená las fases del paso, la coordinación de tus movimientos y la estabilidad al caminar.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Dos barras paralelas de apoyo.
- Un espacio libre de obstáculos.
- Si no contás con barras paralelas, podés utilizar una superficie fija, firme y resistente, como el mostrador de la cocina. Ubicate frente a ella, manteniendo ambas manos apoyadas y suficiente espacio para realizar un paso corto hacia adelante y regresar.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 6 a 8 repeticiones con cada pierna.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Colocate de pie, con ambos pies apoyados en el suelo y las manos sujetas a la superficie de apoyo.
- Dá un paso hacia adelante, prestando atención a cada momento del movimiento:
- Elevá ligeramente el talón.
- Despegá la punta del pie del suelo.
- Llevá el pie hacia adelante de manera controlada.
- Apoyá primero el talón y luego, progresivamente, el resto del pie.
- Regresá lentamente a la posición inicial y repetí el movimiento, manteniendo siempre el apoyo de las manos.
- Una vez que completés las repeticiones, realizá el ejercicio con la otra pierna.

#### La ciencia detrás del movimiento

- ¿Sabías que caminar requiere una secuencia coordinada de movimientos que tu cerebro organiza habitualmente de manera automática?
- Desde el momento en que levantás el talón hasta que volvés a apoyar el pie, tu cerebro integra información sensorial y motora para controlar el movimiento y mantener el equilibrio.
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden favorecer el equilibrio, la marcha y el tiempo de reacción en personas adultas mayores.
- Practicar estos movimientos de manera consciente nos permite trabajar la precisión del paso, la coordinación y el control corporal necesarios para desplazarnos en nuestra vida cotidiana.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá pasos cortos hacia adelante y regresá lentamente a la posición inicial, manteniendo ambas manos apoyadas. Concentrate en la secuencia del movimiento, sin forzar la amplitud del paso ni la movilidad del tobillo.
- Para aumentar el desafío: alterná la pierna con la que realizás cada repetición. Dá un paso hacia adelante con la pierna derecha, regresá a la posición inicial y repetí con la izquierda. Procurá mantener la secuencia de despegue, desplazamiento y apoyo del pie, sin aumentar la velocidad ni retirar el apoyo de las manos.

#### ¡Sumale un reto cognitivo!

- Si ya dominás la secuencia del movimiento, intentá nombrar diferentes frutas, diciendo una cada vez que completés un movimiento de ida y regreso.
- Recordá que lo más importante es mantener la calidad y el control de tus movimientos.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Mantené ambas manos sobre la superficie de apoyo durante todo el ejercicio. Utilizá calzado antideslizante y asegurate de que el espacio esté libre de obstáculos.
- Evitá los pasos demasiado largos y los movimientos bruscos. Regresá a la posición inicial sin cruzar los pies ni desplazar excesivamente el cuerpo hacia atrás.
- No forcés la elevación del talón, el movimiento del tobillo ni la forma de apoyar el pie si experimentás molestias o tenés alguna limitación física.
- Si tenés dificultades de equilibrio, realizá el ejercicio con el acompañamiento de una persona que pueda ayudarte de forma segura.
- Suspendé el reto cognitivo si afecta la estabilidad o la coordinación del movimiento. Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-023.
- Área: Gerontogimnasia.
- Categoría: Marcha, equilibrio y control motor.
- Duración del video: 37 segundos.
- Nivel de dificultad: Básico-intermedio.
- Tipo de entrenamiento: Entrenamiento segmentado de los componentes del ciclo de la marcha, transferencia del peso corporal, equilibrio dinámico y control motor, con progresión a doble tarea cognitivo-motora.
- Objetivos motores:
- Entrenamiento de los componentes del ciclo de la marcha.
- Control de la elevación del talón y del despegue de la punta del pie.
- Control del movimiento durante la fase de balanceo.
- Contacto inicial del talón y apoyo progresivo del pie.
- Movilidad funcional del tobillo.
- Transferencia controlada del peso corporal.
- Estabilidad monopodal asistida.
- Coordinación de los miembros inferiores.
- Precisión del paso.
- Equilibrio dinámico y control postural.
- Objetivos cognitivos:
- Atención sostenida y dirigida al movimiento.
- Conciencia corporal.
- Procesamiento de la información propioceptiva.
- Lateralidad.
- Planificación motora.
- Secuenciación.
- Monitorización de la ejecución.
- Atención dividida y fluidez verbal semántica al incorporar el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional |
| Deterioro cognitivo leve | Recomendado, incorporando retos cognitivos según tolerancia |
| Síntomas demenciales leves | Recomendado con acompañamiento según necesidad, utilizando instrucciones sencillas y demostraciones del movimiento |
| Síntomas demenciales moderados | Variante simplificada, con modelado, instrucciones de un solo paso y supervisión directa. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | No recomendado en su formato original; requiere valoración individual |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente, siempre que exista adecuado equilibrio, capacidad para realizar el movimiento de forma segura y una superficie de apoyo firme |
| Amarilla | Sí, con acompañamiento, apoyo bilateral y adaptación de la longitud del paso según capacidad funcional |
| Roja | No |

- Criterios de exclusión del formato original: riesgo elevado de caída, control postural insuficiente en bipedestación, incapacidad para transferir el peso corporal de forma segura, dificultad significativa para elevar los pies, episodios de bloqueo de la marcha no controlados, restricciones articulares o posquirúrgicas, dolor durante el movimiento o incapacidad para seguir instrucciones sencillas.
- Consideraciones terapéuticas: la secuencia de despegue, balanceo y contacto inicial descrita corresponde a componentes de un patrón habitual de marcha. En personas con alteraciones neurológicas, musculoesqueléticas o patrones de marcha atípicos, deberá adaptarse el movimiento a sus capacidades y necesidades individuales, evitando forzar un patrón biomecánico específico.
- Compatible con retos cognitivos: sí, una vez dominada la secuencia del movimiento y siempre que no comprometa la estabilidad, la calidad de la ejecución ni la seguridad.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593.
- https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 23: Un paso adelante y regreso
- Duración aproximada del video: 37 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está de pie entre dos barras paralelas, con una mano en cada barra y el terapeuta cerca. | «Al dar un paso, el pie atraviesa distintas fases. Vamos a practicarlas.» |
| 06–14 s | Da un paso hacia adelante con una pierna manteniendo las manos en las barras. El terapeuta describe las fases del paso. | «Sujétate de ambas barras y da un paso hacia adelante. Fíjate en cómo el pie se despega, se balancea y vuelve a apoyarse.» |
| 14–30 s | Vuelve hacia atrás a la posición inicial y repite los pasos de ida y regreso, con el apoyo de las barras. Se señalan el apoyo, el balanceo y el despegue del pie. | «Vuelve hacia atrás al punto de partida y repite, manteniendo el apoyo en las barras.» |
| 30–37 s | El terapeuta se coloca a su lado mientras la participante mantiene el agarre. Logotipo de IntegraMente. | «Así entrenamos la marcha en cada una de sus fases.» |


| Materiales necesarios | Dos barras paralelas de apoyo. |
| --- | --- |


---


## RECURSO N.º 24 – MEMORIA DE OBJETOS Y MOVIMIENTO CON PESO


### A. Contenido visible en la aplicación

- Título: Memoria de objetos y movimiento con peso.
- Subtítulo: Entrená tu memoria, atención y fuerza muscular en un mismo ejercicio.
- Tiempo de práctica: 5 a 7 minutos aproximadamente.

#### Materiales que debés tener listos

- Una mesa.
- Tres objetos pequeños de uso cotidiano, como una cuchara, un peine y unas llaves.
- Una pelota con peso ligero.
- Una silla firme, si necesitás realizar el ejercicio sentado.
- Una persona que te acompañe durante la actividad.
- Si no contás con una pelota con peso, podés utilizar una botella plástica pequeña, bien cerrada y parcialmente llena de agua, que puedas sujetar cómodamente con ambas manos. También podés comenzar utilizando una pelota liviana, sin resistencia adicional.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 o 3 series de 10 repeticiones.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Colocate frente a la mesa y seguí estos pasos:
- Observá durante 10 a 15 segundos los objetos y prestá atención al lugar que ocupa cada uno.
- Girá lentamente hasta quedar de espaldas a la mesa.
- Sostené la pelota frente al pecho, extendé los brazos hacia adelante y regresá a la posición inicial. Realizá 10 repeticiones.
- Mientras realizás los movimientos, pedile a la persona que te acompaña que retire uno de los objetos o cambie su ubicación.
- Al finalizar, regresá a la posición inicial y observá nuevamente la mesa. ¿Podés identificar qué objeto falta o cuál cambió de lugar?
- Repetí la actividad utilizando diferentes objetos o cambiando su distribución.

#### La ciencia detrás del movimiento

- ¿Sabías que tu cerebro necesita registrar, almacenar y recuperar información incluso cuando estás realizando otras actividades?
- Una revisión científica publicada en la revista Ageing Research Reviews encontró que los programas que combinan el ejercicio físico con el entrenamiento cognitivo pueden generar beneficios tanto en el funcionamiento cognitivo como en el físico de personas adultas mayores con y sin deterioro cognitivo leve.
- Con este ejercicio practicamos habilidades que utilizamos diariamente al recordar dónde dejamos las llaves, organizar nuestras pertenencias o retomar una actividad después de una interrupción, mientras trabajamos la musculatura de los brazos.
- Consultar estudio científico: https://doi.org/10.1016/j.arr.2020.101232

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá el ejercicio sentado, utilizando únicamente dos objetos y una pelota liviana, sin peso adicional. En lugar de girar el cuerpo, pedile a la persona que te acompaña que cubra los objetos mientras realizás entre 5 y 6 repeticiones de brazos. Después, observá nuevamente los objetos e intentá identificar cuál falta.
- Para aumentar el desafío: aumentá progresivamente la cantidad de objetos de tres a cuatro o cinco. También podés pedirle a la persona que te acompaña que intercambie la ubicación de dos objetos, sin retirar ninguno.
- No es necesario aumentar el peso de la pelota para incrementar la dificultad cognitiva.

#### ¡Sumale un reto cognitivo!

- Este ejercicio ya incorpora un desafío de memoria. Si lo realizás con facilidad, intentá recordar tanto los objetos como su posición exacta sobre la mesa.
- Al finalizar, además de identificar qué cambió, tratá de colocar los objetos en su ubicación original.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Utilizá un peso ligero que puedas manejar cómodamente con ambas manos. Extendé los brazos sin bloquear los codos ni elevarlos por encima de los hombros.
- Respirá con normalidad durante todo el ejercicio y evitá contener la respiración.
- Al girar, realizá pasos cortos y controlados, evitando girar bruscamente sobre los pies.
- Si utilizás ayudas para caminar, tenés dificultades de equilibrio o necesitás apoyarte para permanecer de pie, realizá la variante sentada.
- No forcés la amplitud del movimiento ni aumentés el peso si experimentás molestias en los hombros, brazos o espalda.
- Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-024.
- Área: Gerontogimnasia.
- Categoría: Fortalecimiento muscular e integración cognitivo-motora.
- Duración del video: 43 segundos.
- Nivel de dificultad: Básico-intermedio en su variante sentada e intermedio-avanzado en su formato original de pie.
- Tipo de entrenamiento: Entrenamiento combinado cognitivo-motor, fortalecimiento de miembros superiores y memoria visual y visoespacial con actividad motora interpuesta.
- Objetivos motores:
- Activación y fortalecimiento de la musculatura de los miembros superiores.
- Activación del deltoides anterior, pectorales y tríceps.
- Coordinación bilateral de los miembros superiores.
- Control de la prensión de objetos.
- Movilidad funcional de hombros y codos.
- Estabilidad del tronco.
- Control postural estático y dinámico.
- Coordinación durante los cambios de dirección.
- Transferencia controlada del peso corporal durante los giros.
- Los últimos tres objetivos corresponden principalmente a la variante de pie.
- Objetivos cognitivos:
- Atención selectiva y sostenida.
- Codificación de información visual.
- Memoria visual inmediata.
- Memoria de localización espacial.
- Asociación objeto-ubicación.
- Retención de información durante una actividad motora interpuesta.
- Resistencia a la interferencia.
- Recuperación de información visual y espacial.
- Reconocimiento y discriminación visual.
- Memoria de trabajo.
- Monitorización de la ejecución.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado. Posibilidad de incrementar progresivamente la cantidad de objetos y los cambios de ubicación |
| Deterioro cognitivo leve | Especialmente pertinente, ajustando la cantidad de objetos y la complejidad del reto según el perfil cognitivo |
| Síntomas demenciales leves | Recomendado con adaptación. Comenzar con dos o tres objetos familiares y cambios sencillos |
| Síntomas demenciales moderados | Variante sentada y simplificada, utilizando dos objetos familiares, menor intervalo de retención, modelado y claves visuales o verbales cuando sea necesario |
| Síntomas demenciales severos | No recomendado en su formato original. Considerar una actividad individualizada de reconocimiento de objetos familiares, según las capacidades conservadas |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, con adecuado equilibrio, capacidad para permanecer de pie y realizar giros seguros. Requiere un acompañante para modificar los objetos |
| Amarilla | Sí, priorizando la variante sentada cuando exista dificultad de equilibrio. Requiere acompañamiento |
| Roja | Sí, exclusivamente en su variante sentada, según capacidad de control postural, movilidad de los miembros superiores y comprensión de instrucciones |

- Requiere acompañamiento para ejecutar la actividad: sí, independientemente de la ruta funcional asignada.
- Criterios de exclusión del formato original: riesgo elevado de caída, dificultad para realizar giros de forma segura, control postural insuficiente en bipedestación, necesidad de apoyo continuo de las manos, restricciones significativas de movilidad de hombros o miembros superiores, dolor durante el movimiento, alteraciones visuales que impidan identificar los objetos o incapacidad para comprender la dinámica del ejercicio.
- Consideraciones terapéuticas: la dificultad motora y la dificultad cognitiva deberán ajustarse de manera independiente. No se recomienda incrementar simultáneamente el peso de la pelota, la cantidad de repeticiones y la complejidad del reto de memoria.
- En personas con deterioro cognitivo, se deberá priorizar una experiencia de éxito, evitando la frustración y proporcionando claves cuando sea necesario.
- Compatible con retos cognitivos: sí. El ejercicio incorpora un reto cognitivo como parte de su estructura principal. Se recomienda progresar mediante la manipulación de la cantidad de objetos, su ubicación y el intervalo de retención, antes de incorporar demandas cognitivas adicionales.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Malmberg Gavelin, H., Dong, C., Minkov, R., Bahar-Fuchs, A., Ellis, K. A., Lautenschlager, N. T., Mellow, M. L., Wade, A. T., Smith, A. E., Finke, C., Krohn, S., & Lampit, A. (2021). Combined physical and cognitive training for older adults with and without cognitive impairment: A systematic review and network meta-analysis of randomized controlled trials. Ageing Research Reviews, 66, 101232.
- https://doi.org/10.1016/j.arr.2020.101232
- Guion N.º 24: Reacomodar los objetos y hacer las series con peso
- Duración aproximada del video: 43 segundos30 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–07 s | La participante está de pie frente a una mesa con objetos y sostiene una pelota de peso con ambas manos. El terapeuta presenta el reto de memoria. | «¿Te ha pasado que dejas algo y luego olvidas dónde? Hoy practicaremos cómo recordar objetos y su lugar.» |
| 07–15 s | Observa los objetos y su ubicación en la mesa antes de girar. | «Observa con detenimiento los objetos que tienes al frente y fíjate dónde está cada uno.» |
| 15–28 s | Da media vuelta y, de espaldas a la mesa, hace extensiones de brazos desde el pecho con la pelota de peso. Se indican diez repeticiones. El terapeuta retira un objeto mientras la participante está de espaldas. | «Da media vuelta. Con la pelota de peso frente al pecho, extiende los brazos hacia adelante y vuelve. Haz diez repeticiones.» |
| 28–43 s | Vuelve a mirar la mesa e identifica si falta algún objeto o si cambió de lugar. Se propone aumentar la cantidad de objetos como progresión. Logotipo de IntegraMente. | «Vuelve a mirar la mesa. ¿Falta algún objeto o cambió alguno de lugar? Si te resultó fácil, puedes memorizar más objetos.» |


| Materiales necesarios | Mesa, tres objetos pequeños para memorizar y una pelota con peso. |
| --- | --- |


---


## RECURSO N.º 25 – ORIENTACIÓN ESPACIAL Y MEMORIA DE COLORES


### A. Contenido visible en la aplicación

- Título: Orientación espacial y memoria de colores.
- Subtítulo: Entrená tu memoria espacial y tu capacidad para orientarte al cambiar de dirección.
- Tiempo de práctica: 4 a 6 minutos aproximadamente.

#### Materiales que debés tener listos

- Cuatro marcas planas de diferentes colores.
- Una venda para los ojos, únicamente si podés realizar esta variante de forma segura.
- Una silla firme con respaldo, si necesitás realizar el ejercicio sentado.
- Un familiar o cuidador que te acompañe durante toda la actividad.
- Si no contás con marcas de colores, podés utilizar hojas de papel, cartulinas o cinta adhesiva de diferentes colores, asegurándote de que estén bien adheridas al suelo.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 4 cambios de dirección.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Colocá cuatro marcas de diferentes colores alrededor de tu posición: una al frente, una atrás, una a la derecha y otra a la izquierda.
- Observá durante 15 a 20 segundos los colores y memorizá dónde se encuentra cada uno.
- Pedile a tu acompañante que oculte o retire temporalmente las marcas, conservando un registro de su ubicación.
- Con los ojos abiertos, realizá un cambio de dirección mediante pasos cortos y controlados.
- Una vez que estés completamente detenido y estable, intentá identificar qué color se encontraba frente a vos.
- Pedile a tu acompañante que confirme tu respuesta y repetí el ejercicio cambiando de dirección.
- Si previamente se ha determinado que contás con las capacidades físicas necesarias para realizar la variante con los ojos vendados que se muestra en el video, podés practicarla con el acompañamiento directo de un familiar o cuidador capaz de brindarte asistencia segura durante todo el movimiento.

#### La ciencia detrás del movimiento

- ¿Sabías que tu cerebro puede reconocer la posición de tu cuerpo en el espacio incluso cuando no estás utilizando la información visual?
- Para orientarnos y mantener el equilibrio, nuestro cerebro integra información de la visión, del sistema vestibular —ubicado en el oído interno— y de la propiocepción, que nos permite reconocer la posición y los movimientos de nuestro cuerpo.
- Una revisión científica publicada en 2024 en la revista European Journal of Translational Myology señala que los programas de entrenamiento propioceptivo y sensoriomotor pueden favorecer el equilibrio en personas adultas mayores.
- Con esta actividad practicamos habilidades que utilizamos diariamente al cambiar de dirección, orientarnos dentro de nuestra casa y recordar la ubicación de elementos que no estamos viendo directamente.
- Consultar estudio científico: https://doi.org/10.4081/ejtm.2024.12010

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá el ejercicio sentado en una silla firme. Comenzá con dos o tres colores colocados sobre una mesa, al frente y a los lados. Observá su ubicación y pedile a tu acompañante que los cubra. Después, orientá suavemente la cabeza hacia una de las posiciones e intentá recordar qué color se encontraba allí.
- Para aumentar el desafío: una vez que dominés la actividad con cuatro colores, realizá dos cambios de dirección antes de identificar el color que se encontraba frente a vos.
- No es necesario aumentar la velocidad de los giros ni utilizar una venda para incrementar la dificultad cognitiva.

#### ¡Sumale un reto cognitivo!

- Este ejercicio ya incorpora un desafío de memoria y orientación espacial.
- Si lo realizás con facilidad, después de identificar el color que se encontraba frente a vos, intentá recordar también cuál se encontraba a tu derecha o a tu izquierda.
- Respondé únicamente cuando estés completamente detenido y estable.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Realizá este ejercicio siempre con el acompañamiento directo de un familiar o cuidador.
- Utilizá calzado antideslizante y asegurate de que el espacio esté libre de obstáculos. Realizá los cambios de dirección mediante pasos cortos y controlados, evitando girar bruscamente sobre un solo pie.
- Importante: la variante con los ojos vendados está reservada para personas con adecuado equilibrio, estabilidad postural y capacidad para realizar giros de forma segura, cuya aptitud para esta actividad haya sido valorada previamente.
- No realicés esta variante si presentás dificultades de equilibrio, antecedentes de caídas, mareos, vértigo, alteraciones significativas de la sensibilidad, inseguridad al caminar o necesidad de utilizar ayudas para la marcha.
- En estos casos, priorizá la variante sentada y con los ojos abiertos.
- Si tenés dificultades para identificar los colores, podés utilizar símbolos o figuras geométricas fácilmente reconocibles.
- Detené inmediatamente el ejercicio si experimentás mareos, vértigo, náuseas, ansiedad, dolor, desorientación o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-025.
- Área: Gerontogimnasia.
- Categoría: Equilibrio, orientación espacial e integración sensoriomotora.
- Duración del video: 56 segundos.
- Nivel de dificultad:
- Básico-intermedio: variante sentada.
- Intermedio: variante de pie con ojos abiertos.
- Avanzado: variante con privación visual y acompañamiento directo.
- Tipo de entrenamiento: integración sensoriomotora, orientación corporal y espacial, memoria asociativa color-ubicación, actualización espacial y equilibrio dinámico durante los cambios de dirección.

#### Objetivos motores

- Equilibrio dinámico durante los giros.
- Control postural durante los cambios de dirección.
- Coordinación de los miembros inferiores.
- Transferencia controlada del peso corporal.
- Conciencia de la posición corporal.
- Integración de información propioceptiva y vestibular.
- Control de los movimientos de rotación corporal.
- Adaptación sensoriomotora ante la reducción de información visual, en la variante avanzada.

#### Objetivos cognitivos

- Atención selectiva y sostenida.
- Codificación de información visual y espacial.
- Memoria visual inmediata.
- Memoria de localización espacial.
- Asociación color-ubicación.
- Memoria de trabajo visoespacial.
- Orientación espacial egocéntrica.
- Actualización de las relaciones espaciales después de un cambio de posición corporal.
- Lateralidad.
- Planificación motora.
- Representación mental del entorno.
- Flexibilidad cognitiva.
- Recuperación de información visual y espacial.
- Monitorización de la ejecución.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional. Posibilidad de incrementar progresivamente la complejidad espacial |
| Deterioro cognitivo leve | Recomendado, ajustando la cantidad de colores y cambios de dirección según el perfil cognitivo y funcional |
| Síntomas demenciales leves | Variante con ojos abiertos, utilizando dos o tres colores, instrucciones sencillas y acompañamiento |
| Síntomas demenciales moderados | Variante sentada y simplificada, utilizando dos referencias visuales, modelado y claves verbales o visuales |
| Síntomas demenciales severos | No recomendado en su formato original. Considerar actividades individualizadas de reconocimiento de colores y orientación corporal básica |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, con acompañamiento. La variante con ojos vendados requiere adecuada capacidad funcional y valoración previa favorable |
| Amarilla | Sí, mediante la variante con ojos abiertos y acompañamiento. Priorizar la posición sentada cuando existan dificultades de equilibrio |
| Roja | Sí, exclusivamente en su variante sentada, con ojos abiertos y según capacidad de control postural, movilidad cervical y comprensión de instrucciones |

- Requiere acompañamiento para ejecutar la actividad: sí, independientemente de la ruta funcional asignada.
- Tipo de acompañamiento: familiar o cuidador capaz de comprender las instrucciones y proporcionar asistencia segura durante la actividad.
- Compatible con modalidad domiciliaria: sí, con acompañamiento obligatorio y adaptación según capacidad funcional.
- Criterios de exclusión de la variante con ojos vendados:
- Riesgo de caída.
- Antecedentes de caídas.
- Alteraciones del equilibrio o del control postural.
- Mareos o vértigo.
- Alteraciones vestibulares.
- Déficit propioceptivo significativo.
- Neuropatías que comprometan la sensibilidad y el equilibrio.
- Inestabilidad durante los giros.
- Necesidad de ayudas para caminar.
- Ansiedad ante la privación visual.
- Dificultad para comprender y seguir instrucciones.
- Ausencia de un acompañante capaz de brindar asistencia segura.

#### Consideraciones terapéuticas

- La actividad combina la formación de una representación mental del espacio con la actualización de dicha representación después de un cambio de orientación corporal.
- La variante con ojos vendados incrementa la demanda sensoriomotora al eliminar temporalmente la información visual. Su asignación deberá estar condicionada a la capacidad funcional de la persona y no únicamente a su perfil cognitivo.
- La dificultad cognitiva y motora deberá ajustarse de manera independiente, evitando incrementar simultáneamente la cantidad de referencias espaciales, el número de giros y la dificultad postural.
- En personas con deterioro cognitivo, se recomienda favorecer experiencias de éxito mediante instrucciones sencillas, demostraciones, claves y correcciones respetuosas.
- Compatible con retos cognitivos: sí. El ejercicio incorpora un reto cognitivo como parte de su estructura principal. Se recomienda incrementar progresivamente la cantidad de referencias espaciales o solicitar la identificación de más de una ubicación.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Sensorimotor and proprioceptive exercise programs to improve balance in older adults: A systematic review with meta-analysis. (2024). European Journal of Translational Myology, 34(1), 12010.
- https://doi.org/10.4081/ejtm.2024.12010
- Guion N.º 25: Identifica el color al frente con los ojos vendados
- Duración aproximada del video: 56 segundos30 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–08 s | La participante está de pie entre cuatro marcas de colores. El fisioterapeuta explica que primero memorizará su ubicación. | «Cuando giras, cambia lo que tienes al frente. Hoy vamos a recordar dónde está cada color.» |
| 08–18 s | Observa las marcas alrededor de sus pies y memoriza dónde se encuentra cada color. | «Mira el color que tienes al frente, atrás y a cada lado. Recuerda dónde está cada uno.» |
| 18–39 s | El fisioterapeuta coloca la venda, sostiene a la participante por los hombros y guía giros con pasos cortos. Al detenerse frente a otra marca, le pide identificar el color que quedó al frente. | «Voy a sostenerte. Da pasos cortos mientras giramos. Ahora quédate quieto.» |
| 39–56 s | Se repite el giro guiado antes de volver a preguntar por el color del frente. En el cierre, la participante vuelve a aparecer sin la venda. Logotipo de IntegraMente. | «Para variar el reto, podemos cambiar de dirección más de una vez antes de preguntar. Cuando estés quieta, ¿qué color tienes al frente? Así practicas orientarte al cambiar de dirección.» |


| Materiales necesarios | Cuatro marcas planas de colores para el suelo y una venda para los ojos. |
| --- | --- |


---


## RECURSO N.º 26 – ALCANCE FUNCIONAL Y COORDINACIÓN POR COLORES


### A. Contenido visible en la aplicación

- Título: Alcance funcional y coordinación por colores.
- Subtítulo: Entrená tu equilibrio, atención y coordinación al alcanzar objetos desde una silla.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una silla firme con respaldo y sin ruedas.
- Cuatro bolos de diferentes colores: morado, celeste, rojo y verde.
- Si no contás con bolos, podés utilizar cuatro botellas plásticas de tamaño similar, identificadas con papel o cinta adhesiva de diferentes colores.
- También podés colocar los objetos sobre una mesa firme si tenés dificultades para alcanzarlos desde el suelo.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 8 alcances: 4 con cada mano.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Sentate en una silla firme, con ambos pies completamente apoyados en el suelo.
- Colocá los cuatro objetos a una distancia que te permita alcanzarlos cómodamente: dos al frente y dos hacia los lados.
- Identificá el color que vas a tocar.
- Incliná suavemente el tronco hacia el objeto, manteniendo ambos pies apoyados.
- Tocá el objeto con la punta de los dedos.
- Regresá lentamente a la posición inicial, recuperando una postura erguida antes de realizar el siguiente movimiento.
- Comenzá utilizando la mano derecha y seguí esta secuencia:
- Morado – Celeste – Rojo – Verde.
- Después, utilizá la mano izquierda y realizá la secuencia inversa:
- Verde – Rojo – Celeste – Morado.
- Si practicás con un familiar o cuidador, podés pedirle que te indique los colores que debés tocar.

#### La ciencia detrás del movimiento

- ¿Sabías que alcanzar un objeto mientras estás sentado requiere que tu cerebro coordine los movimientos del brazo y del tronco para mantener el equilibrio?
- Un estudio publicado en el Journal of Physical Therapy Science encontró que practicar ejercicios de alcance en posición sentada puede contribuir a mejorar el equilibrio en personas adultas mayores.
- Con este ejercicio trabajamos habilidades necesarias para alcanzar un vaso, tomar objetos cercanos, vestirnos o realizar diferentes actividades cotidianas que requieren mover el cuerpo sin perder la estabilidad.
- Además, al seguir una secuencia de colores, incorporamos un desafío de atención y coordinación entre lo que vemos y cómo nos movemos.
- Consultar estudio científico: https://doi.org/10.1589/jpts.27.2337

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: colocá únicamente dos objetos de diferentes colores sobre una mesa firme y a una distancia cómoda. Tocá un objeto a la vez, utilizando la mano correspondiente y regresando a la posición inicial después de cada movimiento.
- Para aumentar el desafío: variá ligeramente la distancia y la ubicación de los objetos, incorporando alcances hacia adelante y en diagonal, siempre dentro de una distancia segura.
- También podés modificar el orden de los colores o incorporar nuevas secuencias, sin necesidad de aumentar la distancia de alcance.

#### ¡Sumale un reto cognitivo!

- Este ejercicio ya incorpora un componente de atención y coordinación visomotora.
- Si lo realizás con facilidad, intentá memorizar una secuencia de tres colores antes de comenzar el movimiento y reproducila sin volver a consultar las instrucciones.
- Por ejemplo:
- Rojo – Morado – Verde.
- Cuando dominés tres colores, podés intentar recordar una secuencia de cuatro.
- Si practicás con un familiar o cuidador, pedile que te indique una nueva secuencia en cada serie.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Utilizá una silla firme, estable, sin ruedas y preferiblemente colocada contra una pared.
- Mantené ambos pies completamente apoyados en el suelo y los glúteos en contacto con el asiento durante todo el ejercicio.
- Realizá una inclinación controlada del tronco desde la cadera, evitando movimientos bruscos o flexiones excesivas de la espalda.
- No coloqués los objetos a una distancia que te obligue a levantarte de la silla, deslizarte hacia adelante o perder el equilibrio.
- Si tenés dificultades de movilidad, control del tronco o antecedentes de caídas, realizá el ejercicio sobre una mesa firme y con el acompañamiento de un familiar o cuidador.
- Si tenés osteoporosis avanzada, antecedentes de fracturas vertebrales o restricciones de movilidad de la columna, evitá los alcances hacia el suelo y consultá previamente sobre las adaptaciones necesarias.
- Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-026.
- Área: Gerontogimnasia.
- Categoría: Equilibrio en sedestación, alcance funcional y coordinación visomotora.
- Duración del video: 46 segundos.
- Nivel de dificultad: Básico-intermedio, adaptable según la altura, distancia y ubicación de los objetos y la complejidad de las secuencias.
- Tipo de entrenamiento: equilibrio dinámico en sedestación, control postural, alcance multidireccional, coordinación visomotora e integración cognitivo-motora, con progresión a tareas de memoria de trabajo.

#### Objetivos motores

- Equilibrio dinámico en sedestación.
- Control postural durante los movimientos de alcance.
- Estabilidad del tronco.
- Desplazamiento controlado del centro de gravedad dentro de la base de sustentación.
- Transferencia controlada del peso corporal en sedestación.
- Movilidad funcional de los miembros superiores.
- Coordinación óculo-manual.
- Coordinación entre el tronco y los miembros superiores.
- Alcance anterior, lateral y diagonal.
- Disociación funcional de los movimientos del tronco y los miembros superiores.
- Recuperación controlada de la postura inicial.

#### Objetivos cognitivos

- Atención selectiva y sostenida.
- Discriminación visual de colores.
- Exploración visual.
- Procesamiento visoespacial.
- Coordinación visomotora.
- Lateralidad.
- Planificación motora.
- Secuenciación.
- Seguimiento de instrucciones.
- Monitorización de la ejecución.
- Memoria de trabajo verbal y visoespacial, al incorporar la memorización de secuencias.
- Flexibilidad cognitiva, al modificar las secuencias y alternar las manos.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado. Posibilidad de incrementar la complejidad de las secuencias y variar la ubicación de los objetos |
| Deterioro cognitivo leve | Recomendado, graduando la cantidad de colores y la longitud de las secuencias según el perfil cognitivo |
| Síntomas demenciales leves | Recomendado con instrucciones sencillas. Comenzar con dos o tres colores y aumentar la complejidad según el desempeño |
| Síntomas demenciales moderados | Variante simplificada sobre una mesa, utilizando dos colores, instrucciones de un solo paso, modelado y acompañamiento |
| Síntomas demenciales severos | Considerar la variante simplificada de alcance hacia un único objeto visible y familiar, mediante modelado y acompañamiento directo, según las capacidades conservadas |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente, siempre que exista adecuado control postural y capacidad para alcanzar los objetos de forma segura |
| Amarilla | Sí, con acompañamiento y adaptación de la altura y distancia de los objetos según capacidad funcional |
| Roja | Sí, siempre que exista suficiente control del tronco en sedestación. Priorizar objetos elevados sobre una mesa firme cuando exista movilidad reducida o dificultad de equilibrio |

- Requiere acompañamiento para ejecutar la actividad: no necesariamente. Puede realizarse de manera independiente siguiendo las secuencias propuestas. El acompañamiento dependerá del perfil funcional y cognitivo de la persona.
- El familiar o cuidador también puede participar indicando nuevas secuencias de colores.
- Criterios de exclusión del formato original: control postural insuficiente en sedestación, incapacidad para recuperar la posición erguida después de una inclinación, riesgo de caída desde la silla, restricciones de movilidad de la columna o los miembros superiores, dolor durante el movimiento, alteraciones visuales que impidan identificar los estímulos o incapacidad para comprender las instrucciones básicas.

#### Consideraciones terapéuticas

- La dificultad motora puede graduarse mediante la altura, distancia y ubicación de los objetos, mientras que la dificultad cognitiva puede modificarse mediante la cantidad de estímulos, la longitud de las secuencias y la alternancia de las manos.
- Ambos componentes deberán progresar de manera independiente.
- En personas con dificultades para discriminar colores, se podrán utilizar números, símbolos o figuras geométricas fácilmente reconocibles.
- En personas con deterioro cognitivo moderado o severo, se recomienda priorizar el alcance funcional, la imitación del movimiento y la interacción con objetos familiares, evitando demandas excesivas de memoria y secuenciación.
- Compatible con retos cognitivos: sí. El ejercicio incorpora un componente cognitivo básico de identificación de estímulos y seguimiento de secuencias, con posibilidad de progresar hacia tareas de memoria de trabajo y mayor demanda ejecutiva.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Kim, S. G., Goo, M., & Park, J. H. (2015). Comparison of the effectiveness of balance training using a reaching task between a sitting position and a standing position in the elderly. Journal of Physical Therapy Science, 27(7), 2337–2339.
- https://doi.org/10.1589/jpts.27.2337
- Artículo completo: https://pmc.ncbi.nlm.nih.gov/articles/PMC4540875/

#### Guion N.º 26 · Tocar las marcas de colores con la mano

- Duración aproximada del video: 46 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–06 s | La participante está sentada con ambos pies apoyados. Hay cuatro bolos de colores en el suelo a su alcance, dos al frente y dos hacia los lados. | «Para alcanzar un vaso desde la silla, coordinas el movimiento del cuerpo y la mano. Vamos a practicarlo.» |
| 06–16 s | Se indica apoyar bien los pies, inclinar el tronco hacia adelante y tocar con la punta de los dedos el color que diga el terapeuta. | «Apoya firmemente los pies. Inclínate hacia adelante y toca con la punta de los dedos el color que te voy indicando.» |
| 16–30 s | Con la mano derecha alcanza los bolos en el orden morado, celeste, rojo y verde. Después cambia a la mano izquierda y repite en el orden inverso. | «Con la mano derecha, toca morado, celeste, rojo y verde. Ahora con la izquierda: verde, rojo, celeste y morado.» |
| 30–46 s | Vuelve a sentarse erguida. Se propone variar la distancia de los bolos como progresión. Logotipo de IntegraMente. | «¿Te resultó fácil? Podemos variar la distancia de los bolos para practicar el alcance.» |


| Materiales necesarios | Silla firme y cuatro bolos de colores (morado, celeste, rojo y verde). |
| --- | --- |


---


## RECURSO N.º 27 – COORDINACIÓN Y REACCIÓN CON GLOBO


### A. Contenido visible en la aplicación

- Título: Coordinación y reacción con globo.
- Subtítulo: Entrená tu atención, coordinación y capacidad de reacción mientras disfrutás de una actividad en movimiento.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Un globo inflado.
- Una silla firme con respaldo y sin ruedas.
- Un familiar o cuidador que participe en la actividad.
- Si no contás con un globo, podés utilizar una pelota inflable de playa, liviana y de tamaño mediano, realizando pases suaves y a corta distancia.

#### ¿Cómo practicar este ejercicio?

- Realizá 3 series de 30 a 45 segundos.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Sentate en una silla firme, con ambos pies completamente apoyados en el suelo. Si contás con suficiente equilibrio y estabilidad, también podés realizarlo de pie.
- Pedile a tu acompañante que se coloque frente a vos y te envíe suavemente el globo.
- Seguí el movimiento del globo con la mirada.
- Devolvelo mediante un toque suave con la mano derecha.
- En el siguiente pase, utilizá la mano izquierda.
- Continuá alternando ambas manos o utilizá la mano que te indique tu acompañante.
- Procurá controlar la dirección y la fuerza de cada toque, manteniendo una postura estable durante toda la actividad.

#### La ciencia detrás del movimiento

- ¿Sabías que, para alcanzar un objeto en movimiento, tu cerebro necesita calcular su trayectoria, seleccionar una respuesta y coordinar los movimientos de tu cuerpo?
- Un estudio publicado en 2025 en la revista Scientific Reports encontró que los programas de entrenamiento que combinan estímulos visuales, respuestas motoras y ejercicios de equilibrio pueden favorecer la velocidad de reacción y el desempeño físico en personas adultas mayores.
- Con esta actividad practicamos habilidades que utilizamos diariamente al recibir un objeto, manipular nuestras pertenencias o responder a situaciones inesperadas de nuestro entorno.
- Consultar estudio científico: https://doi.org/10.1038/s41598-025-20418-7

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá el ejercicio sentado. Pedile a tu acompañante que te envíe el globo lentamente, directamente al frente y a una distancia cómoda. Podés utilizar ambas manos o la mano con la que te sintás más cómodo, sin necesidad de alternarlas.
- Para aumentar el desafío: pedile a tu acompañante que varíe ligeramente la dirección de los pases, siempre dentro de tu alcance, y que te indique de manera aleatoria con cuál mano debés devolver el globo.
- También podés realizarlo de pie si contás con suficiente equilibrio y estabilidad, siempre con acompañamiento.

#### ¡Sumale un reto cognitivo!

- Una vez que dominés el movimiento, intentá seguir estas instrucciones:
- Cuando tu acompañante diga «uno», devolvé el globo con la mano derecha.
- Cuando diga «dos», devolvé el globo con la mano izquierda.
- Prestá atención a cada número y recordá qué mano debés utilizar.
- Comenzá esta variante en posición sentada. Lo más importante es responder correctamente, sin necesidad de hacerlo rápidamente.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Realizá el ejercicio en un espacio libre de obstáculos y objetos que puedan interferir con los movimientos.
- Si estás sentado, mantené ambos pies apoyados en el suelo y evitá inclinarte excesivamente para alcanzar el globo.
- Tu acompañante deberá enviar el globo suavemente y dentro de una distancia cómoda, evitando pases demasiado altos, rápidos o alejados de tu cuerpo.
- Si realizás el ejercicio de pie, no des pasos inesperados ni persigás el globo si se aleja de tu alcance.
- Si tenés dificultades de equilibrio, antecedentes de caídas o necesitás utilizar ayudas para caminar, realizá únicamente la variante sentada.
- Evitá utilizar globos de látex si tenés alergia a este material. Si el globo se revienta, tu acompañante deberá retirar inmediatamente todos los fragmentos.
- Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva, ansiedad o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-027.
- Área: Gerontogimnasia.
- Categoría: Coordinación visomotora, capacidad de reacción e integración cognitivo-motora.
- Duración del video: 42 segundos.
- Nivel de dificultad:
- Básico: variante sentada con pases predecibles y respuestas libres.
- Intermedio: alternancia de manos y variación controlada de la trayectoria del globo.
- Intermedio-avanzado: variante de pie o incorporación de reglas cognitivas de respuesta.
- Tipo de entrenamiento: coordinación óculo-manual, seguimiento visual dinámico, anticipación motora, capacidad de reacción ante estímulos visuales y verbales e integración cognitivo-motora.

#### Objetivos motores

- Coordinación óculo-manual.
- Coordinación bilateral de los miembros superiores.
- Movilidad funcional de hombros, codos y muñecas.
- Precisión y dirección del movimiento.
- Regulación de la fuerza aplicada durante el contacto con el globo.
- Velocidad de respuesta motora.
- Anticipación de la trayectoria de objetos en movimiento.
- Control postural durante los movimientos de alcance.
- Equilibrio dinámico en sedestación o bipedestación, según la variante.
- Ajustes posturales durante la interacción con estímulos móviles.

#### Objetivos cognitivos

- Atención sostenida.
- Atención selectiva.
- Seguimiento visual de estímulos dinámicos.
- Procesamiento visoespacial.
- Percepción de la trayectoria, dirección y distancia de objetos en movimiento.
- Velocidad de procesamiento y selección de respuesta.
- Lateralidad.
- Planificación motora.
- Anticipación y predicción.
- Seguimiento de instrucciones.
- Monitorización de la ejecución.
- Memoria de trabajo, al mantener las reglas de asociación entre números y manos.
- Control inhibitorio, al seleccionar la mano indicada e inhibir respuestas incompatibles.
- Flexibilidad cognitiva, cuando se modifican las reglas de respuesta.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado. Posibilidad de incorporar pases en distintas direcciones, alternancia de manos y reglas de respuesta |
| Deterioro cognitivo leve | Recomendado, ajustando la velocidad de los pases y la complejidad de las instrucciones según el perfil cognitivo |
| Síntomas demenciales leves | Recomendado con instrucciones sencillas, pases lentos y acompañamiento. Incorporar la alternancia de manos según el desempeño |
| Síntomas demenciales moderados | Variante sentada, con pases predecibles, instrucciones de un solo paso, demostración y refuerzo positivo. Inicialmente sin reglas cognitivas adicionales |
| Síntomas demenciales severos | Considerar una variante simplificada e individualizada en posición sentada, permitiendo tocar o devolver el globo libremente, sin exigencias de velocidad, lateralidad o secuenciación |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, en posición sentada o de pie, según capacidad funcional. Requiere un acompañante para realizar los pases |
| Amarilla | Sí, priorizando la variante sentada, con pases suaves y controlados |
| Roja | Sí, exclusivamente en posición sentada, según capacidad de control postural y movilidad de los miembros superiores |

- Requiere acompañamiento para ejecutar la actividad: sí, independientemente de la ruta funcional asignada.
- Tipo de acompañamiento: familiar, cuidador u otra persona capaz de seguir las instrucciones y adaptar los pases a las capacidades del participante.
- Criterios de exclusión de la variante de pie: riesgo elevado de caída, alteraciones del equilibrio, inestabilidad postural, necesidad de ayudas para caminar o incapacidad para mantener una posición estable durante los movimientos de los miembros superiores.
- Criterios de exclusión o adaptación general: control postural insuficiente en sedestación, limitaciones significativas de movilidad de los miembros superiores, dolor durante los movimientos, alteraciones visuales que impidan seguir el estímulo, ansiedad o sobresalto significativo ante los globos y alergia al material utilizado.

#### Consideraciones terapéuticas

- La dificultad motora puede graduarse mediante la dirección, distancia, frecuencia y velocidad de los pases.
- La dificultad cognitiva puede modificarse mediante la alternancia de manos, la selección de respuestas según instrucciones verbales y la incorporación de reglas de asociación.
- Se recomienda progresar en ambos componentes de manera independiente, evitando incrementar simultáneamente la velocidad de los pases, la dificultad postural y la exigencia cognitiva.
- En personas con deterioro cognitivo moderado o severo, se deberá priorizar la participación espontánea, el disfrute de la actividad, la interacción social y las capacidades motoras conservadas.
- La precisión de la respuesta deberá prevalecer sobre la velocidad de ejecución.
- Compatible con retos cognitivos: sí. Permite incorporar tareas de atención, selección de respuesta, memoria de trabajo, control inhibitorio y flexibilidad cognitiva.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Çekok, F. K., & Anaforoğlu, B. (2025). Effects of balance-based visual reaction time exercises on cognitive and physical performance in older adults: A randomized controlled trial. Scientific Reports, 15, 34299.
- https://doi.org/10.1038/s41598-025-20418-7
- Artículo completo: https://pmc.ncbi.nlm.nih.gov/articles/PMC12489105/
- Guion N.º 27: Golpear el globo con las manos
- Duración aproximada del video: 42 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–14 s | La participante está sentada frente al terapeuta. Se explica el objetivo de coordinar la vista y las manos, y se menciona que la posición puede variar según la estabilidad. | “Con el globo vamos a practicar cómo coordinar la vista y las manos.” Esto mejora tu capacidad de reacción y reflejos. |
| 14–24 s | El terapeuta envía el globo a su alcance. La participante lo sigue con la mirada y lo devuelve con un toque suave de la mano indicada. | “Sentado o de pie, seguí el globo con la vista. Devolvelo con un toque suave de la mano derecha.” |
| 24–34 s | El terapeuta vuelve a enviar el globo e indica la mano para cada devolución. La participante alterna la derecha y la izquierda. | “Ahora probá con la izquierda. Seguí alternando, o usá la mano que te indique.” |
| 34–42 s | La participante sostiene el globo en el regazo mientras el terapeuta cierra la demostración. Logotipo de IntegraMente. | «¡Muy bien! Así practicamos tu capacidad de reacción y tu coordinación.» |


| Materiales necesarios | Silla firme y un globo. |
| --- | --- |


---


## RECURSO N.º 28 – PASOS LATERALES CON CAMBIO DE NIVEL


### A. Contenido visible en la aplicación

- Título: Pasos laterales con cambio de nivel.
- Subtítulo: Entrená tu equilibrio, fortalecé tus piernas y mejorá el control de tus movimientos al cambiar de nivel.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Un step bajo, firme y antideslizante.
- Dos barras laterales de apoyo, fijas y resistentes.
- Un par de pesas ligeras de velcro para los tobillos (opcional).
- Un familiar o cuidador que te acompañe durante la actividad.
- Si no contás con un step, podés utilizar marcas de colores o cinta adhesiva sobre el suelo para practicar los desplazamientos laterales sin cambios de altura.
- Las pesas para los tobillos son opcionales. Podés realizar el ejercicio sin resistencia adicional.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 6 a 8 repeticiones con cada pierna.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Colocate sobre el step con ambos pies apoyados y las manos sujetas a las barras laterales.
- Bajá lentamente el pie derecho hacia el lado derecho hasta tocar el suelo, manteniendo el pie izquierdo sobre el step.
- Regresá el pie derecho al step de manera controlada.
- Bajá el pie izquierdo hacia el lado izquierdo, manteniendo el derecho sobre el step.
- Regresá el pie izquierdo a la posición inicial.
- Continuá alternando ambos lados, procurando mantener una postura estable y controlar tanto el descenso como el ascenso de cada pierna.
- Realizá los movimientos lentamente, evitando impulsarte o dejar caer el peso del cuerpo de manera brusca.

#### La ciencia detrás del movimiento

- ¿Sabías que cada vez que subís o bajás un escalón, tu cerebro y tus músculos trabajan en conjunto para controlar el peso de tu cuerpo y mantener el equilibrio?
- Una revisión científica publicada en el British Journal of Sports Medicine encontró que los programas de entrenamiento de pasos pueden mejorar el equilibrio, la marcha y la capacidad de reacción, además de contribuir a reducir el riesgo de caídas en personas adultas mayores.
- Con este ejercicio trabajamos habilidades necesarias para desplazarnos hacia los lados, superar pequeños desniveles, subir y bajar escalones y adaptarnos a diferentes superficies durante nuestras actividades cotidianas.
- Consultar estudio científico: https://doi.org/10.1136/bjsports-2015-095452

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: realizá el ejercicio sobre una superficie plana, sin step ni pesas en los tobillos. Colocate frente a una superficie fija y firme, como el mostrador de la cocina, manteniendo ambas manos apoyadas.
- Dá un paso corto hacia la derecha y regresá a la posición inicial. Después, realizá el movimiento hacia la izquierda.
- Podés utilizar marcas de colores en el suelo para orientar tus movimientos.
- Para aumentar el desafío: si ya dominás los desplazamientos laterales sobre una superficie plana y contás con suficiente equilibrio, podés incorporar un step bajo, siempre con apoyo bilateral y acompañamiento.
- Si ya realizás el ejercicio con facilidad, podés incorporar pesas ligeras en los tobillos, siempre que esta resistencia haya sido indicada de acuerdo con tus capacidades físicas.
- No es necesario aumentar la altura del step ni retirar el apoyo de las manos para incrementar la dificultad.

#### ¡Sumale un reto cognitivo!

- Una vez que dominés el movimiento, intentá nombrar un país o una ciudad diferente cada vez que regresés a la posición inicial.
- Por ejemplo:
- Costa Rica – España – México – Italia.
- También podés elegir otras categorías, como frutas, animales o medios de transporte.
- Comenzá practicando este reto sobre una superficie plana. Si posteriormente lo incorporás al ejercicio con step, respondé cuando ambos pies estén nuevamente apoyados y hayas recuperado una posición estable.
- Recordá que lo más importante es mantener el equilibrio y la calidad de tus movimientos.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Utilizá un step bajo, firme, antideslizante y suficientemente ancho para apoyar ambos pies de forma segura.
- Mantené ambas manos sujetas a las barras de apoyo durante todo el ejercicio. Las barras deben estar fijas, ser resistentes y permanecer al alcance durante los desplazamientos laterales.
- No utilicés cajas, bancos, libros apilados ni otras superficies improvisadas como sustitutos del step.
- Realizá los movimientos lentamente, procurando que las rodillas mantengan una alineación adecuada con los pies y evitando que se desplacen excesivamente hacia adentro.
- No aumentés simultáneamente la altura del step, el peso de los tobillos y la complejidad del reto cognitivo.
- Realizá la variante con step siempre con el acompañamiento directo de un familiar o cuidador capaz de brindarte asistencia segura.
- Si tenés antecedentes de caídas, dificultades de equilibrio, debilidad importante en las piernas o necesitás ayudas para caminar, no realicés la variante con step sin una valoración funcional previa. La variante sobre una superficie plana también deberá ajustarse a tus capacidades.
- Suspendé el reto cognitivo si interfiere con tu equilibrio o coordinación.
- Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o inestabilidad.

### B. Información interna para el desarrollador

- Código: GJ-028.
- Área: Gerontogimnasia.
- Categoría: Equilibrio dinámico, fortalecimiento funcional y desplazamientos laterales.
- Duración del video: 45 segundos.
- Nivel de dificultad:
- Básico-intermedio: desplazamientos laterales sobre una superficie plana.
- Intermedio-avanzado: desplazamientos laterales con step y apoyo bilateral, sin resistencia adicional.
- Avanzado: desplazamientos laterales con step y pesas en los tobillos.
- Tipo de entrenamiento: equilibrio dinámico, transferencia lateral del peso corporal, fortalecimiento funcional de los miembros inferiores, control motor durante los cambios de nivel e integración cognitivo-motora mediante doble tarea.

#### Objetivos motores

- Equilibrio dinámico en bipedestación.
- Control postural durante los desplazamientos laterales.
- Transferencia lateral del peso corporal.
- Estabilidad monopodal asistida.
- Fortalecimiento funcional de los miembros inferiores.
- Activación de los músculos abductores y aductores de la cadera.
- Activación de la musculatura estabilizadora de la pelvis, especialmente el glúteo medio.
- Participación de cuádriceps, glúteos y musculatura estabilizadora del tobillo.
- Control muscular excéntrico durante el descenso.
- Control muscular concéntrico durante el ascenso.
- Coordinación bilateral de los miembros inferiores.
- Precisión en la ubicación de los pies.
- Adaptación motora a los cambios de altura.
- Estabilidad funcional de cadera, rodilla y tobillo.

#### Objetivos cognitivos

- Atención sostenida y selectiva.
- Conciencia corporal.
- Procesamiento de información propioceptiva.
- Procesamiento visoespacial.
- Percepción de la distancia y la altura.
- Lateralidad.
- Planificación motora.
- Secuenciación de movimientos.
- Monitorización de la ejecución.
- Atención dividida, al incorporar el reto cognitivo.
- Fluidez verbal semántica.
- Acceso al léxico y estrategias de búsqueda semántica.
- Memoria de trabajo y control ejecutivo, al evitar repetir respuestas durante el reto cognitivo.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado según capacidad funcional. Posibilidad de incorporar cambios de nivel, resistencia y retos cognitivos de manera progresiva |
| Deterioro cognitivo leve | Recomendado, ajustando la dificultad motora y cognitiva de manera independiente |
| Síntomas demenciales leves | Recomendado con adaptación y acompañamiento. Priorizar inicialmente los desplazamientos laterales sobre una superficie plana y sin pesas |
| Síntomas demenciales moderados | Variante simplificada sobre una superficie plana, con apoyo bilateral, modelado, instrucciones de un solo paso y acompañamiento directo. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | No recomendado en su formato original. Requiere valoración individual y selección de actividades funcionales adaptadas |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente en la variante sobre una superficie plana, siempre que exista adecuado equilibrio y apoyo bilateral. La variante con step requiere acompañamiento |
| Amarilla | Sí, con acompañamiento, apoyo bilateral y adaptación según capacidad funcional. Priorizar la superficie plana. El step requiere capacidad funcional suficiente |
| Roja | No. Se deberán seleccionar otros recursos de fortalecimiento de miembros inferiores en sedestación |

- Requiere acompañamiento para ejecutar la actividad: obligatorio en todas las variantes con step. En la variante sobre una superficie plana dependerá del perfil funcional y cognitivo de la persona.
- Tipo de acompañamiento: familiar o cuidador capaz de comprender las instrucciones y brindar asistencia segura durante los desplazamientos.
- Criterios de exclusión del formato original:
- Riesgo elevado de caída.
- Alteraciones significativas del equilibrio dinámico.
- Control postural insuficiente en bipedestación.
- Dificultad para realizar transferencias laterales del peso corporal.
- Debilidad significativa de los miembros inferiores.
- Incapacidad para subir o bajar escalones de forma segura.
- Dolor durante los movimientos de cadera, rodilla o tobillo.
- Restricciones articulares o posquirúrgicas.
- Alteraciones visuales que dificulten identificar los desniveles.
- Incapacidad para comprender y seguir instrucciones sencillas.
- Ausencia de superficies de apoyo adecuadas o de acompañamiento.

#### Consideraciones terapéuticas

- La actividad requiere controlar la transferencia del peso corporal hacia la extremidad que permanece sobre el step, así como regular el descenso y ascenso de la extremidad contraria.
- La incorporación de pesas en los tobillos aumenta la resistencia al movimiento de los miembros inferiores y puede modificar las demandas biomecánicas del ejercicio. Su utilización deberá individualizarse y no constituirá un requisito para realizar la actividad.
- La dificultad motora podrá graduarse mediante la longitud del desplazamiento lateral, la cantidad de repeticiones, la incorporación de cambios de nivel y la resistencia adicional.
- La dificultad cognitiva podrá modificarse mediante la selección de categorías semánticas, la búsqueda de palabras y la incorporación de reglas, como evitar repetir respuestas.
- Ambos componentes deberán progresar de manera independiente, priorizando el control postural, la precisión del movimiento y la seguridad.
- Compatible con retos cognitivos: sí. Permite incorporar tareas de fluidez verbal semántica, atención dividida y control ejecutivo, una vez dominada la secuencia motora.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Okubo, Y., Schoene, D., & Lord, S. R. (2017). Step training improves reaction time, gait and balance and reduces falls in older people: A systematic review and meta-analysis. British Journal of Sports Medicine, 51(7), 586–593.
- https://doi.org/10.1136/bjsports-2015-095452
- Guion N.º 28: Subir y bajar del step en posición lateral o de medio lado
- Duración aproximada del video: 45 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–13 s | La participante comienza con ambos pies en el step, pesas de velcro en los tobillos y una barra a cada lado. El terapeuta está cerca. | “Vamos a practicar el equilibrio al cambiar de nivel.” De esta forma te sentirás mas preparado para los obstáculos que se presentan en el día a día, mientras caminas. |
| 13–21 s | Baja el pie derecho lateralmente al suelo, dejando el izquierdo sobre el step, y vuelve a subir el derecho. Las barras quedan al alcance. | “Con ambos pies arriba, bajá el derecho de lado hasta el suelo. Dejá el izquierdo arriba y volvé a subir el derecho.” |
| 21–31 s | Baja el pie izquierdo por el otro lado y vuelve a subirlo. Alterna los lados, regresando con ambos pies al step. | “Eso es. Ahora bajá el izquierdo por el otro lado y volvé a subirlo. Alterná despacio.” |
| 31–45 s | Se propone nombrar un país o ciudad cada vez que vuelve a subir. La participante termina con ambos pies sobre el step, junto al terapeuta. Logotipo de IntegraMente. | «Si quieres aumentar la dificultad, nombra un país o una ciudad cada vez que vuelvas a subir. ¡Muy buen trabajo!» |


| Materiales necesarios | Step, dos barras laterales de apoyo y un par de pesas de velcro para los tobillos. |
| --- | --- |


---

- RECURSO N.º 29 – FORTALECIMIENTO DE MUSLOS CON ARO DE RESISTENCIA
- A. Contenido visible en la aplicación
- Título: Fortalecimiento de muslos con aro de resistencia.
- Subtítulo: Fortalecé la parte interna de tus muslos y trabajá la estabilidad de tus piernas desde una posición sentada.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.
- Materiales que debés tener listos
- Una silla firme con respaldo y sin ruedas.
- Un aro de resistencia.
- Si no contás con un aro de resistencia, podés utilizar una pelota plástica blanda, ligeramente inflada, o un cojín pequeño y firme que puedas comprimir cómodamente entre las rodillas.
- ¿Cómo practicar este ejercicio?
- Realizá 2 series de 8 a 10 repeticiones.
- Mantené cada presión durante 3 segundos.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, preferiblemente en días no consecutivos.
- Sentate cómodamente, con la espalda apoyada en el respaldo y ambos pies completamente apoyados en el suelo.
- Colocá el aro entre las rodillas y sujetalo suavemente con ambas manos para mantenerlo en su posición.
- Presioná el aro acercando las rodillas entre sí, sin realizar un esfuerzo excesivo.
- Mantené la presión durante 3 segundos, respirando con normalidad.
- Aflojá lentamente la presión y relajá los músculos antes de comenzar la siguiente repetición.
- Procurá mantener una postura estable y realizar cada movimiento de manera lenta y controlada.
- La ciencia detrás del movimiento
- ¿Sabías que los músculos de la parte interna de tus muslos participan en la estabilidad de la pelvis y el control de tus piernas?
- Una revisión científica de la Colaboración Cochrane, que analizó 121 ensayos clínicos, encontró que el entrenamiento de fuerza con resistencia progresiva puede mejorar la fuerza muscular y la capacidad funcional de las personas adultas mayores.
- Mantener la fuerza de nuestras piernas es importante para realizar actividades cotidianas como caminar, levantarnos de una silla, cambiar de posición y desplazarnos con mayor autonomía.
- Consultar estudio científico: https://doi.org/10.1002/14651858.CD002759.pub2
- Adaptá el ejercicio a tus capacidades
- Para hacerlo más sencillo: utilizá un cojín pequeño o una pelota blanda que ofrezca poca resistencia. Realizá entre 6 y 8 repeticiones, manteniendo cada presión durante 1 o 2 segundos.
- Para aumentar el desafío: si realizás el ejercicio cómodamente, podés aumentar progresivamente hasta 12 repeticiones por serie o mantener cada presión durante 5 segundos.
- No es necesario apretar con la máxima fuerza posible. Priorizá el control muscular y una respiración adecuada.
- ¡Sumale un reto cognitivo!
- Una vez que dominés el movimiento, intentá nombrar diferentes productos u objetos que podés encontrar en una farmacia.
- Por ejemplo:
- Algodón – Vendas – Termómetro – Jabón.
- Nombrá un elemento diferente cada vez que relajés la presión del aro, procurando no repetir las respuestas.
- También podés elegir otras categorías, como objetos de cocina, prendas de vestir o alimentos.
- Recordá mantener una respiración natural durante toda la actividad.
- Botón: Ir a nuestra tabla de retos cognitivos.
- Recomendaciones de seguridad
- Utilizá una silla firme y estable, manteniendo la espalda apoyada en el respaldo y ambos pies completamente apoyados en el suelo.
- Seleccioná un aro, pelota o cojín que puedas sujetar cómodamente entre las rodillas, sin generar presión dolorosa sobre las articulaciones.
- Realizá una presión suave o moderada. Evitá realizar esfuerzos máximos, movimientos bruscos o contener la respiración.
- No utilicés objetos rígidos, pesados o que puedan deslizarse fácilmente.
- Si tenés antecedentes de cirugía reciente de cadera o rodilla, restricciones posquirúrgicas, dolor en la ingle o alguna condición que limite estos movimientos, consultá previamente si el ejercicio es apropiado para vos.
- Si presentás dificultades para comprender las instrucciones o mantener el material en su posición, realizá el ejercicio con el acompañamiento de un familiar o cuidador.
- Detené el ejercicio si experimentás dolor, mareos, dificultad para respirar, fatiga excesiva o cualquier otra molestia.
- B. Información interna para el desarrollador
- Código: GJ-029.
- Área: Gerontogimnasia.
- Categoría: Fortalecimiento muscular de miembros inferiores.
- Duración del video: 51 segundos.
- Nivel de dificultad: Básico-intermedio, adaptable según la resistencia del material, la duración de las contracciones y la cantidad de repeticiones.
- Tipo de entrenamiento: fortalecimiento muscular resistido en sedestación, aducción bilateral de cadera, contracciones musculares sostenidas e integración cognitivo-motora mediante doble tarea.
- Objetivos motores
- Activación y fortalecimiento de la musculatura aductora de cadera.
- Activación del aductor mayor, aductor largo, aductor corto, grácil y pectíneo.
- Control de la contracción y relajación muscular.
- Regulación de la intensidad del esfuerzo.
- Resistencia muscular localizada.
- Coordinación bilateral de los miembros inferiores.
- Estabilidad y control de la región pélvica.
- Control postural en sedestación.
- Coordinación entre el esfuerzo muscular y la respiración.
- Conciencia corporal y reconocimiento de la tensión muscular.
- Objetivos cognitivos
- Atención sostenida.
- Atención dirigida al movimiento.
- Conciencia corporal.
- Procesamiento de información propioceptiva.
- Seguimiento de instrucciones.
- Secuenciación de la contracción y relajación muscular.
- Monitorización de la ejecución.
- Regulación voluntaria del esfuerzo.
- Al incorporar el reto cognitivo:
- Fluidez verbal semántica.
- Acceso al léxico.
- Evocación de información semántica.
- Estrategias de búsqueda dentro de una categoría.
- Memoria de trabajo y monitorización de respuestas para evitar repeticiones.
- Coordinación temporal de las demandas cognitivas y motoras.
- Atención dividida, cuando ambas tareas se ejecutan simultáneamente.
- Perfil cognitivo recomendado

| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado. Posibilidad de aumentar progresivamente la resistencia, la duración de las contracciones y la complejidad del reto cognitivo |
| Deterioro cognitivo leve | Recomendado, incorporando tareas de fluidez verbal semántica según el perfil cognitivo |
| Síntomas demenciales leves | Recomendado con instrucciones sencillas y demostración. Utilizar categorías semánticas familiares y acompañamiento según necesidad |
| Síntomas demenciales moderados | Variante simplificada, utilizando una pelota blanda o cojín, menor cantidad de repeticiones, modelado e instrucciones de un solo paso. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | Considerar una variante individualizada con resistencia mínima, acompañamiento directo y demostración del movimiento, siempre que exista comprensión suficiente y participación voluntaria |

- Rutas compatibles

| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, de manera independiente, siempre que la persona pueda comprender las instrucciones y realizar el movimiento de forma segura |
| Amarilla | Sí, con acompañamiento según necesidad y adaptación de la resistencia y las repeticiones |
| Roja | Sí, en posición sentada, siempre que exista suficiente control postural y capacidad para realizar la aducción voluntaria de cadera |

- Requiere acompañamiento para ejecutar la actividad: no necesariamente. Dependerá del perfil funcional y cognitivo de la persona, así como de su capacidad para colocar y mantener el material en la posición adecuada.
- Criterios de exclusión o adaptación:
- Dolor significativo en la cadera, rodilla o región inguinal.
- Lesiones recientes de la musculatura aductora.
- Restricciones articulares o posquirúrgicas que contraindiquen la aducción de cadera.
- Incapacidad para mantener una posición sentada estable.
- Dificultad significativa para regular la intensidad del esfuerzo.
- Espasticidad o hipertonía de los músculos aductores que requiera un abordaje individualizado.
- Condiciones cardiovasculares no controladas o restricciones médicas para realizar ejercicios resistidos.
- Incapacidad para comprender o reproducir el movimiento de manera segura, incluso con acompañamiento.
- Consideraciones terapéuticas
- El ejercicio se orienta principalmente al fortalecimiento de la musculatura aductora de cadera mediante una fase de compresión del material, una contracción isométrica sostenida y una relajación controlada.
- La dificultad motora puede graduarse mediante:
- La resistencia ofrecida por el material.
- La duración de la contracción muscular.
- La cantidad de repeticiones.
- La cantidad de series.
- La dificultad cognitiva puede graduarse mediante la selección de categorías semánticas más o menos familiares y la incorporación de reglas para evitar respuestas repetidas.
- Se recomienda progresar en ambos componentes de manera independiente, evitando incrementar simultáneamente la resistencia muscular y la dificultad cognitiva.
- Debe prestarse especial atención a evitar la maniobra de Valsalva, favoreciendo una respiración continua durante las contracciones musculares.
- En personas con deterioro cognitivo moderado o severo, se deberá priorizar la comprensión del movimiento, la participación activa, el bienestar y la sensación de competencia, evitando exigencias cognitivas innecesarias.
- Compatible con retos cognitivos: sí. Permite incorporar tareas de fluidez verbal semántica, memoria de trabajo y coordinación cognitivo-motora.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Liu, C. J., & Latham, N. K. (2009). Progressive resistance strength training for improving physical function in older adults. Cochrane Database of Systematic Reviews, (3), CD002759.
- https://doi.org/10.1002/14651858.CD002759.pub2
- Artículo completo: https://pmc.ncbi.nlm.nih.gov/articles/PMC4324332/
- Resumen científico disponible en español: https://www.cochrane.org/es/evidence/CD002759_progressive-resistance-strength-training-improving-physical-function-older-adults
- Guion N.º 29: Presión de aro entre las rodillas
- Duración aproximada del video: 51 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–11 s | La participante se sienta con la espalda apoyada en el respaldo y ambos pies en el suelo. El terapeuta explica el trabajo de la parte interna de los muslos. | “Vamos a fortalecer la parte interna de los muslos.” |
| 11–21 s | Coloca un aro de resistencia entre las rodillas y lo sujeta con ambas manos. Se menciona una bola plástica como alternativa. | «Coloca el aro entre las rodillas. Si no tienes aro, puedes usar una bola plástica.» |
| 21–43 s | Presiona el aro con las rodillas y afloja la presión, coordinando el esfuerzo con la respiración. Se propone nombrar algo que se encuentre en una farmacia. | «Aprieta el aro con las rodillas, sigue respirando y luego suelta la presión. Si te resulta cómodo, nombra algo que encuentras en una farmacia.» |
| 43–51 s | El terapeuta cierra junto a la participante, que sigue sentada y sostiene el aro. Logotipo de IntegraMente. | «¡Muy bien! Fortalecer tus piernas te ayuda a mantener tu independencia.» |


| Materiales necesarios | Silla firme con respaldo y un aro de resistencia. Alternativa mencionada: bola plástica. |
| --- | --- |


---


## RECURSO N.º 30 – REACCIÓN Y COORDINACIÓN CON PELOTA


### A. Contenido visible en la aplicación

- Título: Reacción y coordinación con pelota.
- Subtítulo: Entrená tu atención, coordinación y capacidad para responder ante objetos en movimiento.
- Tiempo de práctica: 3 a 5 minutos aproximadamente.

#### Materiales que debés tener listos

- Una silla firme con respaldo y sin ruedas.
- Una pelota plástica liviana, preferiblemente blanda.
- Un familiar o cuidador que participe en la actividad.
- Si no contás con una pelota, podés utilizar una pelota de espuma o un par de medias enrolladas que puedas atrapar fácilmente con ambas manos.

#### ¿Cómo practicar este ejercicio?

- Realizá 2 series de 8 a 10 intentos.
- Descansá entre 30 y 60 segundos entre cada serie.
- Practicalo de 2 a 3 veces por semana, según tu tolerancia.
- Sentate cómodamente, con la espalda apoyada en el respaldo y ambos pies completamente apoyados en el suelo.
- Colocá ambas manos abiertas frente al pecho, preparadas para recibir la pelota.
- Pedile a tu acompañante que sostenga la pelota por encima de tus manos, dentro de tu campo visual.
- Cuando tu acompañante suelte la pelota, intentá atraparla utilizando ambas manos.
- Regresá a la posición inicial y preparate para el siguiente intento.
- Tu acompañante podrá colocarse detrás o al lado de la silla, siempre procurando que la pelota permanezca visible y que su trayectoria sea segura.
- Si la pelota se cae, no te preocupés. Pedile a tu acompañante que la recoja y volvé a intentarlo.
- Lo importante es practicar, no conseguir una ejecución perfecta.

#### La ciencia detrás del movimiento

- ¿Sabías que, cuando intentamos atrapar un objeto que está cayendo, nuestro cerebro necesita detectar el movimiento, calcular su trayectoria y coordinar rápidamente nuestras manos?
- Un estudio publicado en 2025 en la revista Scientific Reports encontró que los programas de entrenamiento que combinan estímulos visuales y respuestas motoras pueden mejorar el tiempo de reacción y el desempeño físico en personas adultas mayores.
- Con este ejercicio practicamos habilidades que utilizamos diariamente al recibir un objeto, manipular nuestras pertenencias o responder ante movimientos inesperados en nuestro entorno.
- Consultar estudio científico: https://doi.org/10.1038/s41598-025-20418-7

#### Adaptá el ejercicio a tus capacidades

- Para hacerlo más sencillo: utilizá una pelota blanda de mayor tamaño o un par de medias enrolladas. Pedile a tu acompañante que se coloque frente a vos, te avise antes de soltar el objeto y lo deje caer desde una altura cómoda que te permita atraparlo con facilidad.
- Si todavía te resulta difícil, comenzá recibiendo el objeto directamente en tus manos, sin dejarlo caer.
- Para aumentar el desafío: una vez que dominés el movimiento, pedile a tu acompañante que varíe el momento en que suelta la pelota, sin avisarte exactamente cuándo lo hará.
- También puede modificar ligeramente la altura de la suelta, manteniendo siempre la pelota por debajo del rostro y dentro de una trayectoria segura.
- No es necesario realizar lanzamientos rápidos ni aumentar excesivamente la altura para incrementar la dificultad.

#### ¡Sumale un reto cognitivo!

- Una vez que dominés el movimiento, intentá contar hacia adelante de dos en dos después de cada intento.
- Por ejemplo:
- 2 – 4 – 6 – 8 – 10.
- Cada vez que finalicés un intento, mencioná el siguiente número de la secuencia, independientemente de si lograste atrapar la pelota.
- También podés realizar una variante nombrando diferentes frutas o animales después de cada intento.
- Si esta actividad interfiere con tu concentración o coordinación, regresá al ejercicio original.
- Botón: Ir a nuestra tabla de retos cognitivos.

#### Recomendaciones de seguridad

- Realizá el ejercicio siempre en posición sentada, utilizando una silla firme, estable y sin ruedas.
- Utilizá una pelota liviana, preferiblemente blanda, que no pueda lastimarte si no lográs atraparla.
- Tu acompañante deberá soltar la pelota dentro de tu campo visual, evitando dirigirla hacia tu rostro o dejarla caer desde una altura excesiva.
- No intentés levantarte, inclinarte bruscamente ni alcanzar la pelota si se aleja de tus manos o cae al suelo. Tu acompañante deberá encargarse de recogerla.
- Si tenés dificultades visuales, utilizá una pelota de mayor tamaño y de un color que contraste con el entorno.
- Si presentás dificultades para mover los brazos, comprender las instrucciones o coordinar ambas manos, comenzá con la variante simplificada.
- Evitá generar sobresaltos, especialmente si la actividad produce ansiedad, inseguridad o frustración.
- Detené el ejercicio si experimentás dolor, mareos, fatiga excesiva o cualquier otra molestia.

### B. Información interna para el desarrollador

- Código: GJ-030.
- Área: Gerontogimnasia.
- Categoría: Capacidad de reacción, coordinación visomotora e integración cognitivo-motora.
- Duración del video: 50 segundos.
- Nivel de dificultad:
- Básico: recepción directa del objeto o suelta anticipada y predecible.
- Intermedio: recepción de una pelota en caída libre utilizando ambas manos.
- Intermedio-avanzado: variación del momento y la altura de la suelta o incorporación de retos cognitivos.
- Tipo de entrenamiento: tiempo de reacción visual, coordinación óculo-manual, coordinación bilateral de los miembros superiores, anticipación motora, interceptación de objetos en movimiento e integración cognitivo-motora.

#### Objetivos motores

- Coordinación óculo-manual.
- Coordinación bilateral simultánea de los miembros superiores.
- Velocidad de respuesta motora.
- Precisión de los movimientos de recepción.
- Movilidad funcional de hombros, codos, muñecas y manos.
- Ajuste de la posición de las manos ante estímulos móviles.
- Regulación de la fuerza de agarre.
- Coordinación de la apertura y cierre de las manos.
- Anticipación motora de la trayectoria de un objeto.
- Control postural en sedestación durante la respuesta motora.
- Integración temporal de los movimientos de ambos miembros superiores.

#### Objetivos cognitivos

- Atención sostenida.
- Atención selectiva.
- Alerta y preparación para responder ante un estímulo.
- Detección de estímulos visuales dinámicos.
- Seguimiento visual.
- Velocidad de procesamiento de la información.
- Procesamiento visoespacial.
- Estimación de la trayectoria, distancia y velocidad de un objeto.
- Anticipación temporal.
- Planificación y ejecución de respuestas motoras.
- Monitorización y ajuste de la respuesta.
- Preparación e iniciación de respuestas voluntarias.
- Al incorporar el reto cognitivo:
- Memoria de trabajo.
- Secuenciación numérica.
- Cálculo mental básico.
- Fluidez verbal semántica.
- Acceso y recuperación de información.
- Alternancia atencional entre las demandas motoras y cognitivas.

#### Perfil cognitivo recomendado


| Perfil | Indicación |
| --- | --- |
| Envejecimiento normal | Recomendado. Posibilidad de incorporar variaciones temporales de la suelta y retos cognitivos |
| Deterioro cognitivo leve | Recomendado, ajustando la complejidad de la tarea y la velocidad de respuesta requerida según el perfil cognitivo |
| Síntomas demenciales leves | Recomendado con acompañamiento, demostraciones e instrucciones sencillas. Priorizar inicialmente estímulos predecibles |
| Síntomas demenciales moderados | Variante simplificada con el acompañante colocado al frente, utilizando objetos blandos de mayor tamaño, aviso previo a la suelta y refuerzo positivo. Inicialmente sin reto cognitivo |
| Síntomas demenciales severos | Considerar una variante individualizada de recepción directa de objetos familiares, blandos y livianos, mediante modelado y acompañamiento. Evitar estímulos inesperados y exigencias de velocidad |


#### Rutas compatibles


| Ruta | Compatibilidad |
| --- | --- |
| Verde | Sí, en posición sentada y con participación de un acompañante |
| Amarilla | Sí, en posición sentada, adaptando las características del objeto y las condiciones de la suelta |
| Roja | Sí, siempre que exista suficiente control postural en sedestación y movilidad funcional de los miembros superiores |

- Requiere acompañamiento para ejecutar la actividad: sí, independientemente de la ruta funcional asignada.
- Tipo de acompañamiento: familiar, cuidador u otra persona capaz de comprender las instrucciones, adaptar la presentación del estímulo y recuperar la pelota entre los intentos.
- Criterios de exclusión o adaptación:
- Control postural insuficiente en sedestación.
- Limitaciones significativas de movilidad de los miembros superiores.
- Dolor durante los movimientos de brazos o manos.
- Restricciones articulares o posquirúrgicas.
- Alteraciones visuales significativas que impidan detectar o seguir el objeto.
- Dificultades importantes para coordinar la recepción del objeto.
- Ansiedad o respuestas exageradas de sobresalto ante estímulos inesperados.
- Incapacidad para comprender las instrucciones básicas, incluso mediante demostración.
- Ausencia de un acompañante que pueda realizar la actividad de forma segura.

#### Consideraciones terapéuticas

- El ejercicio se orienta al entrenamiento de respuestas motoras voluntarias ante estímulos visuales dinámicos, incorporando mecanismos de anticipación temporal, integración visomotora y coordinación bilateral.
- A diferencia de los ejercicios con globos, la caída libre de la pelota exige ajustar la respuesta motora a unas condiciones temporales diferentes, dependiendo de la altura de la suelta y las características del objeto.
- La dificultad motora puede graduarse mediante:
- El tamaño de la pelota.
- Las características físicas del objeto.
- La altura de la suelta.
- La predictibilidad temporal del estímulo.
- La cantidad de intentos.
- La dificultad cognitiva puede graduarse mediante la incorporación de secuencias numéricas, categorías semánticas o reglas de respuesta.
- Se recomienda modificar una sola variable a la vez y favorecer inicialmente experiencias de éxito.
- En personas con deterioro cognitivo moderado o severo, se deberá priorizar la participación activa, la interacción interpersonal y el disfrute de la actividad, evitando demandas excesivas de velocidad o respuestas ante estímulos inesperados.
- La cantidad de recepciones exitosas puede utilizarse como un indicador descriptivo del desempeño durante la actividad, pero no constituye una medida neuropsicológica estandarizada del tiempo de reacción.
- Compatible con retos cognitivos: sí. Permite incorporar tareas de memoria de trabajo, secuenciación numérica, fluidez verbal semántica y coordinación cognitivo-motora.
- Enlace interno: tabla de retos cognitivos (pendiente de desarrollo).
- Referencia científica:
- Çekok, F. K., & Anaforoğlu, B. (2025). Effects of balance-based visual reaction time exercises on cognitive and physical performance in older adults: A randomized controlled trial. Scientific Reports, 15, 34299.
- https://doi.org/10.1038/s41598-025-20418-7
- Artículo completo: https://pmc.ncbi.nlm.nih.gov/articles/PMC12489105/
- Guion N.º 30: Reacción con bola de plástico
- Duración aproximada del video: 50 segundos

| Tiempo | Acción visual | Guion del terapeuta (audio) |
| --- | --- | --- |
| 00–10 s | La participante está sentada en una silla y el terapeuta muestra una bola de plástico liviana. | “Vamos a practicar cómo reaccionar cuando algo cae.” Esto aumenta tu capacidad de reacción ante una sorpresa! |
| 10–20 s | El terapeuta se coloca detrás de la silla. La participante mantiene ambas manos abiertas frente al pecho, listas para recibir la bola. | «Mantén las manos abiertas frente al pecho. Me voy a colocar detrás de la silla para soltar la bola.» |
| 20–36 s | El terapeuta sostiene la bola por delante y por encima de las manos y la deja caer para que la atrape con ambas manos. Repite la suelta desde distintas alturas. | «Cuando caiga la bola, intenta atraparla con las dos manos. Podemos variar la altura de la suelta.» |
| 36–50 s | El terapeuta recupera la bola entre intentos y anima a la participante a volver a probar. Logotipo de IntegraMente. | «¡Muy buen intento! Si se cae, volvemos a probar. Lo importante es entrenar tu capacidad de reacción.» |


| Materiales necesarios | Silla firme y una bola de plástico liviana. |
| --- | --- |
