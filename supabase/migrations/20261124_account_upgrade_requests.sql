-- Secure account-role upgrade requests with private evidence and an internal review queue.

create table if not exists public.platform_account_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  added_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.platform_account_reviewers enable row level security;
revoke all on public.platform_account_reviewers from anon, authenticated;

create or replace function public.is_platform_account_reviewer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_admin() or exists (
    select 1 from public.platform_account_reviewers r
    where r.user_id = auth.uid() and r.active
  );
$$;
revoke all on function public.is_platform_account_reviewer() from public, anon;
grant execute on function public.is_platform_account_reviewer() to authenticated;

create table if not exists public.account_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  requester_name text not null default '',
  previous_role text not null default 'stakeholder',
  target_role text not null check (target_role in ('landlord','property_developer','tenant','agent','caretaker','lawyer','property_seeker','complainant')),
  justification text not null check (char_length(justification) between 20 and 4000),
  proposed_business_name text,
  evidence_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','reviewing','approved','declined')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.account_upgrade_requests enable row level security;
revoke all on public.account_upgrade_requests from anon, authenticated;
grant select, insert on public.account_upgrade_requests to authenticated;

create or replace function public.set_account_upgrade_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user auth.users%rowtype; v_profile_role text;
begin
  if new.user_id <> auth.uid() then raise exception 'You can only request a role change for your own account.'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if v_user.id is null then raise exception 'Signed-in account not found.'; end if;
  select sp.role into v_profile_role from public.stakeholder_profiles sp where sp.user_id = auth.uid();
  new.requester_email := coalesce(v_user.email, '');
  new.requester_name := coalesce(nullif(v_user.raw_user_meta_data->>'full_name',''), v_user.email, '');
  new.previous_role := case
    when v_user.raw_user_meta_data->>'stakeholder_kind' = 'property_developer' then 'property_developer'
    when v_user.raw_user_meta_data->>'account_role' = 'landlord' and v_profile_role is null then 'landlord'
    when v_profile_role = 'stakeholder' and v_user.raw_user_meta_data->>'stakeholder_kind' in ('property_seeker','complainant') then v_user.raw_user_meta_data->>'stakeholder_kind'
    else coalesce(v_profile_role, 'stakeholder')
  end;
  new.status := 'pending';
  new.reviewer_notes := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists set_account_upgrade_identity on public.account_upgrade_requests;
create trigger set_account_upgrade_identity before insert on public.account_upgrade_requests
for each row execute function public.set_account_upgrade_identity();

