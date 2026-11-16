-- Fase 2 (business/ACTIVIDADES_FASE_2.md, 3.2): «El corredor» (tipo que-cambio).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-048', 'El corredor', 'Un juego en pantalla: mirar el corredor de una casa y descubrir qué cambió.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden mirar la pantalla con calma y tocarla, solas o con compañía.',
  'En el corredor de una casa de adobe hay una mecedora, macetas, una jaula, un sombrero en un clavo y el gato dormido. Mirá bien y tocá «Ya lo vi». Después algo cambia: desaparece, cambia de color o de lugar. Tocá lo que cambió (también el lugar vacío de lo que desapareció) y «Listo».',
  '["Busquen un lugar con buena luz y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna.", "Tocá «Empezar», mirá el corredor con calma y tocá «Ya lo vi». Después tocá lo que cambió y «Listo»."]'::jsonb,
  'Si cuesta, recorran el corredor de izquierda a derecha y nombren en voz alta cada cosa antes de tocar «Ya lo vi».',
  'El gato se despertó. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "que-cambio", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 48
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Atención selectiva. Secundaria: memoria episódica visual.', array['Atención'],
  'Mecánica clásica de estimulación cognitiva (¿qué cambió?). Dibujos y textos propios.',
  'Revisar con el equipo que los cambios de color sean evidentes para personas con baja visión.'
from public.media_resources r where r.codigo = 'COG-048'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
