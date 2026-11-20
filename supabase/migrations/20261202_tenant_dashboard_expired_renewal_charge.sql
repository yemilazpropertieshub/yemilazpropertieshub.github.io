-- Ensure an expired tenant sees any due rent renewal charge as soon as their
-- portal loads, even if the daily scheduled job has not run yet.
-- The tenant can only request synchronization for a tenancy they can access.
create or replace function public.ensure_my_due_rent_charges(p_tenant_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant record;
  v_step interval;
  v_last_due date;
  v_due date;
  v_created integer := 0;
begin
  if auth.uid() is null or not public.user_can_access_tenant(p_tenant_id) then
    raise exception 'You are not authorized to update this tenancy ledger.' using errcode = '42501';
  end if;

  select t.id, t.owner_id, t.property_id, t.lease_start, t.lease_end,
         t.rent_amount, t.rent_frequency, t.first_rent_paid_at
    into v_tenant
  from public.tenants t
  where t.id = p_tenant_id and t.status = 'active'
    and t.rent_amount > 0 and t.lease_start is not null
    and t.lease_end is not null and t.lease_end <= current_date;

  if not found then return 0; end if;

  v_step := case v_tenant.rent_frequency
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    else interval '1 year'
  end;

  select max(c.due_date) into v_last_due
  from public.service_charges c
  where c.owner_id = v_tenant.owner_id and c.tenant_id = v_tenant.id
    and c.category = 'rent' and c.due_date is not null
    and (c.status <> 'voided' or c.void_reason is distinct from 'Superseded: renewal rent is now recorded only when due.');

  -- If a first rent receipt is recorded on the tenancy, its first period is
  -- already covered even if an older account has no linked rent charge row.
  v_due := case
    when v_last_due is not null then (v_last_due + v_step)::date
    when v_tenant.first_rent_paid_at is not null then (v_tenant.lease_start + v_step)::date
    else v_tenant.lease_start
  end;

  while v_due <= current_date loop
    -- A rent row for this due date, including a manually voided one, reserves
    -- that period so this function remains safe to call repeatedly.
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
    v_due := (v_due + v_step)::date;
  end loop;

  return v_created;
end;
$$;

revoke all on function public.ensure_my_due_rent_charges(uuid) from public, anon;
grant execute on function public.ensure_my_due_rent_charges(uuid) to authenticated;
