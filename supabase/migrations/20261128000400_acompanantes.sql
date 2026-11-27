-- Sumar acompañantes (otros familiares) a una persona ya inscrita.
-- 1. perfil_id_por_correo: para que admin-accounts sepa si el correo ya
--    tiene cuenta (solo service_role).
-- 2. acompanantes(p_patient): quiénes acompañan a la persona, para que la
--    familia lo vea al sumar a alguien (solo cuentas vinculadas a ella).
create or replace function public.perfil_id_por_correo(p_email text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
$$;
revoke execute on function public.perfil_id_por_correo(text) from public, anon, authenticated;
grant execute on function public.perfil_id_por_correo(text) to service_role;

create or replace function public.acompanantes(p_patient uuid default null)
returns table (profile_id uuid, nombre text, relation text, confirmada boolean, soy_yo boolean)
language sql stable security definer set search_path = public, auth as $$
  select p.id, p.nombre, pl.relation::text, u.email_confirmed_at is not null, p.id = auth.uid()
  from public.patient_links pl
  join public.profiles p on p.id = pl.profile_id
  join auth.users u on u.id = p.id
  where pl.patient_id = public.paciente_activo(p_patient)
    and pl.relation in ('familiar_admin', 'participante')
  order by (p.id = auth.uid()) desc, pl.created_at;
$$;
revoke execute on function public.acompanantes(uuid) from public, anon;
grant execute on function public.acompanantes(uuid) to authenticated;
