-- Fase 3.3: recursos de bienvenida por defecto. Los tres primeros son
-- placeholders hasta tener los videos definitivos (external_url null: la
-- ficha se ve igual que cualquier recurso). La clínica cambia el conjunto
-- desde Plantillas → Bienvenida (tabla recursos_bienvenida).
insert into public.media_resources (codigo, modulo, titulo, tipo, media_kind, duracion, detalle, pasos, por_que, activo, estado_clinico, orden)
values
  ('BIE-001', 'bienvenida', 'Te damos la bienvenida', 'video', null, '3 min',
   'Un saludo del equipo de IntegraMente y qué vas a encontrar en estas primeras semanas.',
   '["Buscá un momento tranquilo.", "Mirá el video de bienvenida.", "Contanos cómo te fue."]'::jsonb,
   'Conocer el programa ayuda a empezar con confianza.', true, 'aprobado', 1),
  ('BIE-002', 'bienvenida', 'Conocé a nuestro equipo', 'video', null, '4 min',
   'Las profesionales y los profesionales que preparan y revisan tu plan.',
   '["Mirá el video de presentación.", "Fijate quién acompaña cada área: cognición, movimiento y nutrición."]'::jsonb,
   'Saber quién está detrás de cada actividad genera confianza.', true, 'aprobado', 2),
  ('BIE-003', 'bienvenida', 'Cómo usar la app', 'actividad', null, '5 min',
   'Un recorrido corto por la app: ver la actividad del día, seguirla paso a paso y registrar cómo te fue.',
   '["Abrí la pestaña Hoy: ahí está la actividad del día.", "Tocá Empezar para seguirla paso a paso.", "Al terminar, contanos cómo te fue con un toque.", "En Mi semana ves todas las actividades."]'::jsonb,
   'Practicar con una actividad real es la forma más fácil de aprender a usar la app.', true, 'aprobado', 3)
on conflict (codigo) do nothing;

insert into public.recursos_bienvenida (media_resource_id, dia_offset, hora, orden)
select id, x.dia, x.hora, x.orden
from (values ('BIE-001', 0, null, 1), ('BIE-003', 0, null, 2), ('BIE-002', 1, null, 1), ('GER-010', 1, null, 2), ('COG-004', 2, null, 1), ('PRE-002', 2, null, 2))
  as x(codigo, dia, hora, orden)
join public.media_resources mr on mr.codigo = x.codigo;
