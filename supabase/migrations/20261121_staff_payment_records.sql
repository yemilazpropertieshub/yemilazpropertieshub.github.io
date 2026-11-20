create table if not exists public.staff_payment_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  tenant_id uuid references public.tenants(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  payer_name text,
  category text not null default 'other'
    check (category in ('management_fee','commission','maintenance_fee','legal_fee','viewing_fee','other')),
  description text not null check (length(trim(description)) between 2 and 500),
  amount numeric(14,2) not null check (amount > 0),
  paid_at date not null default current_date,
  reference text,
  tenant_visible boolean not null default false,
  created_at timestamptz not null default now(),
  constraint staff_payment_visibility_requires_tenant check (tenant_visible = false or tenant_id is not null)
);

create index if not exists staff_payment_records_owner_paid_idx
  on public.staff_payment_records(owner_id, paid_at desc);
create index if not exists staff_payment_records_staff_paid_idx
  on public.staff_payment_records(staff_id, paid_at desc);
create index if not exists staff_payment_records_tenant_visible_idx
  on public.staff_payment_records(tenant_id, paid_at desc) where tenant_visible;

alter table public.staff_payment_records enable row level security;
revoke all on public.staff_payment_records from anon, authenticated;
grant select, insert on public.staff_payment_records to authenticated;

create or replace function public.can_record_staff_payment(p_staff_id uuid, p_owner_id uuid, p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1
    from public.stakeholder_profiles sp
    join public.staff s on s.id = sp.staff_id
    where sp.user_id = auth.uid()
      and sp.staff_id = p_staff_id
      and sp.role in ('agent','caretaker','lawyer')
      and s.owner_id = p_owner_id
      and (
        p_tenant_id is null
        or exists (
          select 1 from public.tenants t
          where t.id = p_tenant_id and t.owner_id = s.owner_id
            and (sp.role = 'lawyer' or t.agent_id = s.id or t.caretaker_id = s.id)
        )
      )
  );
$$;
revoke all on function public.can_record_staff_payment(uuid,uuid,uuid) from public, anon;
grant execute on function public.can_record_staff_payment(uuid,uuid,uuid) to authenticated;

drop policy if exists "Landlords view staff payment records" on public.staff_payment_records;
create policy "Landlords view staff payment records" on public.staff_payment_records
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "Staff view their submitted payment records" on public.staff_payment_records;
create policy "Staff view their submitted payment records" on public.staff_payment_records
  for select to authenticated using (public.can_record_staff_payment(staff_id, owner_id, tenant_id));

drop policy if exists "Tenants view shared staff payment records" on public.staff_payment_records;
create policy "Tenants view shared staff payment records" on public.staff_payment_records
  for select to authenticated using (
    tenant_visible and exists (
      select 1 from public.tenants t
      where t.id = staff_payment_records.tenant_id
        and t.owner_id = staff_payment_records.owner_id
        and lower(t.email) = lower(auth.jwt()->>'email')
    )
  );

drop policy if exists "Staff submit their own payment records" on public.staff_payment_records;
create policy "Staff submit their own payment records" on public.staff_payment_records
  for insert to authenticated with check (
    recorded_by = auth.uid()
    and public.can_record_staff_payment(staff_id, owner_id, tenant_id)
    and (tenant_visible = false or tenant_id is not null)
  );
