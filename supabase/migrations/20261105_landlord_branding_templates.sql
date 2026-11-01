-- Gives each landlord a private brand name, palette, and logo mark within the
-- shared Yemilaz Properties platform.

alter table public.landlord_profiles
  add column if not exists brand_template text not null default 'jade',
  add column if not exists brand_logo text not null default 'horizon';

alter table public.landlord_profiles drop constraint if exists landlord_profiles_brand_template_check;
alter table public.landlord_profiles add constraint landlord_profiles_brand_template_check
  check (brand_template in ('jade','midnight','terracotta','plum'));
alter table public.landlord_profiles drop constraint if exists landlord_profiles_brand_logo_check;
alter table public.landlord_profiles add constraint landlord_profiles_brand_logo_check
  check (brand_logo in ('estate','keystone','monogram','horizon','doorway'));

create or replace function public.create_landlord_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
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
