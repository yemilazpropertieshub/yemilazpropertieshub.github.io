-- Caretaker operations: assigned maintenance updates, inspections, photo evidence,
-- incident reports, and landlord notifications. Access is limited to linked properties.

drop policy if exists "Assigned staff update maintenance requests" on public.maintenance_requests;

drop policy if exists "Assigned caretakers read maintenance updates" on public.maintenance_request_updates;
create policy "Assigned caretakers read maintenance updates" on public.maintenance_request_updates
  for select to authenticated using (
    exists (select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      join public.maintenance_requests r on r.id=maintenance_request_updates.request_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.owner_id=maintenance_request_updates.owner_id
        and (r.assigned_staff_id=s.id or s.property_id=r.property_id
          or exists(select 1 from public.tenants t where t.owner_id=s.owner_id and t.property_id=r.property_id and t.caretaker_id=s.id)))
  );
drop policy if exists "Assigned caretakers write maintenance updates" on public.maintenance_request_updates;

create or replace function public.update_caretaker_maintenance(p_request_id uuid,p_status text default null,p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.maintenance_requests%rowtype; v_staff public.staff%rowtype;
begin
  select s.* into v_staff from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
    where sp.user_id=auth.uid() and sp.role='caretaker';
  if v_staff.id is null then raise exception 'Caretaker account required.'; end if;
  select r.* into v_request from public.maintenance_requests r where r.id=p_request_id and r.owner_id=v_staff.owner_id
    and (r.assigned_staff_id=v_staff.id or r.property_id=v_staff.property_id
      or exists(select 1 from public.tenants t where t.owner_id=v_staff.owner_id and t.property_id=r.property_id and t.caretaker_id=v_staff.id));
  if v_request.id is null then raise exception 'This maintenance item is not assigned to your account.'; end if;
  if p_status is not null then
    if p_status not in ('open','assigned','in_progress','waiting','completed','cancelled') then raise exception 'Invalid maintenance status.'; end if;
    update public.maintenance_requests set status=p_status,updated_at=now(),completed_at=case when p_status='completed' then now() else null end where id=v_request.id;
  end if;
  if nullif(trim(p_note),'') is not null then
    if v_request.tenant_id is null then raise exception 'This maintenance record has no linked tenant for updates.'; end if;
    insert into public.maintenance_request_updates(owner_id,request_id,tenant_id,author_id,body)
      values(v_request.owner_id,v_request.id,v_request.tenant_id,auth.uid(),left(trim(p_note),3000));
  end if;
end;
$$;
revoke all on function public.update_caretaker_maintenance(uuid,text,text) from public,anon;
grant execute on function public.update_caretaker_maintenance(uuid,text,text) to authenticated;

drop policy if exists "Assigned caretakers read property inspections" on public.property_inspections;
create policy "Assigned caretakers read property inspections" on public.property_inspections
  for select to authenticated using (
    exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.owner_id=property_inspections.owner_id
        and (s.property_id=property_inspections.property_id or exists(select 1 from public.tenants t
          where t.owner_id=s.owner_id and t.property_id=property_inspections.property_id and t.caretaker_id=s.id)))
  );
drop policy if exists "Assigned caretakers record property inspections" on public.property_inspections;
create policy "Assigned caretakers record property inspections" on public.property_inspections
  for insert to authenticated with check (
    created_by=auth.uid() and exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.owner_id=property_inspections.owner_id
        and (s.property_id=property_inspections.property_id or exists(select 1 from public.tenants t
          where t.owner_id=s.owner_id and t.property_id=property_inspections.property_id and t.caretaker_id=s.id)))
  );

create table if not exists public.property_incidents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 3 and 160),
  severity text not null default 'low' check(severity in ('low','moderate','high','urgent')),
  occurred_at timestamptz not null,
  description text not null check(char_length(trim(description)) between 10 and 4000),
  photo_paths text[] not null default '{}',
  status text not null default 'reported' check(status in ('reported','reviewing','action_required','resolved')),
  created_at timestamptz not null default now()
);
alter table public.property_incidents enable row level security;
drop policy if exists "Owners manage property incidents" on public.property_incidents;
create policy "Owners manage property incidents" on public.property_incidents
  for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists "Assigned caretakers read property incidents" on public.property_incidents;
create policy "Assigned caretakers read property incidents" on public.property_incidents
  for select to authenticated using (
    exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.owner_id=property_incidents.owner_id
        and (s.property_id=property_incidents.property_id or exists(select 1 from public.tenants t
          where t.owner_id=s.owner_id and t.property_id=property_incidents.property_id and t.caretaker_id=s.id)))
  );
drop policy if exists "Assigned caretakers submit property incidents" on public.property_incidents;
create policy "Assigned caretakers submit property incidents" on public.property_incidents
  for insert to authenticated with check (
    reported_by=auth.uid() and exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.owner_id=property_incidents.owner_id
        and (s.property_id=property_incidents.property_id or exists(select 1 from public.tenants t
          where t.owner_id=s.owner_id and t.property_id=property_incidents.property_id and t.caretaker_id=s.id)))
  );
grant select,insert,update,delete on public.property_incidents to authenticated;
create index if not exists property_incidents_owner_date_idx on public.property_incidents(owner_id,created_at desc);

-- Evidence files live under owner/staff/staff-id/type/property-id and are only
-- readable or writable by the assigned caretaker or the property owner.
drop policy if exists "Caretakers manage assigned property evidence" on storage.objects;
create policy "Caretakers manage assigned property evidence" on storage.objects
  for all to authenticated using (
    bucket_id='property-documents' and (storage.foldername(name))[2]='staff'
    and exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.id=(storage.foldername(name))[3]::uuid
        and s.owner_id=(storage.foldername(name))[1]::uuid
        and (s.property_id=(storage.foldername(name))[5]::uuid or exists(select 1 from public.tenants t
          where t.owner_id=s.owner_id and t.property_id=(storage.foldername(name))[5]::uuid and t.caretaker_id=s.id)))
  ) with check (
    bucket_id='property-documents' and (storage.foldername(name))[2]='staff'
    and exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
      where sp.user_id=auth.uid() and sp.role='caretaker' and s.id=(storage.foldername(name))[3]::uuid
        and s.owner_id=(storage.foldername(name))[1]::uuid
        and (s.property_id=(storage.foldername(name))[5]::uuid or exists(select 1 from public.tenants t
          where t.owner_id=s.owner_id and t.property_id=(storage.foldername(name))[5]::uuid and t.caretaker_id=s.id)))
  );

create or replace function public.notify_landlord_of_caretaker_incident()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_notifications(user_id,title,message,category,target_path)
  values(new.owner_id,'Caretaker incident report',new.title||' · '||new.severity||' priority','incident','#portal=account');
  return new;
end;
$$;
drop trigger if exists notify_landlord_of_caretaker_incident on public.property_incidents;
create trigger notify_landlord_of_caretaker_incident after insert on public.property_incidents
  for each row execute function public.notify_landlord_of_caretaker_incident();
