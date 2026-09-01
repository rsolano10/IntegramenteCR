-- Profile photo, mainly for the paciente role's minimal header (no photo
-- affordance existed there at all before this — see ParticipantShell.tsx).
alter table public.profiles add column foto_url text;

-- Same public-bucket rationale as media-resources: a profile photo needs a
-- stable, cacheable URL. Path convention is "<uid>/<filename>" so RLS can
-- check ownership from the path alone, no extra table lookup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: self insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: self update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: self delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
