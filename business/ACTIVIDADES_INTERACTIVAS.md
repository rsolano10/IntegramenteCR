# Actividades interactivas de IntegraMente en Casa

Especificación de implementación para Claude Code.
Repo: `integramente_app` (dev server en `localhost:5173`).

## 0. Cómo usar este documento

1. Lee el documento completo antes de tocar código.
2. Ejecuta el Paso 0 (sección 3) y muestra el resumen de lo que encontraste antes de escribir nada.
3. Implementa por fases y en el orden de la sección 8. Una actividad por commit, en una rama nueva. No hagas push sin que Rodolfo lo pida.
4. Si algo de este documento contradice la estructura real del repo, gana el repo para la estructura (carpetas, nombres, librerías, estilos) y gana este documento para el comportamiento (sección 2).
5. Si una decisión de la sección 9 bloquea el trabajo, pregunta. No la resuelvas por tu cuenta.

Quien escribió este documento no vio el repo. Todo nombre de archivo, forma de datos o librería que aparezca aquí es una propuesta que debes ajustar a lo que exista.

## 1. Contexto

IntegraMente en Casa es una web app para que personas mayores y sus familias hagan en casa actividades de estimulación cognitiva. El plan de cada persona se arma con recursos (videos, PDF, actividades interactivas) que la clínica configura y revisa.

Estado actual, según Rodolfo:

- Ya existe una primera actividad interactiva: el componente `ClasificarNumeros`.
- La clínica configura cada actividad desde el campo `extras` del recurso, en `ResourceEditor`.
- La actividad se muestra a la persona en `ResourceDetailView`.

Objetivo de este trabajo: pasar de una actividad suelta a un sistema de actividades (un contrato común, un registro de tipos, piezas compartidas) y construir sobre él las 10 actividades de la Fase 1.

## 2. Reglas no negociables

Estas reglas son de producto. Ninguna actividad puede romperlas.

### 2.1 Sin puntajes y sin registro automático

- No mostrar puntajes, porcentajes, conteo de aciertos o errores, rachas, estrellas ni niveles alcanzados.
- No guardar resultados de desempeño. El estado de una actividad vive solo en memoria mientras está abierta.
- El registro de la actividad (Sí / En parte / No) lo hace la persona o su familiar con el flujo que ya existe. La actividad nunca lo llena, lo sugiere ni lo preselecciona.
- El progreso dentro de la actividad se muestra de forma neutra: "Ejercicio 2 de 5".

### 2.2 Sin castigo por error

- Prohibido: X roja, sonidos de error, vibración, vidas, "perdiste", "incorrecto", reinicio forzado.
- Ante una respuesta que no corresponde: el elemento vuelve a su estado inicial con una animación suave y aparece un mensaje breve y neutro.
- Tras 2 intentos en el mismo paso se ofrece el botón "Ver una pista". La pista resuelve ese paso o lo deja evidente.
- Siempre existe el botón "Terminar por hoy". Salir a medias no muestra ningún mensaje negativo.

### 2.3 Sin presión de tiempo

- Sin cronómetros, cuentas regresivas ni límites de tiempo.
- Las fases de memorización las cierra la persona con un botón ("Ya lo memoricé"), no un temporizador.
- Sin estímulos en movimiento ni parpadeantes. Respetar `prefers-reduced-motion`.

### 2.4 Interacción para personas mayores

- Solo tocar. Nada de arrastrar, doble toque, mantener presionado ni gestos.
- El patrón para mover algo es: tocar el elemento (queda seleccionado y resaltado), luego tocar el destino.
- Área táctil mínima de 56 x 56 px, con 12 px de separación entre elementos tocables.
- Texto base de 20 px o más. Instrucciones de 24 px o más.
- Contraste de texto 4.5:1 como mínimo.
- Máximo 12 elementos tocables en pantalla en el nivel suave.
- Todo debe funcionar en un celular en vertical (360 px de ancho) sin scroll horizontal.
- Navegable con teclado, con foco visible. Los mensajes de retroalimentación van en una región `aria-live="polite"`.

### 2.5 Identidad visual

- Usar los tokens de color que ya existen en el repo para la paleta oficial: verde serenidad, verde profundo y mostaza.
- No introducir celeste ni colores nuevos. Si falta un token, pregunta.
- La selección y la confirmación no pueden depender solo del color: agregar borde, ícono o texto.

### 2.6 Texto y contenido

