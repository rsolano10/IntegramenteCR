-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.7):
-- «El mandado» (tipo mandado).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-052', 'El mandado', 'Un juego en pantalla: aprender la lista del mandado y, de memoria, buscar en el mercado lo que hay que traer.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden leer o escuchar una lista corta y tocar la pantalla, solas o con compañía.',
  'Primero aparece la lista del mandado en un papelito (y se puede escuchar). Cuando la sepas, tocá «Ya me la aprendí». Después, en los puestos del Mercado Central, tocá lo que había que traer y tocá «Listo».',
  '["Busquen un lugar cómodo y tengan el teléfono o la tablet a mano.", "Lean juntos la lista o toquen «Escuchar la lista».", "Busquen en los puestos lo que hay que traer y toquen «Listo»."]'::jsonb,
  'Para recordar mejor, digan la lista en voz alta o imaginen para qué sirve cada cosa. «Ver una pista» dice con qué letra empieza lo que falta.',
  'La bolsa quedó llena. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "mandado", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 52
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Memoria verbal (lista de compras). Secundaria: atención selectiva.', array['Memoria'],
  'Tarea clásica de lista de compras, en contexto costarricense. Contenido y dibujos propios.',
  'Banco de 25 productos pendiente de revisión (src/lib/actividades/bancos/mandado.ts). Las listas se arman al azar: con voz natural, cada lista distinta se genera una vez y queda guardada (decisión 6.4 abierta).'
from public.media_resources r where r.codigo = 'COG-052'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
