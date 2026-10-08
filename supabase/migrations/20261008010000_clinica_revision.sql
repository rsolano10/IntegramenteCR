-- Pantalla de paciente para la clínica (evaluación inicial, revisión de la
-- semana, planificador).
--
-- Bug: onboarding_answers, clinical_profiles, plans y plan_tasks solo se
-- podían leer con un vínculo profesional_asignado. Un paciente que se
-- registró solo nunca tiene ese vínculo (ni self_onboard ni
-- assign_initial_plan lo crean), así que la clínica abría la evaluación y
-- veía el cuestionario vacío, y la revisión semanal no mostraba nada. El
-- rol profesional ya es el administrador de la clínica con lectura total
-- de patients/patient_links/mensajes (platform_admin.sql,
-- mensajes_profesional_full_access.sql) — esto lo extiende a los datos
-- clínicos que necesita para evaluar. Solo lectura: las escrituras siguen
-- pasando por RPCs security definer.

create policy "onboarding_answers: profesional read all" on public.onboarding_answers
  for select using (public.is_profesional());

create policy "clinical_profiles: profesional read all" on public.clinical_profiles
  for select using (public.is_profesional());

create policy "plans: profesional read all" on public.plans
  for select using (public.is_profesional());

create policy "plan_tasks: profesional read all" on public.plan_tasks
  for select using (public.is_profesional());

-- "Marcar semana revisada" hacía un update directo a plans, que la policy
-- de update también limita a profesional_asignado — fallaba en silencio
-- para los mismos pacientes. Ahora es un RPC, y el comentario para la
-- familia además llega a su chat de la app.
create or replace function public.review_week(p_plan_id uuid, p_feedback text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_feedback text := nullif(btrim(coalesce(p_feedback, '')), '');
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede revisar una semana.' using errcode = '42501';
  end if;

  select patient_id into v_patient_id from public.plans where id = p_plan_id;
  if v_patient_id is null then
    raise exception 'Plan no encontrado.' using errcode = '22023';
  end if;

  update public.plans
  set reviewed_at = now(), feedback_mensaje = v_feedback
  where id = p_plan_id;

  if v_feedback is not null then
    insert into public.mensajes (patient_id, texto, autor_id) values (v_patient_id, v_feedback, auth.uid());
  end if;
end;
$$;

grant execute on function public.review_week(uuid, text) to authenticated;

-- Avisos de WhatsApp de la clínica (plan listo, semana revisada) además de
-- los recordatorios de actividades. El rechazo no se registra acá: borra
-- al paciente, y el log cuelga de patients con on delete cascade.
alter table public.notifications_log drop constraint notifications_log_tipo_check;
alter table public.notifications_log
  add constraint notifications_log_tipo_check check (tipo in ('prep', 'start', 'close', 'programa_listo', 'semana_revisada'));
