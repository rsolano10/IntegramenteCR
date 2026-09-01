-- Fase 4/5: the weekly evaluate-and-review cycle. family_reviewed_at/
-- week_mood/review_favorita/review_preocupacion are the family's own
-- 3-question check-in (previously only ever held in local component state,
-- lost on navigation); reviewed_at/feedback_mensaje are the clinic's side,
-- filled in once they look over a completed week (Fase 5).
alter table public.plans
  add column family_reviewed_at timestamptz,
  add column week_mood text,
  add column review_favorita text,
  add column review_preocupacion text,
  add column reviewed_at timestamptz,
  add column feedback_mensaje text;

-- Lets familiar_admin/participante submit their weekly check-in for a
-- specific (their own) plan — a small RPC instead of a raw column UPDATE
-- policy so the write surface matches exactly this one action.
create or replace function public.submit_week_review(p_plan_id uuid, p_mood text, p_favorita text, p_preocupacion text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
begin
  select patient_id into v_patient_id from public.plans where id = p_plan_id;
  if v_patient_id is null then
    raise exception 'Plan no encontrado.' using errcode = '22023';
  end if;
  if not public.has_patient_link(v_patient_id, array['familiar_admin', 'participante']::public.patient_relation[]) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  update public.plans
  set family_reviewed_at = now(),
      week_mood = p_mood,
      review_favorita = nullif(trim(p_favorita), ''),
      review_preocupacion = nullif(trim(p_preocupacion), '')
  where id = p_plan_id;
end;
$$;

grant execute on function public.submit_week_review(uuid, text, text, text) to authenticated;