- Español de Costa Rica. Tratamiento de "usted" (ver decisión abierta 9.1).
- Contenido local: colones, comidas, lugares y rutinas de Costa Rica.
- Sin afirmaciones de salud en la interfaz. No escribir "mejora su memoria", "previene", "entrena su cerebro" ni similares. Las instrucciones solo dicen qué hacer.
- La función cognitiva de cada actividad es un metadato interno para la clínica. No se le muestra a la familia.

### 2.7 Originalidad

Las mecánicas de este documento son paradigmas clásicos de estimulación cognitiva. La referencia a NeuronUP es solo para trazabilidad interna.

- No copiar nombres, textos de instrucciones, imágenes, ni contenido de niveles de NeuronUP ni de ningún otro producto.
- No descargar imágenes de internet. Ver sección 4.6 para los recursos gráficos.

## 3. Paso 0: reconocimiento del repo

Antes de programar, revisa y resume en un mensaje corto:

1. Stack: framework, lenguaje (TypeScript o JavaScript), sistema de estilos, librería de pruebas, i18n si existe.
2. `ClasificarNumeros`: props que recibe, cómo lee su configuración, cómo maneja el toque, la retroalimentación y el final de la actividad.
3. `ResourceEditor`: forma exacta de `extras` hoy y cómo se edita la configuración de `ClasificarNumeros`.
4. `ResourceDetailView`: cómo decide qué componente interactivo renderizar.
5. Dónde y cómo se hace el registro Sí / En parte / No, para no interferir con él.
6. Tokens de diseño: nombres de los colores de la paleta, tipografías, espaciados, componentes de botón existentes.
7. Qué pruebas existen y cómo se corren.

Termina el resumen con una lista de diferencias entre lo que encontraste y lo que este documento supone.

## 4. Arquitectura

### 4.1 Contrato de configuración

Cada recurso interactivo guarda en `extras` un objeto con esta forma (adaptar el nombre de la clave a lo que ya use `ClasificarNumeros`):

```json
{
  "actividad": {
    "tipo": "pago-exacto",
    "version": 1,
    "nivel": "suave",
    "ejercicios": 5,
    "config": {}
  }
}
```

- `tipo`: identificador del tipo de actividad (ver sección 6).
- `version`: versión del esquema de `config`, para poder migrar después.
- `nivel`: `"suave"`, `"medio"` o `"retador"`. Cada tipo traduce el nivel a valores por defecto de `config`.
- `ejercicios`: cantidad de ejercicios por sesión. Por defecto 5, rango de 3 a 10.
- `config`: parámetros propios del tipo. Todo campo es opcional y, si viene, pisa el valor por defecto del nivel.

El nivel lo fija la clínica. No hay subida ni bajada automática de nivel.

Los recursos que ya usan `ClasificarNumeros` deben seguir funcionando sin migración manual. Si su forma actual de `extras` es distinta, soporta ambas.

### 4.2 Registro de tipos

Un único módulo exporta el registro. Cada entrada define:

| Campo | Para qué |
|---|---|
| `tipo` | Identificador |
| `nombre` | Nombre visible para la clínica en el editor |
| `area` y `funcion` | Metadato interno (taxonomía de la sección 7) |
| `componente` | Componente que juega la actividad |
| `porNivel` | Valores por defecto de `config` para cada nivel |
| `campos` | Descripción de los campos editables (tipo, etiqueta, rango, ayuda) |
| `validar(config)` | Devuelve lista de errores legibles |
| `generar(config, rng)` | Función pura que produce los ejercicios de una sesión |

`ResourceDetailView` resuelve el componente por `tipo` desde el registro. Si el tipo no existe o la configuración no valida, muestra un mensaje amable ("Esta actividad no está disponible por ahora") y nunca una pantalla rota.

### 4.3 Generación separada de la interfaz

- `generar` es una función pura: misma configuración y misma semilla producen los mismos ejercicios.
- Usa un generador de números aleatorios con semilla, inyectado. Nada de `Math.random()` dentro de los componentes.
- `config.semilla` es opcional y existe para pruebas y para que la clínica pueda reproducir una sesión.
- Los componentes solo pintan ejercicios y manejan toques. Esto permite probar la lógica sin montar interfaz.

### 4.4 Piezas compartidas

Construir una sola vez y reutilizar en todas las actividades:

