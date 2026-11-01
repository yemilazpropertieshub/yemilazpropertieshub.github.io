-- Public complaint intake. Complaints are private: clients can submit, but cannot read or change submissions.
create table if not exists public.property_complaints (
  id uuid primary key default gen_random_uuid(),
  complainant_name text not null check (char_length(complainant_name) between 1 and 120),
  email text not null check (char_length(email) <= 254),
  phone text,
  stakeholder_role text not null check (stakeholder_role in ('Landlord','Tenant','Agent','Caretaker','Buyer or seller','Other')),
  property_address text not null check (char_length(property_address) between 1 and 300),
  category text not null check (category in ('Repairs and maintenance','Rent or payment','Property access','Conduct or safety','Agreement or documentation','Other')),
  subject text not null check (char_length(subject) between 1 and 120),
  details text not null check (char_length(details) between 1 and 5000),
  status text not null default 'new' check (status in ('new','in_review','resolved','closed')),
  created_at timestamptz not null default now()
);

alter table public.property_complaints enable row level security;
revoke all on public.property_complaints from anon, authenticated;
grant insert on public.property_complaints to anon, authenticated;
drop policy if exists "Anyone can lodge a property complaint" on public.property_complaints;
create policy "Anyone can lodge a property complaint" on public.property_complaints
  for insert to anon, authenticated with check (true);
