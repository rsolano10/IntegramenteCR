-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.10):
-- «El corral» (tipo corral).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-055', 'El corral', 'Un juego en pantalla: acomodar los animales de la finca en dos corrales, siguiendo la regla del rótulo, que cambia de vez en cuando.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden distinguir animales y colores y tocar la pantalla, solas o con compañía.',
  'En la finca hay dos corrales. El rótulo de arriba dice cómo se acomodan los animales: por animal, por color o por tamaño. Tocá el portón que le toca al primero de la fila. Cuando el rótulo cambie, seguí la regla nueva.',
  '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos el rótulo y lo que dice cada portón.", "Toquen el portón que le toca a cada animal. Si el rótulo cambia, sigan la regla nueva."]'::jsonb,
  'Antes de tocar, lean juntos el rótulo y el portón. «Ver una pista» marca el rótulo y lo lee en voz alta.',
  'Los portones se cierran y todos los animales quedan en su corral. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "corral", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 55
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Flexibilidad cognitiva (cambio de regla). Secundarias: inhibición y atención alternante.', array['Funciones ejecutivas'],
  'Mecánica de clasificación con cambio de criterio, con la regla siempre a la vista (no se adivina). Dibujos y contenido propios.',
  'Sin banco de contenido: los animales se arman al azar. En el retador el cambio solo se ve en el rótulo (sin mensaje ni voz).'
from public.media_resources r where r.codigo = 'COG-055'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
