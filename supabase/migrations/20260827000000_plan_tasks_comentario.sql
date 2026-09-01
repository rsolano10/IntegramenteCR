-- Lets a family/participant record what help was needed when marking a task
-- "parcial" — previously only captured client-side in the local demo store,
-- never visible to the clinic. RLS already allows familiar_admin/participante
-- to update plan_tasks on a published plan (see plan_tasks: familiar/
-- participante mark registro on published plan), so no new policy is needed.
alter table public.plan_tasks add column comentario text;
