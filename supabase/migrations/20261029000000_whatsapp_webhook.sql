-- Webhook de WhatsApp (supabase/functions/whatsapp-webhook): estado de
-- entrega de los recordatorios y mensajes entrantes de las familias.
-- Aplicar con `supabase db query --linked -f <este archivo>` (nunca db push
-- en este proyecto).

alter table public.notifications_log
  add column if not exists delivery_status text check (delivery_status in ('sent', 'delivered', 'read', 'failed')),
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists delivery_error text;

create unique index if not exists notifications_log_whatsapp_message_idx
  on public.notifications_log (whatsapp_message_id)
  where whatsapp_message_id is not null;

create table if not exists public.whatsapp_inbound (
  id uuid primary key default gen_random_uuid(),
  whatsapp_message_id text not null unique,
  from_wa_id text not null,
  profile_name text,
  tipo text not null,
  texto text,
  phone_number_id text,
  received_at timestamptz not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.whatsapp_inbound is 'Mensajes que las familias le escriben al número de WhatsApp de la app — escrita únicamente por whatsapp-webhook (service role).';

create index if not exists whatsapp_inbound_from_idx on public.whatsapp_inbound (from_wa_id, received_at desc);

alter table public.whatsapp_inbound enable row level security;

drop policy if exists "whatsapp_inbound: profesional read" on public.whatsapp_inbound;
create policy "whatsapp_inbound: profesional read" on public.whatsapp_inbound
  for select using (public.is_profesional());

grant select on public.whatsapp_inbound to authenticated;
