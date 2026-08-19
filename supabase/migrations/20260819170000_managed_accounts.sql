-- Lets the clinic see every familiar/paciente account it's responsible
-- for — including ones that haven't confirmed their email yet, and
-- self-signup accounts with no patient link at all — without exposing
-- auth.users directly to the client. Only profesional accounts can call
-- this; the check is enforced inside the function, not just by RLS.

create or replace function public.is_profesional()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'profesional'
  );
$$;

create or replace function public.list_managed_accounts()
returns table (
  id uuid,
  email text,
  nombre text,
  role public.app_role,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz,
  patient_id uuid,
  patient_nombre text,
  relation public.patient_relation
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
    u.email_confirmed_at,
    u.invited_at,
    p.created_at,
    pl.patient_id,
    pt.nombre,
    pl.relation
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.patient_links pl on pl.profile_id = p.id and pl.relation in ('familiar_admin', 'participante')
  left join public.patients pt on pt.id = pl.patient_id
  where p.role in ('familiar', 'paciente')
  order by u.email_confirmed_at nulls first, p.created_at desc;
end;
$$;

grant execute on function public.is_profesional() to authenticated;
grant execute on function public.list_managed_accounts() to authenticated;
