-- Let each renewal payment carry its own extension duration. Existing charges
-- without a selected duration continue using the original agreement term.
alter table public.tenants
  add column if not exists original_lease_start date,
  add column if not exists original_lease_end date;

update public.tenants
set original_lease_start = coalesce(original_lease_start, lease_start),
    original_lease_end = coalesce(original_lease_end, lease_end)
where lease_start is not null and lease_end is not null;

create or replace function public.capture_original_lease_term()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.original_lease_start is null then new.original_lease_start := new.lease_start; end if;
  if new.original_lease_end is null then new.original_lease_end := new.lease_end; end if;
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
  add column if not exists lease_end_after_extension date,
  add column if not exists lease_extension_months integer;

create or replace function public.set_rent_payment_status(
  p_charge_id uuid,
  p_status text,
  p_paid_at date default current_date,
  p_reason text default null,
  p_duration_months integer default null
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
  v_previous_months integer;
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
    v_previous_months := v_charge.lease_extension_months;
    update public.service_charges
    set status = 'paid', paid_at = coalesce(p_paid_at, current_date),
        lease_extension_months = p_duration_months,
        edited_at = now(), edited_by = auth.uid()
    where id = p_charge_id and owner_id = auth.uid()
    returning * into v_charge;

    if v_charge.category = 'rent' and lower(v_charge.description) like 'renewal rent%'
       and (v_charge.lease_extension_applied_at is null or p_duration_months is distinct from v_previous_months) then
      select * into v_tenant
      from public.tenants
      where id = v_charge.tenant_id and owner_id = auth.uid()
      for update;
      if not found or v_tenant.lease_end is null
         or v_tenant.original_lease_start is null
         or v_tenant.original_lease_end is null then
        raise exception 'This renewal cannot extend the tenancy because the original agreement dates are missing.';
      end if;

      if p_duration_months is not null then
        if p_duration_months < 1 or p_duration_months > 120 then
          raise exception 'Renewal duration must be between 1 and 120 months.';
        end if;
        v_term := make_interval(months => p_duration_months);
      else
        v_term := age(v_tenant.original_lease_end + 1, v_tenant.original_lease_start);
      end if;
      if v_term <= interval '0' then raise exception 'The original agreement term must be greater than zero.'; end if;
      if v_charge.lease_extension_applied_at is null then
        v_new_end := (v_tenant.lease_end + v_term)::date;
        update public.service_charges
        set lease_extension_applied_at = now(), lease_end_before_extension = v_tenant.lease_end
        where id = p_charge_id and owner_id = auth.uid();
      else
        if v_tenant.lease_end is distinct from v_charge.lease_end_after_extension then
          raise exception 'A later lease change exists. Review the tenancy dates before changing the paid renewal duration.';
        end if;
        v_new_end := (v_charge.lease_end_before_extension + v_term)::date;
      end if;

      update public.tenants set lease_end = v_new_end
      where id = v_tenant.id and owner_id = auth.uid();
      update public.service_charges
      set lease_end_after_extension = v_new_end
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

revoke all on function public.set_rent_payment_status(uuid, text, date, text, integer) from public, anon;
grant execute on function public.set_rent_payment_status(uuid, text, date, text, integer) to authenticated;

-- Each renewal is due the day after the current lease expires. This respects
-- custom renewal durations instead of advancing by the tenant's old frequency.
create or replace function public.create_due_rent_renewal_charges()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_tenant record;
  v_due date;
  v_created integer := 0;
begin
  for v_tenant in
    select t.id, t.owner_id, t.property_id, t.lease_end, t.rent_amount
    from public.tenants t
    where t.status = 'active' and t.rent_amount > 0
      and t.lease_end is not null and t.lease_end < current_date
  loop
    v_due := (v_tenant.lease_end + 1)::date;
    if not exists (
      select 1 from public.service_charges c
      where c.owner_id = v_tenant.owner_id and c.tenant_id = v_tenant.id
        and c.category = 'rent' and c.due_date = v_due
    ) then
      insert into public.service_charges(owner_id, tenant_id, property_id, description, category, amount, due_date, status)
      values(v_tenant.owner_id, v_tenant.id, v_tenant.property_id,
        'Renewal rent · ' || to_char(v_due, 'Mon YYYY'), 'rent', v_tenant.rent_amount, v_due, 'unpaid');
      v_created := v_created + 1;
    end if;
  end loop;
  return v_created;
end;
$$;

revoke all on function public.create_due_rent_renewal_charges() from public, anon, authenticated;
grant execute on function public.create_due_rent_renewal_charges() to postgres;

create or replace function public.ensure_my_due_rent_charges(p_tenant_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_tenant record;
  v_due date;
begin
  if auth.uid() is null or not public.user_can_access_tenant(p_tenant_id) then
    raise exception 'You are not authorized to update this tenancy ledger.' using errcode = '42501';
  end if;
  select t.id, t.owner_id, t.property_id, t.lease_end, t.rent_amount
    into v_tenant
  from public.tenants t
  where t.id = p_tenant_id and t.status = 'active'
    and t.rent_amount > 0 and t.lease_end is not null
    and t.lease_end < current_date;
  if not found then return 0; end if;

  v_due := (v_tenant.lease_end + 1)::date;
  if exists (
    select 1 from public.service_charges c
    where c.owner_id = v_tenant.owner_id and c.tenant_id = v_tenant.id
      and c.category = 'rent' and c.due_date = v_due
  ) then return 0; end if;

  insert into public.service_charges(owner_id, tenant_id, property_id, description, category, amount, due_date, status)
  values(v_tenant.owner_id, v_tenant.id, v_tenant.property_id,
    'Renewal rent · ' || to_char(v_due, 'Mon YYYY'), 'rent', v_tenant.rent_amount, v_due, 'unpaid');
  return 1;
end;
$$;

revoke all on function public.ensure_my_due_rent_charges(uuid) from public, anon;
grant execute on function public.ensure_my_due_rent_charges(uuid) to authenticated;
