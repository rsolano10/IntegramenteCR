-- Fase 2.1: guardado automático del cuestionario en el servidor.
-- Hasta ahora las respuestas vivían solo en el localStorage del navegador:
-- si la persona cambiaba de dispositivo (o el navegador borraba datos)
-- empezaba de cero. Un borrador por cuenta, con la última pantalla, deja
-- retomar donde quedó. Se borra al crear el paciente (self_onboard).
-- También sirve para el estado de cuenta "cuestionario_pendiente" (Fase 4).

create table public.onboarding_borradores (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  paso text,
  updated_at timestamptz not null default now()
);

alter table public.onboarding_borradores enable row level security;

create policy "onboarding_borradores: self all" on public.onboarding_borradores
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "onboarding_borradores: profesional read" on public.onboarding_borradores
  for select using (public.is_profesional());

-- Al crear el paciente, el borrador ya no hace falta.
create or replace function public.borrar_borrador_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.onboarding_borradores where profile_id = new.profile_id;
  return new;
end;
$$;

create trigger patient_links_borrar_borrador
  after insert on public.patient_links
  for each row execute function public.borrar_borrador_onboarding();
