-- Landlord profile and individualized onboarding document delivery support.
-- Existing owner_id RLS continues to isolate each landlord's data.

create table if not exists public.landlord_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  business_name text not null default 'Yemilaz Properties',
  phone text,
  business_address text,
  lawyer_name text,
  lawyer_email text,
  agreement_terms text not null default 'The tenant agrees to pay rent and charges by the agreed due dates, keep the premises reasonably clean, promptly report damage, and return all keys at the end of the tenancy. Any deposit deductions must be itemized.',
  house_rules text not null default 'Use the premises for residential purposes only. Keep shared areas clear and clean. Avoid excessive noise, especially at night. Do not make structural changes without written permission. Report maintenance issues promptly. Follow applicable safety, waste, and community rules.',
  updated_at timestamptz not null default now()
);
alter table public.landlord_profiles enable row level security;
drop policy if exists "Landlords manage their profile" on public.landlord_profiles;
create policy "Landlords manage their profile" on public.landlord_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.landlord_profiles to authenticated;

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
create trigger on_auth_user_created_landlord_profile
  after insert on auth.users for each row execute function public.create_landlord_profile();
insert into public.landlord_profiles (user_id, full_name, business_name)
select id, coalesce(raw_user_meta_data->>'full_name', ''),
  coalesce(nullif(raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties')
from auth.users on conflict (user_id) do nothing;

alter table public.tenants add column if not exists agent_id uuid references public.staff(id) on delete set null;
alter table public.tenants add column if not exists caretaker_id uuid references public.staff(id) on delete set null;

create table if not exists public.tenant_packet_deliveries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recipient_role text not null,
  recipient_email text not null,
  status text not null check (status in ('sent','failed')),
  provider_id text,
  error_message text,
  created_at timestamptz not null default now()
);
alter table public.tenant_packet_deliveries enable row level security;
drop policy if exists "Owners view their packet delivery history" on public.tenant_packet_deliveries;
create policy "Owners view their packet delivery history" on public.tenant_packet_deliveries
  for select to authenticated using (owner_id = auth.uid());
drop policy if exists "Owners record their packet delivery history" on public.tenant_packet_deliveries;
create policy "Owners record their packet delivery history" on public.tenant_packet_deliveries
  for insert to authenticated with check (
    owner_id = auth.uid() and exists (
      select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()
    )
  );
grant select, insert on public.tenant_packet_deliveries to authenticated;
create index if not exists packet_deliveries_tenant_idx on public.tenant_packet_deliveries(owner_id, tenant_id, created_at desc);
