-- Run in Supabase SQL Editor. All private property and tenancy records are scoped to the signed-in owner.
create extension if not exists pgcrypto;
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, address text, city text default 'Lagos', listing_type text not null default 'rent' check (listing_type in ('rent','sale')),
  status text not null default 'available' check (status in ('available','occupied','under_offer','sold')), is_advertised boolean not null default false,
  price numeric(14,2) not null default 0,
  bedrooms integer, bathrooms integer, description text, image_url text, created_at timestamptz not null default now()
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
alter table public.properties enable row level security;
alter table public.tenants enable row level security;
alter table public.guarantors enable row level security;
alter table public.service_charges enable row level security;
alter table public.staff enable row level security;
do $$ declare t text; begin foreach t in array array['properties','tenants','guarantors','service_charges','staff'] loop
  execute format('drop policy if exists "Owners manage their %s" on public.%I', t, t);
  execute format('create policy "Owners manage their %s" on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t, t);
end loop; end $$;
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
