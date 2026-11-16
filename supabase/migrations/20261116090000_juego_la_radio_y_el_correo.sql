-- Fase 2 de «Un día en el pueblo» (business/ACTIVIDADES_FASE_2.md, 3.6):
-- «La radio y El correo» (tipo comprension).
insert into public.media_resources (
  codigo, titulo, detalle, modulo, tipo, duracion, duracion_min, duracion_max, frecuencia,
  perfil, actividad, pasos, ayuda, para_cerrar, niveles_cognitivos, extras, estado_clinico, activo, orden
) values (
  'COG-053', 'La radio y El correo', 'Un juego en pantalla: escuchar un aviso de la radio del pueblo o leer una carta de la familia, y responder unas preguntas.', 'cognicion', 'actividad', 'De 5 a 10 minutos.', 5, 10, 'De 2 a 3 veces por semana.',
  'Personas que pueden escuchar o leer textos cortos y tocar la pantalla, solas o con compañía.',
  'En la repisa está la radio del pueblo: tocá «Escuchar el aviso» (también se puede leer escrito). En el correo llegó una carta: abrila y leela, o tocá «Leerla en voz alta». Después respondé las preguntas tocando la respuesta.',
  '["Busquen un lugar tranquilo, con el volumen a gusto.", "Escuchen el aviso o lean la carta juntos.", "Toquen «Ya lo escuché» o «Ya la leí» y respondan las preguntas."]'::jsonb,
  'Escuchen otra vez cuantas veces quieran. «Ver una pista» marca en el texto dónde está la respuesta.',
  'La radio toca música y la carta queda colgada en la pared. ¡Gracias por tu tiempo!',
  array['preventivo', 'dcl', 'leve', 'moderada'], '{"modo": "interactiva", "tipo": "comprension", "version": 1, "nivel": "suave", "ejercicios": 5}'::jsonb, 'en_revision', true, 53
)
on conflict (codigo) do update set
  titulo = excluded.titulo, detalle = excluded.detalle, modulo = excluded.modulo, tipo = excluded.tipo,
  duracion = excluded.duracion, duracion_min = excluded.duracion_min, duracion_max = excluded.duracion_max,
  frecuencia = excluded.frecuencia, perfil = excluded.perfil, actividad = excluded.actividad, pasos = excluded.pasos,
  ayuda = excluded.ayuda, para_cerrar = excluded.para_cerrar, niveles_cognitivos = excluded.niveles_cognitivos,
  extras = excluded.extras, estado_clinico = excluded.estado_clinico, activo = excluded.activo, updated_at = now();

insert into public.media_resources_interno (resource_id, objetivo, areas_trabajo, fuente, pendientes)
select r.id, 'Comprensión auditiva y lectora. Secundarias: memoria episódica verbal y cognición social (inferencias).', array['Lenguaje'],
  'Avisos de radio comunal y cartas familiares escritos para la app, con preguntas escritas a mano.',
  'Banco de 7 avisos y 5 cartas pendiente de revisión (src/lib/actividades/bancos/comprension.ts). La voz natural se genera la primera vez que se escucha cada aviso y queda guardada (decisión 6.4 abierta sobre pregenerar).'
from public.media_resources r where r.codigo = 'COG-053'
on conflict (resource_id) do update set objetivo = excluded.objetivo, areas_trabajo = excluded.areas_trabajo, fuente = excluded.fuente, pendientes = excluded.pendientes;
