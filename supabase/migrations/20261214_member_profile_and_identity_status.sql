-- Private profile details for every portal role. Never store raw NIN values here.
create table if not exists public.account_profile_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  date_of_birth date,
  occupation text not null default '',
  profile_bio text not null default '',
  address_line text not null default '',
  city text not null default '',
  state text not null default '',
  country text not null default 'Nigeria',
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  organization_name text not null default '',
  professional_title text not null default '',
  professional_license_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.account_profile_details enable row level security;
revoke all on public.account_profile_details from anon, public;
grant select, insert, update on public.account_profile_details to authenticated;
drop policy if exists "Members manage their own private profile details" on public.account_profile_details;
create policy "Members manage their own private profile details" on public.account_profile_details
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Provider callbacks (service role only) write the outcome. Users can read their own status.
create table if not exists public.account_identity_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'ninauth',
  status text not null default 'pending' check (status in ('pending','verified','needs_review','rejected')),
  provider_reference text,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.account_identity_verifications enable row level security;
revoke all on public.account_identity_verifications from anon, public, authenticated;
grant select on public.account_identity_verifications to authenticated;
drop policy if exists "Members view their own identity verification status" on public.account_identity_verifications;
create policy "Members view their own identity verification status" on public.account_identity_verifications
  for select to authenticated using (user_id = auth.uid());

comment on table public.account_profile_details is 'Private optional profile information shared across landlord, tenant, agent, caretaker, lawyer and community member portals.';
comment on table public.account_identity_verifications is 'Provider result only. Never store raw NIN, biometric data, identity document images, or verification secrets in this table.';
