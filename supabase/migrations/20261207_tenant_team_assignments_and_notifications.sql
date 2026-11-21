-- Explicit tenant-to-team assignments with in-app notifications.
alter table public.tenants
  add column if not exists lawyer_id uuid references public.staff(id) on delete set null;

create index if not exists tenants_lawyer_id_idx on public.tenants(lawyer_id) where lawyer_id is not null;

create or replace function public.validate_tenant_team_assignments()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.agent_id is not null and not exists(select 1 from public.staff s where s.id=new.agent_id and s.owner_id=new.owner_id and s.role='agent') then
    raise exception 'Choose an agent from this property owner’s team.';
  end if;
  if new.caretaker_id is not null and not exists(select 1 from public.staff s where s.id=new.caretaker_id and s.owner_id=new.owner_id and s.role='caretaker') then
    raise exception 'Choose a caretaker from this property owner’s team.';
  end if;
  if new.lawyer_id is not null and not exists(select 1 from public.staff s where s.id=new.lawyer_id and s.owner_id=new.owner_id and s.role='lawyer') then
    raise exception 'Choose a lawyer from this property owner’s team.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_tenant_team_assignments on public.tenants;
create trigger validate_tenant_team_assignments
before insert or update of owner_id,agent_id,caretaker_id,lawyer_id on public.tenants
for each row execute function public.validate_tenant_team_assignments();


create or replace function public.user_is_assigned_to_tenant(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.tenants t
    join public.stakeholder_profiles sp on sp.user_id=auth.uid()
    join public.staff s on s.id=sp.staff_id
    where t.id=p_tenant_id and s.owner_id=t.owner_id
      and (t.agent_id=s.id or t.caretaker_id=s.id or t.lawyer_id=s.id)
  );
$$;
revoke all on function public.user_is_assigned_to_tenant(uuid) from public,anon;
grant execute on function public.user_is_assigned_to_tenant(uuid) to authenticated;

drop policy if exists "Assigned staff view related properties" on public.properties;
create policy "Assigned staff view related properties" on public.properties for select to authenticated using (
  exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id where sp.user_id=auth.uid() and s.owner_id=properties.owner_id and (s.property_id=properties.id or exists(select 1 from public.tenants t where t.owner_id=s.owner_id and t.property_id=properties.id and (t.agent_id=s.id or t.caretaker_id=s.id or t.lawyer_id=s.id))))
);

create or replace function public.user_can_view_staff(p_staff_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.tenants t where lower(t.email)=lower(auth.jwt()->>'email')
      and (t.agent_id=p_staff_id or t.caretaker_id=p_staff_id or t.lawyer_id=p_staff_id)
  );
$$;
revoke all on function public.user_can_view_staff(uuid) from public,anon;
grant execute on function public.user_can_view_staff(uuid) to authenticated;

drop policy if exists "Tenants view assigned staff" on public.staff;
create policy "Tenants view assigned staff" on public.staff for select to authenticated using (public.user_can_view_staff(id));

create or replace function public.list_tenant_complaint_recipients()
returns table(user_id uuid,full_name text,email text,role text)
language plpgsql stable security definer set search_path = '' as $$
declare v_tenant public.tenants%rowtype; v_allow boolean;
begin
  select t.* into v_tenant from public.tenants t where lower(t.email)=lower(auth.jwt()->>'email') order by t.created_at desc limit 1;
  if v_tenant.id is null then return; end if;
  select coalesce(lp.allow_direct_tenant_complaints,true) into v_allow from public.landlord_profiles lp where lp.user_id=v_tenant.owner_id;
  if coalesce(v_allow,true) then
    return query select u.id,coalesce(lp.full_name,lp.business_name)::text,u.email::text,'landlord'::text from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_tenant.owner_id;
  end if;
  return query select u.id,s.full_name::text,u.email::text,s.role::text from public.staff s join auth.users u on lower(u.email)=lower(s.email)
    where s.owner_id=v_tenant.owner_id and s.id in (v_tenant.agent_id,v_tenant.caretaker_id,v_tenant.lawyer_id);
