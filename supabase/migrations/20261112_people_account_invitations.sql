-- Link tenant, agent, and caretaker logins to the landlord-owned records they belong to.
alter table public.stakeholder_profiles
  add column if not exists staff_id uuid references public.staff(id) on delete set null,
  add column if not exists phone text,
  add column if not exists permanent_address text;
alter table public.tenants add column if not exists permanent_address text;
alter table public.staff add column if not exists permanent_address text;
alter table public.landlord_profiles add column if not exists permanent_address text;

alter table public.stakeholder_profiles drop constraint if exists stakeholder_profiles_role_check;
alter table public.stakeholder_profiles add constraint stakeholder_profiles_role_check
  check (role in ('tenant', 'stakeholder', 'agent', 'caretaker'));
create unique index if not exists stakeholder_profiles_staff_id_uidx
  on public.stakeholder_profiles(staff_id) where staff_id is not null;

-- A staff login can see only its own staff record and its assigned tenancy records.
drop policy if exists "Staff view their own directory record" on public.staff;
create policy "Staff view their own directory record" on public.staff for select to authenticated
  using (exists (select 1 from public.stakeholder_profiles sp where sp.user_id = auth.uid() and sp.staff_id = staff.id));

drop policy if exists "Assigned staff view their tenants" on public.tenants;
create policy "Assigned staff view their tenants" on public.tenants for select to authenticated
  using (exists (
    select 1 from public.stakeholder_profiles sp join public.staff s on s.id = sp.staff_id
    where sp.user_id = auth.uid() and s.owner_id = tenants.owner_id
      and (tenants.agent_id = s.id or tenants.caretaker_id = s.id)
  ));

drop policy if exists "Assigned staff view related properties" on public.properties;
create policy "Assigned staff view related properties" on public.properties for select to authenticated
  using (
    exists (select 1 from public.stakeholder_profiles sp join public.staff s on s.id = sp.staff_id
      where sp.user_id = auth.uid() and s.property_id = properties.id)
    or exists (select 1 from public.tenants t join public.stakeholder_profiles sp on sp.user_id = auth.uid()
      join public.staff s on s.id = sp.staff_id
      where t.property_id = properties.id and s.owner_id = t.owner_id
        and (t.agent_id = s.id or t.caretaker_id = s.id))
  );

-- Resolve invited accounts only when the verified signup email matches the stored contact.
create or replace function public.create_landlord_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_invite_code text := nullif(lower(trim(new.raw_user_meta_data->>'invite_code')), '');
  v_account_role text := coalesce(new.raw_user_meta_data->>'account_role', 'landlord');
  v_stakeholder_role text := lower(coalesce(new.raw_user_meta_data->>'stakeholder_kind', 'stakeholder'));
  v_tenant_id uuid;
  v_staff_id uuid;
begin
  if v_account_role = 'stakeholder' then
    if v_stakeholder_role = 'tenant' then
      select t.id into v_tenant_id from public.tenants t
      where lower(t.email) = lower(new.email)
      order by t.created_at desc limit 1;
      if v_tenant_id is null then raise exception 'No tenant record uses this email address. Ask the landlord to add your email first.'; end if;
      update public.tenants set phone = coalesce(nullif(new.raw_user_meta_data->>'phone', ''), phone),
        permanent_address = nullif(new.raw_user_meta_data->>'permanent_address', '') where id = v_tenant_id;
    elsif v_stakeholder_role in ('agent', 'caretaker') then
      select s.id into v_staff_id from public.staff s
      where lower(s.email) = lower(new.email) and s.role = v_stakeholder_role
      order by s.created_at desc limit 1;
      if v_staff_id is null then raise exception 'No matching staff invitation exists for this email. Ask the landlord to register your email.'; end if;
      update public.staff set phone = coalesce(nullif(new.raw_user_meta_data->>'phone', ''), phone),
        permanent_address = nullif(new.raw_user_meta_data->>'permanent_address', '') where id = v_staff_id;
    else
      v_stakeholder_role := 'stakeholder';
    end if;

    insert into public.stakeholder_profiles (user_id, full_name, role, tenant_id, staff_id, phone, permanent_address)
      values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), v_stakeholder_role, v_tenant_id, v_staff_id,
        nullif(new.raw_user_meta_data->>'phone', ''), nullif(new.raw_user_meta_data->>'permanent_address', ''))
      on conflict (user_id) do update set role = excluded.role, tenant_id = excluded.tenant_id, staff_id = excluded.staff_id,
        full_name = excluded.full_name, phone = excluded.phone, permanent_address = excluded.permanent_address;

    update public.property_complaints c set authenticated_reporter_id = new.id
      where c.authenticated_reporter_id is null and lower(c.email) = lower(new.email)
        and c.stakeholder_role <> 'Landlord'
        and (c.landlord_id is null or exists (select 1 from public.tenants t where t.id = v_tenant_id and t.owner_id = c.landlord_id
          and (c.property_id is null or t.property_id = c.property_id)));
    update public.property_complaints c set other_participant_id = new.id
      where c.other_participant_id is null and lower(c.other_participant_email) = lower(new.email)
        and (exists (select 1 from public.tenants t where t.owner_id = c.landlord_id and lower(t.email) = lower(new.email))
          or exists (select 1 from public.staff s where s.id = v_staff_id and s.owner_id = c.landlord_id and lower(s.email) = lower(new.email)));
    return new;
  end if;

  if v_invite_code is null then raise exception 'A Yemilaz Properties landlord access code is required to create this account.'; end if;
  update public.landlord_invite_codes set redeemed_by = new.id, redeemed_at = now()
    where invite_code = v_invite_code and redeemed_at is null and revoked_at is null and expires_at > now();
  if not found then raise exception 'This Yemilaz Properties landlord access code is invalid, expired, or already used.'; end if;
  insert into public.landlord_profiles (user_id, full_name, business_name, brand_template, brand_logo, phone, permanent_address)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties'),
    case when new.raw_user_meta_data->>'brand_template' in ('jade','midnight','terracotta','plum') then new.raw_user_meta_data->>'brand_template' else 'jade' end,
    case when new.raw_user_meta_data->>'brand_logo' in ('estate','keystone','monogram','horizon','doorway') then new.raw_user_meta_data->>'brand_logo' else 'horizon' end,
    nullif(new.raw_user_meta_data->>'phone', ''), nullif(new.raw_user_meta_data->>'permanent_address', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
