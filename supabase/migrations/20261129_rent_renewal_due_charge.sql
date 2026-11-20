-- Keep one upcoming renewal rent charge in the ledger beyond each active
-- lease term. This makes the next amount visible in landlord and tenant
-- payment history before it falls due, without creating an open-ended bill.
create or replace function public.generate_tenant_rent_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_due date;
  v_schedule_end date;
  v_step interval;
  v_count integer := 0;
  v_description text;
begin
  if new.rent_amount is null or new.rent_amount <= 0
    or new.lease_start is null or new.lease_end is null
    or coalesce(new.status, 'active') <> 'active' then
    return new;
  end if;

  v_step := case new.rent_frequency
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    else interval '1 year'
  end;

  -- A recorded first rent payment covers the first period; a deposit does not.
  v_due := case when new.first_rent_paid_at is not null
    then (new.lease_start + v_step)::date
    else new.lease_start
  end;
  -- Include only the next renewal date after lease_end, so the ledger never
  -- creates an unlimited stream of rent after a tenancy term.
  v_schedule_end := (new.lease_end + v_step)::date;

  while v_due <= v_schedule_end and v_count < 600 loop
    v_description := case when v_due > new.lease_end
      then 'Renewal rent · ' || to_char(v_due, 'Mon YYYY')
      else 'Scheduled rent · ' || to_char(v_due, 'Mon YYYY')
    end;

    if not exists (
      select 1 from public.service_charges c
      where c.owner_id = new.owner_id and c.tenant_id = new.id
        and c.category = 'rent' and c.due_date = v_due
    ) then
      insert into public.service_charges(owner_id, tenant_id, property_id, description, category, amount, due_date, status)
      values(new.owner_id, new.id, new.property_id, v_description, 'rent', new.rent_amount, v_due, 'unpaid');
    else
      update public.service_charges c
      set property_id = coalesce(c.property_id, new.property_id),
          amount = case when c.status = 'unpaid' and v_due >= current_date then new.rent_amount else c.amount end,
          description = case when c.status = 'unpaid' and c.description like 'Scheduled rent · %'
            then v_description else c.description end
      where c.owner_id = new.owner_id and c.tenant_id = new.id
        and c.category = 'rent' and c.due_date = v_due
        and ((c.property_id is null and new.property_id is not null)
          or (c.status = 'unpaid' and v_due >= current_date and c.amount is distinct from new.rent_amount)
          or (c.status = 'unpaid' and c.description like 'Scheduled rent · %' and c.description is distinct from v_description));
    end if;

    v_due := (v_due + v_step)::date;
    v_count := v_count + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists tenants_generate_rent_schedule on public.tenants;
create trigger tenants_generate_rent_schedule
after insert or update of lease_start, lease_end, rent_amount, rent_frequency, property_id, first_rent_paid_at, status
on public.tenants for each row execute function public.generate_tenant_rent_schedule();

-- Backfill the upcoming renewal charge for active existing tenancies.
update public.tenants set rent_frequency = rent_frequency
where status = 'active' and rent_amount > 0 and lease_start is not null and lease_end is not null;
