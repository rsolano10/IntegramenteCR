# Actividades interactivas, Fase 2: diez lugares nuevos del pueblo

Especificación para Claude Code. IntegraMente en Casa, repo `integramente_app`.

## 0. Cómo usar este documento

1. Este documento continúa `business/ACTIVIDADES_INTERACTIVAS.md` y la dirección de diseño "Un día en el pueblo". Todas sus reglas siguen vigentes, en especial la sección 2 (sin puntajes, sin castigo, sin tiempo, solo toques).
2. No hay arquitectura nueva que inventar. Cada actividad se construye con lo que ya existe:
   - Lógica: un `DefActividad` en `src/lib/actividades/`, agregado a `ACTIVIDADES` en `registro.ts`.
   - Escena: un componente en `src/components/actividades/pueblo/`, con `paleta.ts`, `pieza.ts` (estados de pieza) y `Ornamento.tsx` (rosetón, rueda de progreso, rótulo).
   - Marco: `interactivas/Marco.tsx`, con su barra de acciones, pantalla completa, pista y cierre con "¿Cómo le resultó?".
   - Voz: `leerEnVoz` y `detenerVoz` de `src/lib/voz.ts` (voz natural con audio en caché).
   - Dictado: `useDictado` de `src/lib/voz.ts`.
   - Biblioteca: una migración que crea el recurso de cada juego, siguiendo `20261111000000_actividades_un_dia_en_el_pueblo.sql`, con códigos desde COG-047.
   - Nivel sugerido: `nivelSugerido.ts` funciona para cualquier tipo nuevo sin cambios; verificalo con una prueba.
3. Antes de empezar, revisá cómo quedaron implementadas las 10 escenas de la Fase 1 y reutilizá sus patrones. Si este documento contradice el código, gana el código para la estructura y este documento para el comportamiento.
4. Una actividad por commit. Pruebas de `generar` y `validar` en `actividades.test.ts`, como las demás. No hagas push sin que Rodolfo lo pida.
5. Las decisiones de la sección 6 son de Rodolfo y del equipo. Si una bloquea, preguntá.

Corrección pendiente: `ACTIVIDADES_INTERACTIVAS.md` dice en la sección 2.6 que el tratamiento es "usted". El código ya usa voseo, que es lo correcto. Actualizá ese párrafo a voseo costarricense en el primer commit.

## 1. Qué cubre esta fase

La Fase 1 cubrió bien atención selectiva, memoria de trabajo, memoria episódica visual, planificación de rutinas y orientación temporal. Quedaron huecos. Esta fase los llena:

| Hueco | Actividad nueva |
|---|---|
| Orientación espacial | Las señas |
| Atención y memoria visual de escena | El corredor |
| Praxias visoconstructivas | La carreta por pintar |
| Razonamiento semántico | La olla de carne |
| Memoria semántica y lenguaje | La banca del parque |
| Comprensión auditiva y lectora | La radio y El correo |
| Memoria verbal | El mandado |
| Fluidez verbal | La pizarra de la escuela |
| Planificación con restricciones (vida diaria) | La pizarra de la cocina |
| Flexibilidad cognitiva | El corral |

Más una extensión: el modo "vuelto" en La pulpería.

## 2. Reglas de esta fase, además de las vigentes

- **Ninguna escena con rostros.** Igual que en la Fase 1.
- **Contenido costarricense revisado.** Dichos, señas, recetas y avisos los propone Claude Code con `revisado: false`. No se publican sin aprobación del equipo.
- **La voz es ayuda, no requisito.** Toda actividad que usa voz tiene botón "Escuchar otra vez" y una alternativa en texto. Ninguna depende de oír bien para poder terminarse.
- **El dictado es opcional.** Si el navegador no lo soporta, o la persona prefiere no hablar, hay una alternativa por toques.
- **Ninguna respuesta hablada se evalúa.** Lo que la persona dice se muestra; no se califica.

## 3. Las diez actividades

Formato de cada una: escena, mecánica, configuración, niveles, pista, contenido, casos borde, momento final y metadato interno.

