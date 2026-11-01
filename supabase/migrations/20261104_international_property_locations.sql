-- Adds country and first-level administrative area to property listings.
-- Existing records continue to use Nigeria as the default country.

alter table public.properties
  add column if not exists country text not null default 'Nigeria',
  add column if not exists state text default 'Lagos';

update public.properties
set country = 'Nigeria'
where country is null or btrim(country) = '';
