-- Surface profiles.is_active in list_managed_accounts() so Cuentas.tsx can
-- show deactivated staff distinctly and offer reactivation.
drop function if exists public.list_managed_accounts();

create or replace function public.list_managed_accounts()
returns table (
  id uuid,
  email text,
  nombre text,
  role public.app_role,
  especialidad text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz,
  links jsonb,
  is_active boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.nombre,
    p.role,
    p.especialidad,
    u.email_confirmed_at,
    u.invited_at,
    p.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object('patient_id', pl.patient_id, 'patient_nombre', pt.nombre, 'relation', pl.relation) order by pt.nombre)
      from public.patient_links pl
      join public.patients pt on pt.id = pl.patient_id
      where pl.profile_id = p.id
    ), '[]'::jsonb) as links,
    p.is_active
  from public.profiles p
  join auth.users u on u.id = p.id
  order by u.email_confirmed_at nulls first, p.created_at desc;
end;
$$;

grant execute on function public.list_managed_accounts() to authenticated;
