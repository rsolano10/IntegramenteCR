-- 1) Aviso de rechazo dentro de la app.
-- Rechazar borra al paciente (admin-accounts → reject_patient), así que la
-- cuenta de la familia quedaba sin paciente y RouteGuard la mandaba directo
-- a /app/consent como si fuera nueva, sin explicarle nada. El mensaje de la
-- clínica ya iba por correo; ahora también queda guardado para mostrarlo la
-- próxima vez que entren. Lo escribe solo la edge function (service role).

create table public.solicitudes_rechazadas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  patient_nombre text not null,
  mensaje text not null,
  created_at timestamptz not null default now(),
  visto_at timestamptz
);

create index solicitudes_rechazadas_profile_idx on public.solicitudes_rechazadas (profile_id, created_at desc);

alter table public.solicitudes_rechazadas enable row level security;

create policy "solicitudes_rechazadas: self read" on public.solicitudes_rechazadas
  for select using (profile_id = auth.uid());

create policy "solicitudes_rechazadas: profesional read" on public.solicitudes_rechazadas
  for select using (public.is_profesional());

-- Sin policies de insert/update: escribe la edge function, y "ya lo vi" va
-- por este RPC (solo puede marcar las propias).
create or replace function public.marcar_rechazo_visto(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.solicitudes_rechazadas set visto_at = now() where id = p_id and profile_id = auth.uid() and visto_at is null;
$$;

grant execute on function public.marcar_rechazo_visto(uuid) to authenticated;

-- 2) Cambiar de programa desde la pantalla del paciente.
-- set_patient_modalidad exigía un vínculo profesional_asignado, que los
-- pacientes autoregistrados nunca tienen — mismo bug que la lectura de
-- datos clínicos (20261008010000_clinica_revision.sql). El rol profesional
-- es el administrador de la clínica.
create or replace function public.set_patient_modalidad(p_patient_id uuid, p_modalidad public.modalidad)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.patients set modalidad = p_modalidad, programa_elegido_en = coalesce(programa_elegido_en, now()) where id = p_patient_id;
end;
$$;
