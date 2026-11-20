-- Renewal rent should appear in the payment history only once the next rent
-- due date has arrived. Supabase Cron runs the generator daily, including when
-- no landlord or tenant is signed in.

-- Retire future renewal entries created in advance by the previous migration.
-- Keep them as voided audit records; they will be recreated on their due date.
update public.service_charges
set status = 'voided',
    voided_at = coalesce(voided_at, now()),
    void_reason = 'Superseded: renewal rent is now recorded only when due.'
where category = 'rent'
  and status = 'unpaid'
  and description like 'Renewal rent · %'
  and due_date > current_date;

-- Stop the tenant trigger from pre-creating a renewal entry beyond lease_end.
create or replace function public.generate_tenant_rent_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_due date;
  v_step interval;
  v_count integer := 0;
begin
  if new.rent_amount is null or new.rent_amount <= 0
    or new.lease_start is null or new.lease_end is null then
    return new;
  end if;

  v_step := case new.rent_frequency
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    else interval '1 year'
  end;

  v_due := case when new.first_rent_paid_at is not null
    then (new.lease_start + v_step)::date
    else new.lease_start
  end;

  -- Create normal lease charges through the recorded lease end only.
  while v_due <= new.lease_end and v_count < 600 loop
    if not exists (
      select 1 from public.service_charges c
      where c.owner_id = new.owner_id and c.tenant_id = new.id
        and c.category = 'rent' and c.due_date = v_due
    ) then
      insert into public.service_charges(owner_id, tenant_id, property_id, description, category, amount, due_date, status)
      values(new.owner_id, new.id, new.property_id, 'Scheduled rent · ' || to_char(v_due, 'Mon YYYY'), 'rent', new.rent_amount, v_due, 'unpaid');
    else
      update public.service_charges c
      set property_id = coalesce(c.property_id, new.property_id),
          amount = case when c.status = 'unpaid' and v_due >= current_date then new.rent_amount else c.amount end
      where c.owner_id = new.owner_id and c.tenant_id = new.id
        and c.category = 'rent' and c.due_date = v_due
        and c.description like 'Scheduled rent · %'
        and ((c.property_id is null and new.property_id is not null)
          or (c.status = 'unpaid' and v_due >= current_date and c.amount is distinct from new.rent_amount));
    end if;
    v_due := (v_due + v_step)::date;
    v_count := v_count + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists tenants_generate_rent_schedule on public.tenants;
create trigger tenants_generate_rent_schedule
after insert or update of lease_start, lease_end, rent_amount, rent_frequency, property_id, first_rent_paid_at
on public.tenants for each row execute function public.generate_tenant_rent_schedule();

-- Materialize rent renewal entries only after their due date arrives. Catch up
-- missed cycles one period at a time for active tenants, without duplicating
-- existing, paid, waived, or intentionally voided rent entries.
create or replace function public.create_due_rent_renewal_charges()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_tenant record;
  v_step interval;
  v_last_due date;
  v_due date;
  v_description text;
  v_created integer := 0;
begin
  for v_tenant in
    select t.id, t.owner_id, t.property_id, t.lease_start, t.lease_end,
           t.rent_amount, t.rent_frequency
    from public.tenants t
    where t.status = 'active'
      and t.rent_amount > 0
      and t.lease_start is not null
      and t.lease_end is not null
      and t.lease_end <= current_date
  loop
    v_step := case v_tenant.rent_frequency
      when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months'
      else interval '1 year'
    end;

    select max(c.due_date) into v_last_due
    from public.service_charges c
    where c.owner_id = v_tenant.owner_id
      and c.tenant_id = v_tenant.id
      and c.category = 'rent'
      and c.due_date is not null
      and (c.status <> 'voided' or c.void_reason is distinct from 'Superseded: renewal rent is now recorded only when due.');

    v_due := case when v_last_due is null
      then v_tenant.lease_start
      else (v_last_due + v_step)::date
    end;

    while v_due <= current_date loop
      -- An intentionally voided charge still reserves its rent period.
      if not exists (
        select 1 from public.service_charges c
        where c.owner_id = v_tenant.owner_id and c.tenant_id = v_tenant.id
          and c.category = 'rent' and c.due_date = v_due
      ) then
        v_description := 'Renewal rent · ' || to_char(v_due, 'Mon YYYY');
        insert into public.service_charges(owner_id, tenant_id, property_id, description, category, amount, due_date, status)
        values(v_tenant.owner_id, v_tenant.id, v_tenant.property_id, v_description, 'rent', v_tenant.rent_amount, v_due, 'unpaid');
        v_created := v_created + 1;
      end if;
      v_due := (v_due + v_step)::date;
    end loop;
  end loop;
  return v_created;
end;
$$;

revoke all on function public.create_due_rent_renewal_charges() from public, anon, authenticated;
grant execute on function public.create_due_rent_renewal_charges() to postgres;

-- Also catch up any renewal dates that have already passed when this migration
-- is installed, then run shortly after midnight UTC each day (02:05 in Nigeria).
select public.create_due_rent_renewal_charges();
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'create-due-rent-renewal-charges',
  '5 1 * * *',
  'select public.create_due_rent_renewal_charges();'
);
