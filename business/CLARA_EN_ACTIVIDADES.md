# Clara dentro de las actividades

Definición e implementación, 16 de noviembre de 2026. Base de conocimiento: [CLARA_BASE_ACTIVIDADES.md](CLARA_BASE_ACTIVIDADES.md).

## Qué resuelve

Hasta ahora Clara vivía solo en la pestaña Ayuda y sabía de la app, no de las actividades. Si una familia se trababa en un paso («no entiende qué tiene que hacer», «no quiere seguir»), tenía que salir de la actividad, explicar todo desde cero o escribir al equipo.

Ahora Clara está **dentro de cada actividad** y sabe **en qué actividad y en qué pantalla** está la persona. La pregunta se responde sobre ese paso concreto, con la ayuda validada por el equipo.

## Dónde aparece

| Lugar | Cómo se ve | Para qué |
|---|---|---|
| **Tablero de la actividad** (antes de empezar), debajo de «Empezar» | Tarjeta «Preguntale a Clara»: tres preguntas sugeridas y un campo para escribir | Dudas antes de arrancar: qué preparar, cómo adaptarla, para qué sirve |
| **Sesión guiada**, botón **Ayuda** de cada paso | Arriba de la hoja de ayuda, la misma tarjeta; debajo, la pista y los consejos de siempre | Dudas en el momento: «no entendemos este paso», «¿cómo lo hago más fácil?», «no quiere seguir» |

Se eligió el botón **Ayuda** que ya existe en lugar de un botón flotante: para un adulto mayor, un botón más que tapa contenido confunde, y «Ayuda» es donde ya buscan cuando se traban. El botón **Ayuda** ahora está siempre (antes solo aparecía si la actividad tenía consejos).

Funciona para la familia y para el participante. Al participante, Clara le habla con frases cortas y, ante una urgencia, le muestra «Necesito ayuda» en lugar de la guía de emergencia de la familia.

## Cómo funciona

1. La tarjeta es liviana. El chat y el SDK de ElevenLabs se cargan recién con la primera pregunta.
2. Se abre una sesión de texto con el **mismo agente de Ayuda** (`agent_6101m6vtn05pf4mtqvys2jnavkt4`), con las mismas variables dinámicas y la misma memoria por usuario (`clara-session`). Solo se usa el agentId; nunca una API key en el navegador.
3. Antes de cada pregunta, la app manda el **contexto de la actividad** con `sendContextualUpdate`, y lo vuelve a mandar si cambió. El saludo del agente no se muestra: la pregunta ya está en pantalla.
4. La respuesta llega en vivo. Si no conecta en 12 segundos, o no responde en 20, se dice con honestidad y se ofrece WhatsApp (familia) o «Necesito ayuda» (participante).
5. Al cerrar la hoja de ayuda, la conversación se corta. Si se abre de nuevo en otro paso, empieza una conversación nueva con el contexto nuevo.

### Qué contexto recibe Clara

Se arma en `src/lib/claraActividad.ts` (`contextoParaClara`):

- **Quién pregunta:** el familiar que acompaña (con el nombre del paciente) o la persona participante.
- **Actividad:** título, código y categoría; de qué se trata; por qué sirve. Si es una actividad extra, que no se registra.
- **Dónde está:** en la sesión, «pantalla 3 de 7» y lo que esa pantalla muestra (la consigna, la frase para decir, las opciones y lo que ya eligieron). En el tablero, cómo va a ser, paso a paso.
- **Ayuda validada:** para tener a mano, consejos del guion, el bloque «Si necesita ayuda» de la ficha y la adaptación para esta persona, sin el nombre de su etapa.
- **Lo del equipo:** la indicación individual (dosis), el mensaje para esa actividad y las precauciones.
- **Reglas:** responder corto sobre ese paso; no cambiar lo indicado por el equipo; no nombrar etapas, diagnósticos ni puntajes; ante señales de alarma, parar o llamar al 9-1-1.

