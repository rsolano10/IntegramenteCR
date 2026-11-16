-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.5):
-- «La banca del parque» (tipo dichos). Banco en src/lib/actividades/bancos/dichos.ts
-- (revisado: false hasta la revisión del equipo).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-051', 'La banca del parque', 'Un juego en pantalla: completar dichos y refranes de siempre, o elegir lo que quieren decir.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen frases cortas con comodidad, o que pueden escucharlas, y tocar la pantalla, solas o con compañía.',
  'En la banca del parque, frente a la iglesia, aparece el comienzo de un dicho. Tocá cómo sigue. En el nivel más alto también hay que elegir qué quiere decir.',
  '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos el dicho o toquen «Escuchar el dicho».", "Tocá el final que corresponde."]'::jsonb,
  'Si no sale, digan el dicho en voz alta juntos: muchas veces el final aparece solo. «Ver una pista» quita una opción.',
  'Las campanas de la iglesia suenan. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "dichos", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 51
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Lenguaje y comprensión. Secundarias: memoria semántica y razonamiento (significado).', array['Lenguaje'],
  'Dichos y refranes de dominio popular en Costa Rica; los significados están redactados con palabras propias.',
  'Banco de 22 dichos pendiente de revisión (revisado: false en src/lib/actividades/bancos/dichos.ts). Si el equipo acepta otro final para un dicho, se agrega en «aceptados»: nunca sale como opción junto al principal.'
from public.media_resources r where r.codigo = 'COG-051'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
