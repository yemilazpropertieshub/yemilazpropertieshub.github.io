-- Tenant portal: rent visibility, maintenance updates/evidence, notices,
-- important dates and profile correction requests.

alter table public.maintenance_requests
  add column if not exists evidence_path text;

create or replace function public.user_can_access_tenant(p_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.tenants t
    where t.id = p_tenant_id and (
      t.owner_id = auth.uid()
      or lower(t.email) = lower(auth.jwt()->>'email')
      or exists (
        select 1 from public.stakeholder_profiles sp
        join public.staff s on s.id = sp.staff_id
        where sp.user_id = auth.uid() and s.owner_id = t.owner_id
          and (s.property_id = t.property_id or s.id = t.caretaker_id or s.id = t.agent_id)
      )
    )
  );
$$;
revoke all on function public.user_can_access_tenant(uuid) from public, anon;
grant execute on function public.user_can_access_tenant(uuid) to authenticated;

-- Landlords publish property-specific or portfolio-wide notices. Tenants only
-- see notices for their currently assigned property or all-property notices.
create table if not exists public.property_notices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 5 and 5000),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.property_notices enable row level security;
drop policy if exists "Landlords manage property notices" on public.property_notices;
create policy "Landlords manage property notices" on public.property_notices
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and created_by = auth.uid());
drop policy if exists "Tenants read assigned property notices" on public.property_notices;
create policy "Tenants read assigned property notices" on public.property_notices
  for select to authenticated using (
    exists (select 1 from public.tenants t where t.owner_id = property_notices.owner_id
      and lower(t.email) = lower(auth.jwt()->>'email')
      and (property_notices.property_id is null or t.property_id = property_notices.property_id))
  );
grant select, insert, update, delete on public.property_notices to authenticated;
create index if not exists property_notices_owner_date_idx on public.property_notices(owner_id, created_at desc);

create or replace function public.notify_tenants_of_property_notice()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  for v_user_id in
    select distinct u.id from public.tenants t join auth.users u on lower(u.email) = lower(t.email)
    where t.owner_id = new.owner_id
      and (new.property_id is null or t.property_id = new.property_id)
  loop
    insert into public.user_notifications(user_id,title,message,category,target_path,target_id)
    values(v_user_id, 'New property notice', new.title, 'property_notice', '#workspace', new.id);
  end loop;
  return new;
end;
$$;
drop trigger if exists notify_tenants_of_property_notice on public.property_notices;
create trigger notify_tenants_of_property_notice after insert on public.property_notices
for each row execute function public.notify_tenants_of_property_notice();

-- Tenants request a correction; the landlord reviews it and applies approved
-- changes through a constrained RPC (never through direct tenant table edits).
create table if not exists public.tenant_profile_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  field_name text not null check (field_name in ('full_name','phone','permanent_address')),
  requested_value text not null check (char_length(trim(requested_value)) between 2 and 500),
  note text,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  response text,
  created_at timestamptz not null default now()
);
alter table public.tenant_profile_requests enable row level security;
drop policy if exists "Landlords review tenant profile requests" on public.tenant_profile_requests;
create policy "Landlords review tenant profile requests" on public.tenant_profile_requests
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Tenants read and submit own profile requests" on public.tenant_profile_requests;
create policy "Tenants read and submit own profile requests" on public.tenant_profile_requests
  for select to authenticated using (public.user_can_access_tenant(tenant_id)
    and exists(select 1 from public.tenants t where t.id=tenant_id and lower(t.email)=lower(auth.jwt()->>'email')));
create policy "Tenants submit own profile requests" on public.tenant_profile_requests
  for insert to authenticated with check (requester_id=auth.uid() and status='pending'
    and exists(select 1 from public.tenants t where t.id=tenant_id and t.owner_id=tenant_profile_requests.owner_id
      and lower(t.email)=lower(auth.jwt()->>'email')));
grant select, insert, update on public.tenant_profile_requests to authenticated;
create index if not exists tenant_profile_requests_owner_status_idx on public.tenant_profile_requests(owner_id,status,created_at desc);

