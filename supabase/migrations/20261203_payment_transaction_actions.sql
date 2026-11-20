-- Allow property owners to correct their own ledger entries and remove only
-- unpaid charges. Tenant read policies remain separate and unchanged.
alter table public.service_charges enable row level security;

grant select, update, delete on public.service_charges to authenticated;

drop policy if exists "Owners update their service charges" on public.service_charges;
create policy "Owners update their service charges"
  on public.service_charges
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Owners delete unpaid service charges" on public.service_charges;
create policy "Owners delete unpaid service charges"
  on public.service_charges
  for delete to authenticated
  using (owner_id = auth.uid() and status = 'unpaid');