### 3.1 `senas`: Las señas

**Escena.** El pueblo visto desde arriba, como un mapa pintado: cuadras, la iglesia, la plaza, la escuela, la pulpería, el palo de mango, casas de colores. Una rosa de los vientos grande en una esquina con Norte, Sur, Este y Oeste.

**Mecánica.** Una seña al estilo tico: "De la iglesia, 200 metros al sur y 100 al este. Casa verde de corredor." La persona toca la casa a la que llega. Cada cuadra equivale a 100 metros.

**Config.** `tramos` (1 a 3), `marcarPartida` (resalta el punto de partida), `casaDescrita` (agrega color o detalle de la casa al final de la seña), `leerEnVoz`.

**Niveles.**
- Suave: 1 tramo, partida resaltada, casa descrita, flecha de dirección junto a la rosa de los vientos.
- Medio: 2 tramos, partida resaltada.
- Retador: 3 tramos, sin descripción de la casa, partidas variadas (plaza, escuela, palo de mango).

**Pista.** Dibuja con un trazo de pincel el primer tramo que falta.

**Contenido.** Puntos de referencia del mapa y un generador de señas que garantiza que el destino existe dentro del mapa y es único.

**Casos borde.** Ningún tramo sale del mapa. Nunca dos casas en el mismo destino. La rosa de los vientos se mantiene fija; el mapa no rota.

**Momento final.** Se encienden las ventanas de las casas visitadas y aparece un camino punteado que las une.

**Metadato.** Orientación, orientación espacial. Secundarias: memoria de trabajo, comprensión.

### 3.2 `que-cambio`: El corredor

**Escena.** El corredor de una casa de adobe: mecedora, macetas con helechos, una jaula vacía colgada, un sombrero en un clavo, una banca, un gato dormido, una lata de leche con flores.

**Mecánica.** Fase 1: la persona mira el corredor y toca "Ya lo vi". Fase 2: el mismo corredor con uno o más cambios (algo desapareció, cambió de color o cambió de lugar). La persona toca lo que cambió y luego "Listo".

**Config.** `cambios` (1 a 3), `tiposDeCambio` (múltiple: `quitar`, `color`, `mover`), `objetos` (5 a 12), `permitirVerDeNuevo`.

**Niveles.**
- Suave: 6 objetos, 1 cambio de tipo "quitar", ver de nuevo permitido.
- Medio: 9 objetos, 2 cambios, "quitar" y "color".
- Retador: 12 objetos, 3 cambios, los tres tipos.

**Pista.** Rodea con un trazo mostaza la zona del corredor donde está un cambio.

**Contenido.** Banco de objetos de corredor en SVG, cada uno con 2 o 3 variantes de color y 2 posiciones posibles. El generador arma la escena y elige los cambios.

**Casos borde.** Un objeto "quitado" deja un espacio tocable (tocar el lugar vacío cuenta). Un cambio de color debe ser evidente, no un matiz. Dos cambios nunca en el mismo objeto.

**Momento final.** El gato se despierta y se estira (una sola animación, sin rostro detallado).

**Metadato.** Atención, atención selectiva. Secundarias: memoria episódica visual.

### 3.3 `pintar-rueda`: La carreta por pintar

**Escena.** El taller de pintura de carretas, de día: una rueda modelo colgada en la pared, una rueda en blanco sobre el caballete, y botes de pintura en el banco.

**Mecánica.** Tocar un bote (queda elegido), luego tocar un sector de la rueda en blanco para pintarlo. Se puede repintar. "Listo" compara con el modelo.

**Config.** `sectores` (4 a 12), `anillos` (1 o 2), `colores` (2 a 4), `rotada` (el modelo aparece girado respecto de la rueda en blanco).

**Niveles.**
- Suave: 4 sectores, 1 anillo, 2 colores.
- Medio: 8 sectores, 1 anillo, 3 colores.
- Retador: 8 sectores, 2 anillos, 4 colores; opcionalmente con el modelo rotado.

**Pista.** Pinta correctamente un sector que esté mal o vacío.

