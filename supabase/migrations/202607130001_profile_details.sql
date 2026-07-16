alter table public.profiles
  add column if not exists nickname text,
  add column if not exists date_of_birth date,
  add column if not exists phone_number text,
  add column if not exists gender text check (gender in ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other')),
  add column if not exists avatar_path text,
  add column if not exists emergency_contact jsonb;

alter table public.sensory_profiles
  add column if not exists preferred_coping_strategies text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own profile photo"
on storage.objects for select to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own profile photo"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own profile photo"
on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can remove their own profile photo"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
