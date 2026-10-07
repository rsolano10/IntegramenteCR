-- Structures what used to live only as free prose inside media_resources.perfil
-- — the target cognitive level and, where the source manual states it
-- explicitly, the motor-safety tier (Verde/Amarillo/Rojo). "La seguridad
-- motora tiene prioridad absoluta en todo el Módulo 2" (manual de
-- contenido) had no queryable representation at all before this; perfil
-- stays untouched as supplementary free-text nuance.
--
-- Allowed values (no DB-level enum, same convention already used for
-- `dominios` — these are display/filter labels, not an authority boundary):
--   niveles_cognitivos: preventivo | dcl | leve | moderada | avanzada
--   niveles_motores:    verde | amarillo | rojo
alter table public.media_resources
  add column niveles_cognitivos text[],
  add column niveles_motores text[];

update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'SEN-001';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'SEN-002';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'SEN-003';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'] where codigo = 'SEN-004';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada','avanzada'] where codigo = 'SEN-005';
update public.media_resources set niveles_cognitivos = array['leve','moderada','avanzada'] where codigo = 'SEN-006';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada','avanzada'] where codigo = 'SEN-007';
update public.media_resources set niveles_cognitivos = array['moderada','avanzada'] where codigo = 'SEN-008';

update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'], niveles_motores = array['verde','amarillo'] where codigo = 'MOV-001';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'MOV-002';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'], niveles_motores = array['verde','amarillo','rojo'] where codigo = 'MOV-003';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'MOV-004';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl'], niveles_motores = array['verde','amarillo'] where codigo = 'MOV-005';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'], niveles_motores = array['verde','amarillo'] where codigo = 'MOV-006';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl'], niveles_motores = array['verde','amarillo'] where codigo = 'MOV-007';
update public.media_resources set niveles_cognitivos = array['dcl','leve'], niveles_motores = array['verde','amarillo'] where codigo = 'MOV-008';

update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'] where codigo = 'MUS-001';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'MUS-002';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'] where codigo = 'MUS-003';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'], niveles_motores = array['verde','amarillo','rojo'] where codigo = 'MUS-004';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'MUS-005';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'] where codigo = 'MUS-006';
update public.media_resources set niveles_cognitivos = array['leve','moderada'] where codigo = 'MUS-007';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'MUS-008';

update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'] where codigo = 'REM-001';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'REM-002';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada','avanzada'] where codigo = 'REM-003';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'REM-004';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'REM-005';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve','moderada'] where codigo = 'REM-006';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'REM-007';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'REM-008';
update public.media_resources set niveles_cognitivos = array['preventivo','dcl','leve'] where codigo = 'REM-009';
update public.media_resources set niveles_cognitivos = array['dcl','leve','moderada'] where codigo = 'REM-010';
