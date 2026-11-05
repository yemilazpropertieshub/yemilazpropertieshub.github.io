-- Keep transaction corrections traceable instead of deleting payment records.
alter table public.service_charges
  drop constraint if exists service_charges_status_check;

alter table public.service_charges
  add constraint service_charges_status_check
  check (status in ('unpaid', 'paid', 'waived', 'voided'));

alter table public.service_charges
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id) on delete set null,
  add column if not exists void_reason text,
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid references auth.users(id) on delete set null;

comment on column public.service_charges.void_reason is
  'Reason supplied by the owner when the transaction was voided; retained for audit history.';
