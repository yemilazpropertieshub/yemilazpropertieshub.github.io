insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('profile-photos','profile-photos',true,4194304,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=4194304,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Public profile photos are viewable" on storage.objects;
create policy "Public profile photos are viewable" on storage.objects
for select to anon, authenticated using (bucket_id='profile-photos');

drop policy if exists "Users manage their own profile photo" on storage.objects;
create policy "Users manage their own profile photo" on storage.objects
for all to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);
