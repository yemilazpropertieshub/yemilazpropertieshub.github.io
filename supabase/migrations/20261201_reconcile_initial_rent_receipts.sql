-- Reconcile imported initial rent receipts with the first generated rent
-- charge. A paid initial rent covering the first lease period means that
-- first scheduled charge is not still owed. Deposits are never treated as rent.

-- Void only the auto-generated first-period rent row when a full initial rent
-- receipt is already recorded for this tenant.
update public.service_charges scheduled
set status = 'voided',
    voided_at = coalesce(scheduled.voided_at, now()),
    void_reason = 'Covered by the recorded initial rent payment for the first lease period.'
from public.tenants t
where scheduled.owner_id = t.owner_id
  and scheduled.tenant_id = t.id
  and scheduled.category = 'rent'
  and scheduled.status = 'unpaid'
  and scheduled.description like 'Scheduled rent · %'
  and scheduled.due_date = t.lease_start
  and t.rent_amount > 0
  and exists (
    select 1
    from public.service_charges paid
    where paid.owner_id = t.owner_id
      and paid.tenant_id = t.id
      and paid.category = 'rent'
      and paid.status = 'paid'
      and paid.description like 'Initial rent payment%'
      and paid.amount >= t.rent_amount
      and paid.paid_at::date between
        t.lease_start - case t.rent_frequency
          when 'monthly' then interval '1 month'
          when 'quarterly' then interval '3 months'
          else interval '1 year'
        end
        and t.lease_start + case t.rent_frequency
          when 'monthly' then interval '1 month'
          when 'quarterly' then interval '3 months'
          else interval '1 year'
        end
  );

-- Correct the due date on qualifying imported initial rent receipts. The
-- actual paid_at remains untouched as the historical receipt date.
update public.service_charges paid
set due_date = t.lease_start
from public.tenants t
where paid.owner_id = t.owner_id
  and paid.tenant_id = t.id
  and paid.category = 'rent'
  and paid.status = 'paid'
  and paid.description like 'Initial rent payment%'
  and paid.amount >= t.rent_amount
  and t.rent_amount > 0
  and t.lease_start is not null
  and paid.paid_at::date between
    t.lease_start - case t.rent_frequency
      when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months'
      else interval '1 year'
    end
    and t.lease_start + case t.rent_frequency
      when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months'
      else interval '1 year'
    end;

-- Store the original receipt date so recurring schedules begin after that
-- paid period. Only use a rent receipt, never a deposit receipt.
update public.tenants t
set first_rent_paid_at = (
  select paid.paid_at::date
  from public.service_charges paid
  where paid.owner_id = t.owner_id
    and paid.tenant_id = t.id
    and paid.category = 'rent'
    and paid.status = 'paid'
    and paid.description like 'Initial rent payment%'
    and paid.amount >= t.rent_amount
    and paid.paid_at::date between
      t.lease_start - case t.rent_frequency
        when 'monthly' then interval '1 month'
        when 'quarterly' then interval '3 months'
        else interval '1 year'
      end
      and t.lease_start + case t.rent_frequency
        when 'monthly' then interval '1 month'
        when 'quarterly' then interval '3 months'
        else interval '1 year'
      end
  order by abs(paid.paid_at::date - t.lease_start), paid.paid_at
  limit 1
)
where t.first_rent_paid_at is null
  and t.rent_amount > 0
  and t.lease_start is not null
  and exists (
    select 1 from public.service_charges paid
    where paid.owner_id = t.owner_id and paid.tenant_id = t.id
      and paid.category = 'rent' and paid.status = 'paid'
      and paid.description like 'Initial rent payment%'
      and paid.amount >= t.rent_amount
  );

-- Re-run the idempotent schedule function for active records after repairs.
update public.tenants set rent_frequency = rent_frequency
where status = 'active' and rent_amount > 0
  and lease_start is not null and lease_end is not null;
