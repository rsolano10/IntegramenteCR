-- Asistente de "Respuestas rápidas" con IA (edge function asistente-ia):
-- un registro por consulta, solo para limitar el uso por persona (costo y
-- abuso). No guarda el contenido de las preguntas.
create table public.asistente_uso (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  categoria text not null,
  created_at timestamptz not null default now()
);

create index asistente_uso_profile_idx on public.asistente_uso (profile_id, created_at desc);

-- Sin policies: solo la edge function (service role) lee y escribe.
alter table public.asistente_uso enable row level security;
