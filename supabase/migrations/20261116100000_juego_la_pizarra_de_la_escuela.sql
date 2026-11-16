-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.8):
-- «La pizarra de la escuela» (tipo pizarra).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-054', 'La pizarra de la escuela', 'Un juego en pantalla: decir todas las palabras de una categoría que se le ocurran, y verlas llenar la pizarra.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden conversar; la persona dice las palabras y alguien de la familia las marca o las escribe.',
  'En el aula de la escuela aparece una consigna, por ejemplo «Frutas». Decí todas las que se te ocurran: cada palabra se marca con tiza en la pizarra o se escribe. No hay tiempo ni palabras malas. Cuando quieras, tocá «Ya terminé».',
  '["Busquen un lugar tranquilo.", "Lean juntos la consigna.", "Digan las palabras en voz alta y márquenlas con «Dijo una palabra», o escríbanlas.", "Cuando quieran, toquen «Ya terminé»."]'::jsonb,
  'Si no salen más, «Ver una pista» propone por dónde seguir (por ejemplo, frutas que se dan en el patio).',
  'Suena la campana de la escuela. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "pizarra", "version": 1, "nivel": "suave", "ejercicios": 3}'::jsonb, 'en_revision', true, 54
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Fluidez verbal semántica y fonológica. Secundarias: memoria semántica y flexibilidad.', array['Lenguaje'],
  'Tarea clásica de fluidez verbal, sin tiempo ni conteo visible. Nada de lo dicho se guarda.',
  'Consignas pendientes de revisión (src/lib/actividades/pizarra.ts). El dictado arranca apagado (decisión 6.2): la clínica puede permitirlo por recurso en Ajustes avanzados.'
from public.media_resources r where r.codigo = 'COG-054'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