**Reintento.** Los sectores que no coinciden vuelven a blanco con suavidad; los correctos se quedan.

**Contenido.** Generado con `roseton.ts`. Los colores salen de `paleta.ts`. Los botes llevan además una marca distinta (forma de la tapa) para no depender solo del color.

**Casos borde.** Con `rotada`, aceptar la rueda si coincide en cualquier giro equivalente. Validar que dos colores elegidos tengan contraste suficiente entre sí.

**Momento final.** La rueda pintada se monta en la carreta y la carreta avanza un poco.

**Metadato.** Praxias, praxias visoconstructivas. Secundarias: atención sostenida, relación espacial.

### 3.4 `intruso`: La olla de carne

**Escena.** Cocina de leña con una olla grande humeando y una mesa con ingredientes.

**Mecánica.** Sobre la mesa hay de 4 a 6 elementos. Todos van en la olla menos uno. La persona toca el que no va. En niveles altos el criterio es menos evidente.

**Config.** `elementos` (4 a 6), `sutileza` (`evidente`, `categoria`, `propiedad`), `mostrarCriterio` (después de acertar muestra por qué en una línea).

**Niveles.**
- Suave: 4 elementos, intruso evidente (un jabón entre verduras).
- Medio: 5 elementos, intruso de otra categoría cercana (una fruta entre verduras).
- Retador: 6 elementos, criterio por propiedad (todos son verdes menos uno; todos se comen crudos menos uno).

**Pista.** Retira uno de los elementos que sí van.

**Contenido.** Banco de conjuntos con su criterio: olla de carne, gallo pinto, café, herramientas del patio, ropa de domingo. Cada conjunto tiene el criterio escrito en una línea para `mostrarCriterio`.

**Casos borde.** Cada conjunto debe tener un único intruso defendible. Si el equipo marca un conjunto como ambiguo, sale del banco.

**Momento final.** La olla queda servida en platos sobre la mesa.

**Metadato.** Funciones ejecutivas, razonamiento. Secundarias: memoria semántica.

### 3.5 `dichos`: La banca del parque

**Escena.** Banca del parque frente a la iglesia, de tarde. Dos sombreros sobre la banca sugieren la conversación; sin personas.

**Mecánica.** Aparece el inicio de un dicho ("Camarón que se duerme...") y de 3 a 4 opciones para completarlo. La persona toca la correcta. Modo alternativo `significado`: aparece el dicho completo y la persona elige qué quiere decir.

**Config.** `modo` (`completar`, `significado`, `mixto`), `opciones` (3 o 4), `leerEnVoz`.

**Niveles.**
- Suave: completar, 3 opciones, dichos muy conocidos.
- Medio: completar, 4 opciones con distractores plausibles.
- Retador: mixto, con preguntas de significado.

**Pista.** Descarta una opción incorrecta.

**Contenido.** Banco de dichos y refranes de uso común en Costa Rica, con su significado en una línea. Son de dominio popular; aun así, redactá las explicaciones con palabras propias.

**Casos borde.** Hay dichos con variantes regionales. Si el equipo acepta dos finales, ambos cuentan como correctos y nunca aparecen juntos como opciones.

**Momento final.** Suenan las campanas de la iglesia (visual: la campana se mueve; sin audio por defecto).

**Metadato.** Lenguaje, comprensión. Secundarias: memoria semántica, razonamiento.

**Por qué importa.** Es conocimiento que las personas mayores conservan mejor que otros. Es una actividad donde casi siempre les va bien, y eso sostiene la motivación.

### 3.6 `comprension`: La radio y El correo

Un solo motor con dos escenas.

**Escena "La radio".** Una radio de tubos sobre una repisa, con la perilla y la luz del dial. Se escucha un aviso de la radio comunal.

**Escena "El correo".** Un apartado de correos abierto con un sobre; al tocarlo se despliega una carta corta escrita a mano.

**Mecánica.** La persona escucha (radio) o lee (correo) un texto corto. Luego responde de 1 a 3 preguntas de opción múltiple: datos literales (qué día, a qué hora, dónde) y, en niveles altos, una inferencia ("¿Cómo creés que se siente Carmen?").

