-- Enables real two-way messaging: families could only ever read mensajes
-- before this (the compose UI that existed was 100% local Zustand, never
-- touched Supabase). This is the missing half — familiar_admin can now
-- write, mirroring the existing profesional write policy.
create policy "mensajes: familiar insert" on public.mensajes
  for insert with check (
    public.has_patient_link(patient_id, array['familiar_admin']::public.patient_relation[])
  );

-- Surfaces, for the clinic, every patient whose most recent message did NOT
-- come from a profesional — i.e. still awaiting a reply. Same
-- security-definer + is_profesional() shape as list_patients/
-- list_managed_accounts.
create or replace function public.list_pending_threads()
returns table (
  patient_id uuid,
  patient_nombre text,
  last_message text,
  last_author_nombre text,
  last_at timestamptz
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
  select pt.id, pt.nombre, m.texto, pr.nombre, m.created_at
  from public.patients pt
  join lateral (
    select mm.texto, mm.autor_id, mm.created_at
    from public.mensajes mm
    where mm.patient_id = pt.id
    order by mm.created_at desc
    limit 1
  ) m on true
  left join public.profiles pr on pr.id = m.autor_id
  where public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
    and (pr.role is distinct from 'profesional')
  order by m.created_at asc;
end;
$$;

grant execute on function public.list_pending_threads() to authenticated;
