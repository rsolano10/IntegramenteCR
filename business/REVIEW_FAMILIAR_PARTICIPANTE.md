# Review del perfil familiar y participante: correcciones

Review del 16 de noviembre de 2026, hecho sobre el commit `b109d8a`. Este documento es la especificación para implementar las correcciones con Claude Code.

**Quién usa estas pantallas.** Un adulto mayor (rol `paciente`, «participante» en la app) o su familiar cuidador (rol `familiar`), muchas veces sin costumbre con la tecnología. Para esa persona, dos pantallas que muestran lo mismo de forma distinta son dos cosas distintas. El criterio de todo el documento es: **una cosa se ve, se llama y se cuenta igual en todas partes.**

**Cómo se revisó.** Lectura del código y capturas reales en 390 px y 1280 px, con una sesión simulada de familiar y de participante cargada con el plan de prueba (semana publicada el 15 de noviembre). Las líneas citadas son las de ese commit y pueden haberse movido: buscá por el texto citado.

No se revisó en pantalla con datos reales: Revisión (`/app/revision`), Resumen (`/app/resumen`), una conversación con Clara, las páginas de `/app/alerta/*` y los modales de bienvenida. Están revisados solo por código.

## Reglas que no se rompen

- Todo el texto en voseo, nunca usted ni tú. Sin rayas largas (—) en textos que ve la familia.
- Sin género asumido: no se sabe si el paciente o el familiar es hombre o mujer.
- La familia y el participante nunca ven puntajes ni semáforos o rutas clínicas.
- Un «No» nunca se muestra como fracaso: nadie tiene que justificar un día difícil.
- No se cambia el contenido clínico de los recursos (`media_resources`) ni los guiones. Lo que haya que acomodar se acomoda al mostrarlo.
- Migraciones solo con `supabase db query --linked -f archivo`. Nunca `supabase db push`.
- Antes de cada commit: `npx tsc -b`, `npx oxlint src` (solo se admite el aviso de `RowMenu.tsx`), `npm test` y `npm run build`. Con todo en verde se hace commit y push a `main` sin consultar.
- Un commit por tanda, con mensaje en español.

## Decisiones de Rodolfo

Las tandas 2 a 5 no dependen de ninguna decisión. Estas cuatro sí: si Rodolfo no indicó otra cosa, se implementa la opción por defecto y se le avisa al entregar.

| # | Decisión | Opción por defecto |
|---|---|---|
| D1 | Qué pasa de verdad cuando el participante toca «Necesito ayuda» y tiene familiar (ver 1.1). | Aviso real dentro de la app para el familiar, texto honesto y botón para llamar. |
| D2 | Acceso a Emergencia. El botón SOS del encabezado se quitó a propósito el 7 de noviembre (commit `7006818`): hoy solo se llega desde Clara y desde «Parar» en una actividad. | **No se vuelve a poner.** Solo se corrige la pantalla (ver 1.2). Si Rodolfo quiere un acceso visible, la propuesta es un enlace discreto «¿Es una urgencia?» en la pestaña Ayuda. |
| D3 | Qué cuenta el anillo de avance (ver 2.2). | Cuenta las hechas (`realizado` + `parcial`), igual en Hoy y en Mi semana. |
| D4 | Las actividades están escritas para el cuidador («Preguntale», «Dale tiempo») y el participante las lee tal cual (ver 5.1). | En el tablero del participante se muestran los títulos de los pasos sin la descripción dirigida al cuidador. Reescribir guiones queda fuera. |

Falta además un dato: el teléfono de CONAPAM (ver 1.2). No se inventa.

---

## Tanda 1. Seguridad y confianza

### 1.1 «Necesito ayuda» del participante no avisa a nadie