**Config.** `escena` (`radio`, `correo`), `longitud` (`corta`, `media`), `preguntas` (1 a 3), `inferencia` (booleano), `textoVisible` (en la radio, mostrar el texto mientras se responde), `escucharOtraVez`.

**Niveles.**
- Suave: texto corto, 1 pregunta literal, texto visible, escuchar otra vez.
- Medio: texto corto, 2 preguntas literales, texto oculto al responder, escuchar otra vez.
- Retador: texto medio, 3 preguntas con una inferencia, texto oculto.

**Pista.** Resalta en el texto la frase que contiene la respuesta (o lo vuelve a leer en voz alta, si es la radio).

**Contenido.** Avisos de radio comunal (turno de la iglesia, vacunación, la feria, un perro perdido, el bus que cambia de horario) y cartas de familiares (una nieta que se gradúa, un hijo que viene de visita). Las preguntas se escriben a mano, no se generan.

**Voz.** La radio usa `leerEnVoz`. Pregenerá y guardá en caché el audio de cada aviso del banco para que no haya espera. La carta tiene un botón "Leerla en voz alta".

**Casos borde.** Sin datos de salud en los textos. Las inferencias deben tener una sola respuesta razonable.

**Momento final.** Radio: suena la música (la luz del dial se mueve). Correo: la carta queda colgada en la pared junto a otras.

**Metadato.** Lenguaje, comprensión. Secundarias: memoria episódica verbal, cognición social (inferencia).

### 3.7 `mandado`: El mandado

**Escena.** El Mercado Central: tramos de verdura, carnicería, abarrotes, flores. Una bolsa de manta vacía en primer plano.

**Mecánica.** Fase 1: la lista del mandado aparece escrita en un papelito (y se puede escuchar). La persona toca "Ya me la aprendí". Fase 2: el papelito se guarda y la persona toca en los tramos los productos de la lista. Cada producto tocado entra a la bolsa. "Listo" compara.

**Config.** `productos` (2 a 6), `distractores` (cuántos productos parecidos hay en los tramos), `formato` (`escrita`, `escuchada`, `ambas`), `agruparPorTramo` (la lista viene ordenada por tramo), `verLista` (permite volver a ver el papelito, con un toque).

**Niveles.**
- Suave: 2 productos, ambas, agrupada, ver lista permitido.
- Medio: 4 productos, ambas, sin agrupar.
- Retador: 6 productos, solo escuchada, distractores de la misma categoría.

**Pista.** Muestra la primera letra de un producto que falta, o vuelve a decir la lista.

**Reintento.** Lo que no estaba en la lista sale de la bolsa con suavidad; lo correcto se queda.

**Contenido.** Banco de productos con nombre costarricense e ilustración. Reutilizá lo que se pueda del banco de La feria.

**Momento final.** La bolsa llena sobre la mesa de la casa.

**Metadato.** Memoria, memoria episódica (verbal). Secundarias: atención selectiva.

### 3.8 `pizarra`: La pizarra de la escuela

**Escena.** Aula de escuela rural: pizarra verde, tiza, pupitres de madera, mapa de Costa Rica en la pared.

**Mecánica.** Aparece una consigna: "Decí todos los nombres de frutas que se te ocurran." La persona habla y las palabras aparecen escritas con tiza en la pizarra. Cuando quiera, toca "Ya terminé". No hay tiempo ni conteo visible.

**Alternativa sin voz.** Un teclado grande o la opción "Las digo en voz alta" (el familiar escucha y toca "+1" por cada palabra; la pizarra muestra marcas de tiza, no un número).

**Config.** `consignas` (categorías: frutas, animales, pueblos de Costa Rica, comidas típicas, nombres de persona; o letras: "palabras que empiecen con M"), `modoEntrada` (`dictado`, `teclado`, `marcas`), `mostrarEjemplo` (la primera palabra ya escrita).

**Niveles.**
- Suave: categorías amplias, con ejemplo.
- Medio: categorías más acotadas (pueblos de Guanacaste).
- Retador: por letra inicial.

