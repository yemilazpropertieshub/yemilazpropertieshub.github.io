-- Explainable account standing: verified account/profile progress plus
-- administrator-reviewed adjustments. A complaint by itself never lowers a score.

create table if not exists public.profile_standing_actions (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references auth.users(id) on delete cascade,
  points smallint not null check (points in (-20, -10, 5, 10, 20)),
  reason text not null check (char_length(btrim(reason)) between 12 and 1000),
  complaint_id uuid references public.property_complaints(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists profile_standing_actions_user_date_idx
  on public.profile_standing_actions(profile_user_id, created_at desc);
alter table public.profile_standing_actions enable row level security;
revoke all on public.profile_standing_actions from anon, authenticated;
grant select on public.profile_standing_actions to authenticated;
drop policy if exists "Users read their own standing history" on public.profile_standing_actions;
create policy "Users read their own standing history" on public.profile_standing_actions
  for select to authenticated using (profile_user_id = auth.uid() or public.is_platform_admin());

create or replace function public.profile_standing_data(p_user_id uuid)
returns table(
  user_id uuid, full_name text, email text, account_role text,
  score integer, level_label text, email_verified boolean,
  profile_completion integer, verified_properties integer, total_properties integer,
  adjustment_points integer, adjustment_history jsonb
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user auth.users%rowtype;
  v_landlord public.landlord_profiles%rowtype;
  v_stakeholder public.stakeholder_profiles%rowtype;
  v_staff public.staff%rowtype;
  v_tenant public.tenants%rowtype;
  v_name text;
  v_phone text;
  v_address text;
  v_role text;
  v_verified boolean;
  v_expected integer;
  v_complete integer;
  v_completion integer;
  v_verified_properties integer := 0;
  v_total_properties integer := 0;
  v_adjustments integer := 0;
  v_score integer;
  v_history jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or (auth.uid() <> p_user_id and not public.is_platform_admin()) then
    raise exception 'You can only view your own profile standing.';
  end if;
  select * into v_user from auth.users u where u.id = p_user_id;
  if not found then raise exception 'Profile account was not found.'; end if;
  select * into v_landlord from public.landlord_profiles lp where lp.user_id = p_user_id;
  select * into v_stakeholder from public.stakeholder_profiles sp where sp.user_id = p_user_id;
  if v_stakeholder.staff_id is not null then
    select * into v_staff from public.staff s where s.id = v_stakeholder.staff_id;
  end if;
  if v_stakeholder.tenant_id is not null then
    select * into v_tenant from public.tenants t where t.id = v_stakeholder.tenant_id;
  else
    select * into v_tenant from public.tenants t
      where lower(t.email) = lower(v_user.email)
      order by t.created_at desc limit 1;
  end if;

  v_role := coalesce(nullif(v_stakeholder.role, ''),
    case when v_landlord.user_id is not null then 'landlord'
         else coalesce(nullif(v_user.raw_user_meta_data->>'stakeholder_kind', ''), 'member') end);
  v_name := coalesce(nullif(v_landlord.full_name, ''), nullif(v_staff.full_name, ''),
    nullif(v_tenant.full_name, ''), nullif(v_stakeholder.full_name, ''),
    nullif(v_user.raw_user_meta_data->>'full_name', ''), 'Profile member');
  v_phone := coalesce(nullif(v_landlord.phone, ''), nullif(v_stakeholder.phone, ''), nullif(v_staff.phone, ''), nullif(v_tenant.phone, ''));
  v_address := coalesce(nullif(v_landlord.business_address, ''), nullif(v_stakeholder.permanent_address, ''), nullif(v_staff.permanent_address, ''), nullif(v_tenant.permanent_address, ''));
  v_verified := v_user.email_confirmed_at is not null;
  v_expected := case when v_role = 'landlord' then 4 else 3 end;
  v_complete := (case when nullif(btrim(v_name), '') is not null and v_name <> 'Profile member' then 1 else 0 end)
    + (case when nullif(btrim(coalesce(v_phone, '')), '') is not null then 1 else 0 end)
    + (case when nullif(btrim(coalesce(v_address, '')), '') is not null then 1 else 0 end)
    + (case when v_role = 'landlord' and nullif(btrim(v_landlord.business_name), '') is not null then 1 else 0 end);
  v_completion := least(100, round(100.0 * v_complete / greatest(v_expected, 1))::integer);
  select count(*) filter (where p.verification_status = 'verified')::integer, count(*)::integer
    into v_verified_properties, v_total_properties
    from public.properties p where p.owner_id = p_user_id;
  select coalesce(sum(a.points), 0)::integer into v_adjustments
    from public.profile_standing_actions a where a.profile_user_id = p_user_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'points', a.points, 'reason', a.reason, 'complaint_id', a.complaint_id, 'created_at', a.created_at
  ) order by a.created_at desc), '[]'::jsonb) into v_history
    from (select * from public.profile_standing_actions x where x.profile_user_id = p_user_id order by x.created_at desc limit 20) a;

  v_score := greatest(0, least(100,
    35 + (case when v_verified then 15 else 0 end)
    + round(v_completion * 0.25)::integer
    + least(v_verified_properties * 5, 15)
    + v_adjustments));
  return query select p_user_id, v_name, v_user.email::text, v_role, v_score,
    case when v_score >= 90 then 'Exemplary'
         when v_score >= 75 then 'Trusted'
         when v_score >= 60 then 'Established'
         when v_score >= 40 then 'Building profile'
         else 'Getting started' end,
    v_verified, v_completion, v_verified_properties, v_total_properties, v_adjustments, v_history;