- **Qué pasa.** En [src/pages/participante/Ayuda.tsx](../src/pages/participante/Ayuda.tsx), «Sí, continuar» solo hace `setConfirmed(true)`. Si hay familiar vinculado, la pantalla dice «Ya le avisamos a tu familiar. Esperá tranquilo. No hace falta hacer nada más». No hay ninguna llamada al servidor: nadie se entera.
- **Qué hacer (D1, opción por defecto).**
  1. Guardar el pedido: tabla nueva `pedidos_ayuda` (`id`, `patient_id`, `creado_por`, `created_at`, `visto_at`, `nota` opcional con el borrador que llega de «No pude») y una función `pedir_ayuda(p_nota text)` `security definer` que resuelve el paciente desde `auth.uid()`, igual que `enviar_alerta_riesgo` en `supabase/migrations/20261008040000_alertas_riesgo.sql`. Si ya hay un pedido sin ver de los últimos 30 minutos, se reutiliza. RLS: lo leen el familiar vinculado y los profesionales.
  2. El familiar lo ve al abrir la app: aviso arriba de Hoy, «Rosa pidió ayuda hoy a las 10:15», con un botón «Ya lo vi» que marca `visto_at`. La clínica lo ve en la ficha del paciente.
  3. La pantalla del participante dice la verdad. Sugerido: «Le dejamos el aviso a tu familiar» y «Lo va a ver cuando abra la app. Si necesitás ayuda ya, llamá.», con un botón grande «Llamar a {nombre}» (`tel:`) si el familiar tiene teléfono, y siempre el 9-1-1 a la vista. El nombre y el teléfono del familiar llegan por una función `security definer` que devuelve solo esos dos datos.
  4. Si falla la llamada al servidor, no se muestra la pantalla de confirmación: se muestra el error y el botón de llamar.
- **No hacer.** No conectar WhatsApp acá: las notificaciones por WhatsApp siguen bloqueadas por el token de Meta. Dejar un comentario en el punto donde se va a enviar.
- **Listo cuando.** El pedido queda en la base, el familiar lo ve en Hoy, y ningún texto promete un aviso que no ocurrió.

### 1.2 Pantalla de Emergencia

Archivo: [src/pages/familiar/Emergencia.tsx](../src/pages/familiar/Emergencia.tsx). Datos: `emergencyContacts` en [src/lib/mockData.ts](../src/lib/mockData.ts).

- **Teléfonos que no se pueden tocar.** Solo el botón del 9-1-1 llama. Agregar un campo `tel` a cada contacto y mostrar cada tarjeta como enlace `tel:` con el número grande. El 1322 pasa a ser tocable.
- **CONAPAM no tiene número.** Muestra «Línea de denuncia y orientación» sin teléfono. Hasta que Rodolfo pase el número verificado, la tarjeta se quita.
- **Género asumido.** «No la encuentro / salió sola» y «De parte de otra persona que la cuida». Sugerido: «No aparece / salió sin avisar» y «De parte de alguien que le cuida». Revisar con el mismo criterio las páginas de [src/pages/alertas/](../src/pages/alertas/).
- **Márgenes dobles.** La página trae su propio `max-w-[680px] px-5 py-10` dentro de `FamiliarShell`, que ya pone márgenes: el contenido queda más angosto y «Volver» desalineado respecto del resto de la app. Quitar el envoltorio propio.
- **Aviso comercial arriba de la emergencia.** Ver 1.3.

### 1.3 El aviso «Semana gratis: activá tu programa» sale donde no debe

Componente: `AvisoEstadoCuenta` en [src/components/layout/EstadoCuentaAviso.tsx](../src/components/layout/EstadoCuentaAviso.tsx). Lo montan `FamiliarShell` (línea 183) y `ParticipantShell` (línea 266) en todas las rutas.

- **Participante.** Hoy el adulto mayor ve «Activar mi programa» en todas sus pantallas, incluida la de pedir ayuda. Quitar `AvisoEstadoCuenta` de `ParticipantShell`. Se conserva `CuentaRechazada`, que es la única que bloquea.
- **Familiar.** Mostrarlo solo en `/app/hoy` y `/app/plan`. Nunca en Emergencia, en el detalle de una actividad, en Revisión, Resumen ni Historial.

---

## Tanda 2. Una actividad se ve, se llama y se cuenta igual

### 2.1 Un solo vocabulario de estados

Hoy el mismo estado tiene cinco nombres:

