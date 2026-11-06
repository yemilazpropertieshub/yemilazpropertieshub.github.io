-- Fix Postgres RPC row-shape errors for tenant complaint recipients and
-- property conversation contacts. auth.users.email is varchar in Supabase;
-- cast output columns explicitly to match the functions' declared text types.

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
    return query select u.id,t.id,t.full_name::text,t.email::text,t.property_id,'tenant'::text
      from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.owner_id=v_owner
      union all
      select u.id,null::uuid,s.full_name::text,s.email::text,s.property_id,s.role::text
      from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner;
  elsif v_role='lawyer' then
    return query select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name)::text,u.email::text,null::uuid,'landlord'::text
      from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union all
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
      select u.id,t.id,s.full_name::text,s.email::text,s.property_id,s.role::text
      from public.tenants t join public.staff s on s.id=t.agent_id or s.id=t.caretaker_id
      join auth.users u on lower(u.email)=lower(s.email) where t.id=v_tenant and s.owner_id=v_owner
      union all
      select u.id,null::uuid,s.full_name::text,s.email::text,s.property_id,'lawyer'::text
      from public.staff s join auth.users u on lower(u.email)=lower(s.email) where s.owner_id=v_owner and s.role='lawyer';
  else
    return query
      select v_owner,null::uuid,coalesce(lp.full_name,lp.business_name)::text,u.email::text,null::uuid,'landlord'::text
      from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_owner
      union all
      select u.id,t.id,t.full_name::text,t.email::text,t.property_id,'tenant'::text
      from public.tenants t join auth.users u on lower(u.email)=lower(t.email)
      where t.owner_id=v_owner and (t.agent_id=v_staff or t.caretaker_id=v_staff or exists(
        select 1 from public.tenants tx where tx.id=t.id and tx.property_id=(select s.property_id from public.staff s where s.id=v_staff)))
      union all
      select u.id,null::uuid,s.full_name::text,s.email::text,s.property_id,s.role::text
      from public.staff s join auth.users u on lower(u.email)=lower(s.email)
      where s.owner_id=v_owner and s.id<>v_staff and (v_role='lawyer' or s.role='lawyer'
        or s.property_id=(select sx.property_id from public.staff sx where sx.id=v_staff)
        or exists(select 1 from public.tenants t where t.owner_id=v_owner and t.agent_id in (s.id,v_staff) and t.caretaker_id in (s.id,v_staff)));
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
    return query select u.id,coalesce(lp.full_name,lp.business_name)::text,u.email::text,'landlord'::text
      from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where u.id=v_tenant.owner_id;
  end if;
  return query select u.id,s.full_name::text,u.email::text,s.role::text
    from public.staff s join auth.users u on lower(u.email)=lower(s.email)
    where s.owner_id=v_tenant.owner_id and s.role in ('agent','caretaker') and s.id in (v_tenant.agent_id,v_tenant.caretaker_id);
end; $$;
revoke all on function public.list_tenant_complaint_recipients() from public,anon;
grant execute on function public.list_tenant_complaint_recipients() to authenticated;
