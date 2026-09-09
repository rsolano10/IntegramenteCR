-- Alineación con business/general_rules.md: el cuestionario se reescribe
-- casi por completo (~150 preguntas nuevas, 4 ejes en vez de 5). Los
-- pacientes ya evaluados con el cuestionario viejo quedan marcados
-- version 1 (default) — Fase 11 los redirige a completar el cuestionario
-- nuevo antes de seguir usando la app; las respuestas nuevas se guardan
-- con version 2.
alter table public.onboarding_answers add column schema_version int not null default 1;