end; $$;
revoke all on function public.list_tenant_complaint_recipients() from public,anon;
grant execute on function public.list_tenant_complaint_recipients() to authenticated;

create or replace function public.notify_tenant_team_assignment_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_recipients uuid[];
  v_team text;
  v_message text;
  v_tenant_user uuid;
  v_role_changed boolean;
begin
  if tg_op='INSERT' then
    v_role_changed := true;
  else
    v_role_changed := old.agent_id is distinct from new.agent_id
      or old.caretaker_id is distinct from new.caretaker_id
      or old.lawyer_id is distinct from new.lawyer_id;
  end if;
  if not v_role_changed then return new; end if;

  select string_agg(concat_ws(' ',s.role, s.full_name), ', ' order by s.role)
    into v_team from public.staff s
    where s.id in (new.agent_id,new.caretaker_id,new.lawyer_id);
  v_team := coalesce(v_team, 'no team members');
  v_message := format('The team linked to %s was updated: %s.', new.full_name, v_team);
  select u.id into v_tenant_user from auth.users u where lower(u.email)=lower(new.email) limit 1;
  v_recipients := array[ new.owner_id, v_tenant_user ];
  select array_cat(v_recipients, coalesce(array_agg(sp.user_id), '{}'::uuid[])) into v_recipients
    from public.stakeholder_profiles sp where sp.staff_id in (new.agent_id,new.caretaker_id,new.lawyer_id,case when tg_op='UPDATE' then old.agent_id end,case when tg_op='UPDATE' then old.caretaker_id end,case when tg_op='UPDATE' then old.lawyer_id end);

  insert into public.user_notifications(user_id,title,message,category,target_path,target_id)
  select distinct recipient_id,
    case when recipient_id=new.owner_id then 'Tenant team assignment updated'
         when recipient_id=v_tenant_user then 'Your property support team was updated'
         else 'Tenant assignment updated' end,
    v_message,'tenant_assignment','#workspace',new.id
  from unnest(v_recipients) as recipients(recipient_id)
  where recipient_id is not null;
  return new;
end;
$$;

drop trigger if exists notify_tenant_team_assignment_change on public.tenants;
create trigger notify_tenant_team_assignment_change
after insert or update of agent_id,caretaker_id,lawyer_id on public.tenants
for each row execute function public.notify_tenant_team_assignment_change();




-- Tenant complaint routing now recognizes the lawyer, agent, and caretaker assigned to that tenancy.
create or replace function public.link_property_complaint_participants()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_target uuid; v_allowed boolean; v_tenant public.tenants%rowtype;
begin
  new.landlord_id:=null; new.assigned_recipient_id:=null; new.other_participant_id:=null;
  new.resolution_proposed_by:=null; new.resolution_proposed_at:=null; new.resolution_approved_at:=null; new.status:='new';
  if auth.uid() is not null then new.authenticated_reporter_id:=auth.uid(); select u.email into new.email from auth.users u where u.id=auth.uid(); end if;
  if new.property_id is not null then select p.owner_id into new.landlord_id from public.properties p where p.id=new.property_id;
  elsif new.landlord_id is null then select p.owner_id,p.id into new.landlord_id,new.property_id from public.properties p where p.is_advertised and lower(trim(concat_ws(', ',p.address,p.city,p.state,p.country)))=lower(trim(new.property_address)) order by p.created_at desc limit 1; end if;
  if new.stakeholder_role='Landlord' and auth.uid()=new.landlord_id and new.other_participant_email is not null then
    select u.id into v_target from auth.users u join public.tenants t on lower(t.email)=lower(u.email)
      where lower(u.email)=lower(trim(new.other_participant_email)) and t.owner_id=new.landlord_id
        and (new.property_id is null or t.property_id=new.property_id) limit 1;
    if v_target is not null then new.other_participant_id:=v_target; else new.other_participant_email:=null; end if;
  elsif new.stakeholder_role='Tenant' and auth.uid() is not null then
    select t.* into v_tenant from public.tenants t where lower(t.email)=lower(auth.jwt()->>'email')
      and t.owner_id=new.landlord_id and (new.property_id is null or t.property_id=new.property_id)
      order by t.created_at desc limit 1;
    if v_tenant.id is null then raise exception 'Your signed-in tenant account is not linked to this property.'; end if;
    if coalesce(lower(trim(new.other_participant_email)),'')='' or lower(trim(new.other_participant_email))=lower((select u.email from auth.users u where u.id=new.landlord_id)) then
      select coalesce(lp.allow_direct_tenant_complaints,true) into v_allowed from public.landlord_profiles lp where lp.user_id=new.landlord_id;
      if not coalesce(v_allowed,true) then raise exception 'This landlord has directed tenant complaints to the assigned property team.'; end if;
      v_target:=new.landlord_id;
    else
      select u.id into v_target from auth.users u join public.staff s on lower(s.email)=lower(u.email)
      where s.owner_id=new.landlord_id and lower(s.email)=lower(trim(new.other_participant_email))
        and s.id in (v_tenant.agent_id,v_tenant.caretaker_id,v_tenant.lawyer_id) limit 1;
      if v_target is null then raise exception 'Choose the landlord or a professional assigned to your tenancy.'; end if;
    end if;
    new.assigned_recipient_id:=v_target; new.other_participant_id:=v_target;
  else new.other_participant_email:=null; end if;
  if new.stakeholder_role='Landlord' and auth.uid() is not null and auth.uid()<>new.landlord_id then raise exception 'Only the owner of this property can lodge a landlord complaint'; end if;
  return new;