- **Marco de actividad**: título, instrucción, progreso neutro, botón "Terminar por hoy", zona de retroalimentación con `aria-live`.
- **Retroalimentación**: tres estados y nada más.
  - Confirmación: marca de verificación en verde profundo y una frase corta ("Muy bien.").
  - Reintento: frase neutra ("Probemos otra vez.").
  - Pista: disponible tras 2 intentos en el mismo paso.
- **Selección por toque**: lógica "tocar elemento, tocar destino", con estado seleccionado visible y posibilidad de deseleccionar tocando de nuevo.
- **Pantalla de cierre**: mensaje neutro ("Listo por hoy. Gracias por su tiempo.") y un botón para volver al recurso. No muestra resumen de desempeño. No toca el registro Sí / En parte / No.
- **Fase de memorización**: muestra el contenido con el botón "Ya lo memoricé"; al tocarlo, oculta y pasa a la fase de respuesta.

Si `ClasificarNumeros` ya resuelve alguna de estas piezas, extráela de ahí en lugar de duplicarla.

### 4.5 Editor para la clínica

En `ResourceEditor`:

- Selector de tipo de actividad, alimentado por el registro.
- Selector de nivel y campo de cantidad de ejercicios.
- Formulario de `config` generado a partir de `campos`, con los valores por defecto del nivel visibles como placeholder.
- Validación con `validar` antes de guardar, con errores en lenguaje llano.
- Botón "Probar actividad" que abre la actividad con la configuración actual, sin guardar.

### 4.6 Bancos de contenido y recursos gráficos

- El contenido (palabras, categorías, objetos, rutinas) vive en archivos de datos dentro del repo, uno por banco, separados del código.
- Cada entrada lleva `revisado: false` hasta que el equipo clínico la apruebe. Agrega una lista corta de bancos pendientes de revisión al final de tu trabajo.
- Gráficos: usar la librería de íconos que ya tenga el repo o SVG simples hechos a mano. Si no alcanza, usar tarjetas de texto grande. No usar emojis como contenido principal (se ven distintos en cada dispositivo) y no descargar imágenes.
- Las actividades que necesitan ilustraciones o audio propios quedan para la Fase 2.

### 4.7 Pruebas

Con la librería de pruebas que ya use el repo:

- Por cada tipo: pruebas de `generar` (determinismo con semilla, respeto de rangos, sin ejercicios imposibles) y de `validar`.
- Por cada componente: flujo feliz completo, flujo con errores hasta la pista, y salida con "Terminar por hoy".
- Una prueba transversal que recorra el registro y verifique que cada tipo tiene todos los campos y que su configuración por defecto valida en los tres niveles.

## 5. Criterios de aceptación comunes

Cada actividad está terminada cuando:

- [ ] Cumple todas las reglas de la sección 2.
- [ ] Se puede crear, configurar y probar desde `ResourceEditor`.
- [ ] Se juega completa en un celular de 360 px de ancho, solo con toques.
- [ ] Se juega completa solo con teclado.
- [ ] Funciona en los tres niveles con la configuración por defecto.
- [ ] Una configuración inválida muestra un error claro en el editor y un mensaje amable en la vista de la persona.
- [ ] No escribe nada en almacenamiento ni en el backend.
- [ ] Tiene las pruebas de la sección 4.7 y pasan.
- [ ] No rompe `ClasificarNumeros` ni los recursos existentes.

## 6. Fase 1: diez actividades

Los nombres visibles son propuestas propias. La columna "Referencia" de la sección 7 indica en qué actividades del catálogo se inspira cada una.

### 6.1 `clasificar`: Cada cosa en su lugar

Motor genérico de clasificación. Es la generalización natural de `ClasificarNumeros`: evalúa si conviene que `ClasificarNumeros` pase a ser un paquete de contenido de este motor, y propónlo antes de hacerlo.

- **Mecánica**: se muestran de 2 a 4 grupos (cajas con nombre) y una fila de elementos. La persona toca un elemento y luego el grupo al que pertenece. El ejercicio termina cuando todos están ubicados.
- **Paquetes de contenido** (`config.paquete`):
  - `cocina`: alimentos y utensilios hacia refrigeradora, alacena, gaveta, fregadero.
  - `casa`: objetos hacia cocina, baño, cuarto, sala.
  - `reciclaje`: residuos hacia orgánico, papel y cartón, plástico y envases, vidrio.
  - `categorias`: palabras hacia frutas, animales, ropa, herramientas, etc.
