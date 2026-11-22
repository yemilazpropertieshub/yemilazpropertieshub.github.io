-- Include account photos in the public homepage spotlight only for members
-- who opted in and still meet the public-standing threshold.
drop function if exists public.get_homepage_member_spotlight();

create function public.get_homepage_member_spotlight()
returns table(
  profile_id uuid,
  display_name text,
  account_role text,
  level_label text,
  topic text,
  tagline text,
  contact_phone text,
  contact_email text,
  contact_address text,
  avatar_url text
)
language sql stable security definer set search_path = '' as $$
  select s.public_id,
    s.display_name,
    standing.account_role,
    standing.level_label,
    s.topic,
    s.tagline,
    case when s.show_phone then contact.contact_phone else null end,
    case when s.show_email then contact.contact_email else null end,
    case when s.show_address then contact.contact_address else null end,
    nullif(u.raw_user_meta_data->>'avatar_url', '')
  from public.public_profile_settings s
  join auth.users u on u.id = s.user_id
  cross join lateral public.profile_standing_score_internal(s.user_id) standing
  cross join lateral public.profile_contact_data_internal(s.user_id) contact
  where s.is_visible and standing.score >= 60
  order by md5(s.user_id::text || current_date::text)
  limit 6;
$$;

revoke all on function public.get_homepage_member_spotlight() from public;
grant execute on function public.get_homepage_member_spotlight() to anon, authenticated;
