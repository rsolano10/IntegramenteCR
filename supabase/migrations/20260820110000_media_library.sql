-- Media resource library the clinic creates and manages. Assigning a
-- resource to a specific patient's plan is deliberately out of scope here
-- (that's future work) — this is just the library itself.
--
-- `tipo` deliberately reuses public.task_tipo (video/actividad/estrategia/
-- neuroproteccion) rather than inventing a parallel enum, so that future
-- "assign this resource" work can copy a row straight into plan_tasks
-- without a mapping table. `categoria` mirrors the frontend's
-- ActivityCategory, unaccented lowercase to match this project's existing
-- enum style (modalidad, plan_status).
create type public.resource_category as enum ('movimiento', 'cognitiva', 'social', 'relajacion', 'musica');

create table public.media_resources (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text,
  categoria public.resource_category not null,
  tipo public.task_tipo not null,
  media_kind text not null default 'video' check (media_kind in ('video', 'imagen', 'audio', 'documento', 'enlace')),
  storage_path text,
  external_url text,
  duracion text,
  precaucion text,
  activo boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_resources_source_check check (num_nonnulls(storage_path, external_url) = 1)
);

comment on table public.media_resources is 'Generic exercise/activity media the clinic curates. Nothing patient-identifying belongs here — the storage bucket backing this is public.';

create index media_resources_categoria_idx on public.media_resources (categoria, activo);

alter table public.media_resources enable row level security;

create policy "media_resources: read active or profesional" on public.media_resources
  for select using (activo or public.is_profesional());

create policy "media_resources: profesional insert" on public.media_resources
  for insert with check (public.is_profesional());

create policy "media_resources: profesional update" on public.media_resources
  for update using (public.is_profesional());

create policy "media_resources: profesional delete" on public.media_resources
  for delete using (public.is_profesional());

-- Explicit grant: newer Supabase projects don't auto-expose new public
-- tables to the Data API (see the auto_expose_new_tables note in
-- supabase/config.toml) — without this, the table 401s regardless of RLS.
grant select, insert, update, delete on public.media_resources to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger media_resources_set_updated_at
  before update on public.media_resources
  for each row execute function public.set_updated_at();

-- Public bucket, deliberately: this holds generic exercise photos/videos,
-- never patient-identifying content. Public means getPublicUrl() returns a
-- stable, browser-cacheable URL; a private bucket would force
-- createSignedUrl() per item with expiry refresh, defeating caching and
-- breaking any future emailed/printed link. Uploads still go through
-- authenticated, RLS-checked requests — only reads bypass RLS via the
-- public CDN URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-resources',
  'media-resources',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'application/pdf']
)
on conflict (id) do nothing;

create policy "media-resources: read" on storage.objects
  for select using (bucket_id = 'media-resources');

create policy "media-resources: profesional insert" on storage.objects
  for insert with check (bucket_id = 'media-resources' and public.is_profesional());

create policy "media-resources: profesional update" on storage.objects
  for update using (bucket_id = 'media-resources' and public.is_profesional());

create policy "media-resources: profesional delete" on storage.objects
  for delete using (bucket_id = 'media-resources' and public.is_profesional());
