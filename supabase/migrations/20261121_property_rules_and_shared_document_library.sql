-- Rename the default rule wording for mixed-use property portfolios and allow
-- each emailed participant to access their own private copy of generated PDFs.

update public.landlord_profiles
set house_rules = 'Use the premises only for the purpose permitted by the signed agreement and applicable requirements. Keep the premises and shared access areas reasonably clean and unobstructed. Take reasonable care of fixtures, boundaries and supplied equipment. Do not make structural changes or materially change the use of the property without required written approval. Report damage, faults, hazards and security concerns promptly. Use utilities responsibly, store items only in approved areas, and follow applicable safety, waste and community requirements.'
where house_rules = 'Use the premises for residential purposes only. Keep shared areas clear and clean. Avoid excessive noise, especially at night. Do not make structural changes without written permission. Report maintenance issues promptly. Follow applicable safety, waste, and community rules.';

alter table public.landlord_profiles alter column house_rules set default
  'Use the premises only for the purpose permitted by the signed agreement and applicable requirements. Keep the premises and shared access areas reasonably clean and unobstructed. Take reasonable care of fixtures, boundaries and supplied equipment. Do not make structural changes or materially change the use of the property without required written approval. Report damage, faults, hazards and security concerns promptly. Use utilities responsibly, store items only in approved areas, and follow applicable safety, waste and community requirements.';

-- Keep this update self-healing if the earlier document-storage migration was
-- skipped on an existing project (the earlier app showed a missing relation).
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  storage_path text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);
alter table public.property_documents enable row level security;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('property-documents','property-documents',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false;
drop policy if exists "Landlords manage property documents" on public.property_documents;
create policy "Landlords manage property documents" on public.property_documents
  for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and uploaded_by=auth.uid());

alter table public.property_documents
  add column if not exists recipient_emails text[] not null default '{}',
  add column if not exists document_category text not null default 'shared_file';

-- Use SECURITY DEFINER lookups to avoid policy recursion between tenants,
-- landlord profiles, documents and private Storage objects.
create or replace function public.user_can_read_property_document(p_document_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.property_documents d
    where d.id = p_document_id and (
      d.owner_id = auth.uid()
      or lower(auth.jwt()->>'email') = any(d.recipient_emails)
      or (cardinality(coalesce(d.recipient_emails, '{}'::text[])) = 0 and exists (
        select 1 from public.tenants t
        where t.id = d.tenant_id and lower(t.email) = lower(auth.jwt()->>'email')
      ))
    )
  );
$$;
revoke all on function public.user_can_read_property_document(uuid) from public, anon;
grant execute on function public.user_can_read_property_document(uuid) to authenticated;

create or replace function public.user_can_read_property_document_path(p_storage_path text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.property_documents d
    where d.storage_path = p_storage_path and public.user_can_read_property_document(d.id)
  );
$$;
revoke all on function public.user_can_read_property_document_path(text) from public, anon;
grant execute on function public.user_can_read_property_document_path(text) to authenticated;

create or replace function public.user_is_linked_tenant_to_landlord(p_owner_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.tenants t
    where t.owner_id = p_owner_id and lower(t.email) = lower(auth.jwt()->>'email')
  );
$$;
revoke all on function public.user_is_linked_tenant_to_landlord(uuid) from public, anon;
grant execute on function public.user_is_linked_tenant_to_landlord(uuid) to authenticated;

drop policy if exists "Tenants view their documents" on public.property_documents;
drop policy if exists "Document recipients view their files" on public.property_documents;
create policy "Document recipients view their files" on public.property_documents
  for select to authenticated using (public.user_can_read_property_document(id));

drop policy if exists "Tenants read their property document files" on storage.objects;
drop policy if exists "Property document recipients read shared files" on storage.objects;
drop policy if exists "Landlords manage property document files" on storage.objects;
create policy "Landlords manage property document files" on storage.objects
  for all to authenticated using(bucket_id='property-documents' and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id='property-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Property document recipients read shared files" on storage.objects
  for select to authenticated using (
    bucket_id = 'property-documents'
    and public.user_can_read_property_document_path(storage.objects.name)
  );

-- Keep the landlord's complete profile private while allowing a verified tenant
-- to read the contact and rule details needed for their own tenancy documents.
drop policy if exists "Tenants view landlord contact profile" on public.landlord_profiles;
create policy "Tenants view landlord contact profile" on public.landlord_profiles
  for select to authenticated using (public.user_is_linked_tenant_to_landlord(user_id));

grant select on public.property_documents to authenticated;