| Dónde | `realizado` | `parcial` | `no` |
|---|---|---|---|
| Cierre de la sesión (`Escenas.tsx`) | Sí | En parte | No |
| Hoy, familiar (`HoyDelDia.tsx:40`) | Realizada | En parte | No se realizó |
| Hoy, participante (`HoyDelDia.tsx:41`) | Hecho | Con ayuda | No pude |
| Mi semana (`Plan.tsx:30`) | Hecha | En parte | No se hizo |
| Detalle (`PanelActividad.tsx:27`) | Realizada | Hecha en parte | No se realizó |

«Con ayuda» además es incorrecto: `parcial` significa que se hizo en parte, no que hubo ayuda. Pasa lo mismo en [src/pages/familiar/Resumen.tsx](../src/pages/familiar/Resumen.tsx) (líneas 110 y 196).

- **Qué hacer.** Un módulo nuevo `src/lib/estadoActividad.ts` con las etiquetas y los colores del chip, usado por las cuatro pantallas y por Resumen. Etiquetas: **Hecha / En parte / No se hizo**, que son las que ya usa la clínica en `src/lib/seguimiento.ts`. El participante usa las mismas. Las preguntas del cierre («Sí / En parte / No») no cambian: son respuestas, no estados.
- **Listo cuando.** `grep -rn "Realizada\|No se realizó\|Con ayuda\|No pude\|Hecha en parte" src/pages/familiar src/pages/participante src/components/hoy src/components/actividad` no devuelve etiquetas de estado.

### 2.2 Un solo conteo (D3)

- **Qué pasa.** En Hoy, el anillo cuenta como registrada una actividad marcada «No» (`estaRegistrada` en `src/lib/hoyDelDia.ts`). En Mi semana, `registradas` cuenta solo `realizado` y `parcial` ([Plan.tsx:149](../src/pages/familiar/Plan.tsx)). Con una actividad en «No», Hoy dice «2 de 2» y Mi semana suma 1.
- **Qué hacer.** El anillo cuenta las hechas (`realizado` + `parcial`) en Hoy, Mi semana, semanas anteriores y Resumen. El mensaje del día se decide aparte, por lo que queda pendiente:
  - Sin pendientes y todas hechas: «¡Día completo!».
  - Sin pendientes pero con alguna en «No»: «Listo por hoy», sin tono de fracaso.
- Revisar que `useSemanasAnteriores` y `FilaSemana` cuenten igual. Una sola función de conteo en `src/lib/`, con pruebas.

### 2.3 Una sola caja de avance

- **Qué pasa.** Hoy usa `ResumenDelDia` ([HoyDelDia.tsx:92](../src/components/hoy/HoyDelDia.tsx)): caja verde en degradado, anillo a la izquierda, trazo mostaza `#f4d096`. Mi semana usa `EstaSemana` ([Plan.tsx:146](../src/pages/familiar/Plan.tsx)): caja blanca, anillo a la derecha, trazo verde `#6a969c`. El historial usa un anillo chico propio y Resumen uno centrado.
- **Qué hacer.** Un componente compartido (por ejemplo `src/components/ui/CajaAvance.tsx`) con el diseño de Hoy: caja verde, anillo a la izquierda con trazo mostaza, número y «de N» adentro, título y detalle a la derecha. Lo usan Hoy y Mi semana. En Mi semana el título es el rango de fechas y el detalle «9 actividades · 5 días». El anillo chico de `FilaSemana` y el de Resumen usan los mismos colores.

### 2.4 Una sola tarjeta de actividad, con el mismo icono adentro y afuera

- **Qué pasa.**
  - Hoy usa `TarjetaTarea` y Mi semana usa `WeekTaskCard`: distinta tipografía, posición de la hora y etiquetas.
  - Las dos listas muestran el icono del módulo (`ModuloIcon`, un bombillo). El detalle muestra el de la actividad: `guion.icono`, la portada del juego o, si no hay, el del módulo ([PanelActividad.tsx:115-124](../src/components/actividad/PanelActividad.tsx)).
  - El módulo se esconde en celular en la lista de Hoy (`hidden sm:inline`, [HoyDelDia.tsx:201](../src/components/hoy/HoyDelDia.tsx)), pero la tarjeta «Próxima» sí lo muestra. Resultado: una actividad dice «Atención y memoria» y la de al lado no dice nada.
