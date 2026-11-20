-- Anchor recurring charges to the first lease period and keep historical
-- tenancies auditable when the first rent payment date is known.
alter table public.tenants add column if not exists first_rent_paid_at date;

-- Preserve the existing first-year-paid model when that payment was already
-- recorded against the lease start date. Deposits do not count as rent paid.
update public.tenants t
set first_rent_paid_at = (
  select c.paid_at
  from public.service_charges c
  where c.tenant_id=t.id and c.owner_id=t.owner_id and c.category='rent'
    and c.status='paid' and c.due_date=t.lease_start and c.paid_at is not null
  order by c.paid_at
  limit 1
)
where t.first_rent_paid_at is null and t.lease_start is not null;

-- Scheduled rows made before the property allocation was saved should still
-- appear under the tenant's property in the payment ledger.
update public.service_charges c
set property_id=t.property_id
from public.tenants t
where c.tenant_id=t.id and c.owner_id=t.owner_id and c.property_id is null
  and c.category='rent' and c.description like 'Scheduled rent · %'
  and t.property_id is not null;

create or replace function public.generate_tenant_rent_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_due date; v_step interval; v_count integer := 0;
begin
  if new.rent_amount is null or new.rent_amount <= 0 or new.lease_start is null or new.lease_end is null then return new; end if;
  v_step := case new.rent_frequency when 'monthly' then interval '1 month' when 'quarterly' then interval '3 months' else interval '1 year' end;
  -- A recorded first rent payment covers the first period; a deposit does not.
  v_due := case when new.first_rent_paid_at is not null then (new.lease_start + v_step)::date else new.lease_start end;
  while v_due <= new.lease_end and v_count < 600 loop
    if not exists (select 1 from public.service_charges c where c.owner_id=new.owner_id and c.tenant_id=new.id and c.category='rent' and c.due_date=v_due) then
      insert into public.service_charges(owner_id,tenant_id,property_id,description,category,amount,due_date,status)
      values(new.owner_id,new.id,new.property_id,'Scheduled rent · '||to_char(v_due,'Mon YYYY'),'rent',new.rent_amount,v_due,'unpaid');
    else
      update public.service_charges c set property_id=coalesce(c.property_id,new.property_id),
        amount=case when c.status='unpaid' and v_due>=current_date then new.rent_amount else c.amount end
      where c.owner_id=new.owner_id and c.tenant_id=new.id and c.category='rent' and c.due_date=v_due
        and c.description like 'Scheduled rent · %'
        and ((c.property_id is null and new.property_id is not null)
          or (c.status='unpaid' and v_due>=current_date and c.amount is distinct from new.rent_amount));
    end if;
    v_due := (v_due + v_step)::date;
    v_count := v_count + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists tenants_generate_rent_schedule on public.tenants;
create trigger tenants_generate_rent_schedule after insert or update of lease_start,lease_end,rent_amount,rent_frequency,property_id,first_rent_paid_at on public.tenants
for each row execute function public.generate_tenant_rent_schedule();

-- Backfill missing rent periods for existing records without changing any
-- existing paid, edited, waived, or voided entry.
update public.tenants set rent_frequency=rent_frequency
where rent_amount > 0 and lease_start is not null and lease_end is not null;

drop policy if exists "Owners delete unpaid service charges" on public.service_charges;
create policy "Owners delete unpaid service charges" on public.service_charges
  for delete to authenticated using(owner_id=auth.uid() and status='unpaid');
grant delete on public.service_charges to authenticated;

create or replace function public.prevent_delete_recorded_payment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status <> 'unpaid' then
    raise exception 'Only unpaid charges can be deleted. Void a paid record to preserve its transaction history.';
  end if;
  if auth.uid() is not null and old.owner_id <> auth.uid() then
    raise exception 'You can only delete charges from your own property account.';
  end if;
  return old;
end;
$$;
drop trigger if exists protect_recorded_payment_history on public.service_charges;
create trigger protect_recorded_payment_history before delete on public.service_charges
  for each row execute function public.prevent_delete_recorded_payment();