**Pista.** Sugiere un subtipo para seguir ("Pensá en frutas que se dan en el patio").

**Reglas propias.** No se valida ninguna palabra. No se muestran repetidas dos veces (se ignoran en silencio). No se guarda lo dicho. Esta actividad no tiene "acierto": cualquier palabra cuenta igual.

**Casos borde.** El dictado puede equivocarse; la persona puede tocar una palabra para borrarla. Si el navegador no soporta dictado, se ofrece directamente la alternativa.

**Momento final.** Suena el timbre (la campana del corredor se mueve) y la pizarra queda llena.

**Metadato.** Lenguaje, fluidez. Secundarias: memoria semántica, flexibilidad.

### 3.9 `agenda`: La pizarra de la cocina

**Escena.** Pizarra de corcho o tablero en la cocina con las horas del día como franjas, una taza de café y un almanaque al lado.

**Mecánica.** Hay de 3 a 6 tarjetas de tareas del día ("Ir al EBAIS a las 10:00", "Chorrear el café", "Regar las matas", "El bus a San José pasa a las 9:00", "Almorzar"). Algunas tienen hora fija. La persona toca una tarjeta y luego la franja donde la haría. "Listo" verifica que se cumplen las reglas: las de hora fija en su hora, lo que va antes de algo va antes, nada se cruza.

**Config.** `tareas` (3 a 6), `conHoraFija` (cuántas), `restricciones` (cuántas reglas de orden: "antes de salir hay que..."), `franjas` (mañana/tarde o por horas).

**Niveles.**
- Suave: 3 tareas, 1 con hora fija, franjas mañana, tarde y noche.
- Medio: 4 tareas, 2 con hora fija, 1 regla de orden, franjas por hora.
- Retador: 6 tareas, 2 con hora fija, 2 reglas de orden.

**Pista.** Coloca una de las tareas con hora fija, o resalta la regla que no se cumple.

**Validación.** Cualquier organización que cumpla las reglas es válida. Nunca hay una única respuesta "correcta" si las reglas permiten varias.

**Contenido.** Escenarios de día completo, escritos a mano, sin medicamentos ni datos de salud.

**Momento final.** El almanaque pasa al día siguiente y la pizarra queda ordenada.

**Metadato.** Funciones ejecutivas, planificación. Secundarias: estimación temporal, actividades instrumentales de la vida diaria.

### 3.10 `corral`: El corral

**Escena.** Un corral de finca con dos portones. Gallinas, chompipes, terneros y cerdos de dos colores esperan afuera.

**Mecánica.** Un rótulo sobre los portones dice el criterio: "Por animal" o "Por color". La persona toca cada animal y luego el portón que le corresponde. Después de unos animales, el rótulo cambia de criterio, con un aviso visible y una animación de rótulo que se voltea. La persona sigue con la regla nueva.

**Config.** `animalesPorRegla` (3 a 6), `cambios` (1 a 3), `avisarCambio` (el cambio de regla se anuncia con texto y voz), `criterios` (`animal`, `color`, `tamano`).

**Niveles.**
- Suave: 1 cambio, anunciado con texto y voz, 2 criterios.
- Medio: 2 cambios, anunciados.
- Retador: 3 cambios, anunciados solo con el rótulo (sin voz), 3 criterios.

**Pista.** Señala el rótulo con un trazo mostaza y lo lee en voz alta.

**Reglas propias.** El cambio de regla nunca es sorpresa oculta: siempre está escrito en el rótulo. Esta versión mide adaptarse a una regla nueva, no adivinar la regla.

**Momento final.** Los portones se cierran y los animales quedan acomodados.

**Metadato.** Funciones ejecutivas, flexibilidad. Secundarias: inhibición, atención alternante.

## 4. Extensión: La pulpería, modo "vuelto"

Agregar a `pagoExacto` un campo `modo` (`pagar`, `vuelto`, `mixto`). Valor por defecto: `pagar` (los recursos actuales no cambian).

**Mecánica del vuelto.** La cuenta es de ₡1 350 y la persona pagó con un billete de ₡2 000. Tiene que armar el vuelto (₡650) sobre el mostrador. Se reutiliza toda la escena y la lógica de armar montos.