end;
$$;
revoke all on function public.profile_standing_data(uuid) from public, anon, authenticated;

create or replace function public.get_my_profile_standing()
returns table(
  score integer, level_label text, email_verified boolean,
  profile_completion integer, verified_properties integer, total_properties integer,
  adjustment_points integer, adjustment_history jsonb
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to view your profile standing.'; end if;
  return query select s.score, s.level_label, s.email_verified, s.profile_completion,
    s.verified_properties, s.total_properties, s.adjustment_points, s.adjustment_history
  from public.profile_standing_data(auth.uid()) s;
end;
$$;
revoke all on function public.get_my_profile_standing() from public, anon;
grant execute on function public.get_my_profile_standing() to authenticated;

create or replace function public.list_profile_standings()
returns table(
  user_id uuid, full_name text, email text, account_role text, score integer,
  level_label text, email_verified boolean, profile_completion integer,
  verified_properties integer, total_properties integer, adjustment_points integer
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required.'; end if;
  return query
    select s.user_id, s.full_name, s.email, s.account_role, s.score, s.level_label,
      s.email_verified, s.profile_completion, s.verified_properties, s.total_properties, s.adjustment_points
    from auth.users u cross join lateral public.profile_standing_data(u.id) s
    order by s.score asc, s.full_name asc;
end;
$$;
revoke all on function public.list_profile_standings() from public, anon;
grant execute on function public.list_profile_standings() to authenticated;

create or replace function public.adjust_profile_standing(
  p_profile_user_id uuid, p_points smallint, p_reason text, p_complaint_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_action_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Only a platform administrator can adjust profile standing.'; end if;
  if p_points not in (-20, -10, 5, 10, 20) then raise exception 'Choose an approved standing adjustment.'; end if;
  if nullif(btrim(p_reason), '') is null or char_length(btrim(p_reason)) < 12 then raise exception 'Give a clear reason of at least 12 characters.'; end if;
  if p_points < 0 then
    if p_complaint_id is null then raise exception 'A confirmed negative finding must link to its resolved complaint.'; end if;
    if not exists (
      select 1 from public.property_complaints c
      where c.id = p_complaint_id and c.status in ('resolved','closed')
        and (c.landlord_id = p_profile_user_id or c.assigned_recipient_id = p_profile_user_id or c.other_participant_id = p_profile_user_id)
    ) then raise exception 'Link a resolved or closed complaint involving this account before recording a negative finding.'; end if;
  end if;
  if not exists (select 1 from auth.users u where u.id = p_profile_user_id) then raise exception 'Profile account not found.'; end if;
  insert into public.profile_standing_actions(profile_user_id, points, reason, complaint_id, created_by)
  values (p_profile_user_id, p_points, btrim(p_reason), p_complaint_id, auth.uid()) returning id into v_action_id;
  return v_action_id;
end;
$$;
revoke all on function public.adjust_profile_standing(uuid,smallint,text,uuid) from public, anon;
grant execute on function public.adjust_profile_standing(uuid,smallint,text,uuid) to authenticated;