- **Qué hacer.**
  1. Extraer de `PanelActividad` un componente `IconoActividad` (guion, luego juego, luego módulo) y usarlo en la lista de Hoy, en Mi semana, en el detalle y en la portada de la sesión.
  2. Un solo componente `TarjetaActividad` para Hoy y Mi semana: icono de la actividad, hora, título, una línea «Módulo · duración» siempre visible, y el chip de estado de 2.1. En Mi semana se mantiene la columna de días a la izquierda.
  3. La tarjeta no muestra el párrafo de `task.detalle` (hoy aparece en la tarjeta destacada, con emojis). Esa descripción vive en el detalle.
- **Listo cuando.** En 390 px, la misma actividad muestra el mismo icono, el mismo módulo y el mismo estado en Hoy, Mi semana y el detalle, y ningún título se parte en tres líneas por culpa del chip.

### 2.5 Duración corta y pareja

- **Qué pasa.** Los datos traen «10-15 min», «De 3 a 8 minutos.», «5–10 minutos, ajustables al interés y tolerancia.» o nada. La larga rompe la tarjeta en celular: la hora se parte en dos líneas.
- **Qué hacer.** Una función `duracionCorta(texto)` en `src/lib/` que toma los números y devuelve «5 a 10 min» (o «10 min» si hay uno solo, o nada si no hay números), usada en las tarjetas y en «Próxima». No se tocan los datos. Con pruebas para los cuatro casos. La hora lleva `whitespace-nowrap`.

### 2.6 La próxima actividad aparece dos veces y «Empezar» se salta el tablero

- **Qué pasa.** Con actividades pendientes, Hoy muestra la tarjeta «Próxima» ([HoyDelDia.tsx:128](../src/components/hoy/HoyDelDia.tsx)) y la misma actividad otra vez, destacada, en la lista de abajo. «Empezar» en «Próxima» va directo a `/pasos` (línea 155), mientras que tocar una tarjeta abre el tablero. El tablero antes de empezar fue una decisión explícita (commit `84e19a9`).
- **Qué hacer.** Una sola lista. La próxima queda destacada en su lugar, con la etiqueta «Próxima» y un botón «Ver actividad» que abre el tablero, igual que el resto. Se elimina la tarjeta «Próxima» separada. Vale para familiar y participante.

### 2.7 Gramática del cierre del día

- **Qué pasa.** [HoyDelDia.tsx:285-286](../src/components/hoy/HoyDelDia.tsx): «Mañana hay 1 actividad nuevas» y «Mañana les esperan 1 actividad nuevas». Al participante además se le habla en plural («les»).
- **Qué hacer.** Concordar número en verbo, sustantivo y adjetivo, y persona según el rol:
  - Familiar: «Mañana les espera 1 actividad nueva» / «Mañana les esperan 3 actividades nuevas».
  - Participante: «Mañana te espera 1 actividad nueva» / «Mañana te esperan 3 actividades nuevas».
  - Variante de día completo: «A descansar. Mañana hay 1 actividad nueva» / «…hay 3 actividades nuevas».
- Con pruebas para 1 y para varias. `cuandoEsElDia` de `planWeek.ts` sigue decidiendo el «Mañana» o el día con fecha.

---

## Tanda 3. Textos

| Dónde | Hoy dice | Corrección |
|---|---|---|
| [src/lib/tourSteps.ts](../src/lib/tourSteps.ts), familiar | «¡Bienvenida a IntegraMente en Casa!» | «Te damos la bienvenida a IntegraMente en Casa» |
| `tourSteps.ts`, familiar, paso Hoy | «Tocá una para verla paso a paso y marcala como realizada cuando la terminen juntos.» | Ya no se marca a mano. «Tocá una para ver de qué se trata y empezarla. Al terminar, la app les pregunta cómo les fue.» |
| `tourSteps.ts`, participante | «¡Bienvenido…!», «Hoy toca», «Cuando termines, marcala como realizada» | Sin género y con el flujo actual. El título del paso es «Hoy». |
| `tourSteps.ts`, familiar y participante | Rayas largas (líneas 6 y 33) | Punto o coma. Los pasos del profesional no se tocan. |
| [FamiliarShell.tsx:71](../src/components/layout/FamiliarShell.tsx) | «…por ahora — te avisamos…» | «…por ahora. Te avisamos…» |
| [Plan.tsx:342](../src/pages/familiar/Plan.tsx) | «Elegidas según el perfil — para los días…» | Sin raya. |
| `participante/Ayuda.tsx` | «Esperá tranquilo.» | Se reemplaza en 1.1. |
| `Resumen.tsx:18` | «Más bajo» | Revisión responde «Mejor / Igual / Peor». Usar las mismas palabras o una versión amable pareja en las dos pantallas. |
| `AppHeader.tsx` y `ParticipantShell.tsx` | «Calendario en tu teléfono» y «Avisos en tu teléfono» | Es la misma función: un solo nombre, «Avisos en tu teléfono». |

