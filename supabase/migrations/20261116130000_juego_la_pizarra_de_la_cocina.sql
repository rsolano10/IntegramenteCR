-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.9):
-- «La pizarra de la cocina» (tipo agenda).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-056', 'La pizarra de la cocina', 'Un juego en pantalla: organizar las tareas de un día en la pizarra de la cocina, respetando las horas fijas y lo que va antes de qué.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen frases cortas y pueden pensar el orden de su día, solas o con compañía.',
  'En el tablero de la cocina están las tareas del día. Tocá una tarea y después la franja donde la harías. Algunas tienen hora fija y hay reglas a la vista («el café se chorrea antes de desayunar»). Cuando todo esté en su lugar, tocá «Listo». Cualquier organización que cumpla las reglas vale.',
  '["Busquen un lugar cómodo y lean juntos las reglas del tablero.", "Toquen una tarea y después la franja donde la harían.", "Cuando esté todo, toquen «Listo»."]'::jsonb,
  'Empiecen por las tareas con hora fija. «Ver una pista» pone una de ellas en su hora o marca la regla que falta cumplir.',
  'El almanaque pasa al día siguiente. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "agenda", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 56
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Planificación con reglas (actividades instrumentales de la vida diaria). Secundaria: estimación temporal.', array['Funciones ejecutivas'],
  'Días de la vida cotidiana en Costa Rica escritos para la app, sin medicamentos ni datos de salud. Siempre hay más de una solución válida.',
  'Banco de 4 días pendiente de revisión (src/lib/actividades/bancos/agenda.ts, revisado: false). Cada día armado se verifica con un buscador de soluciones antes de mostrarse.'
from public.media_resources r where r.codigo = 'COG-056'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
