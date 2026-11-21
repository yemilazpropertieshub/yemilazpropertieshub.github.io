-- Allow one authenticated person to hold and switch between several approved portal roles.
create table if not exists public.account_role_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('landlord','property_developer','tenant','agent','caretaker','lawyer','property_seeker','complainant','stakeholder')),
  tenant_id uuid references public.tenants(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (user_id, role),
  check ((role = 'tenant' and staff_id is null) or (role in ('agent','caretaker','lawyer') and tenant_id is null) or (role not in ('tenant','agent','caretaker','lawyer') and tenant_id is null and staff_id is null))
);
alter table public.account_role_memberships enable row level security;
revoke all on public.account_role_memberships from anon, authenticated;

create or replace function public.get_my_portal_options()
returns table(role text, tenant_id uuid, staff_id uuid)
language plpgsql stable security definer set search_path = '' as $$
declare v_email text; v_meta jsonb; v_profile public.stakeholder_profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to view your account profiles.'; end if;
  select u.email,u.raw_user_meta_data into v_email,v_meta from auth.users u where u.id=auth.uid();
  select * into v_profile from public.stakeholder_profiles sp where sp.user_id=auth.uid();

  -- Bring existing accounts into the multi-role directory without changing their records.
  if v_profile.user_id is not null then
    insert into public.account_role_memberships(user_id,role,tenant_id,staff_id)
    values(auth.uid(),case when v_profile.role='stakeholder' and v_meta->>'stakeholder_kind' in ('property_seeker','complainant') then v_meta->>'stakeholder_kind' else coalesce(nullif(v_profile.role,''),'stakeholder') end,v_profile.tenant_id,v_profile.staff_id)
    on conflict(user_id,role) do update set tenant_id=coalesce(excluded.tenant_id,account_role_memberships.tenant_id),staff_id=coalesce(excluded.staff_id,account_role_memberships.staff_id);
  end if;
  if coalesce(v_meta->>'account_role','') in ('landlord','property_developer') or exists(select 1 from public.landlord_profiles lp where lp.user_id=auth.uid()) then
    insert into public.account_role_memberships(user_id,role) values(auth.uid(),case when v_meta->>'stakeholder_kind'='property_developer' then 'property_developer' else 'landlord' end) on conflict do nothing;
  end if;
  if nullif(v_email,'') is not null then
    insert into public.account_role_memberships(user_id,role,tenant_id)
    select auth.uid(),'tenant',t.id from public.tenants t where lower(t.email)=lower(v_email)
    on conflict(user_id,role) do update set tenant_id=excluded.tenant_id;
    insert into public.account_role_memberships(user_id,role,staff_id)
    select auth.uid(),s.role,s.id from public.staff s where lower(s.email)=lower(v_email) and s.role in ('agent','caretaker','lawyer')
    on conflict(user_id,role) do update set staff_id=excluded.staff_id;
  end if;
  return query
    select m.role,m.tenant_id,m.staff_id from public.account_role_memberships m
    where m.user_id=auth.uid()
    order by case when m.role=coalesce(v_meta->>'account_role',v_profile.role) then 0 else 1 end,
      case m.role when 'landlord' then 1 when 'property_developer' then 2 when 'tenant' then 3 when 'agent' then 4 when 'caretaker' then 5 when 'lawyer' then 6 else 7 end;
end;
$$;
revoke all on function public.get_my_portal_options() from public,anon;
grant execute on function public.get_my_portal_options() to authenticated;

