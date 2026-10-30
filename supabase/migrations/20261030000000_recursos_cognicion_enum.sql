-- Quinto módulo de actividades: «Atención, memoria y funciones ejecutivas»
-- (Manual de recursos cognitivos). Va en su propia migración porque Postgres
-- no deja usar un valor nuevo de enum en la misma transacción que lo agrega.
alter type public.resource_modulo add value if not exists 'cognicion';
