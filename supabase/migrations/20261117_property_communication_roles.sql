-- Lawyer workspace, role-aware property messaging, and routed tenant complaints.

alter table public.stakeholder_profiles drop constraint if exists stakeholder_profiles_role_check;
alter table public.stakeholder_profiles add constraint stakeholder_profiles_role_check
  check (role in ('tenant','stakeholder','agent','caretaker','lawyer'));
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check check (role in ('agent','caretaker','lawyer'));

-- Keep an already activated staff login in sync when its landlord changes its role.
create or replace function public.sync_staff_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role is distinct from new.role then
    update public.stakeholder_profiles
      set role=new.role
      where staff_id=new.id and role in ('agent','caretaker','lawyer');
  end if;
  return new;
end; $$;
drop trigger if exists sync_staff_profile_role on public.staff;
create trigger sync_staff_profile_role after update of role on public.staff
  for each row execute function public.sync_staff_profile_role();

alter table public.landlord_profiles add column if not exists allow_direct_tenant_complaints boolean not null default true;
alter table public.property_complaints add column if not exists assigned_recipient_id uuid references auth.users(id) on delete set null;

-- Extend the verified-email signup link so invited lawyers are attached to their staff record.
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
      select t.id into v_tenant_id from public.tenants t where lower(t.email)=lower(new.email) order by t.created_at desc limit 1;
      if v_tenant_id is null then raise exception 'No tenant record uses this email address. Ask the landlord to add your email first.'; end if;
      update public.tenants set phone=coalesce(nullif(new.raw_user_meta_data->>'phone',''),phone), permanent_address=nullif(new.raw_user_meta_data->>'permanent_address','') where id=v_tenant_id;
    elsif v_stakeholder_role in ('agent','caretaker','lawyer') then
      select s.id into v_staff_id from public.staff s where lower(s.email)=lower(new.email) and s.role=v_stakeholder_role order by s.created_at desc limit 1;
      if v_staff_id is null then raise exception 'No matching staff invitation exists for this email. Ask the landlord to register your email.'; end if;
      update public.staff set phone=coalesce(nullif(new.raw_user_meta_data->>'phone',''),phone), permanent_address=nullif(new.raw_user_meta_data->>'permanent_address','') where id=v_staff_id;
    else v_stakeholder_role := 'stakeholder';
    end if;
    insert into public.stakeholder_profiles(user_id,full_name,role,tenant_id,staff_id,phone,permanent_address)
    values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),v_stakeholder_role,v_tenant_id,v_staff_id,nullif(new.raw_user_meta_data->>'phone',''),nullif(new.raw_user_meta_data->>'permanent_address',''))
    on conflict(user_id) do update set role=excluded.role,tenant_id=excluded.tenant_id,staff_id=excluded.staff_id,full_name=excluded.full_name,phone=excluded.phone,permanent_address=excluded.permanent_address;
    update public.property_complaints c set authenticated_reporter_id=new.id
      where c.authenticated_reporter_id is null and lower(c.email)=lower(new.email) and c.stakeholder_role<>'Landlord'
        and (c.landlord_id is null or exists(select 1 from public.tenants t where t.id=v_tenant_id and t.owner_id=c.landlord_id and (c.property_id is null or t.property_id=c.property_id)));
    update public.property_complaints c set other_participant_id=new.id
      where c.other_participant_id is null and lower(c.other_participant_email)=lower(new.email)
        and (exists(select 1 from public.tenants t where t.owner_id=c.landlord_id and lower(t.email)=lower(new.email))
          or exists(select 1 from public.staff s where s.id=v_staff_id and s.owner_id=c.landlord_id and lower(s.email)=lower(new.email)));
    return new;
  end if;
  if v_invite_code is null then raise exception 'A Yemilaz Properties landlord access code is required to create this account.'; end if;
  update public.landlord_invite_codes set redeemed_by=new.id,redeemed_at=now() where invite_code=v_invite_code and redeemed_at is null and revoked_at is null and expires_at>now();
  if not found then raise exception 'This Yemilaz Properties landlord access code is invalid, expired, or already used.'; end if;
  insert into public.landlord_profiles(user_id,full_name,business_name,brand_template,brand_logo,phone,permanent_address)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'Yemilaz Properties'),
    case when new.raw_user_meta_data->>'brand_template' in ('jade','midnight','terracotta','plum') then new.raw_user_meta_data->>'brand_template' else 'jade' end,
    case when new.raw_user_meta_data->>'brand_logo' in ('estate','keystone','monogram','horizon','doorway') then new.raw_user_meta_data->>'brand_logo' else 'horizon' end,
    nullif(new.raw_user_meta_data->>'phone',''),nullif(new.raw_user_meta_data->>'permanent_address','')) on conflict(user_id) do nothing;
  return new;