Al terminar, buscar rayas largas en textos visibles: `grep -rn "—" src/pages/familiar src/pages/participante src/components/hoy src/components/familiar src/components/layout/FamiliarShell.tsx` (los comentarios de código no cuentan).

---

## Tanda 4. Legibilidad

### 4.1 Encabezado más corto fuera de las pestañas

- **Qué pasa.** En un celular de 800 px de alto, el logo, «Hola, Ana» y el aviso de cuenta ocupan unos 370 px en todas las pantallas, también en el detalle de una actividad, donde lo que importa queda abajo.
- **Qué hacer.** En `FamiliarShell` y `ParticipantShell`, el bloque de fecha y saludo se muestra solo en las pantallas de pestaña (`/app/hoy`, `/app/plan`, `/app/ayuda`, `/app/participante/hoy`). En las demás (actividad, Revisión, Resumen, Historial, Emergencia, ayuda del participante) queda solo la barra del logo y el botón «Volver». El aviso de cuenta ya se limita en 1.3.

### 4.2 Contraste del texto gris

- **Qué pasa.** `--color-tinta-tenue: #7a8b8e` ([src/index.css:23](../src/index.css)) da 3,2:1 sobre el fondo crema y 3,6:1 sobre blanco. Lo mínimo para texto de lectura es 4,5:1. Se usa en duraciones, ayudas y etiquetas.
- **Qué hacer.** Cambiar el valor a `#5e6f72` (4,8:1 sobre crema y 5,3:1 sobre blanco). La variable es global, así que también cambia en la clínica: revisar dos o tres pantallas clínicas para confirmar que nada se ve pesado.

### 4.3 Tamaño mínimo de letra

- **Qué pasa.** En las pantallas de familia y participante hay unas 60 etiquetas entre 10,5 y 13 px: pestañas de abajo (12 px), «de 2» dentro del anillo, «ESTA SEMANA», «hechas», módulo en mayúsculas, chips de estado.
- **Qué hacer.** En `src/pages/familiar`, `src/pages/participante`, `src/components/hoy`, `src/components/actividad`, `src/components/familiar`, `src/components/sesion` y las dos barras de navegación: nada informativo por debajo de 14 px, y 13 px solo para etiquetas en mayúsculas con espaciado. En el tamaño `large` del participante, mínimo 16 px.

### 4.4 Botón principal de un solo color

- **Qué pasa.** El botón principal es verde en el tablero («Empezar»), verde profundo en el aviso de cuenta, y casi negro (`bg-tinta`) en «Evaluar la semana» y dentro de la sesión (`SesionGuiada.tsx:294`, `Pie` en `Escenas.tsx`). La sesión además alterna «Seguir» (`Escenas.tsx:201`) y «Siguiente».
- **Qué hacer.** `bg-verde-profundo` con texto blanco para toda acción principal de familia y participante, incluida la sesión. Dentro de la sesión, siempre «Siguiente». El estado «todavía no marcaste todo» de la escena de preparar puede seguir en tono suave, pero con la misma palabra.

### 4.5 Cierre de la sesión

Archivo: [src/components/sesion/Escenas.tsx](../src/components/sesion/Escenas.tsx).