end; $$;

-- Tenant and assigned staff can message the actual team linked to that tenancy.
create or replace function public.list_property_conversation_contacts()
returns table(user_id uuid,tenant_id uuid,full_name text,email text,property_id uuid,role text)
language plpgsql stable security definer set search_path = '' as $$
declare v_owner uuid; v_role text; v_staff uuid; v_tenant uuid;
begin
  select sp.role,sp.staff_id,sp.tenant_id into v_role,v_staff,v_tenant
    from public.stakeholder_profiles sp where sp.user_id=auth.uid();
  if v_role='tenant' then
    select t.id,t.owner_id into v_tenant,v_owner from public.tenants t
      where lower(t.email)=lower(auth.jwt()->>'email') order by t.created_at desc limit 1;
  elsif v_role in ('agent','caretaker','lawyer') then
    select s.owner_id into v_owner from public.staff s where s.id=v_staff;
  else v_owner:=auth.uid(); end if;
  if v_owner is null then return; end if;

  if v_role is null or v_role='landlord' then
    return query
      select u.id,t.id,t.full_name::text,t.email::text,t.property_id,'tenant'::text
      from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.owner_id=v_owner
      union all
      select u.id,null::uuid,s.full_name::text,s.email::text,s.property_id,s.role::text
      from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner;
  elsif v_role='tenant' then
    return query
      select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name)::text,u.email::text,null::uuid,'landlord'::text
      from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union all
      select u.id,v_tenant,s.full_name::text,s.email::text,s.property_id,s.role::text
      from public.tenants t join public.staff s on s.id in (t.agent_id,t.caretaker_id,t.lawyer_id)
      join auth.users u on lower(u.email)=lower(s.email)
      where t.id=v_tenant and s.owner_id=v_owner;
  else
    return query
      select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name)::text,u.email::text,null::uuid,'landlord'::text
      from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union
      select u.id,t.id,t.full_name::text,t.email::text,t.property_id,'tenant'::text
      from public.tenants t join auth.users u on lower(u.email)=lower(t.email)
      where t.owner_id=v_owner and v_staff in (t.agent_id,t.caretaker_id,t.lawyer_id)
      union
      select distinct u.id,null::uuid,s.full_name::text,s.email::text,s.property_id,s.role::text
      from public.tenants t join public.staff s on s.id in (t.agent_id,t.caretaker_id,t.lawyer_id)
      join auth.users u on lower(u.email)=lower(s.email)
      where t.owner_id=v_owner and v_staff in (t.agent_id,t.caretaker_id,t.lawyer_id) and s.id<>v_staff;
  end if;
end; $$;
revoke all on function public.list_property_conversation_contacts() from public,anon;
grant execute on function public.list_property_conversation_contacts() to authenticated;

