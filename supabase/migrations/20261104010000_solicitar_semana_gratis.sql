-- Fase 2.2: "Activar mi semana gratis" en la página de resultados.
-- Registra la solicitud (la semana corre recién cuando la clínica aprueba la
-- cuenta, ver Fase 3.2) y, si todavía no eligió programa, deja el
-- Autoguiado, que es el que se prueba gratis.

alter table public.patients add column if not exists semana_gratis_solicitada_en timestamptz;

create or replace function public.solicitar_semana_gratis()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
begin
  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  update public.patients
  set semana_gratis_solicitada_en = coalesce(semana_gratis_solicitada_en, now()),
      modalidad = case when programa_elegido_en is null and plan_status = 'pendiente' then 'autoguiado'::public.modalidad else modalidad end,
      programa_elegido_en = coalesce(programa_elegido_en, now())
  where id = v_patient_id;
end;
$$;

grant execute on function public.solicitar_semana_gratis() to authenticated;
