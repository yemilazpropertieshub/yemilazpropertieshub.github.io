-- Optional service period covered by an individual payment or charge.
alter table public.service_charges
  add column if not exists period_start date,
  add column if not exists period_end date;
