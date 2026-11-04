-- Anonymous property-wanted requests can be browsed only by signed-in landlords
-- who have enabled the opt-in in their landlord profile.
alter table public.landlord_profiles
  add column if not exists receive_wanted_requests boolean not null default true;

create table if not exists public.property_wanted_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (char_length(requester_name) between 2 and 120),
  requester_email text not null check (char_length(requester_email) <= 254),
  requester_phone text not null check (char_length(requester_phone) between 5 and 40),
  country text not null default 'Nigeria' check (char_length(country) between 2 and 80),
  state text check (state is null or char_length(state) <= 100),
  city text not null check (char_length(city) between 2 and 100),
  property_type text not null check (property_type in ('Land','House','Apartment','Commercial','Other')),
  listing_type text not null check (listing_type in ('rent','sale')),
  budget numeric(14,2) check (budget is null or budget >= 0),
  bedrooms integer check (bedrooms is null or bedrooms between 0 and 30),
  land_size text check (land_size is null or char_length(land_size) <= 100),
  details text not null check (char_length(details) between 10 and 3000),
  created_at timestamptz not null default now()
);

alter table public.property_wanted_requests enable row level security;
revoke all on public.property_wanted_requests from public, anon, authenticated;
grant insert on public.property_wanted_requests to anon, authenticated;
grant select on public.property_wanted_requests to authenticated;

drop policy if exists "Anyone can submit a wanted request" on public.property_wanted_requests;
create policy "Anyone can submit a wanted request"
  on public.property_wanted_requests for insert to anon, authenticated
  with check (true);

drop policy if exists "Opted-in landlords can view wanted requests" on public.property_wanted_requests;
create policy "Opted-in landlords can view wanted requests"
  on public.property_wanted_requests for select to authenticated
  using (exists (
    select 1 from public.landlord_profiles lp
    where lp.user_id = auth.uid() and lp.receive_wanted_requests = true
  ));

create index if not exists property_wanted_requests_created_at_idx
  on public.property_wanted_requests(created_at desc);
