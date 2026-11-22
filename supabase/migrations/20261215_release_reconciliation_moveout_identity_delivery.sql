-- Operational controls: move-out closeout, identity consent, and email retries/webhooks.
-- Existing tenancy/payment history is retained. This migration never stores raw NIN or biometrics.

alter table public.property_inspections
  add column if not exists keys_returned integer check (keys_returned is null or keys_returned >= 0),
  add column if not exists meter_readings jsonb not null default '{}'::jsonb,
  add column if not exists deposit_refund_amount numeric(14,2) not null default 0 check (deposit_refund_amount >= 0),
  add column if not exists outstanding_balance numeric(14,2) not null default 0 check (outstanding_balance >= 0),
  add column if not exists move_out_completed_at timestamptz,
  add column if not exists settlement_charge_id uuid references public.service_charges(id) on delete set null;

create or replace function public.complete_tenancy_move_out(p_inspection_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inspection public.property_inspections%rowtype;
  v_tenant public.tenants%rowtype;
  v_charge_id uuid;
begin
  select * into v_inspection
  from public.property_inspections
  where id = p_inspection_id and owner_id = auth.uid()
  for update;
  if not found then raise exception 'Move-out inspection was not found in your account.'; end if;
  if v_inspection.inspection_type <> 'move_out' or v_inspection.tenant_id is null then
    raise exception 'A move-out inspection linked to a tenant is required.';
  end if;
  if v_inspection.move_out_completed_at is not null then return v_inspection.settlement_charge_id; end if;

  select * into v_tenant from public.tenants
  where id = v_inspection.tenant_id and owner_id = auth.uid()
  for update;
  if not found then raise exception 'The linked tenant record is unavailable.'; end if;

  if v_inspection.outstanding_balance > 0 then
    insert into public.service_charges(owner_id, tenant_id, property_id, description, category, amount, due_date, status)
    values (auth.uid(), v_tenant.id, v_tenant.property_id, 'Move-out settlement · ' || v_tenant.full_name,
      'other', v_inspection.outstanding_balance, v_inspection.inspection_date, 'unpaid')
    returning id into v_charge_id;
  end if;

  update public.tenants set status = 'expired' where id = v_tenant.id and owner_id = auth.uid();
  if v_tenant.property_id is not null and not exists (
    select 1 from public.tenants other_tenant
    where other_tenant.owner_id = auth.uid() and other_tenant.property_id = v_tenant.property_id
      and other_tenant.id <> v_tenant.id and other_tenant.status = 'active'
  ) then
    update public.properties set status = 'available', is_advertised = false
    where id = v_tenant.property_id and owner_id = auth.uid() and status <> 'sold';
  end if;

  update public.property_inspections
  set move_out_completed_at = now(), settlement_charge_id = v_charge_id
  where id = v_inspection.id and owner_id = auth.uid();
  return v_charge_id;
end;
$$;
revoke all on function public.complete_tenancy_move_out(uuid) from public, anon;
grant execute on function public.complete_tenancy_move_out(uuid) to authenticated;

create table if not exists public.account_identity_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'ninauth',
  consent_version text not null,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.account_identity_consents enable row level security;
revoke all on public.account_identity_consents from anon, public;
grant select, insert on public.account_identity_consents to authenticated;
drop policy if exists "Members view their identity consent history" on public.account_identity_consents;
create policy "Members view their identity consent history" on public.account_identity_consents
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Members record their own identity consent" on public.account_identity_consents;
create policy "Members record their own identity consent" on public.account_identity_consents
  for insert to authenticated with check (user_id = auth.uid());
comment on table public.account_identity_consents is 'Versioned user consent timestamps only. Do not store NIN, biometric, or identity-document values here.';

alter table public.tenant_packet_deliveries
  add column if not exists attempt_number integer not null default 1 check (attempt_number > 0),
  add column if not exists retry_of uuid references public.tenant_packet_deliveries(id) on delete set null,
  add column if not exists provider_status text not null default 'unknown'
    check (provider_status in ('unknown','delivered','bounced','complained','delivery_delayed')),
  add column if not exists provider_event_id text;
create unique index if not exists tenant_packet_delivery_provider_event_uidx
  on public.tenant_packet_deliveries(provider_event_id) where provider_event_id is not null;
create index if not exists tenant_packet_delivery_retry_idx
  on public.tenant_packet_deliveries(owner_id, tenant_id, recipient_email, created_at desc);

create table if not exists public.yemilaz_migration_history (
  migration_file text primary key,
  sha256 char(64) not null,
  environment text not null check (environment in ('staging','production')),
  applied_by text not null,
  release_reference text,
  applied_at timestamptz not null default now()
);
revoke all on table public.yemilaz_migration_history from public, anon, authenticated;
comment on table public.yemilaz_migration_history is 'Internal SQL Editor release log. Checksum is compared to the checked-in supabase/migration-manifest.json.';
