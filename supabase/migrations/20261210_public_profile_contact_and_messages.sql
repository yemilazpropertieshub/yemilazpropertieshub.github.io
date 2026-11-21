-- Optional public contact methods and a private enquiry inbox for homepage profiles.
alter table public.public_profile_settings
  add column if not exists public_id uuid not null default gen_random_uuid(),
  add column if not exists show_phone boolean not null default false,
  add column if not exists show_email boolean not null default false,
  add column if not exists show_address boolean not null default false;
create unique index if not exists public_profile_settings_public_id_uidx on public.public_profile_settings(public_id);

create or replace function public.profile_contact_data_internal(p_user_id uuid)
returns table(contact_email text, contact_phone text, contact_address text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user auth.users%rowtype;
  v_landlord public.landlord_profiles%rowtype;
  v_stakeholder public.stakeholder_profiles%rowtype;
  v_staff public.staff%rowtype;
  v_tenant public.tenants%rowtype;
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
    select * into v_tenant from public.tenants t where lower(t.email) = lower(v_user.email) order by t.created_at desc limit 1;
  end if;
  return query select v_user.email::text,
    coalesce(nullif(v_landlord.phone, ''), nullif(v_stakeholder.phone, ''), nullif(v_staff.phone, ''), nullif(v_tenant.phone, '')),
    coalesce(nullif(v_landlord.business_address, ''), nullif(v_stakeholder.permanent_address, ''), nullif(v_staff.permanent_address, ''), nullif(v_tenant.permanent_address, ''));
end;
$$;
revoke all on function public.profile_contact_data_internal(uuid) from public, anon, authenticated;

drop function if exists public.get_my_public_profile_settings();
create function public.get_my_public_profile_settings()
returns table(is_visible boolean, display_name text, topic text, tagline text,
  score integer, level_label text, eligible boolean, account_role text,
  show_phone boolean, show_email boolean, show_address boolean)
language plpgsql stable security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Sign in to manage your public profile.'; end if;
  return query
    select coalesce(s.is_visible, false),
      coalesce(nullif(s.display_name, ''), nullif(lp.full_name, ''), nullif(sp.full_name, ''), nullif(u.raw_user_meta_data->>'full_name', ''), ''),
      coalesce(nullif(s.topic, ''), case standing.account_role
        when 'landlord' then 'Property ownership & lettings' when 'tenant' then 'Home renting & resident life'
        when 'agent' then 'Property search & lettings' when 'caretaker' then 'Property care & operations'
        when 'lawyer' then 'Property law & tenancy guidance' when 'property_seeker' then 'Home search & neighbourhoods'
        else 'Property community' end),
      coalesce(nullif(s.tagline, ''), case standing.account_role
        when 'landlord' then 'Helping people find and care for the right property.'
        when 'tenant' then 'A resident building a better home experience.'
        when 'agent' then 'Connecting people with spaces that fit their plans.'
        when 'caretaker' then 'Supporting safe, well-cared-for properties.'
        when 'lawyer' then 'Supporting clear, considered property relationships.'
        when 'property_seeker' then 'Exploring spaces that fit the next chapter.'
        else 'Part of the Yemilaz Properties community.' end),
      standing.score, standing.level_label, standing.score >= 60, standing.account_role,
      coalesce(s.show_phone, false), coalesce(s.show_email, false), coalesce(s.show_address, false)
    from public.profile_standing_score_internal(v_user_id) standing
    join auth.users u on u.id = v_user_id
    left join public.landlord_profiles lp on lp.user_id = v_user_id
    left join public.stakeholder_profiles sp on sp.user_id = v_user_id
    left join public.public_profile_settings s on s.user_id = v_user_id;
end;
$$;
revoke all on function public.get_my_public_profile_settings() from public, anon;
grant execute on function public.get_my_public_profile_settings() to authenticated;

drop function if exists public.save_my_public_profile_settings(boolean,text,text,text);
create function public.save_my_public_profile_settings(
  p_is_visible boolean, p_display_name text, p_topic text, p_tagline text,
  p_show_phone boolean default false, p_show_email boolean default false, p_show_address boolean default false
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_score integer;
begin
  if v_user_id is null then raise exception 'Sign in to manage your public profile.'; end if;
  select s.score into v_score from public.profile_standing_score_internal(v_user_id) s;
  if p_is_visible and coalesce(v_score, 0) < 60 then
    raise exception 'Reach Established standing (60 points) before joining the public homepage spotlight.';
  end if;
  if p_is_visible and (nullif(btrim(p_display_name), '') is null or nullif(btrim(p_topic), '') is null or nullif(btrim(p_tagline), '') is null) then
    raise exception 'Add a public display name, topic and short introduction before enabling visibility.';
  end if;
  insert into public.public_profile_settings(user_id,is_visible,display_name,topic,tagline,show_phone,show_email,show_address,updated_at)
  values(v_user_id,coalesce(p_is_visible,false),left(btrim(coalesce(p_display_name,'')),80),left(btrim(coalesce(p_topic,'')),80),
    left(btrim(coalesce(p_tagline,'')),180),case when p_is_visible then coalesce(p_show_phone,false) else false end,
    case when p_is_visible then coalesce(p_show_email,false) else false end,
    case when p_is_visible then coalesce(p_show_address,false) else false end,now())
  on conflict(user_id) do update set is_visible=excluded.is_visible,display_name=excluded.display_name,
    topic=excluded.topic,tagline=excluded.tagline,show_phone=excluded.show_phone,
    show_email=excluded.show_email,show_address=excluded.show_address,updated_at=excluded.updated_at;
end;
$$;
revoke all on function public.save_my_public_profile_settings(boolean,text,text,text,boolean,boolean,boolean) from public, anon;
grant execute on function public.save_my_public_profile_settings(boolean,text,text,text,boolean,boolean,boolean) to authenticated;

drop function if exists public.get_homepage_member_spotlight();
create function public.get_homepage_member_spotlight()
returns table(profile_id uuid, display_name text, account_role text, level_label text, topic text, tagline text,
  contact_phone text, contact_email text, contact_address text)
language sql stable security definer set search_path = '' as $$
  select s.public_id, s.display_name, standing.account_role, standing.level_label, s.topic, s.tagline,
    case when s.show_phone then contact.contact_phone else null end,
    case when s.show_email then contact.contact_email else null end,
    case when s.show_address then contact.contact_address else null end
  from public.public_profile_settings s
  cross join lateral public.profile_standing_score_internal(s.user_id) standing
  cross join lateral public.profile_contact_data_internal(s.user_id) contact
  where s.is_visible and standing.score >= 60
  order by md5(s.user_id::text || current_date::text)
  limit 6;
$$;
revoke all on function public.get_homepage_member_spotlight() from public;
grant execute on function public.get_homepage_member_spotlight() to anon, authenticated;

create table if not exists public.public_profile_messages (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(btrim(sender_name)) between 2 and 120),
  sender_email text not null check (char_length(sender_email) between 5 and 254),
  sender_phone text check (sender_phone is null or char_length(sender_phone) <= 40),
  subject text not null check (char_length(btrim(subject)) between 2 and 120),
  message text not null check (char_length(btrim(message)) between 10 and 3000),
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists public_profile_messages_owner_date_idx
  on public.public_profile_messages(profile_user_id, created_at desc);
alter table public.public_profile_messages enable row level security;
revoke all on public.public_profile_messages from anon, authenticated;
grant select, update(status,read_at) on public.public_profile_messages to authenticated;
drop policy if exists "Members view profile messages sent to them" on public.public_profile_messages;
create policy "Members view profile messages sent to them" on public.public_profile_messages
  for select to authenticated using (profile_user_id = auth.uid());
drop policy if exists "Members update status on profile messages sent to them" on public.public_profile_messages;
create policy "Members update status on profile messages sent to them" on public.public_profile_messages
  for update to authenticated using (profile_user_id = auth.uid()) with check (profile_user_id = auth.uid());

create or replace function public.send_public_profile_message(
  p_public_profile_id uuid, p_sender_name text, p_sender_email text, p_sender_phone text,
  p_subject text, p_message text, p_website text default ''
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_profile_user_id uuid; v_score integer; v_recent integer;
begin
  if nullif(btrim(coalesce(p_website,'')), '') is not null then return null; end if;
  select p.user_id into v_profile_user_id from public.public_profile_settings p
    cross join lateral public.profile_standing_score_internal(p.user_id) standing
    where p.public_id=p_public_profile_id and p.is_visible and standing.score>=60;
  if v_profile_user_id is null or auth.uid() = v_profile_user_id then raise exception 'Choose a public member profile to contact.'; end if;
  select s.score into v_score from public.profile_standing_score_internal(v_profile_user_id) s;
  if coalesce(v_score,0) < 60 or not exists(select 1 from public.public_profile_settings p where p.user_id=v_profile_user_id and p.is_visible) then
    raise exception 'This profile is not accepting public messages.';
  end if;
  if char_length(btrim(coalesce(p_sender_name,''))) not between 2 and 120
    or char_length(btrim(coalesce(p_sender_email,''))) not between 5 and 254
    or position('@' in p_sender_email) < 2
    or char_length(btrim(coalesce(p_sender_phone,''))) > 40
    or char_length(btrim(coalesce(p_subject,''))) not between 2 and 120
    or char_length(btrim(coalesce(p_message,''))) not between 10 and 3000 then
    raise exception 'Complete your name, valid email, subject and a message of at least 10 characters.';
  end if;
  select count(*)::integer into v_recent from public.public_profile_messages m
    where m.profile_user_id=v_profile_user_id and lower(m.sender_email)=lower(btrim(p_sender_email))
      and m.created_at > now() - interval '1 hour';
  if v_recent >= 5 then raise exception 'Please wait before sending another message to this profile.'; end if;
  insert into public.public_profile_messages(profile_user_id,sender_name,sender_email,sender_phone,subject,message)
  values(v_profile_user_id,btrim(p_sender_name),btrim(p_sender_email),nullif(btrim(coalesce(p_sender_phone,'')),''),btrim(p_subject),btrim(p_message))
  returning id into v_id;
  insert into public.user_notifications(user_id,title,message,category,target_path)
  values(v_profile_user_id,'New community profile message',btrim(p_sender_name)||' sent you a message about “'||btrim(p_subject)||'”.','enquiry','Public profile enquiries');
  return v_id;
end;
$$;
revoke all on function public.send_public_profile_message(uuid,text,text,text,text,text,text) from public;
grant execute on function public.send_public_profile_message(uuid,text,text,text,text,text,text) to anon, authenticated;
