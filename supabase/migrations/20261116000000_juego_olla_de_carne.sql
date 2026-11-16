-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.4):
-- «La olla de carne» (tipo intruso). Banco en src/lib/actividades/bancos/intrusos.ts
-- (revisado: false hasta la revisión del equipo).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-047', 'La olla de carne', 'Un juego en pantalla: encontrar, entre las cosas de la mesa, la que no va en la olla.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que leen palabras sueltas con comodidad y pueden tocar la pantalla, solas o con compañía.',
  'En la cocina de leña hierve la olla. Sobre la mesa hay varias cosas: todas van juntas menos una. Tocá la que no va. Si tocás una que sí va, se va a la olla y seguís buscando.',
  '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la consigna o toquen «Escuchar la consigna».", "Tocá «Empezar» y tocá la cosa que no va con las demás."]'::jsonb,
  'Si cuesta, nombren en voz alta cada cosa de la mesa y piensen para qué sirve o de qué color es.',
  'La olla quedó lista. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "intruso", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 47
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Razonamiento (categorías y propiedades). Secundaria: memoria semántica.', array['Funciones ejecutivas'],
  'Mecánica clásica de estimulación cognitiva (el que no pertenece). Contenido y textos propios.',
  'Banco de conjuntos pendiente de revisión clínica (revisado: false en src/lib/actividades/bancos/intrusos.ts). Un conjunto ambiguo sale del banco.'
from public.media_resources r where r.codigo = 'COG-047'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
