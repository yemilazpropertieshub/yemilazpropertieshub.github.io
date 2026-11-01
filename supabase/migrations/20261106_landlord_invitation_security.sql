-- Require every new landlord signup to have a one-time administrator-issued code.
-- The table has RLS enabled, no client policies, and no client grants; the code
-- is returned only once from the administrator-only generation function.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.landlord_invite_codes (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  code_hint text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz
);

alter table public.platform_admins enable row level security;
alter table public.landlord_invite_codes enable row level security;
revoke all on public.platform_admins from anon, authenticated;
revoke all on public.landlord_invite_codes from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.validate_landlord_invite(p_invite_code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.landlord_invite_codes i
    where i.invite_code = lower(trim(coalesce(p_invite_code, '')))
      and i.redeemed_at is null and i.revoked_at is null and i.expires_at > now()
  );
$$;
revoke all on function public.validate_landlord_invite(text) from public;
grant execute on function public.validate_landlord_invite(text) to anon, authenticated;

create or replace function public.generate_landlord_invite(p_valid_hours integer default 24)
returns table(invite_id uuid, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires timestamptz := now() + make_interval(hours => least(greatest(coalesce(p_valid_hours, 24), 1), 168));
  v_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Only a Yemilaz Properties administrator can issue landlord codes.'; end if;
  insert into public.landlord_invite_codes (invite_code, code_hint, created_by, expires_at)
  values (v_code, right(v_code, 6), auth.uid(), v_expires)
  returning id into v_id;
  return query select v_id, v_code, v_expires;
end;
$$;
revoke all on function public.generate_landlord_invite(integer) from public, anon;
grant execute on function public.generate_landlord_invite(integer) to authenticated;

create or replace function public.list_landlord_invites()
returns table(invite_id uuid, code_hint text, status text, created_at timestamptz, expires_at timestamptz, redeemed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only a Yemilaz Properties administrator can view landlord codes.'; end if;
  return query
    select i.id, '••••••' || i.code_hint,
      case when i.redeemed_at is not null then 'used'
           when i.revoked_at is not null then 'revoked'
           when i.expires_at <= now() then 'expired'
           else 'active' end,
      i.created_at, i.expires_at, i.redeemed_at
    from public.landlord_invite_codes i
    order by i.created_at desc limit 100;
end;
$$;
revoke all on function public.list_landlord_invites() from public, anon;
grant execute on function public.list_landlord_invites() to authenticated;

create or replace function public.revoke_landlord_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Only a Yemilaz Properties administrator can revoke landlord codes.'; end if;
  update public.landlord_invite_codes set revoked_at = now()
  where id = p_invite_id and redeemed_at is null and revoked_at is null and expires_at > now();
end;
$$;
revoke all on function public.revoke_landlord_invite(uuid) from public, anon;
grant execute on function public.revoke_landlord_invite(uuid) to authenticated;

create or replace function public.create_landlord_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_invite_code text := nullif(lower(trim(new.raw_user_meta_data->>'invite_code')), '');
begin
  if v_invite_code is null then
    raise exception 'A Yemilaz Properties landlord access code is required to create this account.';
  end if;

  update public.landlord_invite_codes
  set redeemed_by = new.id, redeemed_at = now()
  where invite_code = v_invite_code
    and redeemed_at is null and revoked_at is null and expires_at > now();
  if not found then
    raise exception 'This Yemilaz Properties access code is invalid, expired, or already used.';
  end if;

  insert into public.landlord_profiles (user_id, full_name, business_name, brand_template, brand_logo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'Yemilaz Properties'),
    case when new.raw_user_meta_data->>'brand_template' in ('jade','midnight','terracotta','plum')
      then new.raw_user_meta_data->>'brand_template' else 'jade' end,
    case when new.raw_user_meta_data->>'brand_logo' in ('estate','keystone','monogram','horizon','doorway')
      then new.raw_user_meta_data->>'brand_logo' else 'horizon' end
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_landlord_profile on auth.users;
create trigger on_auth_user_created_landlord_profile after insert on auth.users
  for each row execute function public.create_landlord_profile();

-- Bootstrap the first platform administrator manually in the SQL editor after
-- this migration, substituting the verified email used by the platform owner:
-- insert into public.platform_admins (user_id)
-- select id from auth.users where lower(email) = lower('OWNER_EMAIL_HERE')
-- on conflict (user_id) do nothing;