- **Config**: `paquete`, `grupos` (2 a 4), `elementosPorEjercicio` (4 a 12), `mostrarAyuda` (muestra un ejemplo ya ubicado en cada grupo).
- **Niveles**: suave = 2 grupos, 4 elementos, con ayuda. Medio = 3 grupos, 8 elementos. Retador = 4 grupos, 12 elementos, sin ayuda.
- **Pista**: resalta el grupo correcto del elemento seleccionado.
- **Borde**: un elemento puede aceptar más de un grupo válido (por ejemplo, el tomate). El banco permite declarar varios grupos correctos por elemento.

### 6.2 `pago-exacto`: Pagar justo

- **Mecánica**: se muestra un monto ("Pague ₡1 350"). Abajo hay una bandeja con monedas y billetes. Cada toque sobre una denominación agrega una unidad a la zona "Lo que voy a pagar"; tocar una unidad en esa zona la quita. Un botón "Listo" verifica.
- **Moneda**: colones. Denominaciones propuestas: monedas de 5, 10, 25, 50, 100 y 500; billetes de 1 000, 2 000, 5 000, 10 000 y 20 000. Confirmar con la clínica cuáles mostrar.
- **Config**: `montoMin`, `montoMax`, `denominaciones` (lista), `multiploDe` (por ejemplo 100, para evitar montos incómodos), `mostrarSuma` (muestra el total acumulado mientras arma el pago).
- **Niveles**: suave = montos de 100 a 1 000, múltiplos de 100, solo monedas de 100 y 500, con suma visible. Medio = hasta 5 000, múltiplos de 50, con billetes. Retador = hasta 20 000, múltiplos de 5, sin suma visible.
- **Validación**: cualquier combinación que sume el monto es válida. No exigir la combinación mínima.
- **Reintento**: si no coincide, el mensaje indica solo la dirección ("Falta un poco." o "Se pasó un poco.").
- **Pista**: muestra una combinación válida, atenuada.
- **Borde**: `generar` debe garantizar que el monto es alcanzable con las denominaciones configuradas.

### 6.3 `ordenar-pasos`: Paso a paso

- **Mecánica**: se muestran desordenados los pasos de una tarea cotidiana. La persona los toca en el orden en que se hacen; cada toque lo pasa a una lista numerada. Tocar un paso de la lista lo devuelve.
- **Banco**: rutinas con 3 a 7 pasos. Ejemplos: chorrear café, poner la mesa, lavarse las manos, tender la cama, preparar gallo pinto, salir de casa.
- **Config**: `rutinas` (lista de ids, o todas), `pasos` (3 a 7), `formato` (`texto` o `texto-con-icono`).
- **Niveles**: suave = 3 pasos. Medio = 5. Retador = 7.
- **Validación**: el banco puede marcar pares de pasos intercambiables para no rechazar órdenes razonables.
- **Pista**: coloca el siguiente paso correcto.

### 6.4 `ordenar-secuencia`: En orden

- **Mecánica**: tarjetas estáticas desordenadas. La persona las toca de menor a mayor (o en orden alfabético). Cada toque válido las acomoda en una fila ordenada.
- **Config**: `tipo` (`numeros`, `letras`, `palabras`), `cantidad` (3 a 9), `sentido` (`ascendente` o `descendente`), `rangoNumerico`, `palabras` (lista propia opcional).
- **Niveles**: suave = 4 números del 1 al 20, ascendente. Medio = 6 números hasta 100 o 5 palabras. Retador = 9 números hasta 1 000, o palabras que comparten la primera letra, o sentido descendente.
- **Pista**: resalta la siguiente tarjeta.

### 6.5 `formar-palabra`: Arme la palabra

- **Mecánica**: letras desordenadas en fichas grandes y casillas vacías. Tocar una ficha la pone en la siguiente casilla libre; tocar una casilla llena devuelve la letra.
- **Config**: `palabras` (lista propia; pensada para nombres de familiares, lugares y cosas significativas), `banco` (categoría del banco general si no hay lista propia), `longitudMin`, `longitudMax`, `mostrarPista` (muestra una definición corta o categoría).
- **Niveles**: suave = 3 a 4 letras, primera letra ya colocada. Medio = 5 a 6 letras. Retador = 7 a 9 letras, sin ayuda.
- **Detalles**: manejar tildes, ñ y dígrafos como letras normales. Comparar sin distinguir mayúsculas. Si las letras forman otra palabra válida del banco, aceptarla.
- **Pista**: coloca la siguiente letra correcta.

### 6.6 `parejas`: Encuentre las parejas

