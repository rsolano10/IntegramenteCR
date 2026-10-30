-- Módulos de business/integramente-recursos-spec.md: gerontogimnasia (GER) y
-- nutrición (PRE). Migración propia: Postgres no deja usar un valor nuevo de
-- enum en la misma transacción que lo agrega.
alter type public.resource_modulo add value if not exists 'gerontogimnasia';
alter type public.resource_modulo add value if not exists 'nutricion';
