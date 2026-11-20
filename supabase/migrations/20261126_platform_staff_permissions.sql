-- Granular owner-managed platform staff permissions.
create table if not exists public.platform_staff_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in ('account_upgrades','listing_verification','complaints_read')),
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, permission)
);
alter table public.platform_staff_permissions enable row level security;
revoke all on public.platform_staff_permissions from anon, authenticated;

create or replace function public.has_platform_permission(p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_admin() or exists (
    select 1 from public.platform_staff_permissions p
    where p.user_id = auth.uid() and p.permission = p_permission
  );
$$;
revoke all on function public.has_platform_permission(text) from public, anon;
grant execute on function public.has_platform_permission(text) to authenticated;

create or replace function public.get_my_platform_permissions()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(p.permission order by p.permission), '{}'::text[])
  from public.platform_staff_permissions p where p.user_id = auth.uid();
$$;
revoke all on function public.get_my_platform_permissions() from public, anon;
grant execute on function public.get_my_platform_permissions() to authenticated;

create or replace function public.set_platform_staff_permissions(p_email text, p_permissions text[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_permission text;
begin
  if not public.is_platform_admin() then raise exception 'Only the platform administrator can assign platform staff access.'; end if;
  if nullif(btrim(p_email), '') is null then raise exception 'Enter the staff member account email.'; end if;
  if coalesce(array_length(p_permissions, 1), 0) > 3 then raise exception 'Choose only the listed platform work permissions.'; end if;
  foreach v_permission in array coalesce(p_permissions, '{}'::text[]) loop
    if v_permission not in ('account_upgrades','listing_verification','complaints_read') then
      raise exception 'One of the selected platform permissions is not allowed.';
    end if;
  end loop;
  select id into v_user_id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
  if v_user_id is null then raise exception 'No registered Yemilaz account uses that email. Ask the staff member to create an account first, then grant access here.'; end if;
  if v_user_id = auth.uid() then raise exception 'Your administrator access is protected and cannot be changed here.'; end if;
  delete from public.platform_staff_permissions where user_id = v_user_id;
  insert into public.platform_staff_permissions(user_id, permission, granted_by)
    select v_user_id, x.permission, auth.uid()
    from (select distinct unnest(coalesce(p_permissions, '{}'::text[])) as permission) x;
end;
$$;
revoke all on function public.set_platform_staff_permissions(text,text[]) from public, anon;
grant execute on function public.set_platform_staff_permissions(text,text[]) to authenticated;

create or replace function public.list_platform_staff_permissions()
returns table(user_id uuid, email text, full_name text, permissions text[], granted_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
  return query
  select p.user_id, u.email::text, coalesce(u.raw_user_meta_data->>'full_name','')::text,
    array_agg(p.permission order by p.permission), min(p.granted_at)
  from public.platform_staff_permissions p join auth.users u on u.id=p.user_id
  group by p.user_id,u.email,u.raw_user_meta_data order by min(p.granted_at) desc;
end;
$$;
revoke all on function public.list_platform_staff_permissions() from public, anon;
grant execute on function public.list_platform_staff_permissions() to authenticated;

-- Move pre-existing account reviewers into the unified staff permission list.
insert into public.platform_staff_permissions(user_id, permission, granted_by, granted_at)
select r.user_id, 'account_upgrades', r.added_by, r.created_at
from public.platform_account_reviewers r where r.active
on conflict (user_id, permission) do nothing;

-- Keep older frontend builds compatible while routing reviewer changes through the
-- same permission records used by Platform staff.
create or replace function public.set_platform_account_reviewer(p_email text, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
  select id into v_user_id from auth.users where lower(email)=lower(trim(coalesce(p_email,''))) limit 1;
  if v_user_id is null then raise exception 'No Yemilaz account uses that email yet.'; end if;
  if p_enabled then
    insert into public.platform_staff_permissions(user_id,permission,granted_by)
    values(v_user_id,'account_upgrades',auth.uid())
    on conflict(user_id,permission) do update set granted_by=excluded.granted_by,granted_at=now();
  else
    delete from public.platform_staff_permissions where user_id=v_user_id and permission='account_upgrades';
  end if;
end;
$$;

create or replace function public.list_platform_account_reviewers()
returns table(user_id uuid,email text,active boolean,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
  return query select p.user_id,u.email::text,true,p.granted_at
  from public.platform_staff_permissions p join auth.users u on u.id=p.user_id
  where p.permission='account_upgrades' order by p.granted_at desc;
end;
$$;

create or replace function public.is_platform_account_reviewer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_platform_permission('account_upgrades');
$$;

drop policy if exists "Platform admins review listing verification" on public.properties;
create policy "Platform admins review listing verification" on public.properties for select to authenticated
  using (public.has_platform_permission('listing_verification'));
drop policy if exists "Platform admins update listing verification" on public.properties;
create policy "Platform admins update listing verification" on public.properties for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create or replace function public.guard_property_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.verification_status in ('verified','rejected') and not public.has_platform_permission('listing_verification') then
    raise exception 'Listing verification permission required.';
  end if;
  return new;
end;
$$;
create or replace function public.review_property_verification(p_property_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_platform_permission('listing_verification') then raise exception 'Listing verification permission required.'; end if;
  if p_decision not in ('verified','rejected') then raise exception 'Choose a valid verification decision.'; end if;
  update public.properties set verification_status=p_decision
  where id=p_property_id and verification_status='pending';
  if not found then raise exception 'This listing is no longer pending review.'; end if;
end;
$$;
revoke all on function public.review_property_verification(uuid,text) from public, anon;
grant execute on function public.review_property_verification(uuid,text) to authenticated;

drop policy if exists "Platform admins read all complaints" on public.property_complaints;
create policy "Platform admins read all complaints" on public.property_complaints for select to authenticated
  using (public.has_platform_permission('complaints_read'));
drop policy if exists "Platform admins read all complaint messages" on public.property_complaint_messages;
create policy "Platform admins read all complaint messages" on public.property_complaint_messages for select to authenticated
  using (public.has_platform_permission('complaints_read'));
