-- Run in Supabase SQL Editor. All private property and tenancy records are scoped to the signed-in owner.
create extension if not exists pgcrypto;
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, address text, city text default 'Lagos', listing_type text not null default 'rent' check (listing_type in ('rent','sale')),
  status text not null default 'available' check (status in ('available','occupied','under_offer','sold')), price numeric(14,2) not null default 0,
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
  tenant_id uuid references public.tenants(id) on delete cascade, property_id uuid references public.properties(id) on delete cascade,
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
create index if not exists tenants_owner_status_idx on public.tenants(owner_id,status);
create index if not exists charges_owner_status_idx on public.service_charges(owner_id,status,due_date);