end; $$;

-- Return only communication contacts related to the signed-in account's property owner.
create or replace function public.list_property_conversation_contacts()
returns table(user_id uuid,tenant_id uuid,full_name text,email text,property_id uuid,role text)
language plpgsql stable security definer set search_path = '' as $$
declare v_owner uuid; v_role text; v_staff uuid; v_tenant uuid;
begin
  select sp.role,sp.staff_id,sp.tenant_id into v_role,v_staff,v_tenant from public.stakeholder_profiles sp where sp.user_id=auth.uid();
  if v_role='tenant' then
    select t.id,t.owner_id into v_tenant,v_owner from public.tenants t where lower(t.email)=lower(auth.jwt()->>'email') order by t.created_at desc limit 1;
  elsif v_role in ('agent','caretaker','lawyer') then
    select s.owner_id into v_owner from public.staff s where s.id=v_staff;
  else v_owner:=auth.uid();
  end if;
  if v_owner is null then return; end if;
  if v_role is null or v_role='landlord' then
    return query select u.id,t.id,t.full_name,t.email,t.property_id,'tenant'::text from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.owner_id=v_owner
      union all
      select u.id,null::uuid,s.full_name,s.email,s.property_id,s.role from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner;
  elsif v_role='lawyer' then
    return query select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name),u.email,null::uuid,'landlord'::text from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union all
      select u.id,t.id,t.full_name,t.email,t.property_id,'tenant'::text from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.owner_id=v_owner
      union all
      select u.id,null::uuid,s.full_name,s.email,s.property_id,s.role from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner;
  elsif v_role='tenant' then
    return query
      select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name),u.email,null::uuid,'landlord'::text from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union all
      select u.id,t.id,s.full_name,s.email,s.property_id,s.role from public.tenants t join public.staff s on s.id=t.agent_id or s.id=t.caretaker_id join auth.users u on lower(u.email)=lower(s.email) where t.id=v_tenant and s.owner_id=v_owner
      union all
      select u.id,null::uuid,s.full_name,s.email,s.property_id,'lawyer'::text from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner and s.role='lawyer';
  else
    return query
      select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name),u.email,null::uuid,'landlord'::text from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union all
      select u.id,t.id,t.full_name,t.email,t.property_id,'tenant'::text from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.owner_id=v_owner and (t.agent_id=v_staff or t.caretaker_id=v_staff or exists(select 1 from public.tenants tx where tx.id=t.id and tx.property_id=(select s.property_id from public.staff s where s.id=v_staff)))
      union all
      select u.id,null::uuid,s.full_name,s.email,s.property_id,s.role from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner and s.id<>v_staff and (v_role='lawyer' or s.role='lawyer' or s.property_id=(select sx.property_id from public.staff sx where sx.id=v_staff) or exists(select 1 from public.tenants t where t.owner_id=v_owner and t.agent_id in (s.id,v_staff) and t.caretaker_id in (s.id,v_staff)));
  end if;
end; $$;
revoke all on function public.list_property_conversation_contacts() from public,anon;
grant execute on function public.list_property_conversation_contacts() to authenticated;

create or replace function public.list_tenant_complaint_recipients()
returns table(user_id uuid,full_name text,email text,role text)
language plpgsql stable security definer set search_path = '' as $$
declare v_tenant public.tenants%rowtype; v_allow boolean;
begin
  select t.* into v_tenant from public.tenants t where lower(t.email)=lower(auth.jwt()->>'email') order by t.created_at desc limit 1;
  if v_tenant.id is null then return; end if;
  select coalesce(lp.allow_direct_tenant_complaints,true) into v_allow from public.landlord_profiles lp where lp.user_id=v_tenant.owner_id;
  if coalesce(v_allow,true) then
    return query select u.id,coalesce(lp.full_name,lp.business_name),u.email,'landlord'::text from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_tenant.owner_id;
  end if;
  return query select u.id,s.full_name,u.email,s.role from public.staff s join auth.users u on lower(u.email)=lower(s.email)
    where s.owner_id=v_tenant.owner_id and s.role in ('agent','caretaker') and s.id in (v_tenant.agent_id,v_tenant.caretaker_id);
end; $$;
revoke all on function public.list_tenant_complaint_recipients() from public,anon;
grant execute on function public.list_tenant_complaint_recipients() to authenticated;

