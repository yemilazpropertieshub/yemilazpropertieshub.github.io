-- Preserve the original agreement term, then extend an expired tenancy once
-- when its due renewal rent is recorded as paid.
alter table public.tenants
  add column if not exists original_lease_start date,
  add column if not exists original_lease_end date;

update public.tenants
set original_lease_start = coalesce(original_lease_start, lease_start),
    original_lease_end = coalesce(original_lease_end, lease_end)
where lease_start is not null and lease_end is not null;

create or replace function public.capture_original_lease_term()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.original_lease_start is null then
    new.original_lease_start := new.lease_start;
  end if;
  if new.original_lease_end is null then
    new.original_lease_end := new.lease_end;
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_capture_original_lease_term on public.tenants;
create trigger tenants_capture_original_lease_term
before insert or update of lease_start, lease_end on public.tenants
for each row execute function public.capture_original_lease_term();

alter table public.service_charges
  add column if not exists lease_extension_applied_at timestamptz,
  add column if not exists lease_end_before_extension date,
  add column if not exists lease_end_after_extension date;

create or replace function public.set_rent_payment_status(
  p_charge_id uuid,
  p_status text,
  p_paid_at date default current_date,
  p_reason text default null
)
returns public.service_charges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_charge public.service_charges%rowtype;
  v_tenant public.tenants%rowtype;
  v_term interval;
  v_new_end date;
begin
  if auth.uid() is null or p_status not in ('paid', 'unpaid', 'voided') then
    raise exception 'A signed-in property manager and a valid payment status are required.';
  end if;
  if p_status = 'voided' and nullif(btrim(p_reason), '') is null then
    raise exception 'A reason is required to void a payment.';
  end if;

  select * into v_charge
  from public.service_charges
  where id = p_charge_id and owner_id = auth.uid()
  for update;
  if not found then raise exception 'Payment record not found.'; end if;
  if v_charge.status = 'voided' then raise exception 'A voided payment cannot be changed.'; end if;

  if p_status = 'paid' then
    update public.service_charges
    set status = 'paid', paid_at = coalesce(p_paid_at, current_date),
        edited_at = now(), edited_by = auth.uid()
    where id = p_charge_id and owner_id = auth.uid()
    returning * into v_charge;

    if v_charge.category = 'rent'
       and v_charge.description like 'Renewal rent · %'
       and v_charge.lease_extension_applied_at is null then
      select * into v_tenant
      from public.tenants
      where id = v_charge.tenant_id and owner_id = auth.uid()
      for update;
      if not found or v_tenant.lease_end is null
         or v_tenant.original_lease_start is null
         or v_tenant.original_lease_end is null then
        raise exception 'This renewal cannot extend the tenancy because the original agreement dates are missing.';
      end if;

      -- age(original end + 1 day, original start) preserves calendar terms
      -- such as 1 Nov through 31 Oct as exactly one year.
      v_term := age(v_tenant.original_lease_end + 1, v_tenant.original_lease_start);
      if v_term <= interval '0' then raise exception 'The original agreement term must be greater than zero.'; end if;
      v_new_end := (v_tenant.lease_end + v_term)::date;

      update public.tenants set lease_end = v_new_end
      where id = v_tenant.id and owner_id = auth.uid();

      update public.service_charges
      set lease_extension_applied_at = now(),
          lease_end_before_extension = v_tenant.lease_end,
          lease_end_after_extension = v_new_end
      where id = p_charge_id and owner_id = auth.uid()
      returning * into v_charge;
    end if;
  elsif p_status = 'unpaid' then
    if v_charge.lease_extension_applied_at is not null then
      select * into v_tenant
      from public.tenants
      where id = v_charge.tenant_id and owner_id = auth.uid()
      for update;
      if v_tenant.lease_end is distinct from v_charge.lease_end_after_extension then
        raise exception 'A later lease change exists. Review the tenancy dates before reversing this renewal payment.';
      end if;
      update public.tenants set lease_end = v_charge.lease_end_before_extension
      where id = v_tenant.id and owner_id = auth.uid();
      update public.service_charges
      set status = 'unpaid', paid_at = null, edited_at = now(), edited_by = auth.uid(),
          lease_extension_applied_at = null,
          lease_end_before_extension = null,
          lease_end_after_extension = null
      where id = p_charge_id and owner_id = auth.uid()
      returning * into v_charge;
    else
      update public.service_charges
      set status = 'unpaid', paid_at = null, edited_at = now(), edited_by = auth.uid()
      where id = p_charge_id and owner_id = auth.uid()
      returning * into v_charge;
    end if;
  else
    if v_charge.lease_extension_applied_at is not null then
      select * into v_tenant
      from public.tenants
      where id = v_charge.tenant_id and owner_id = auth.uid()
      for update;
      if v_tenant.lease_end is distinct from v_charge.lease_end_after_extension then
        raise exception 'A later lease change exists. Review the tenancy dates before voiding this renewal payment.';
      end if;
      update public.tenants set lease_end = v_charge.lease_end_before_extension
      where id = v_tenant.id and owner_id = auth.uid();
    end if;
    update public.service_charges
    set status = 'voided', voided_at = now(), voided_by = auth.uid(),
        void_reason = btrim(p_reason), edited_at = now(), edited_by = auth.uid(),
        lease_extension_applied_at = null,
        lease_end_before_extension = null,
        lease_end_after_extension = null
    where id = p_charge_id and owner_id = auth.uid()
    returning * into v_charge;
  end if;
  return v_charge;
end;
$$;

revoke all on function public.set_rent_payment_status(uuid, text, date, text) from public, anon;
grant execute on function public.set_rent_payment_status(uuid, text, date, text) to authenticated;
