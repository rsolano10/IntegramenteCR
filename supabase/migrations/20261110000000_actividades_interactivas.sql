-- Actividades interactivas de la Fase 1 (business/ACTIVIDADES_INTERACTIVAS.md)
-- como recursos de la Biblioteca, igual que «Clasificar números» (COG-036):
-- se ven y se asignan como cualquier otro recurso. Su configuración vive en
-- extras (modo "interactiva", ver src/lib/actividades/registro.ts); el nivel
-- arranca en «suave» y la clínica lo cambia desde el editor del recurso.
-- Quedan en estado «en_revision» hasta que el equipo clínico revise los
-- bancos de contenido. Área y función (metadato interno) van a
-- media_resources_interno. Idempotente por código.

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-037', 'Cada cosa en su lugar', 'Un juego en pantalla: ubicar cosas de la cocina, de la casa o del reciclaje en el lugar donde van.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen con comodidad y pueden tocar la pantalla, solas o con compañía.', 'En la pantalla aparecen algunas cosas y dos o más lugares, como «Refrigeradora» y «Alacena». Tocá una cosa y después el lugar donde va.', '["Busquen un lugar cómodo, con buena luz, y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna o toquen «Escuchar la consigna».", "Tocá «Empezar»: tocá una cosa y después el lugar donde va. Si no era ahí, la cosa vuelve sola para intentarlo de nuevo."]'::jsonb, 'Si cuesta, conversen sobre dónde guardan esa cosa en su propia casa. Algunas, como el tomate, pueden ir en más de un lugar.', 'Cada cosa quedó en su lugar. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "clasificar-objetos", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 37
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-038', 'En orden', 'Un juego en pantalla: tocar números (o palabras) de menor a mayor.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen números con comodidad y pueden tocar la pantalla.', 'En la pantalla aparecen tarjetas desordenadas. Tocalas en orden, de la más chica a la más grande, y se van acomodando en una fila.', '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar» y tocá las tarjetas en orden. Si una va más adelante, no pasa nada: se queda en su lugar."]'::jsonb, 'Si cuesta, busquen primero la más chica de todas y digan los números en voz alta.', 'Todo quedó en orden. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve'], '{"modo": "interactiva", "tipo": "ordenar-secuencia", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 38
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-039', 'Ordenar los pasos', 'Un juego en pantalla: poner en orden los pasos de una tarea de todos los días, como chorrear café.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen frases cortas con comodidad y pueden tocar la pantalla.', 'En la pantalla aparecen desordenados los pasos de una tarea conocida. Tocalos en el orden en que se hacen y se van numerando.', '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar» y tocá primero lo que se hace primero. Si un paso viene más adelante, se queda en su lugar para después."]'::jsonb, 'Si cuesta, imaginen juntos que están haciendo la tarea y cuenten en voz alta qué hacen primero.', 'Los pasos quedaron en orden. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "ordenar-pasos", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 39
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-040', 'Buscá los iguales', 'Un juego en pantalla: encontrar todas las figuras iguales a un modelo.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden mirar la pantalla con calma y tocarla, solas o con compañía.', 'Arriba hay un modelo. Abajo hay varias figuras: tocá todas las que son iguales al modelo y después «Listo».', '["Busquen un lugar con buena luz y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar», tocá los iguales al modelo y después «Listo». Si alguno no era igual, se desmarca solo."]'::jsonb, 'Si cuesta, recorran las figuras de a una, de izquierda a derecha, comparándolas con el modelo.', 'Encontraste los iguales. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "encontrar-iguales", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 40
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-041', '¿Cuántos hay?', 'Un juego en pantalla: contar cuántas cucharas, platos o vasos hay en la mesa.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que cuentan con comodidad hasta 10 y pueden tocar la pantalla.', 'En la pantalla hay un dibujo con cosas de la mesa. Contá cuántas hay de cada una con los botones − y + y después tocá «Listo».', '["Busquen un lugar con buena luz y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar», contá cada tipo y ajustá el número con − y +. Después tocá «Listo»."]'::jsonb, 'Si cuesta, cuenten de a un tipo por vez y señalen con el dedo cada cosa que cuentan.', 'Contaste todo. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "contar-por-tipo", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 41
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-042', 'Encontrá las parejas', 'Un juego en pantalla: dar vuelta cartas de a dos para encontrar las que son iguales.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden tocar la pantalla, solas o con compañía.', 'Las cartas están boca abajo. Tocá dos para darles vuelta. Si son iguales, quedan a la vista. Si no, tocá «Continuar» y se vuelven a tapar.', '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar» y buscá las parejas. Las cartas no se tapan solas: vos decidís cuándo seguir."]'::jsonb, 'Si cuesta, digan en voz alta qué dibujo vieron y en qué número de carta estaba.', 'Encontraste todas las parejas. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "parejas", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 42
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-043', 'Ventanas encendidas', 'Un juego en pantalla: mirar qué ventanas de una casa tienen luz y después señalarlas.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden mirar la pantalla con calma y tocarla.', 'Una casa tiene algunas ventanas con la luz encendida. Miralas el tiempo que necesités, tocá «Ya lo memoricé» y después tocá las que estaban encendidas.', '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar». No hay apuro: las luces se apagan solo cuando tocás «Ya lo memoricé»."]'::jsonb, 'Si cuesta, describan en voz alta dónde está cada luz: «arriba a la izquierda», «abajo en el medio».', 'Encontraste las ventanas. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve'], '{"modo": "interactiva", "tipo": "recordar-posiciones", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 43
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-044', 'Armá la palabra', 'Un juego en pantalla: ordenar letras sueltas para armar una palabra conocida.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen con comodidad y pueden tocar la pantalla.', 'En la pantalla hay letras desordenadas y casillas vacías. Tocá las letras en orden para armar la palabra. Tocá una casilla llena para devolver la letra.', '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna y la pista, si aparece.", "Tocá «Empezar» y armá la palabra letra por letra."]'::jsonb, 'Si cuesta, lean la pista en voz alta y piensen juntos en palabras que empiecen con la primera letra.', 'Armaste las palabras. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve'], '{"modo": "interactiva", "tipo": "formar-palabra", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 44
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-045', 'Pagar justo', 'Un juego en pantalla: pagar un monto exacto en colones con monedas y billetes.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que manejan dinero con comodidad y pueden tocar la pantalla.', 'En la pantalla aparece un monto, como ₡1 350. Tocá las monedas y los billetes para armarlo y después tocá «Listo». Cualquier forma de llegar al monto vale.', '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar» y armá el pago. Para quitar una moneda o billete, tocalo arriba, en «Lo que vas a pagar»."]'::jsonb, 'Si cuesta, empiecen por la moneda o el billete más grande que quepa en el monto. También pueden usar monedas de verdad sobre la mesa.', 'Pagaste justo. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve'], '{"modo": "interactiva", "tipo": "pago-exacto", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 45
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-046', 'El día de hoy', 'Un juego en pantalla: conversar sobre qué día, mes y parte del día es hoy.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden tocar la pantalla, con compañía si lo prefieren.', 'Aparecen preguntas sobre el día de hoy, como «¿Qué día de la semana es hoy?», con opciones grandes para tocar. Pueden mirar un calendario o un reloj cuando quieran.', '["Busquen un lugar cómodo y tengan cerca un calendario o un reloj.", "Lean juntos la pregunta.", "Tocá la opción que te parezca. Si no era, no pasa nada: miren juntos otra opción."]'::jsonb, 'Si cuesta, miren juntos el calendario o el periódico del día y conversen sobre lo que pasó ayer.', 'Gracias por conversar sobre el día de hoy.',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "orientacion-hoy", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 46
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