create or replace function public.current_property_message_owner() returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_role text; v_staff uuid; v_owner uuid;
begin
 select role,staff_id into v_role,v_staff from public.stakeholder_profiles where user_id=auth.uid();
 if v_role in ('agent','caretaker','lawyer') then select owner_id into v_owner from public.staff where id=v_staff; return v_owner; end if;
 if v_role='tenant' then select owner_id into v_owner from public.tenants where lower(email)=lower(auth.jwt()->>'email') order by created_at desc limit 1; return v_owner; end if;
 return auth.uid();
end; $$;
revoke all on function public.current_property_message_owner() from public,anon;
grant execute on function public.current_property_message_owner() to authenticated;

-- Give lawyers portfolio-wide read access to property and tenant context, while agent/caretaker access stays assigned.
drop policy if exists "Assigned staff view their tenants" on public.tenants;
create policy "Assigned staff view their tenants" on public.tenants for select to authenticated using (
  exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id where sp.user_id=auth.uid() and s.owner_id=tenants.owner_id and (sp.role='lawyer' or tenants.agent_id=s.id or tenants.caretaker_id=s.id))
);
drop policy if exists "Assigned staff view related properties" on public.properties;
create policy "Assigned staff view related properties" on public.properties for select to authenticated using (
  exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id where sp.user_id=auth.uid() and s.owner_id=properties.owner_id and (sp.role='lawyer' or s.property_id=properties.id or exists(select 1 from public.tenants t where t.owner_id=s.owner_id and t.property_id=properties.id and (t.agent_id=s.id or t.caretaker_id=s.id))))
);

drop policy if exists "Conversation participants read messages" on public.property_messages;
create policy "Conversation participants read messages" on public.property_messages for select to authenticated
  using(sender_id=auth.uid() or recipient_id=auth.uid() or owner_id=auth.uid());
drop policy if exists "Participants send messages" on public.property_messages;
create policy "Participants send messages" on public.property_messages for insert to authenticated with check (
  sender_id=auth.uid() and exists(select 1 from public.list_property_conversation_contacts() c where c.user_id=property_messages.recipient_id)
  and owner_id=public.current_property_message_owner()
);

-- Complaint routing is validated server-side. A landlord may opt out of direct tenant complaints;
-- those cases are visible to the tenant, assigned staff recipient, and platform administrators.
create or replace function public.link_property_complaint_participants()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_target uuid; v_owner uuid; v_allowed boolean; v_tenant public.tenants%rowtype;
begin
  new.landlord_id:=null; new.assigned_recipient_id:=null; new.other_participant_id:=null;
  new.resolution_proposed_by:=null; new.resolution_proposed_at:=null; new.resolution_approved_at:=null; new.status:='new';
  if auth.uid() is not null then new.authenticated_reporter_id:=auth.uid(); select u.email into new.email from auth.users u where u.id=auth.uid(); end if;
  if new.property_id is not null then select p.owner_id into new.landlord_id from public.properties p where p.id=new.property_id;
  elsif new.landlord_id is null then select p.owner_id,p.id into new.landlord_id,new.property_id from public.properties p where p.is_advertised and lower(trim(concat_ws(', ',p.address,p.city,p.state,p.country)))=lower(trim(new.property_address)) order by p.created_at desc limit 1; end if;
  if new.stakeholder_role='Landlord' and auth.uid()=new.landlord_id and new.other_participant_email is not null then
    select u.id into v_target from auth.users u join public.tenants t on lower(t.email)=lower(u.email) where lower(u.email)=lower(trim(new.other_participant_email)) and t.owner_id=new.landlord_id and (new.property_id is null or t.property_id=new.property_id) limit 1;
    if v_target is not null then new.other_participant_id:=v_target; else new.other_participant_email:=null; end if;
  elsif new.stakeholder_role='Tenant' and auth.uid() is not null then
    select t.* into v_tenant from public.tenants t where lower(t.email)=lower(auth.jwt()->>'email') and t.owner_id=new.landlord_id and (new.property_id is null or t.property_id=new.property_id) order by t.created_at desc limit 1;
    if v_tenant.id is null then raise exception 'Your signed-in tenant account is not linked to this property.'; end if;
    if coalesce(lower(trim(new.other_participant_email)),'')='' or lower(trim(new.other_participant_email))=lower((select u.email from auth.users u where u.id=new.landlord_id)) then
      select coalesce(lp.allow_direct_tenant_complaints,true) into v_allowed from public.landlord_profiles lp where lp.user_id=new.landlord_id;
      if not coalesce(v_allowed,true) then raise exception 'This landlord has directed tenant complaints to the assigned agent or caretaker.'; end if;
      v_target:=new.landlord_id;
    else
      select u.id into v_target from auth.users u join public.staff s on lower(s.email)=lower(u.email)
      where s.owner_id=new.landlord_id and lower(s.email)=lower(trim(new.other_participant_email)) and s.role in ('agent','caretaker')
        and s.id in (v_tenant.agent_id,v_tenant.caretaker_id) limit 1;
      if v_target is null then raise exception 'Choose the landlord or an agent/caretaker assigned to your tenancy.'; end if;
    end if;
    new.assigned_recipient_id:=v_target; new.other_participant_id:=v_target;
  else new.other_participant_email:=null; end if;
  if new.stakeholder_role='Landlord' and auth.uid() is not null and auth.uid()<>new.landlord_id then raise exception 'Only the owner of this property can lodge a landlord complaint'; end if;
  return new;
