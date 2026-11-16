-- Medición de la sesión guiada: cada tarea guarda en progreso.uso cuántas
-- pantallas vio, si terminó, si pidió ayuda o paró, el tiempo y si le
-- resultó fácil de seguir. La clínica ve el resumen por recurso.
create or replace function public.metricas_sesiones()
returns table (
  codigo text,
  sesiones int,
  terminadas int,
  claras int,
  con_clara int,
  con_ayuda int,
  paradas int,
  mediana_segundos int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.codigo,
    count(*)::int,
    count(*) filter (where (t.progreso -> 'uso' ->> 'terminada')::boolean)::int,
    count(*) filter (where t.progreso -> 'uso' ->> 'clara' = 'si')::int,
    count(*) filter (where t.progreso -> 'uso' ->> 'clara' is not null)::int,
    count(*) filter (where coalesce((t.progreso -> 'uso' ->> 'ayuda')::int, 0) > 0)::int,
    count(*) filter (where coalesce((t.progreso -> 'uso' ->> 'parar')::int, 0) > 0)::int,
    (percentile_cont(0.5) within group (order by (t.progreso -> 'uso' ->> 'segundos')::int))::int
  from public.plan_tasks t
  join public.media_resources r on r.id = t.media_resource_id
  where public.is_profesional()
    and t.progreso ? 'uso'
    and r.codigo is not null
  group by r.codigo;
$$;

revoke all on function public.metricas_sesiones() from public;
grant execute on function public.metricas_sesiones() to authenticated;
