-- Memoria por usuario para Clara (agente de ElevenLabs en Ayuda).
--
--   · agent_memory: lo que Clara recuerda de cada cuenta. Se lee al iniciar
--     la conversación (función clara-session) y se actualiza al terminar
--     (webhook post-llamada, función clara-post-call).
--   · clara_conversaciones: qué conversación de ElevenLabs es de qué
--     usuario. La registra la app con la sesión verificada al conectarse;
--     el webhook busca el usuario acá y nunca confía en el user_id que llega
--     desde el navegador (se podría falsificar para escribir la memoria de
--     otra persona).
--
-- Seguridad: cada usuario solo puede leer su propia memoria; nadie escribe
-- desde el cliente (solo las funciones, con la service role).

create table public.agent_memory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  resumen_previo text not null default '' check (char_length(resumen_previo) <= 1200),
  updated_at timestamptz not null default now()
);
alter table public.agent_memory enable row level security;
create policy "agent_memory: leer la propia" on public.agent_memory for select using (user_id = auth.uid());
revoke insert, update, delete on public.agent_memory from anon, authenticated;

create table public.clara_conversaciones (
  conversation_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  procesada_en timestamptz
);
create index clara_conversaciones_user_idx on public.clara_conversaciones (user_id);
alter table public.clara_conversaciones enable row level security;
create policy "clara_conversaciones: leer las propias" on public.clara_conversaciones for select using (user_id = auth.uid());
revoke insert, update, delete on public.clara_conversaciones from anon, authenticated;