end; $$;
drop trigger if exists link_property_complaint_participants on public.property_complaints;
create trigger link_property_complaint_participants before insert on public.property_complaints for each row execute function public.link_property_complaint_participants();

drop policy if exists "Complaint participants read their cases" on public.property_complaints;
create policy "Complaint participants read their cases" on public.property_complaints for select to authenticated using (
  authenticated_reporter_id=auth.uid() or other_participant_id=auth.uid()
  or (landlord_id=auth.uid() and not (stakeholder_role='Tenant' and assigned_recipient_id is not null and assigned_recipient_id<>auth.uid()))
);
drop policy if exists "Complaint participants read messages" on public.property_complaint_messages;
create policy "Complaint participants read messages" on public.property_complaint_messages for select to authenticated using (
  exists(select 1 from public.property_complaints c where c.id=complaint_id and (c.authenticated_reporter_id=auth.uid() or c.other_participant_id=auth.uid() or (c.landlord_id=auth.uid() and not (c.stakeholder_role='Tenant' and c.assigned_recipient_id is not null and c.assigned_recipient_id<>auth.uid()))))
);
drop policy if exists "Complaint participants write messages" on public.property_complaint_messages;
create policy "Complaint participants write messages" on public.property_complaint_messages for insert to authenticated with check (
 sender_id=auth.uid() and exists(select 1 from public.property_complaints c where c.id=complaint_id and (c.authenticated_reporter_id=auth.uid() or c.other_participant_id=auth.uid() or (c.landlord_id=auth.uid() and not (c.stakeholder_role='Tenant' and c.assigned_recipient_id is not null and c.assigned_recipient_id<>auth.uid()))))
);

-- Resolution actions use security-definer functions, so repeat the complaint visibility rule there.
create or replace function public.propose_complaint_resolution(p_complaint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.property_complaints set status='in_review',resolution_proposed_by=auth.uid()::text,resolution_proposed_at=now(),resolution_approved_at=null
 where id=p_complaint_id and (authenticated_reporter_id=auth.uid() or other_participant_id=auth.uid() or (landlord_id=auth.uid() and not (stakeholder_role='Tenant' and assigned_recipient_id is not null and assigned_recipient_id<>auth.uid())));
 if not found then raise exception 'Complaint not found or access denied'; end if;
end; $$;
create or replace function public.approve_complaint_resolution(p_complaint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.property_complaints set status='resolved',resolution_approved_at=now() where id=p_complaint_id and resolution_proposed_at is not null and resolution_proposed_by<>auth.uid()::text
   and (authenticated_reporter_id=auth.uid() or other_participant_id=auth.uid() or (landlord_id=auth.uid() and not (stakeholder_role='Tenant' and assigned_recipient_id is not null and assigned_recipient_id<>auth.uid())));
 if not found then raise exception 'Only the other complaint participant can approve a proposed resolution'; end if;
end; $$;
create or replace function public.request_complaint_rework(p_complaint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.property_complaints set status='in_review',resolution_proposed_by=null,resolution_proposed_at=null,resolution_approved_at=null where id=p_complaint_id and resolution_proposed_at is not null and resolution_proposed_by<>auth.uid()::text
   and (authenticated_reporter_id=auth.uid() or other_participant_id=auth.uid() or (landlord_id=auth.uid() and not (stakeholder_role='Tenant' and assigned_recipient_id is not null and assigned_recipient_id<>auth.uid())));
 if not found then raise exception 'Only the other complaint participant can request further work'; end if;
end; $$;
