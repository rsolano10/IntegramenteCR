-- Sesión guiada: lo que la familia arma durante la actividad (la salida que
-- eligieron, lo que llevarían) y la misión de la semana (las comidas ya
-- marcadas). La familia y la persona lo escriben con la misma política de
-- registro sobre el plan publicado; solo se habilita esta columna.
alter table public.plan_tasks add column if not exists progreso jsonb;

grant update (progreso) on public.plan_tasks to authenticated;