**Niveles para el modo vuelto.** Suave: vuelto menor a ₡500, múltiplos de 50. Medio: hasta ₡5 000. Retador: hasta ₡10 000, múltiplos de 5.

## 5. Orden de trabajo

**Tanda A, sin dependencias nuevas.** Validan que el patrón de la Fase 1 se repite sin esfuerzo.

1. `intruso` (La olla de carne)
2. `que-cambio` (El corredor)
3. `pintar-rueda` (La carreta por pintar)
4. `senas` (Las señas)
5. Modo "vuelto" en La pulpería

**Tanda B, usan voz o dictado.**

6. `dichos` (La banca del parque)
7. `mandado` (El mandado)
8. `comprension` (La radio y El correo)
9. `pizarra` (La pizarra de la escuela)

**Tanda C, lógica de reglas más compleja.**

10. `corral` (El corral)
11. `agenda` (La pizarra de la cocina)

Después de cada tanda: capturas a 360 x 740 y 1280 x 800 de cada escena nueva, revisión contra la lista de aceptación de diseño de la Fase 1, y alto para que Rodolfo apruebe antes de la tanda siguiente.

Por cada actividad: recurso en la Biblioteca (COG-047 en adelante), portada en "Juegos del pueblo", y una línea en la base de conocimiento del asistente (`business/knowledge-base-agente.md`) con el nombre del juego y qué hace la persona.

### Estado (16 de noviembre de 2026)

- **Tanda A:** hecha y aprobada por la clínica. Son COG-047 a COG-050 y el modo vuelto.
- **Tanda B:** hecha y aprobada por la clínica:

  | Código | Juego |
  |---|---|
  | COG-051 | La banca del parque |
  | COG-052 | El mandado |
  | COG-053 | La radio y El correo |
  | COG-054 | La pizarra de la escuela |

  Sus bancos están aprobados (`revisado: true`).

- **Valores por defecto mientras las decisiones siguen abiertas:**
  - **Dictado (6.2):** apagado. La clínica puede permitirlo en cada recurso.
  - **Voz (6.4):** sin pregenerar. Cada aviso o lista se genera la primera vez que alguien lo escucha y queda guardado.
  - **Sonidos (6.3):** solo visuales (campanas, radio y timbre).
- **Tanda C:** El corral y La pizarra de la cocina. Pendiente.

## 6. Decisiones abiertas

1. **Contenido cultural.** Quién del equipo revisa los bancos de dichos, señas, avisos de radio, cartas y escenarios de agenda.
2. **Dictado.** Si se acepta enviar la voz de la persona al servicio de reconocimiento del navegador (en Chrome suele procesarse en servidores externos). Si no, La pizarra arranca solo con teclado y marcas.
3. **Sonidos.** Campanas, radio, timbre y animales quedaron visuales. Un banco de efectos de sonido propio subiría mucho la experiencia, pero hay que producirlo o licenciarlo, y agregar un control visible para silenciarlo.
4. **Costo de voz.** Pregenerar el audio de los bancos (avisos, dichos, listas) tiene un costo único con ElevenLabs. Los textos generados en el momento (listas aleatorias del mandado) se generan una vez por combinación y se guardan en caché; definir un tope.
5. **Escena del mapa.** Las señas funcionan mejor con un pueblo genérico. Otra opción es un mapa de Cartago o del barrio de la clínica, más reconocible pero menos reutilizable.

## 7. Lo que queda para después

- **El álbum de la familia.** Juegos con las fotos que sube la familia (ordenar por época, reconocer quién es quién). Conecta con REM-007 "Álbum digital de vida" de los contenidos. Requiere almacenamiento de fotos, consentimiento y una revisión del equipo de cada foto antes de usarla. Merece su propia especificación.
- **El reloj de la iglesia.** Leer la hora en un reloj de agujas y poner la hora con botones de más y menos.
- **Sonidos de la casa.** Reconocer sonidos cotidianos; depende de la decisión 6.3.