- **Mecánica**: cartas boca abajo. La persona voltea dos. Si son pareja, quedan visibles. Si no, se mantienen visibles hasta que toque "Continuar" y luego se voltean. No se voltean solas con temporizador.
- **Config**: `pares` (3 a 8), `contenido` (`iconos`, `palabras`, `icono-palabra` para emparejar un ícono con su nombre), `numerarReverso` (número en el reverso como ayuda de ubicación).
- **Niveles**: suave = 3 pares con reverso numerado. Medio = 6 pares. Retador = 8 pares sin números.
- **Pista**: resalta por un momento la pareja de la última carta volteada (animación corta, sin parpadeo).
- **Nota**: no contar ni mostrar intentos.

### 6.7 `recordar-posiciones`: Ventanas encendidas

- **Mecánica**: una cuadrícula de casillas (ventanas de una casa). Algunas aparecen encendidas. La persona toca "Ya lo memoricé", todas se apagan, y ella toca las que estaban encendidas. Botón "Listo" para verificar.
- **Config**: `filas`, `columnas`, `encendidas`, `permitirVerDeNuevo` (botón para volver a mostrar el patrón).
- **Niveles**: suave = 2 x 3 con 2 encendidas y opción de ver de nuevo. Medio = 3 x 4 con 4. Retador = 4 x 4 con 6, sin ver de nuevo.
- **Reintento**: mantiene las que acertó y apaga las demás, con el mensaje neutro.
- **Pista**: vuelve a mostrar el patrón completo.

### 6.8 `encontrar-iguales`: Busque los iguales

- **Mecánica**: arriba hay un modelo. Abajo, una cuadrícula con figuras, letras o números. La persona toca todos los que son iguales al modelo y luego "Listo".
- **Config**: `contenido` (`figuras`, `letras`, `numeros`), `total` (6 a 20), `objetivos` (2 a 6), `parecido` (`bajo`, `medio`, `alto`: qué tan similares son los distractores).
- **Niveles**: suave = 6 elementos, 2 objetivos, parecido bajo. Medio = 12 elementos, 4 objetivos. Retador = 20 elementos, 6 objetivos, parecido alto (b/d/p/q, 6/9, figuras rotadas).
- **Reintento**: indica solo cuántos faltan ("Aún queda alguno por encontrar.") o deselecciona suavemente los que no corresponden.
- **Pista**: resalta uno de los que faltan.

### 6.9 `contar-por-tipo`: ¿Cuántos hay?

- **Mecánica**: una escena con elementos de 2 a 4 tipos mezclados. Debajo, un contador por tipo con botones grandes de menos y más. Botón "Listo" para verificar.
- **Config**: `tipos` (2 a 4), `maxPorTipo` (hasta 9), `banco` (`mesa`: cubiertos y platos; `frutas`; `figuras`).
- **Niveles**: suave = 2 tipos, hasta 4 de cada uno, agrupados. Medio = 3 tipos, hasta 6, mezclados. Retador = 4 tipos, hasta 9, mezclados y de tamaño variado.
- **Reintento**: señala solo qué tipo revisar ("Revise las cucharas.").
- **Pista**: numera sobre la escena los elementos del tipo señalado.

### 6.10 `orientacion-hoy`: El día de hoy

- **Mecánica**: preguntas de opción múltiple sobre el momento actual, con 3 o 4 opciones en botones grandes. La respuesta correcta se calcula con la fecha y hora del dispositivo.
- **Preguntas disponibles** (`config.preguntas`): día de la semana, mes, año, parte del día (mañana, tarde, noche), época (seca o lluviosa), día anterior y día siguiente.
- **Config**: `preguntas` (lista), `opciones` (3 o 4).
- **Niveles**: suave = día de la semana y parte del día, 3 opciones. Medio = agrega mes y época. Retador = agrega año, ayer y mañana, con distractores cercanos.
- **Zona horaria**: usar siempre `America/Costa_Rica`, no la del navegador.
- **Época**: seca de diciembre a abril y lluviosa de mayo a noviembre, como valor por defecto configurable. Confirmar con la clínica.
- **Pista**: descarta una opción.
- **Tono**: esta actividad es la más sensible. El mensaje de reintento debe ser especialmente suave y nunca sugerir que la persona "debería saberlo".

## 7. Trazabilidad con el catálogo de referencia

Metadatos internos por actividad y su inspiración en el catálogo de NeuronUP. Solo para uso del equipo.

