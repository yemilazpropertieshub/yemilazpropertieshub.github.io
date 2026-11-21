-- Optional public member spotlight. Only opted-in accounts at Established (60+) or
-- higher are eligible; the public endpoint returns a deliberately small field set.
create table if not exists public.public_profile_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_visible boolean not null default false,
  display_name text not null default '' check (char_length(display_name) <= 80),
  topic text not null default '' check (char_length(topic) <= 80),
  tagline text not null default '' check (char_length(tagline) <= 180),
  updated_at timestamptz not null default now()
);

alter table public.public_profile_settings enable row level security;
revoke all on public.public_profile_settings from anon, authenticated;
grant select on public.public_profile_settings to authenticated;
drop policy if exists "Members read their own public profile settings" on public.public_profile_settings;
create policy "Members read their own public profile settings" on public.public_profile_settings
  for select to authenticated using (user_id = auth.uid());

create or replace function public.profile_standing_score_internal(p_user_id uuid)
returns table(score integer, level_label text, account_role text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user auth.users%rowtype;
  v_landlord public.landlord_profiles%rowtype;
  v_stakeholder public.stakeholder_profiles%rowtype;
  v_staff public.staff%rowtype;
  v_tenant public.tenants%rowtype;
  v_role text;
  v_name text;
  v_phone text;
  v_address text;
  v_completion integer;
  v_verified_properties integer := 0;
  v_adjustments integer := 0;
  v_score integer;
begin
  select * into v_user from auth.users u where u.id = p_user_id;
  if not found then return; end if;
  select * into v_landlord from public.landlord_profiles lp where lp.user_id = p_user_id;
  select * into v_stakeholder from public.stakeholder_profiles sp where sp.user_id = p_user_id;
  if v_stakeholder.staff_id is not null then
    select * into v_staff from public.staff s where s.id = v_stakeholder.staff_id;
  end if;
  if v_stakeholder.tenant_id is not null then
    select * into v_tenant from public.tenants t where t.id = v_stakeholder.tenant_id;
  else
    select * into v_tenant from public.tenants t
      where lower(t.email) = lower(v_user.email) order by t.created_at desc limit 1;
  end if;
  v_role := coalesce(nullif(v_stakeholder.role, ''),
    case when v_landlord.user_id is not null then 'landlord'
         else coalesce(nullif(v_user.raw_user_meta_data->>'stakeholder_kind', ''), 'member') end);
  v_name := coalesce(nullif(v_landlord.full_name, ''), nullif(v_staff.full_name, ''),
    nullif(v_tenant.full_name, ''), nullif(v_stakeholder.full_name, ''),
    nullif(v_user.raw_user_meta_data->>'full_name', ''), '');
  v_phone := coalesce(nullif(v_landlord.phone, ''), nullif(v_stakeholder.phone, ''), nullif(v_staff.phone, ''), nullif(v_tenant.phone, ''));
  v_address := coalesce(nullif(v_landlord.business_address, ''), nullif(v_stakeholder.permanent_address, ''), nullif(v_staff.permanent_address, ''), nullif(v_tenant.permanent_address, ''));
  v_completion := least(100, round(100.0 * (
    (case when nullif(btrim(v_name), '') is not null then 1 else 0 end)
    + (case when nullif(btrim(coalesce(v_phone, '')), '') is not null then 1 else 0 end)
    + (case when nullif(btrim(coalesce(v_address, '')), '') is not null then 1 else 0 end)
    + (case when v_role = 'landlord' and nullif(btrim(v_landlord.business_name), '') is not null then 1 else 0 end)
  ) / case when v_role = 'landlord' then 4.0 else 3.0 end)::integer);
  select count(*)::integer into v_verified_properties from public.properties p
    where p.owner_id = p_user_id and p.verification_status = 'verified';
  select coalesce(sum(a.points), 0)::integer into v_adjustments from public.profile_standing_actions a
    where a.profile_user_id = p_user_id;
  v_score := greatest(0, least(100,
    35 + (case when v_user.email_confirmed_at is not null then 15 else 0 end)
    + round(v_completion * 0.25)::integer + least(v_verified_properties * 5, 15) + v_adjustments));
  return query select v_score,
    case when v_score >= 90 then 'Exemplary' when v_score >= 75 then 'Trusted'
         when v_score >= 60 then 'Established' when v_score >= 40 then 'Building profile'
         else 'Getting started' end,
    case when v_role = 'stakeholder' and v_staff.role in ('agent','caretaker','lawyer') then v_staff.role
         when v_role = 'stakeholder' and v_user.raw_user_meta_data->>'stakeholder_kind' = 'property_seeker' then 'property_seeker'
         else v_role end;
end;
$$;
revoke all on function public.profile_standing_score_internal(uuid) from public, anon, authenticated;

create or replace function public.get_my_public_profile_settings()
returns table(is_visible boolean, display_name text, topic text, tagline text,
  score integer, level_label text, eligible boolean, account_role text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Sign in to manage your public profile.'; end if;
  return query
    select coalesce(s.is_visible, false),
      coalesce(nullif(s.display_name, ''), nullif(lp.full_name, ''), nullif(sp.full_name, ''), nullif(u.raw_user_meta_data->>'full_name', ''), ''),
      coalesce(nullif(s.topic, ''), case standing.account_role
        when 'landlord' then 'Property ownership & lettings'
        when 'tenant' then 'Home renting & resident life'
        when 'agent' then 'Property search & lettings'
        when 'caretaker' then 'Property care & operations'
        when 'lawyer' then 'Property law & tenancy guidance'
        when 'property_seeker' then 'Home search & neighbourhoods'
        else 'Property community' end),
      coalesce(nullif(s.tagline, ''), case standing.account_role
        when 'landlord' then 'Helping people find and care for the right property.'
        when 'tenant' then 'A resident building a better home experience.'
        when 'agent' then 'Connecting people with spaces that fit their plans.'
        when 'caretaker' then 'Supporting safe, well-cared-for properties.'
        when 'lawyer' then 'Supporting clear, considered property relationships.'
        when 'property_seeker' then 'Exploring spaces that fit the next chapter.'
        else 'Part of the Yemilaz Properties community.' end),
      standing.score, standing.level_label, standing.score >= 60, standing.account_role
    from public.profile_standing_score_internal(v_user_id) standing
    join auth.users u on u.id = v_user_id
    left join public.landlord_profiles lp on lp.user_id = v_user_id
    left join public.stakeholder_profiles sp on sp.user_id = v_user_id
    left join public.public_profile_settings s on s.user_id = v_user_id;
end;
$$;
revoke all on function public.get_my_public_profile_settings() from public, anon;
grant execute on function public.get_my_public_profile_settings() to authenticated;

create or replace function public.save_my_public_profile_settings(
  p_is_visible boolean, p_display_name text, p_topic text, p_tagline text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_score integer;
begin
  if v_user_id is null then raise exception 'Sign in to manage your public profile.'; end if;
  select s.score into v_score from public.profile_standing_score_internal(v_user_id) s;
  if p_is_visible and coalesce(v_score, 0) < 60 then
    raise exception 'Reach Established standing (60 points) before joining the public homepage spotlight.';
  end if;
  if p_is_visible and (nullif(btrim(p_display_name), '') is null or nullif(btrim(p_topic), '') is null or nullif(btrim(p_tagline), '') is null) then
    raise exception 'Add a public display name, topic and short introduction before enabling visibility.';
  end if;
  insert into public.public_profile_settings(user_id, is_visible, display_name, topic, tagline, updated_at)
  values (v_user_id, coalesce(p_is_visible, false), left(btrim(coalesce(p_display_name, '')), 80),
    left(btrim(coalesce(p_topic, '')), 80), left(btrim(coalesce(p_tagline, '')), 180), now())
  on conflict (user_id) do update set is_visible = excluded.is_visible,
    display_name = excluded.display_name, topic = excluded.topic,
    tagline = excluded.tagline, updated_at = excluded.updated_at;
end;
$$;
revoke all on function public.save_my_public_profile_settings(boolean,text,text,text) from public, anon;
grant execute on function public.save_my_public_profile_settings(boolean,text,text,text) to authenticated;

create or replace function public.get_homepage_member_spotlight()
returns table(display_name text, account_role text, level_label text, topic text, tagline text)
language sql stable security definer set search_path = '' as $$
  select s.display_name, standing.account_role, standing.level_label, s.topic, s.tagline
  from public.public_profile_settings s
  cross join lateral public.profile_standing_score_internal(s.user_id) standing
  where s.is_visible and standing.score >= 60
  order by md5(s.user_id::text || current_date::text)
  limit 6;
$$;
revoke all on function public.get_homepage_member_spotlight() from public;
grant execute on function public.get_homepage_member_spotlight() to anon, authenticated;