drop policy if exists "Users submit own account upgrade requests" on public.account_upgrade_requests;
create policy "Users submit own account upgrade requests" on public.account_upgrade_requests
for insert to authenticated with check (
  user_id = auth.uid()
  and char_length(justification) between 20 and 4000
  and not exists (
    select 1 from unnest(evidence_paths) as p(path)
    where path !~ ('^' || auth.uid()::text || '/[A-Za-z0-9._/-]+$') or path like '%..%'
  )
);
drop policy if exists "Users and reviewers read account upgrade requests" on public.account_upgrade_requests;
create policy "Users and reviewers read account upgrade requests" on public.account_upgrade_requests
for select to authenticated using (user_id = auth.uid() or public.is_platform_account_reviewer());
create unique index if not exists one_open_account_upgrade_per_user
on public.account_upgrade_requests(user_id) where status in ('pending','reviewing');
create index if not exists account_upgrade_review_queue_idx
on public.account_upgrade_requests(status, created_at desc);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('account-upgrade-evidence','account-upgrade-evidence',false,15728640,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=15728640,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Users upload own account upgrade evidence" on storage.objects;
create policy "Users upload own account upgrade evidence" on storage.objects for insert to authenticated
with check (bucket_id='account-upgrade-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Requesters and reviewers read account upgrade evidence" on storage.objects;
create policy "Requesters and reviewers read account upgrade evidence" on storage.objects for select to authenticated
using (bucket_id='account-upgrade-evidence' and (
  (storage.foldername(name))[1]=auth.uid()::text
  or public.is_platform_account_reviewer()
));
drop policy if exists "Users delete own account upgrade evidence" on storage.objects;
create policy "Users delete own account upgrade evidence" on storage.objects for delete to authenticated
using (bucket_id='account-upgrade-evidence' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.set_platform_account_reviewer(p_email text, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
  select id into v_user_id from auth.users where lower(email)=lower(trim(coalesce(p_email,''))) limit 1;
  if v_user_id is null then raise exception 'No Yemilaz account uses that email yet.'; end if;
  if v_user_id=auth.uid() and not p_enabled then raise exception 'You cannot remove your own administrator account as a reviewer.'; end if;
  if p_enabled then
    insert into public.platform_account_reviewers(user_id,active,added_by)
    values(v_user_id,true,auth.uid())
    on conflict(user_id) do update set active=true,added_by=excluded.added_by;
  else
    delete from public.platform_account_reviewers where user_id=v_user_id;
  end if;
end;
$$;
revoke all on function public.set_platform_account_reviewer(text,boolean) from public, anon;
grant execute on function public.set_platform_account_reviewer(text,boolean) to authenticated;

create or replace function public.list_platform_account_reviewers()
returns table(user_id uuid,email text,active boolean,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
  return query select r.user_id,u.email,r.active,r.created_at
  from public.platform_account_reviewers r join auth.users u on u.id=r.user_id
  order by r.created_at desc;
end;
$$;
revoke all on function public.list_platform_account_reviewers() from public, anon;
grant execute on function public.list_platform_account_reviewers() to authenticated;

create or replace function public.review_account_upgrade(p_request_id uuid,p_decision text,p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.account_upgrade_requests%rowtype; v_email text; v_tenant_id uuid; v_staff_id uuid;
  v_metadata jsonb; v_target_role text; v_stakeholder_role text; v_full_name text; v_business_name text;
begin
  if not public.is_platform_account_reviewer() then raise exception 'Authorized account reviewer access required.'; end if;
  if p_decision not in ('approved','declined','reviewing') then raise exception 'Choose approve, decline, or mark as reviewing.'; end if;
  if p_notes is not null and char_length(p_notes)>3000 then raise exception 'Review notes must be 3,000 characters or fewer.'; end if;
  select * into v_request from public.account_upgrade_requests where id=p_request_id for update;
  if v_request.id is null then raise exception 'Account upgrade request not found.'; end if;
  if v_request.status in ('approved','declined') then raise exception 'This request has already been decided.'; end if;

  if p_decision='approved' then
    select email,raw_user_meta_data into v_email,v_metadata from auth.users where id=v_request.user_id;
    if v_email is null then raise exception 'The requesting account no longer exists.'; end if;
    v_target_role:=v_request.target_role;
    v_full_name:=coalesce(nullif(v_metadata->>'full_name',''),v_request.requester_name,v_email);
    if v_target_role in ('landlord','property_developer') then
      if exists(select 1 from public.properties where owner_id=v_request.user_id)
         or exists(select 1 from public.tenants where owner_id=v_request.user_id)
         or exists(select 1 from public.staff where owner_id=v_request.user_id) then
        raise exception 'Transfer or close existing owner-managed records before changing this account away from its current workspace.';
      end if;
      delete from public.stakeholder_profiles where user_id=v_request.user_id;
      v_business_name:=coalesce(nullif(v_request.proposed_business_name,''),nullif(v_metadata->>'business_name',''),'Yemilaz Properties');
      insert into public.landlord_profiles(user_id,full_name,business_name,brand_template,brand_logo,phone,business_address)
      values(v_request.user_id,v_full_name,v_business_name,'jade','horizon',nullif(v_metadata->>'phone',''),nullif(v_metadata->>'permanent_address',''))
      on conflict(user_id) do update set full_name=excluded.full_name,business_name=excluded.business_name;
      update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('account_role','landlord','stakeholder_kind',v_target_role,'full_name',v_full_name,'business_name',v_business_name)
      where id=v_request.user_id;
    else
      if exists(select 1 from public.properties where owner_id=v_request.user_id)
         or exists(select 1 from public.tenants where owner_id=v_request.user_id)
         or exists(select 1 from public.staff where owner_id=v_request.user_id) then
        raise exception 'Transfer or close existing owner-managed records before changing this account to a linked profile.';
      end if;
      v_tenant_id:=null; v_staff_id:=null;
      if v_target_role='tenant' then
        select id into v_tenant_id from public.tenants where lower(email)=lower(v_email) order by created_at desc limit 1;
        if v_tenant_id is null then raise exception 'A landlord must first create a tenant record using this account email.'; end if;
      elsif v_target_role in ('agent','caretaker','lawyer') then
        select id into v_staff_id from public.staff where lower(email)=lower(v_email) and role=v_target_role order by created_at desc limit 1;
        if v_staff_id is null then raise exception 'A landlord must first create a matching staff assignment using this account email and role.'; end if;
      end if;
      v_stakeholder_role:=case when v_target_role in ('property_seeker','complainant') then 'stakeholder' else v_target_role end;
      insert into public.stakeholder_profiles(user_id,full_name,role,tenant_id,staff_id)
      values(v_request.user_id,v_full_name,v_stakeholder_role,v_tenant_id,v_staff_id)
      on conflict(user_id) do update set full_name=excluded.full_name,role=excluded.role,tenant_id=excluded.tenant_id,staff_id=excluded.staff_id;
      update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('account_role','stakeholder','stakeholder_kind',v_target_role,'full_name',v_full_name)
      where id=v_request.user_id;
    end if;
  end if;
  update public.account_upgrade_requests set status=p_decision,reviewer_notes=nullif(trim(coalesce(p_notes,'')),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now()
  where id=p_request_id;
end;
$$;
revoke all on function public.review_account_upgrade(uuid,text,text) from public, anon;
grant execute on function public.review_account_upgrade(uuid,text,text) to authenticated;
