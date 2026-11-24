-- Plan «Al crear la cuenta» con los videos propios: la presentación de la
-- app (BIE-001, que ya tenía su escena de video) y la de cada área:
-- estimulación cognitiva (BIE-004), gerontogimnasia (GER-010, ya cargado),
-- nutrición (BIE-005) y terapia ocupacional (BIE-006). Los videos están en
-- media-resources/home/ (720p, con póster). BIE-002 y BIE-003 quedan en la
-- plantilla, desactivados (se pueden volver a activar desde Plantillas).

update public.media_resources
set storage_path = 'home/intro-app.mp4', poster_path = 'home/intro-app-poster.jpg', media_kind = 'video', duracion = '1 min',
    detalle = 'Un video corto para conocer IntegraMente en Casa y cómo te acompaña cada semana.',
    pasos = '["Buscá un momento tranquilo.", "Mirá el video de presentación."]'::jsonb
where codigo = 'BIE-001';

insert into public.media_resources (codigo, modulo, titulo, tipo, media_kind, storage_path, poster_path, duracion, detalle, pasos, por_que, activo, estado_clinico, orden)
values
  ('BIE-004', 'bienvenida', 'Conocé la estimulación cognitiva', 'video', 'video', 'home/intro-estimulacion.mp4', 'home/intro-estimulacion-poster.jpg', '1 min',
   'Qué es la estimulación cognitiva y cómo la van a practicar en casa.',
   '["Busquen un momento tranquilo.", "Miren juntos el video."]'::jsonb,
   'Conocer cada área ayuda a aprovechar mejor las actividades de la semana.', true, 'aprobado', 4),
  ('BIE-005', 'bienvenida', 'Conocé la nutrición', 'video', 'video', 'home/intro-nutricion.mp4', 'home/intro-nutricion-poster.jpg', '1 min',
   'Cómo la alimentación y la hidratación cuidan la salud del cerebro.',
   '["Busquen un momento tranquilo.", "Miren juntos el video."]'::jsonb,
   'Conocer cada área ayuda a aprovechar mejor las actividades de la semana.', true, 'aprobado', 5),
  ('BIE-006', 'bienvenida', 'Conocé la terapia ocupacional', 'video', 'video', 'home/intro-terapia-ocupacional.mp4', 'home/intro-terapia-ocupacional-poster.jpg', '2 min',
   'Cómo las tareas de todos los días ayudan a mantener la autonomía.',
   '["Busquen un momento tranquilo.", "Miren juntos el video."]'::jsonb,
   'Conocer cada área ayuda a aprovechar mejor las actividades de la semana.', true, 'aprobado', 6)
on conflict (codigo) do update set
  storage_path = excluded.storage_path, poster_path = excluded.poster_path, media_kind = excluded.media_kind,
  duracion = excluded.duracion, detalle = excluded.detalle, activo = true;

-- La plantilla «Al crear la cuenta»: un video por día.
update public.recursos_automaticos ra set activo = false
from public.media_resources mr
where mr.id = ra.media_resource_id and ra.disparador = 'cuenta_creada' and mr.codigo in ('BIE-002', 'BIE-003');

update public.recursos_automaticos ra set activo = true, dia_offset = x.dia, orden = 1
from public.media_resources mr, (values ('BIE-001', 0), ('GER-010', 2)) as x(codigo, dia)
where mr.id = ra.media_resource_id and ra.disparador = 'cuenta_creada' and mr.codigo = x.codigo;

insert into public.recursos_automaticos (media_resource_id, dia_offset, hora, orden, activo, disparador)
select mr.id, x.dia, null, 1, true, 'cuenta_creada'
from (values ('BIE-004', 1), ('BIE-005', 3), ('BIE-006', 4)) as x(codigo, dia)
join public.media_resources mr on mr.codigo = x.codigo
where not exists (select 1 from public.recursos_automaticos ra where ra.media_resource_id = mr.id and ra.disparador = 'cuenta_creada');