create or replace function public.review_tenant_profile_request(p_request_id uuid, p_approve boolean, p_response text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.tenant_profile_requests%rowtype;
begin
  select * into v_request from public.tenant_profile_requests where id=p_request_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Profile request not found for this account.'; end if;
  if v_request.status <> 'pending' then raise exception 'This request has already been reviewed.'; end if;
  if p_approve then
    update public.tenants set
      full_name=case when v_request.field_name='full_name' then trim(v_request.requested_value) else full_name end,
      phone=case when v_request.field_name='phone' then trim(v_request.requested_value) else phone end,
      permanent_address=case when v_request.field_name='permanent_address' then trim(v_request.requested_value) else permanent_address end
    where id=v_request.tenant_id and owner_id=auth.uid();
  end if;
  update public.tenant_profile_requests set status=case when p_approve then 'approved' else 'declined' end,
    reviewed_by=auth.uid(), reviewed_at=now(), response=nullif(trim(p_response),'') where id=p_request_id;
end;
$$;
revoke all on function public.review_tenant_profile_request(uuid,boolean,text) from public, anon;
grant execute on function public.review_tenant_profile_request(uuid,boolean,text) to authenticated;

create or replace function public.notify_tenant_profile_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_notifications(user_id,title,message,category,target_path,target_id)
  values(new.owner_id,'Tenant profile correction requested','A tenant asked to update their '||replace(new.field_name,'_',' ')||'.','tenant_profile_request','#workspace',new.id);
  return new;
end;
$$;
drop trigger if exists notify_tenant_profile_request on public.tenant_profile_requests;
create trigger notify_tenant_profile_request after insert on public.tenant_profile_requests
for each row execute function public.notify_tenant_profile_request();

create or replace function public.notify_tenant_profile_request_result()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  if old.status is distinct from new.status and new.status in ('approved','declined') then
    select u.id into v_user_id from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.id=new.tenant_id limit 1;
    if v_user_id is not null then
      insert into public.user_notifications(user_id,title,message,category,target_path,target_id)
      values(v_user_id,'Profile correction reviewed','Your profile correction request was '||new.status||'.','tenant_profile_request','#workspace',new.id);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_tenant_profile_request_result on public.tenant_profile_requests;
create trigger notify_tenant_profile_request_result after update on public.tenant_profile_requests
for each row execute function public.notify_tenant_profile_request_result();

-- A request timeline lets the tenant see landlord updates and reply. Replies
-- notify the landlord; tenant access is always limited to their own tenancy.
create table if not exists public.maintenance_request_updates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
alter table public.maintenance_request_updates enable row level security;
drop policy if exists "Property participants read maintenance updates" on public.maintenance_request_updates;
create policy "Property participants read maintenance updates" on public.maintenance_request_updates
  for select to authenticated using (owner_id=auth.uid() or public.user_can_access_tenant(tenant_id));
drop policy if exists "Landlords write maintenance updates" on public.maintenance_request_updates;
create policy "Landlords write maintenance updates" on public.maintenance_request_updates
  for insert to authenticated with check (owner_id=auth.uid() and author_id=auth.uid());
drop policy if exists "Tenants reply to own maintenance requests" on public.maintenance_request_updates;
create policy "Tenants reply to own maintenance requests" on public.maintenance_request_updates
  for insert to authenticated with check (author_id=auth.uid() and exists (
    select 1 from public.tenants t where t.id=tenant_id and t.owner_id=maintenance_request_updates.owner_id
      and lower(t.email)=lower(auth.jwt()->>'email')
  ) and exists (
    select 1 from public.maintenance_requests r where r.id=maintenance_request_updates.request_id
      and r.tenant_id=maintenance_request_updates.tenant_id and r.owner_id=maintenance_request_updates.owner_id
  ));
grant select,insert on public.maintenance_request_updates to authenticated;
create index if not exists maintenance_request_updates_timeline_idx on public.maintenance_request_updates(request_id,created_at);

create or replace function public.notify_maintenance_request_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  if new.author_id= new.owner_id then
    select u.id into v_user_id from public.tenants t join auth.users u on lower(u.email)=lower(t.email) where t.id=new.tenant_id limit 1;
  else
    v_user_id:=new.owner_id;
  end if;
  if v_user_id is not null and v_user_id<>new.author_id then
    insert into public.user_notifications(user_id,title,message,category,target_path,target_id)
    values(v_user_id,'Maintenance request updated',left(new.body,180),'maintenance_update','#workspace',new.request_id);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_maintenance_request_update on public.maintenance_request_updates;
create trigger notify_maintenance_request_update after insert on public.maintenance_request_updates
for each row execute function public.notify_maintenance_request_update();

-- Allow tenants to attach evidence securely using a path scoped to their owner
-- and tenant IDs; only that tenant and the landlord can read it.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('maintenance-evidence','maintenance-evidence',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false;
drop policy if exists "Landlords manage maintenance evidence" on storage.objects;
create policy "Landlords manage maintenance evidence" on storage.objects for all to authenticated
using(bucket_id='maintenance-evidence' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='maintenance-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Tenants upload and read own maintenance evidence" on storage.objects;
create policy "Tenants upload and read own maintenance evidence" on storage.objects for all to authenticated
using(bucket_id='maintenance-evidence' and exists(select 1 from public.tenants t where t.owner_id::text=(storage.foldername(name))[1] and t.id::text=(storage.foldername(name))[3] and lower(t.email)=lower(auth.jwt()->>'email')))
with check(bucket_id='maintenance-evidence' and exists(select 1 from public.tenants t where t.owner_id::text=(storage.foldername(name))[1] and t.id::text=(storage.foldername(name))[3] and lower(t.email)=lower(auth.jwt()->>'email')));

-- Tenants can see upcoming inspections only when their landlord linked the
-- inspection to their lease or their assigned property.
drop policy if exists "Tenants view assigned property inspections" on public.property_inspections;
create policy "Tenants view assigned property inspections" on public.property_inspections
  for select to authenticated using (
    exists(select 1 from public.tenants t where t.owner_id=property_inspections.owner_id
      and lower(t.email)=lower(auth.jwt()->>'email')
      and ((property_inspections.tenant_id is not null and t.id=property_inspections.tenant_id)
        or (property_inspections.tenant_id is null and t.property_id=property_inspections.property_id)))
  );
grant select on public.property_inspections to authenticated;
