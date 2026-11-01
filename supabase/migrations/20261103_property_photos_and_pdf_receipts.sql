-- Supports up to five publicly viewable marketing photos per property.
-- Uploads are written under the authenticated landlord's own folder.

alter table public.properties add column if not exists image_urls text[] not null default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'properties_image_urls_max_5') then
    alter table public.properties add constraint properties_image_urls_max_5
      check (cardinality(image_urls) <= 5);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view property photos" on storage.objects;
create policy "Public can view property photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-images');

drop policy if exists "Landlords upload photos to their folder" on storage.objects;
create policy "Landlords upload photos to their folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Landlords update photos in their folder" on storage.objects;
create policy "Landlords update photos in their folder" on storage.objects
  for update to authenticated using (
    bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Landlords delete photos in their folder" on storage.objects;
create policy "Landlords delete photos in their folder" on storage.objects
  for delete to authenticated using (
    bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
