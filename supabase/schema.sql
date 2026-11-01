-- Run in Supabase SQL Editor. All private property and tenancy records are scoped to the signed-in owner.
create extension if not exists pgcrypto;
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, address text, city text default 'Lagos', listing_type text not null default 'rent' check (listing_type in ('rent','sale')),
  status text not null default 'available' check (status in ('available','occupied','under_offer','sold')), is_advertised boolean not null default false,
  price numeric(14,2) not null default 0,
  bedrooms integer, bathrooms integer, description text, image_url text, image_urls text[] not null default '{}',
  created_at timestamptz not null default now(), constraint properties_image_urls_max_5 check (cardinality(image_urls) <= 5)
);
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null, full_name text not null, email text, phone text,
  lease_start date not null, lease_end date not null, rent_amount numeric(14,2) not null, rent_frequency text not null default 'yearly',
  deposit_amount numeric(14,2) default 0, status text not null default 'active' check (status in ('active','expired','notice','pending')),
  notes text, created_at timestamptz not null default now()
);
create table if not exists public.guarantors (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade, full_name text not null, email text, phone text,
  address text, occupation text, relationship text, id_document_url text, created_at timestamptz not null default now()
);
create table if not exists public.service_charges (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade, property_id uuid references public.properties(id) on delete set null,
  description text not null, category text not null default 'other', amount numeric(14,2) not null,
  due_date date, paid_at timestamptz, status text not null default 'unpaid' check (status in ('unpaid','paid','waived')),
  created_at timestamptz not null default now()
);
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null, role text not null check (role in ('caretaker','agent')), email text, phone text,
  property_id uuid references public.properties(id) on delete set null, notes text, created_at timestamptz not null default now()
);
alter table public.tenants add column if not exists agent_id uuid references public.staff(id) on delete set null;
alter table public.tenants add column if not exists caretaker_id uuid references public.staff(id) on delete set null;
create table if not exists public.landlord_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', business_name text not null default 'Yemilaz Properties',
  phone text, business_address text, lawyer_name text, lawyer_email text,
  agreement_terms text not null default 'The tenant agrees to pay rent and charges by the agreed due dates, keep the premises reasonably clean, promptly report damage, and return all keys at the end of the tenancy. Any deposit deductions must be itemized.',
  house_rules text not null default 'Use the premises for residential purposes only. Keep shared areas clear and clean. Avoid excessive noise, especially at night. Do not make structural changes without written permission. Report maintenance issues promptly. Follow applicable safety, waste, and community rules.',
  updated_at timestamptz not null default now()
);
create table if not exists public.tenant_packet_deliveries (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recipient_role text not null, recipient_email text not null,
  status text not null check (status in ('sent','failed')), provider_id text, error_message text,
  created_at timestamptz not null default now()
);
alter table public.properties enable row level security;
alter table public.tenants enable row level security;
alter table public.guarantors enable row level security;
alter table public.service_charges enable row level security;
alter table public.staff enable row level security;
alter table public.landlord_profiles enable row level security;
alter table public.tenant_packet_deliveries enable row level security;
do $$ declare t text; begin foreach t in array array['properties','tenants','guarantors','service_charges','staff'] loop
  execute format('drop policy if exists "Owners manage their %s" on public.%I', t, t);
  execute format('create policy "Owners manage their %s" on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t, t);
end loop; end $$;
drop policy if exists "Landlords manage their profile" on public.landlord_profiles;
create policy "Landlords manage their profile" on public.landlord_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.landlord_profiles to authenticated;
drop policy if exists "Owners view their packet delivery history" on public.tenant_packet_deliveries;
create policy "Owners view their packet delivery history" on public.tenant_packet_deliveries
  for select to authenticated using (owner_id = auth.uid());
drop policy if exists "Owners record their packet delivery history" on public.tenant_packet_deliveries;
create policy "Owners record their packet delivery history" on public.tenant_packet_deliveries
  for insert to authenticated with check (owner_id = auth.uid() and exists (
    select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()
  ));
grant select, insert on public.tenant_packet_deliveries to authenticated;
create or replace function public.create_landlord_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.landlord_profiles (user_id, full_name, business_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_landlord_profile on auth.users;
create trigger on_auth_user_created_landlord_profile after insert on auth.users
  for each row execute function public.create_landlord_profile();
insert into public.landlord_profiles (user_id, full_name, business_name)
select id, coalesce(raw_user_meta_data->>'full_name', ''),
  coalesce(nullif(raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties')
from auth.users on conflict (user_id) do nothing;
drop policy if exists "Public can view advertised available properties" on public.properties;
create policy "Public can view advertised available properties" on public.properties
  for select to anon, authenticated using (status = 'available' and is_advertised = true);

create or replace function public.allocate_property(p_tenant_id uuid, p_property_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_owner_id uuid;
  v_old_property_id uuid;
  v_property_owner_id uuid;
  v_property_status text;
begin
  select t.owner_id, t.property_id into v_owner_id, v_old_property_id
    from public.tenants as t where t.id = p_tenant_id for update;
  if not found or v_owner_id is distinct from auth.uid() then
    raise exception 'Tenant not found for this account';
  end if;
  if p_property_id is not null then
    if not exists (
      select 1 from public.service_charges as c
      where c.tenant_id = p_tenant_id and c.owner_id = auth.uid()
        and c.status = 'paid' and c.category in ('rent', 'deposit')
    ) then
      raise exception 'Record a paid rent or deposit before allocating a property';
    end if;
    select p.owner_id, p.status into v_property_owner_id, v_property_status
      from public.properties as p where p.id = p_property_id for update;
    if not found or v_property_owner_id is distinct from auth.uid() then
      raise exception 'Property not found for this account';
    end if;
    if v_property_status <> 'available' and p_property_id is distinct from v_old_property_id then
      raise exception 'Property is no longer available';
    end if;
  end if;
  if v_old_property_id is not null and v_old_property_id is distinct from p_property_id then
    update public.properties set status = 'available'
      where id = v_old_property_id and owner_id = auth.uid() and status = 'occupied';
  end if;
  if p_property_id is not null and p_property_id is distinct from v_old_property_id then
    update public.properties set status = 'occupied', is_advertised = false
      where id = p_property_id and owner_id = auth.uid() and status = 'available';
    if not found then raise exception 'Property is no longer available'; end if;
  end if;
  update public.tenants set property_id = p_property_id
    where id = p_tenant_id and owner_id = auth.uid();
end;
$$;
revoke all on function public.allocate_property(uuid, uuid) from public;
grant execute on function public.allocate_property(uuid, uuid) to authenticated;
create index if not exists tenants_owner_status_idx on public.tenants(owner_id,status);
create index if not exists charges_owner_status_idx on public.service_charges(owner_id,status,due_date);
create index if not exists packet_deliveries_tenant_idx on public.tenant_packet_deliveries(owner_id,tenant_id,created_at desc);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public can view property photos" on storage.objects;
create policy "Public can view property photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-images');
drop policy if exists "Landlords upload photos to their folder" on storage.objects;
create policy "Landlords upload photos to their folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Landlords update photos in their folder" on storage.objects;
create policy "Landlords update photos in their folder" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Landlords delete photos in their folder" on storage.objects;
create policy "Landlords delete photos in their folder" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