| Tipo | Área | Función principal | Referencia en el catálogo |
|---|---|---|---|
| `clasificar` | Funciones ejecutivas | Razonamiento | Ordena la cocina, Household Objects, Recicla tu basura, Seleccionar elementos de una categoría |
| `pago-exacto` | Funciones ejecutivas | Memoria de trabajo | Pagos exactos, Clasifica el dinero |
| `ordenar-pasos` | Funciones ejecutivas | Planificación | Task Sequencing |
| `ordenar-secuencia` | Funciones ejecutivas | Memoria de trabajo | Sort the Words Alphabetically, Chapas (versión sin movimiento) |
| `formar-palabra` | Lenguaje | Vocabulario | Letras desordenadas, Making Words |
| `parejas` | Memoria | Memoria episódica | Empareja las cartas de póker |
| `recordar-posiciones` | Memoria | Memoria episódica | Illuminated Windows, Post-it ordenados |
| `encontrar-iguales` | Atención | Atención selectiva | Matching Shapes, Hidden Letters |
| `contar-por-tipo` | Atención | Atención selectiva | Contar estímulos por tipo |
| `orientacion-hoy` | Orientación | Orientación temporal | Location in Time |

## 8. Orden de trabajo

1. Paso 0 y resumen (sección 3). Espera confirmación de Rodolfo.
2. Contrato, registro de tipos y piezas compartidas (sección 4), con `ClasificarNumeros` funcionando igual que antes.
3. Editor genérico en `ResourceEditor` con "Probar actividad".
4. `clasificar`, por ser la más cercana a lo que ya existe y la que valida la arquitectura.
5. `ordenar-secuencia` y `ordenar-pasos` (comparten la lógica de ordenar por toques).
6. `encontrar-iguales` y `contar-por-tipo`.
7. `parejas` y `recordar-posiciones` (comparten la fase de memorización).
8. `formar-palabra`.
9. `pago-exacto`.
10. `orientacion-hoy`.

Al terminar cada punto: correr pruebas, verificar los criterios de la sección 5 y reportar en 3 a 5 líneas qué se hizo y qué quedó pendiente.

## 9. Decisiones abiertas

No las resuelvas sin Rodolfo.

1. **Tratamiento**: este documento asume "usted". Confirmar si la app ya usa otro tratamiento y seguir el existente.
2. **Datos para la clínica**: hoy la regla es no guardar nada de desempeño. Si en el futuro se quiere dar a la clínica una señal de uso (por ejemplo, que la actividad se abrió), es una decisión de producto aparte.
3. **Migración de `ClasificarNumeros`** al motor `clasificar`: proponer con pros y contras tras el Paso 0.
4. **Recursos gráficos**: si la librería de íconos no alcanza, definir quién produce las ilustraciones.
5. **Lectura en voz alta** de instrucciones: útil para este público, pero fuera de alcance de la Fase 1.
6. **Denominaciones de colones y definición de épocas**: confirmar con el equipo clínico.
7. **Revisión clínica de bancos de contenido**: quién aprueba y cómo se marca `revisado`.

## 10. Backlog

### Fase 2: requieren audio, ilustraciones o contenido más elaborado

| Idea | Referencia en el catálogo | Qué falta |
|---|---|---|
| Recordar nombres con fotos de la familia | Recuerda los nombres (audio) | Carga de fotos y audio, permisos |
| Vestirse según la ocasión | Get Dressed | Ilustraciones |
| Sonidos de la casa | What's Making Noise in the Kitchen?, Localiza los sonidos | Banco de audio propio |
| Sopa de letras con palabras propias | Word Search | Generador y diseño para pantallas pequeñas |
| Encontrar la palabra por su definición | Encontrar palabra por su definición | Banco de definiciones revisado |
| Palabras relacionadas | Word Association | Banco revisado |
| ¿Qué pasaría si...? | Consequences | Redacción de situaciones |
| Comparar dos textos | Comparación de textos | Diseño de lectura en celular |
| Leer el reloj | Telling the Time | Reloj analógico accesible |
| ¿Cuánto tarda? | Time Estimation | Criterios de respuesta válidos |
| El que no pertenece | Find the Different Picture | Banco gráfico |

### Fuera de alcance

- Actividades basadas en velocidad de reacción o estímulos en movimiento (Chapas, Números inquietos, Para la bola, Separa los bichos, Pick the Flowers): chocan con las reglas 2.2 y 2.3.
- Actividades infantiles del catálogo.
- Fichas pensadas solo para papel.
- Subida y bajada automática de nivel.
