-- Listing discovery, public enquiries, viewing requests, reports, and two-party complaint resolution.
alter table public.properties add column if not exists property_type text not null default 'Residential';
alter table public.properties add column if not exists amenities text[] not null default '{}';
alter table public.properties add column if not exists verification_status text not null default 'unverified';
alter table public.properties add column if not exists viewing_notes text;
alter table public.properties add column if not exists view_count bigint not null default 0 check (view_count >= 0);
alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties add constraint properties_status_check check (status in ('available','reserved','occupied','under_offer','sold'));
alter table public.properties add constraint properties_verification_status_check check (verification_status in ('unverified','pending','verified','rejected'));
drop policy if exists "Public can view advertised available properties" on public.properties;
drop policy if exists "Public can view advertised listings" on public.properties;
create policy "Public can view advertised listings" on public.properties for select to anon, authenticated
  using (is_advertised = true and status in ('available','reserved'));

create table if not exists public.property_enquiries (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, name text not null, email text not null,
  phone text, message text not null, created_at timestamptz not null default now()
);
create table if not exists public.property_viewing_requests (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, name text not null, email text not null,
  phone text, requested_at timestamptz not null, note text, status text not null default 'new'
    check (status in ('new','confirmed','declined','completed')), created_at timestamptz not null default now()
);
create table if not exists public.property_listing_reports (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, reporter_email text, reason text not null,
  details text, status text not null default 'new' check (status in ('new','reviewed','actioned','dismissed')),
  created_at timestamptz not null default now()
);
create or replace function public.record_property_listing_view(p_property_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.properties set view_count = view_count + 1
  where id = p_property_id and status in ('available','reserved') and is_advertised = true;
end;
$$;
revoke all on function public.record_property_listing_view(uuid) from public;
grant execute on function public.record_property_listing_view(uuid) to anon, authenticated;
alter table public.property_enquiries enable row level security;
alter table public.property_viewing_requests enable row level security;
alter table public.property_listing_reports enable row level security;
grant insert on public.property_enquiries, public.property_viewing_requests, public.property_listing_reports to anon, authenticated;
grant select, update on public.property_enquiries, public.property_viewing_requests, public.property_listing_reports to authenticated;
drop policy if exists "Public can enquire about advertised listings" on public.property_enquiries;
create policy "Public can enquire about advertised listings" on public.property_enquiries for insert to anon, authenticated with check (
  exists (select 1 from public.properties p where p.id = property_enquiries.property_id and p.owner_id = property_enquiries.owner_id and p.is_advertised and p.status = 'available')
);
drop policy if exists "Owners manage their property enquiries" on public.property_enquiries;
create policy "Owners manage their property enquiries" on public.property_enquiries for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Public can request a property viewing" on public.property_viewing_requests;
create policy "Public can request a property viewing" on public.property_viewing_requests for insert to anon, authenticated with check (
  status = 'new' and exists (select 1 from public.properties p where p.id = property_viewing_requests.property_id and p.owner_id = property_viewing_requests.owner_id and p.is_advertised and p.status = 'available')
);
drop policy if exists "Owners manage their viewing requests" on public.property_viewing_requests;
create policy "Owners manage their viewing requests" on public.property_viewing_requests for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Public can report a listing" on public.property_listing_reports;
create policy "Public can report a listing" on public.property_listing_reports for insert to anon, authenticated with check (
  status = 'new' and exists (select 1 from public.properties p where p.id = property_listing_reports.property_id and p.owner_id = property_listing_reports.owner_id and p.is_advertised)
);
drop policy if exists "Owners can review listing reports" on public.property_listing_reports;
create policy "Owners can review listing reports" on public.property_listing_reports for select to authenticated using (owner_id = auth.uid());

-- Complaints keep a private message history. Resolution stays proposed until the other participant approves it.
alter table public.property_complaints add column if not exists landlord_id uuid references auth.users(id) on delete cascade;
alter table public.property_complaints add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.property_complaints add column if not exists other_participant_email text;
alter table public.property_complaints add column if not exists other_participant_id uuid references auth.users(id) on delete set null;
alter table public.property_complaints add column if not exists reference_code text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
alter table public.property_complaints add column if not exists resolution_proposed_by text;
alter table public.property_complaints add column if not exists resolution_proposed_at timestamptz;
alter table public.property_complaints add column if not exists resolution_approved_at timestamptz;
alter table public.property_complaints add column if not exists authenticated_reporter_id uuid references auth.users(id) on delete set null;
create or replace function public.link_property_complaint_participants()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.landlord_id := null;
  new.resolution_proposed_by := null;
  new.resolution_proposed_at := null;
  new.resolution_approved_at := null;
  new.status := 'new';
  if auth.uid() is not null then
    new.authenticated_reporter_id := auth.uid();
    select u.email into new.email from auth.users u where u.id = auth.uid();
  end if;
  if new.property_id is not null then
    select p.owner_id into new.landlord_id from public.properties p where p.id = new.property_id;
  elsif new.landlord_id is null then
    select p.owner_id, p.id into new.landlord_id, new.property_id from public.properties p
    where p.is_advertised and lower(trim(concat_ws(', ', p.address, p.city, p.state, p.country))) = lower(trim(new.property_address))
    order by p.created_at desc limit 1;
  end if;
  if new.stakeholder_role = 'Landlord' and auth.uid() = new.landlord_id and new.other_participant_email is not null then
    if exists (select 1 from public.tenants t where t.owner_id = new.landlord_id and lower(t.email) = lower(trim(new.other_participant_email))
      and (new.property_id is null or t.property_id = new.property_id)) then
      select u.id into new.other_participant_id from auth.users u join public.tenants t on lower(t.email) = lower(u.email)
      where lower(u.email) = lower(trim(new.other_participant_email)) and t.owner_id = new.landlord_id
        and (new.property_id is null or t.property_id = new.property_id) limit 1;
    else new.other_participant_email := null; new.other_participant_id := null;
    end if;
  else
    new.other_participant_email := null; new.other_participant_id := null;
  end if;
  if new.stakeholder_role = 'Landlord' and auth.uid() is not null and auth.uid() <> new.landlord_id then
    raise exception 'Only the owner of this property can lodge a landlord complaint';
  end if;
  return new;
end;
$$;
drop trigger if exists link_property_complaint_participants on public.property_complaints;
create trigger link_property_complaint_participants before insert on public.property_complaints
  for each row execute function public.link_property_complaint_participants();
create table if not exists public.property_complaint_messages (
  id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.property_complaints(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade, message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);
alter table public.property_complaint_messages enable row level security;
grant select, insert on public.property_complaint_messages to authenticated;
drop policy if exists "Complaint participants read messages" on public.property_complaint_messages;
create policy "Complaint participants read messages" on public.property_complaint_messages for select to authenticated using (
  exists (select 1 from public.property_complaints c where c.id = complaint_id and (c.landlord_id = auth.uid() or c.authenticated_reporter_id = auth.uid() or c.other_participant_id = auth.uid()))
);
drop policy if exists "Complaint participants write messages" on public.property_complaint_messages;
create policy "Complaint participants write messages" on public.property_complaint_messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (select 1 from public.property_complaints c where c.id = complaint_id and (c.landlord_id = auth.uid() or c.authenticated_reporter_id = auth.uid() or c.other_participant_id = auth.uid()))
);
drop policy if exists "Complaint participants read their cases" on public.property_complaints;
create policy "Complaint participants read their cases" on public.property_complaints for select to authenticated using (
  landlord_id = auth.uid() or authenticated_reporter_id = auth.uid() or other_participant_id = auth.uid()
);
drop policy if exists "Signed-in users lodge complaints" on public.property_complaints;
create policy "Signed-in users lodge complaints" on public.property_complaints for insert to authenticated with check (
  authenticated_reporter_id = auth.uid() and status = 'new' and resolution_proposed_by is null
    and resolution_proposed_at is null and resolution_approved_at is null
);
drop policy if exists "Landlords update complaint status" on public.property_complaints;
revoke update on public.property_complaints from authenticated;
grant select on public.property_complaints to authenticated;

create or replace function public.propose_complaint_resolution(p_complaint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.property_complaints set status = 'in_review', resolution_proposed_by = auth.uid()::text,
    resolution_proposed_at = now(), resolution_approved_at = null
  where id = p_complaint_id and (landlord_id = auth.uid() or authenticated_reporter_id = auth.uid() or other_participant_id = auth.uid());
  if not found then raise exception 'Complaint not found or access denied'; end if;
end;
$$;
create or replace function public.approve_complaint_resolution(p_complaint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.property_complaints set status = 'resolved', resolution_approved_at = now()
  where id = p_complaint_id and resolution_proposed_at is not null
    and resolution_proposed_by <> auth.uid()::text
    and (landlord_id = auth.uid() or authenticated_reporter_id = auth.uid() or other_participant_id = auth.uid());
  if not found then raise exception 'Only the other complaint participant can approve a proposed resolution'; end if;
end;
$$;
revoke all on function public.propose_complaint_resolution(uuid), public.approve_complaint_resolution(uuid) from public, anon;
grant execute on function public.propose_complaint_resolution(uuid), public.approve_complaint_resolution(uuid) to authenticated;

create or replace function public.request_complaint_rework(p_complaint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.property_complaints set status = 'in_review', resolution_proposed_by = null,
    resolution_proposed_at = null, resolution_approved_at = null
  where id = p_complaint_id and resolution_proposed_at is not null
    and resolution_proposed_by <> auth.uid()::text
    and (landlord_id = auth.uid() or authenticated_reporter_id = auth.uid() or other_participant_id = auth.uid());
  if not found then raise exception 'Only the other complaint participant can request further work'; end if;
end;
$$;
revoke all on function public.request_complaint_rework(uuid) from public, anon;
grant execute on function public.request_complaint_rework(uuid) to authenticated;

create or replace function public.guard_property_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.verification_status in ('verified','rejected') and not exists (
    select 1 from public.platform_admins a where a.user_id = auth.uid()
  ) then raise exception 'Only a Yemilaz administrator can complete a listing verification review'; end if;
  return new;
end;
$$;
drop trigger if exists guard_property_verification on public.properties;
create trigger guard_property_verification before insert or update of verification_status on public.properties
  for each row execute function public.guard_property_verification();
drop policy if exists "Platform admins review listing verification" on public.properties;
create policy "Platform admins review listing verification" on public.properties for select to authenticated
  using (public.is_platform_admin());
drop policy if exists "Platform admins update listing verification" on public.properties;
create policy "Platform admins update listing verification" on public.properties for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- A verified tenant account can view its own tenancy and the allocated property's public details.
grant select on public.tenants, public.service_charges, public.properties to authenticated;
drop policy if exists "Tenants view their own tenancy" on public.tenants;
create policy "Tenants view their own tenancy" on public.tenants for select to authenticated
  using (lower(email) = lower(auth.jwt()->>'email'));
drop policy if exists "Tenants view their own charges" on public.service_charges;
create policy "Tenants view their own charges" on public.service_charges for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and lower(t.email) = lower(auth.jwt()->>'email')));
drop policy if exists "Tenants view their allocated property" on public.properties;
create policy "Tenants view their allocated property" on public.properties for select to authenticated
  using (exists (select 1 from public.tenants t where t.property_id = properties.id and lower(t.email) = lower(auth.jwt()->>'email')));

drop policy if exists "Anyone can lodge a property complaint" on public.property_complaints;
create policy "Anyone can lodge a property complaint" on public.property_complaints for insert to anon with check (
  authenticated_reporter_id is null and (landlord_id is null or exists (
    select 1 from public.properties p where p.id = property_id and p.owner_id = landlord_id
  ))
);

-- Stakeholder accounts are limited to private complaint threads; landlords still require administrator-issued codes.
create table if not exists public.stakeholder_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', created_at timestamptz not null default now()
);
alter table public.stakeholder_profiles enable row level security;
revoke all on public.stakeholder_profiles from anon, authenticated;
grant select on public.stakeholder_profiles to authenticated;
drop policy if exists "Users view their stakeholder profile" on public.stakeholder_profiles;
create policy "Users view their stakeholder profile" on public.stakeholder_profiles for select to authenticated using (user_id = auth.uid());

create or replace function public.create_landlord_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_invite_code text := nullif(lower(trim(new.raw_user_meta_data->>'invite_code')), '');
  v_account_role text := coalesce(new.raw_user_meta_data->>'account_role', 'landlord');
begin
  if v_account_role = 'stakeholder' then
    insert into public.stakeholder_profiles (user_id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
    update public.property_complaints c set authenticated_reporter_id = new.id
      where c.authenticated_reporter_id is null and lower(c.email) = lower(new.email)
        and c.stakeholder_role <> 'Landlord'
        and exists (select 1 from public.tenants t where t.owner_id = c.landlord_id and lower(t.email) = lower(new.email)
          and (c.property_id is null or t.property_id = c.property_id));
    update public.property_complaints c set other_participant_id = new.id
      where c.other_participant_id is null and lower(c.other_participant_email) = lower(new.email)
        and exists (select 1 from public.tenants t where t.owner_id = c.landlord_id and lower(t.email) = lower(new.email));
    return new;
  end if;
  if v_invite_code is null then raise exception 'A Yemilaz Properties landlord access code is required to create this account.'; end if;
  update public.landlord_invite_codes set redeemed_by = new.id, redeemed_at = now()
    where invite_code = v_invite_code and redeemed_at is null and revoked_at is null and expires_at > now();
  if not found then raise exception 'This Yemilaz Properties access code is invalid, expired, or already used.'; end if;
  insert into public.landlord_profiles (user_id, full_name, business_name, brand_template, brand_logo)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties'),
    case when new.raw_user_meta_data->>'brand_template' in ('jade','midnight','terracotta','plum') then new.raw_user_meta_data->>'brand_template' else 'jade' end,
    case when new.raw_user_meta_data->>'brand_logo' in ('estate','keystone','monogram','horizon','doorway') then new.raw_user_meta_data->>'brand_logo' else 'horizon' end)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
