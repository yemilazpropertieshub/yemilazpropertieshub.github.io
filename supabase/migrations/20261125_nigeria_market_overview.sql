-- Track public asking-price changes without presenting them as completed-sale valuations.
create table if not exists public.property_price_observations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  observed_at timestamptz not null default now(),
  state text,
  city text,
  property_type text,
  listing_type text not null,
  price_period text,
  price numeric not null check (price > 0)
);

create index if not exists property_price_observations_market_idx
  on public.property_price_observations (observed_at, state, city, property_type, listing_type, price_period);
create index if not exists property_price_observations_property_idx
  on public.property_price_observations (property_id, observed_at desc);

alter table public.property_price_observations enable row level security;
revoke all on public.property_price_observations from anon, authenticated;

create or replace function public.capture_public_property_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_advertised is true
     and new.status in ('available', 'reserved')
     and new.price is not null and new.price > 0
     and lower(coalesce(new.country, 'nigeria')) in ('nigeria', 'ng')
     and (tg_op = 'INSERT' or old.is_advertised is distinct from new.is_advertised
          or old.status is distinct from new.status or old.price is distinct from new.price
          or old.state is distinct from new.state or old.city is distinct from new.city
          or old.property_type is distinct from new.property_type
          or old.listing_type is distinct from new.listing_type
          or old.price_period is distinct from new.price_period) then
    insert into public.property_price_observations
      (property_id, state, city, property_type, listing_type, price_period, price)
    values (new.id, nullif(btrim(new.state), ''), nullif(btrim(new.city), ''),
      nullif(btrim(new.property_type), ''), new.listing_type, new.price_period, new.price);
  end if;
  return new;
end;
$$;

drop trigger if exists capture_public_property_price on public.properties;
create trigger capture_public_property_price
  after insert or update of is_advertised, status, price, state, city, property_type, listing_type, price_period
  on public.properties for each row execute function public.capture_public_property_price();

-- Current advertised listings establish the first observation. Trends appear only after
-- at least 30 days of real history; no historical prices are invented.
insert into public.property_price_observations
  (property_id, state, city, property_type, listing_type, price_period, price)
select p.id, nullif(btrim(p.state), ''), nullif(btrim(p.city), ''),
       nullif(btrim(p.property_type), ''), p.listing_type, p.price_period, p.price
from public.properties p
where p.is_advertised is true and p.status in ('available', 'reserved')
  and p.price is not null and p.price > 0
  and lower(coalesce(p.country, 'nigeria')) in ('nigeria', 'ng')
  and not exists (select 1 from public.property_price_observations o where o.property_id = p.id);

create or replace function public.get_property_market_overview()
returns table (
  state text, city text, property_type text, listing_type text, price_period text,
  current_median numeric, previous_median numeric, movement_percent numeric,
  comparable_listings bigint, as_of timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with current_listings as (
    select p.id, nullif(btrim(p.state), '') as state, nullif(btrim(p.city), '') as city,
      nullif(btrim(p.property_type), '') as property_type, p.listing_type, p.price_period, p.price::numeric as price,
      (select o.price from public.property_price_observations o
       where o.property_id = p.id and o.observed_at <= now() - interval '30 days'
         and o.state is not distinct from nullif(btrim(p.state), '')
         and o.city is not distinct from nullif(btrim(p.city), '')
         and o.property_type is not distinct from nullif(btrim(p.property_type), '')
         and o.listing_type = p.listing_type and o.price_period is not distinct from p.price_period
       order by o.observed_at desc limit 1) as previous_price
    from public.properties p
    where p.is_advertised is true and p.status in ('available', 'reserved')
      and p.price is not null and p.price > 0
      and lower(coalesce(p.country, 'nigeria')) in ('nigeria', 'ng')
  ), grouped as (
    select c.state, c.city, c.property_type, c.listing_type, c.price_period,
      percentile_cont(0.5) within group (order by c.price)::numeric as current_median,
      percentile_cont(0.5) within group (order by c.previous_price)::numeric as previous_median,
      count(*)::bigint as comparable_listings
    from current_listings c
    where c.previous_price is not null
    group by c.state, c.city, c.property_type, c.listing_type, c.price_period
    having count(*) >= 3
  )
  select g.state, g.city, g.property_type, g.listing_type, g.price_period,
    g.current_median, g.previous_median,
    round(((g.current_median - g.previous_median) / nullif(g.previous_median, 0) * 100)::numeric, 2),
    g.comparable_listings, now()
  from grouped g
  where g.previous_median > 0 and g.current_median <> g.previous_median
  order by abs((g.current_median - g.previous_median) / nullif(g.previous_median, 0)) desc
  limit 20;
$$;

revoke all on function public.get_property_market_overview() from public;
grant execute on function public.get_property_market_overview() to anon, authenticated;