Nunca se manda lo interno del equipo (`media_resources_interno`), la «adaptación» vieja por semáforos, los semáforos ni las rutas.

### Seguridad

- Las urgencias se detectan en la app, sin IA (`detectarRiesgo`), antes de que responda Clara. Se muestra la guía de emergencia (familia) o «Necesito ayuda» (participante).
- Las herramientas del agente funcionan igual que en Ayuda: `derivar_whatsapp` (solo familia) y `mostrar_emergencia`. `ir_a` responde que dentro de una actividad no se cambia de pantalla.
- Debajo del chat se lee: «Clara es una IA y puede equivocarse. Ante una urgencia, llamá al 9-1-1».

## Lo que tenés que hacer en ElevenLabs (una vez)

1. **Subir la base de conocimiento.** En el agente, Knowledge Base, subí `business/CLARA_BASE_ACTIVIDADES.md` (unos 300 kB). Activá RAG si el agente lo ofrece: la base es grande y conviene que Clara busque solo la ficha que necesita. Volvé a subir también `business/knowledge-base-agente.md`, que cambió el nombre de «Avisos en tu teléfono».
2. **Sumar esto al prompt del agente**, al final:

   > **Dentro de una actividad.** A veces la app te manda un mensaje de contexto que empieza con «[Contexto de la app para Clara…]». Te dice en qué actividad y en qué pantalla está la persona, quién pregunta y la ayuda validada por el equipo. Cuando lo tengas, respondé sobre esa actividad y ese paso, en 2 a 4 frases concretas, usando primero esa ayuda y después la base de conocimiento de actividades. No repitas el contexto textual. No cambies la dosis, las repeticiones, el nivel ni el ejercicio que indicó el equipo: si lo piden, sugerí consultarlo con el equipo por WhatsApp. No nombres etapas, diagnósticos ni puntajes. Si quien pregunta es la persona participante, usá frases cortas, una idea por vez. Ante dolor, mareo, falta de aire, caída o malestar, indicá parar y, si es urgente, llamar al 9-1-1.

3. Nada más: el agentId, las variables dinámicas y las herramientas son los mismos que ya usa Ayuda.

## Cómo mantener la base al día

La base se genera con un script a partir de los guiones (código) y de los campos públicos de cada recurso (base de datos). Cuando cambien recursos o guiones:

1. Exportar los recursos con la consulta del encabezado de `scripts/clara/generar-base.ts` (`supabase db query --linked`), a un JSON.
2. `npx tsx scripts/clara/generar-base.ts recursos.json business/CLARA_BASE_ACTIVIDADES.md`
3. Volver a subir el archivo a ElevenLabs.

## Archivos

| Pieza | Archivo |
|---|---|
| Contexto y descripción de cada pantalla | `src/lib/claraActividad.ts` (pruebas en `claraActividad.test.ts`) |
| Tarjeta liviana «Preguntale a Clara» | `src/components/clara/ClaraActividad.tsx` |
| Chat (se carga a pedido) | `src/components/clara/ChatClaraActividad.tsx` |
| En el tablero | `src/components/actividad/PanelActividad.tsx` |
| En la sesión guiada | `src/components/sesion/SesionGuiada.tsx` (hoja «Ayuda») |
| Generador de la base | `scripts/clara/generar-base.ts` |

## Pendiente y próximos pasos

- **Voz:** por ahora, dentro de la actividad Clara es solo texto. Hablarle con la voz (como en Ayuda) sería el siguiente paso natural para el participante.
- **Actividades sin guion:** los juegos y las actividades sin sesión guiada tienen a Clara en el tablero, pero no en cada pantalla del juego.
- **Medición:** contar cuántas veces se abre Clara por actividad y por paso (hoy se cuentan las aperturas de «Ayuda») para encontrar los pasos que más confunden y mejorar sus guiones.
