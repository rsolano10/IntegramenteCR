-- Fase 2 (business/ACTIVIDADES_FASE_2.md, 3.3): «La carreta por pintar» (tipo pintar-rueda).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-049', 'La carreta por pintar', 'Un juego en pantalla: pintar una rueda de carreta igual a la del modelo.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden mirar la pantalla con calma y tocarla, solas o con compañía.',
  'En el taller de pintura de carretas cuelga una rueda pintada. En el caballete hay otra en blanco. Tocá un bote de pintura y después el sector de la rueda que va de ese color, hasta que quede igual al modelo. Después tocá «Listo».',
  '["Busquen un lugar con buena luz y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar»: elegí un bote y pintá los sectores. Se puede volver a pintar un sector las veces que quieran."]'::jsonb,
  'Si cuesta, empiecen por el sector que está junto a la marca de arriba y sigan en el sentido del reloj, de a uno.',
  'La carreta quedó lista para salir. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "pintar-rueda", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 49
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Praxias visoconstructivas. Secundarias: atención sostenida, relación espacial.', array['Praxias'],
  'Mecánica clásica de estimulación cognitiva (copiar un modelo). Rosetones y textos propios.',
  'Confirmar con el equipo los colores de los botes y si conviene activar el modelo girado en retador.'
from public.media_resources r where r.codigo = 'COG-049'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