- **«¡Lo lograron!» sale antes de la pregunta** (línea 1290). Si responden «No», el festejo contradice la respuesta. Antes de responder, un título neutro («Llegaron al final»). El festejo se muestra al guardar, y solo si la respuesta fue «Sí» o «En parte».
- **«Guardar y terminar» aparece gris sin explicación** (línea 1360). Mientras falte la primera respuesta, mostrar debajo: «Elegí una respuesta para guardar».

### 4.6 Pantallas en blanco mientras cargan

- **Qué pasa.** Hoy, Actividad y Ayuda devuelven `<div className="flex-1" />` mientras cargan (por ejemplo `familiar/Hoy.tsx:20`, `participante/Hoy.tsx:19`, `familiar/Actividad.tsx:25`). Con mala conexión parece que la app se trabó.
- **Qué hacer.** Un componente `Cargando` con `role="status"`, un texto «Cargando…» y siluetas suaves de la caja de avance y dos tarjetas. Aparece recién a los 300 ms para que no parpadee.

---

## Tanda 5. Flujos

### 5.1 El participante lee instrucciones escritas para el cuidador (D4)

- **Qué pasa.** [src/pages/participante/Actividad.tsx](../src/pages/participante/Actividad.tsx) muestra el mismo `PanelActividad` que el familiar. Los pasos dicen «Preguntale», «Dale tiempo», «Si necesita ayuda, ofrecé las dos de la columna de apoyo».
- **Qué hacer (opción por defecto).** Con `large`, la línea de tiempo «Así va a ser» muestra el título de cada paso sin la descripción. No se reescriben guiones. Si Rodolfo quiere textos propios para el participante, es un trabajo de contenido aparte.

### 5.2 «Semana completa» se pide de tres formas

- **Qué pasa.** El pedido de evaluar la semana aparece en Hoy (`familiar/Hoy.tsx:36`, `participante/Hoy.tsx:35`), en `PendienteRevision` de `FamiliarShell` y en `NuevaSemanaModal`, con textos y estilos distintos.
- **Qué hacer.** Un solo texto y un solo componente para el aviso («¡Semana completa!», «Contanos cómo estuvo», botón «Evaluar la semana»), reutilizado en los tres lugares. No deben verse dos a la vez en la misma pantalla.

### 5.3 «Actividades sugeridas» abre la ficha vieja

- **Qué pasa.** `MasActividades` en [Plan.tsx:264](../src/pages/familiar/Plan.tsx) abre el recurso en un modal con `ResourceDetailView` (línea 390), no con el tablero ni la sesión guiada. Es otra experiencia para el mismo tipo de contenido.
- **Qué hacer.** Abrir el recurso en una ruta propia que use `PanelActividad` y la sesión guiada en modo práctica, sin registro, igual que «Hacerla sin registrar».

---

## Fuera de alcance, para más adelante

- **Vista de semana para el participante.** Hoy solo ve el día y no puede abrir actividades de otros días.
- **Dos actividades a la misma hora.** En el plan de prueba hay dos el miércoles a las 3:00 p.m. Convendría que el planificador de la clínica lo avise.
- **Pantallas no vistas con datos reales.** Revisión, Resumen, Clara, alertas y modales de bienvenida merecen una pasada visual con el mismo criterio.

---

## Cómo verificar

1. **Checks.** Los cuatro de «Reglas que no se rompen», en verde antes de cada commit.
2. **Pruebas nuevas** (`npm test`, archivos `*.test.ts` junto al código): etiquetas de estado, conteo de hechas, `duracionCorta`, y singular y plural del cierre del día.
3. **Capturas.** Cada tanda se mira en 390 × 800 y en 1280 × 800, como familiar y como participante, en tres estados del día: con pendientes, día completo y semana completa. El método usado en el review fue Chrome sin ventana manejado por CDP contra `npx vite --port 4197`, interceptando las llamadas a Supabase (`Fetch.enable`) para simular la sesión y devolver un plan fijo; no escribe nada en producción. Los scripts quedaron en una carpeta temporal de esa sesión y puede que ya no existan: si hacen falta, se rearman con ese esquema.
4. **Recorrido final como usuario.** Hoy, abrir una actividad, hacerla hasta guardar, volver a Hoy, pasar a Mi semana: el icono, el nombre del estado y el número del anillo tienen que coincidir en cada paso.