create or replace function public.review_account_upgrade(p_request_id uuid,p_decision text,p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.account_upgrade_requests%rowtype; v_email text; v_meta jsonb; v_tenant_id uuid; v_staff_id uuid;
  v_target text; v_profile_role text; v_full_name text; v_business_name text;
begin
  if not public.is_platform_account_reviewer() then raise exception 'Authorized account reviewer access required.'; end if;
  if p_decision not in ('approved','declined','reviewing') then raise exception 'Choose approve, decline, or mark as reviewing.'; end if;
  if p_notes is not null and char_length(p_notes)>3000 then raise exception 'Review notes must be 3,000 characters or fewer.'; end if;
  select * into v_request from public.account_upgrade_requests where id=p_request_id for update;
  if v_request.id is null then raise exception 'Account upgrade request not found.'; end if;
  if v_request.status in ('approved','declined') then raise exception 'This request has already been decided.'; end if;

  if p_decision='approved' then
    select u.email,u.raw_user_meta_data into v_email,v_meta from auth.users u where u.id=v_request.user_id;
    if v_email is null then raise exception 'The requesting account no longer exists.'; end if;
    v_target:=v_request.target_role;
    v_full_name:=coalesce(nullif(v_meta->>'full_name',''),v_request.requester_name,v_email);

    -- Preserve the prior role and its linked records before adding the approved role.
    if v_request.previous_role in ('landlord','property_developer') then
      insert into public.account_role_memberships(user_id,role) values(v_request.user_id,v_request.previous_role) on conflict do nothing;
    elsif v_request.previous_role in ('tenant','agent','caretaker','lawyer') then
      v_tenant_id:=null; v_staff_id:=null;
      if v_request.previous_role='tenant' then select t.id into v_tenant_id from public.tenants t where lower(t.email)=lower(v_email) order by t.created_at desc limit 1;
      else select s.id into v_staff_id from public.staff s where lower(s.email)=lower(v_email) and s.role=v_request.previous_role order by s.created_at desc limit 1; end if;
      insert into public.account_role_memberships(user_id,role,tenant_id,staff_id) values(v_request.user_id,v_request.previous_role,v_tenant_id,v_staff_id) on conflict(user_id,role) do update set tenant_id=coalesce(excluded.tenant_id,account_role_memberships.tenant_id),staff_id=coalesce(excluded.staff_id,account_role_memberships.staff_id);
    end if;

    v_tenant_id:=null; v_staff_id:=null;
    if v_target in ('landlord','property_developer') then
      v_business_name:=coalesce(nullif(v_request.proposed_business_name,''),nullif(v_meta->>'business_name',''),'Yemilaz Properties');
      insert into public.landlord_profiles(user_id,full_name,business_name,brand_template,brand_logo,phone,business_address)
      values(v_request.user_id,v_full_name,v_business_name,'jade','horizon',nullif(v_meta->>'phone',''),nullif(v_meta->>'permanent_address',''))
      on conflict(user_id) do update set full_name=excluded.full_name,business_name=coalesce(nullif(landlord_profiles.business_name,''),excluded.business_name);
      insert into public.account_role_memberships(user_id,role) values(v_request.user_id,v_target) on conflict do nothing;
    else
      if v_target='tenant' then
        select t.id into v_tenant_id from public.tenants t where lower(t.email)=lower(v_email) order by t.created_at desc limit 1;
        if v_tenant_id is null then raise exception 'A landlord must first create a tenant record using this account email.'; end if;
      elsif v_target in ('agent','caretaker','lawyer') then
        select s.id into v_staff_id from public.staff s where lower(s.email)=lower(v_email) and s.role=v_target order by s.created_at desc limit 1;
        if v_staff_id is null then raise exception 'A landlord must first create a matching staff assignment using this account email and role.'; end if;
      end if;
      insert into public.account_role_memberships(user_id,role,tenant_id,staff_id) values(v_request.user_id,v_target,v_tenant_id,v_staff_id)
      on conflict(user_id,role) do update set tenant_id=coalesce(excluded.tenant_id,account_role_memberships.tenant_id),staff_id=coalesce(excluded.staff_id,account_role_memberships.staff_id);
      v_profile_role:=case when v_target in ('property_seeker','complainant') then 'stakeholder' else v_target end;
      insert into public.stakeholder_profiles(user_id,full_name,role,tenant_id,staff_id)
      values(v_request.user_id,v_full_name,v_profile_role,v_tenant_id,v_staff_id)
      on conflict(user_id) do update set full_name=coalesce(nullif(public.stakeholder_profiles.full_name,''),excluded.full_name);
    end if;
    -- Keep the original sign-in role as the default; the portal selector changes the active view only.
    update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('full_name',v_full_name)
    where id=v_request.user_id;
  end if;

  update public.account_upgrade_requests set status=p_decision,reviewer_notes=nullif(trim(coalesce(p_notes,'')),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now()
  where id=p_request_id;
end;
$$;
revoke all on function public.review_account_upgrade(uuid,text,text) from public,anon;
grant execute on function public.review_account_upgrade(uuid,text,text) to authenticated;
