-- Support residential, commercial, land and agricultural listings and requests.
alter table public.properties
  add column if not exists property_size text,
  add column if not exists intended_use text,
  add column if not exists price_period text not null default 'year';

alter table public.properties
  drop constraint if exists properties_price_period_check;
alter table public.properties
  add constraint properties_price_period_check
  check (price_period in ('year', 'month', 'week', 'day', 'one-time'));

-- The original wanted-request constraint only allowed five generic types.
alter table public.property_wanted_requests
  drop constraint if exists property_wanted_requests_property_type_check;
alter table public.property_wanted_requests
  add constraint property_wanted_requests_property_type_check
  check (property_type in (
    'Residential', 'House', 'Apartment', 'Duplex', 'Room', 'Short-stay accommodation',
    'Commercial', 'Shop / Retail', 'Office', 'Store / Warehouse', 'Industrial / Workshop',
    'Hotel / Guesthouse', 'Mixed-use building', 'Land', 'Residential land / plot',
    'Commercial land', 'Farmland', 'Farm estate', 'Parking space', 'Event space', 'Other',
    'Other property'
  ));
