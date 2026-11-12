-- Rol de administrador, separado del resto del equipo clínico.
--
-- Todas las cuentas de la clínica siguen siendo role = 'profesional' (mismos
-- permisos clínicos). es_admin marca además al administrador del sistema:
-- ve las métricas generales del programa y aparece como «Administrador» en
-- el equipo. Nadie puede darse este permiso a sí mismo: la columna no entra
-- en los grants de update de profiles (revocados a nivel de tabla en
-- 20260910000000_fix_profiles_self_update.sql).

alter table public.profiles add column if not exists es_admin boolean not null default false;

update public.profiles p
set es_admin = true
from auth.users u
where u.id = p.id
  and lower(u.email) = 'rsolano10@hotmail.com'
  and p.role = 'profesional';

create or replace function public.es_admin()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select coalesce((select es_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.es_admin() to authenticated;

-- Para marcar al administrador en «Equipo de la clínica» (profiles solo se
-- lee a sí mismo por RLS).
create or replace function public.ids_administradores()
returns setof uuid
language sql
stable security definer
set search_path = public
as $$
  select id from public.profiles where es_admin and public.is_profesional();
$$;
grant execute on function public.ids_administradores() to authenticated;

-- Las métricas generales del programa son solo del administrador.
create or replace function public.get_program_adherencia()
returns table(done bigint, total bigint)
language plpgsql
stable security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede ver las métricas generales.' using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (where pt.estado = 'realizado') as done,
    count(*) as total
  from public.plan_tasks pt
  join public.plans p on p.id = pt.plan_id
  where pt.estado <> 'futuro'
    and p.status = 'published'
    and p.publish_at <= now();
end;
$$;
