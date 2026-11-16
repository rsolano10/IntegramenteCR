-- Fase 2 (business/ACTIVIDADES_FASE_2.md, 3.1): «Las señas» (tipo senas).
-- Pueblo genérico (decisión abierta 6.5); señas generadas, siempre dentro del mapa.
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-050', 'Las señas', 'Un juego en pantalla: seguir una dirección al estilo tico en el mapa del pueblo y tocar la casa a la que se llega.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen frases cortas con comodidad y pueden tocar la pantalla, solas o con compañía.',
  'Arriba aparece una seña, como «De la iglesia, 200 metros al sur y 100 al este. Casa verde de corredor». Abajo está el pueblo visto desde arriba, con el norte arriba. Cada cuadra son 100 metros. Seguí la seña con la mirada (o con el dedo) y tocá la casa a la que se llega.',
  '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la seña o toquen «Escuchar la consigna».", "Busquen el punto de partida, cuenten las cuadras y tocá la casa."]'::jsonb,
  'Si cuesta, pongan el dedo en el punto de partida y muévanlo cuadra por cuadra mientras leen la seña en voz alta.',
  'Llegaste a todas las casas. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve'], '{"modo": "interactiva", "tipo": "senas", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 50
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Orientación espacial. Secundarias: memoria de trabajo, comprensión.', array['Orientación'],
  'Mecánica clásica de estimulación cognitiva (seguir indicaciones en un mapa), con señas al estilo costarricense. Mapa y textos propios.',
  'Decisión abierta: pueblo genérico o un mapa reconocible (Cartago o el barrio de la clínica). Revisar la redacción de las señas con el equipo.'
from public.media_resources r where r.codigo = 'COG-050'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