-- Metadato interno (solo la clínica): área, función y trazabilidad.
insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, v.objetivo, v.areas, v.fuente, v.pendientes
from (values
  ('COG-037', 'Razonamiento (categorización)', array['Funciones ejecutivas'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Ordena la cocina, Household Objects, Recicla tu basura, Seleccionar elementos de una categoría. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-038', 'Memoria de trabajo', array['Funciones ejecutivas'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Sort the Words Alphabetically, Chapas (versión sin movimiento). Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-039', 'Planificación (secuenciación)', array['Funciones ejecutivas'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Task Sequencing. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-040', 'Atención selectiva', array['Atención'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Matching Shapes, Hidden Letters. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-041', 'Atención selectiva', array['Atención'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Contar estímulos por tipo. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-042', 'Memoria episódica', array['Memoria'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Empareja las cartas de póker. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-043', 'Memoria episódica (visoespacial)', array['Memoria'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Illuminated Windows, Post-it ordenados. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-044', 'Vocabulario', array['Lenguaje'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Letras desordenadas, Making Words. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-045', 'Memoria de trabajo (cálculo)', array['Funciones ejecutivas'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Pagos exactos, Clasifica el dinero. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).'),
  ('COG-046', 'Orientación temporal', array['Orientación'], 'Mecánica clásica de estimulación cognitiva; referencia interna en el catálogo NeuronUP: Location in Time. Contenido y textos propios.', 'Bancos de contenido pendientes de revisión clínica (revisado: false en src/lib/actividades/bancos).')
) as v(codigo, objetivo, areas, fuente, pendientes)
join public.media_resources r on r.codigo = v.codigo
on conflict (resource_id) do update set
  objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente,
  pendientes = excluded.pendientes, updated_at = now();
