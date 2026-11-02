-- Tenant workspace: private tenancy details, assigned contacts and on-demand documents.
alter table public.stakeholder_profiles add column if not exists role text not null default 'stakeholder';
alter table public.stakeholder_profiles add column if not exists tenant_id uuid references public.tenants(id) on delete set null;
alter table public.landlord_profiles add column if not exists contact_email text;
update public.landlord_profiles lp set contact_email = u.email
from auth.users u where u.id = lp.user_id and lp.contact_email is null;
alter table public.stakeholder_profiles drop constraint if exists stakeholder_profiles_role_check;
alter table public.stakeholder_profiles add constraint stakeholder_profiles_role_check check (role in ('tenant','stakeholder'));
update public.stakeholder_profiles sp set role = 'tenant', tenant_id = t.id
from auth.users u join public.tenants t on lower(t.email) = lower(u.email)
where sp.user_id = u.id and sp.role <> 'tenant';

-- Property complaints are scoped by landlord_id, not owner_id. Keep old installations compatible.
alter table public.property_complaints add column if not exists landlord_id uuid references auth.users(id) on delete cascade;
update public.property_complaints c set landlord_id = p.owner_id
from public.properties p where c.property_id = p.id and c.landlord_id is null;

-- Enable newly created tenant accounts to view only their own tenancy and its related records.
drop policy if exists "Tenants view their own tenancy" on public.tenants;
create policy "Tenants view their own tenancy" on public.tenants for select to authenticated
  using (lower(email) = lower(auth.jwt()->>'email'));
drop policy if exists "Tenants view their own charges" on public.service_charges;
create policy "Tenants view their own charges" on public.service_charges for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and lower(t.email) = lower(auth.jwt()->>'email')));
drop policy if exists "Tenants view their allocated property" on public.properties;
create policy "Tenants view their allocated property" on public.properties for select to authenticated
  using (exists (select 1 from public.tenants t where t.property_id = properties.id and lower(t.email) = lower(auth.jwt()->>'email')));
drop policy if exists "Tenants view assigned staff" on public.staff;
create policy "Tenants view assigned staff" on public.staff for select to authenticated
  using (exists (select 1 from public.tenants t where lower(t.email) = lower(auth.jwt()->>'email') and (t.agent_id = staff.id or t.caretaker_id = staff.id)));
drop policy if exists "Tenants view their guarantor records" on public.guarantors;
create policy "Tenants view their guarantor records" on public.guarantors for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and lower(t.email) = lower(auth.jwt()->>'email')));
drop policy if exists "Tenants view landlord contact profile" on public.landlord_profiles;
create policy "Tenants view landlord contact profile" on public.landlord_profiles for select to authenticated
  using (exists (select 1 from public.tenants t where t.owner_id = user_id and lower(t.email) = lower(auth.jwt()->>'email')));

-- Tenants can see only the packet delivery history for their own lease.
drop policy if exists "Tenants view their packet deliveries" on public.tenant_packet_deliveries;
create policy "Tenants view their packet deliveries" on public.tenant_packet_deliveries for select to authenticated
  using (exists (select 1 from public.tenants t where t.id = tenant_id and lower(t.email) = lower(auth.jwt()->>'email')));

-- Bind tenant account registrations to the matching lease and existing complaint records.
create or replace function public.create_landlord_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_invite_code text := nullif(lower(trim(new.raw_user_meta_data->>'invite_code')), '');
  v_account_role text := coalesce(new.raw_user_meta_data->>'account_role', 'landlord');
  v_stakeholder_role text := case when new.raw_user_meta_data->>'stakeholder_kind' = 'tenant' then 'tenant' else 'stakeholder' end;
  v_tenant_id uuid;
begin
  if v_account_role = 'stakeholder' then
    if v_stakeholder_role = 'tenant' then
      select t.id into v_tenant_id from public.tenants t where lower(t.email) = lower(new.email)
      order by t.created_at desc limit 1;
      if v_tenant_id is null then raise exception 'No tenant record uses this email address. Ask your landlord to add your email first.'; end if;
    end if;
    insert into public.stakeholder_profiles (user_id, full_name, role, tenant_id)
      values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), v_stakeholder_role, v_tenant_id)
      on conflict (user_id) do update set role = excluded.role, tenant_id = excluded.tenant_id;
    update public.property_complaints c set authenticated_reporter_id = new.id
      where c.authenticated_reporter_id is null and lower(c.email) = lower(new.email)
        and c.stakeholder_role <> 'Landlord'
        and (c.landlord_id is null or exists (select 1 from public.tenants t where t.id = v_tenant_id and t.owner_id = c.landlord_id
          and (c.property_id is null or t.property_id = c.property_id)));
    update public.property_complaints c set other_participant_id = new.id
      where c.other_participant_id is null and lower(c.other_participant_email) = lower(new.email)
        and exists (select 1 from public.tenants t where t.owner_id = c.landlord_id and lower(t.email) = lower(new.email));
    return new;
  end if;
  if v_invite_code is null then raise exception 'A Yemilaz Properties landlord access code is required to create this account.'; end if;
  update public.landlord_invite_codes set redeemed_by = new.id, redeemed_at = now()
    where invite_code = v_invite_code and redeemed_at is null and revoked_at is null and expires_at > now();
  if not found then raise exception 'This Yemilaz Properties landlord access code is invalid, expired, or already used.'; end if;
  insert into public.landlord_profiles (user_id, full_name, business_name, brand_template, brand_logo)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties'),
    case when new.raw_user_meta_data->>'brand_template' in ('jade','midnight','terracotta','plum') then new.raw_user_meta_data->>'brand_template' else 'jade' end,
    case when new.raw_user_meta_data->>'brand_logo' in ('estate','keystone','monogram','horizon','doorway') then new.raw_user_meta_data->>'brand_logo' else 'horizon' end)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
