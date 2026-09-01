-- Message retention policy: mensajes older than a year can be discarded
-- (family/clinic correspondence, not the patient's clinical record — that
-- lives in onboarding_answers/clinical_profiles/plans, untouched here).
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_old_mensajes()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.mensajes where created_at < now() - interval '1 year';
$$;

select cron.schedule(
  'purge-old-mensajes',
  '0 9 * * *', -- daily at 09:00 UTC
  $$select public.purge_old_mensajes();$$
);
