-- Run once in Supabase SQL Editor before deploying the matching frontend.
-- Property records stay private by default. Only explicitly advertised and available
-- properties are readable by public visitors.

alter table public.properties
  add column if not exists is_advertised boolean not null default false;

-- Deleting a property should keep its tenant and payment history.
alter table public.service_charges
  drop constraint if exists service_charges_property_id_fkey;
alter table public.service_charges
  add constraint service_charges_property_id_fkey
  foreign key (property_id) references public.properties(id) on delete set null;

drop policy if exists "Public can view advertised available properties" on public.properties;
create policy "Public can view advertised available properties"
  on public.properties for select to anon, authenticated
  using (status = 'available' and is_advertised = true);

-- Atomically release any old allocation and allocate an available property only
-- after a rent or deposit payment has been recorded for the tenant.
create or replace function public.allocate_property(p_tenant_id uuid, p_property_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_old_property_id uuid;
  v_property_owner_id uuid;
  v_property_status text;
begin
  select t.owner_id, t.property_id
    into v_owner_id, v_old_property_id
    from public.tenants as t
    where t.id = p_tenant_id
    for update;

  if not found or v_owner_id is distinct from auth.uid() then
    raise exception 'Tenant not found for this account';
  end if;

  if p_property_id is not null then
    if not exists (
      select 1 from public.service_charges as c
      where c.tenant_id = p_tenant_id
        and c.owner_id = auth.uid()
        and c.status = 'paid'
        and c.category in ('rent', 'deposit')
    ) then
      raise exception 'Record a paid rent or deposit before allocating a property';
    end if;

    select p.owner_id, p.status
      into v_property_owner_id, v_property_status
      from public.properties as p
      where p.id = p_property_id
      for update;

    if not found or v_property_owner_id is distinct from auth.uid() then
      raise exception 'Property not found for this account';
    end if;
    if v_property_status <> 'available' and p_property_id is distinct from v_old_property_id then
      raise exception 'Property is no longer available';
    end if;
  end if;

  if v_old_property_id is not null and v_old_property_id is distinct from p_property_id then
    update public.properties
      set status = 'available'
      where id = v_old_property_id and owner_id = auth.uid() and status = 'occupied';
  end if;

  if p_property_id is not null and p_property_id is distinct from v_old_property_id then
    update public.properties
      set status = 'occupied', is_advertised = false
      where id = p_property_id and owner_id = auth.uid() and status = 'available';
    if not found then
      raise exception 'Property is no longer available';
    end if;
  end if;

  update public.tenants
    set property_id = p_property_id
    where id = p_tenant_id and owner_id = auth.uid();
end;
$$;

revoke all on function public.allocate_property(uuid, uuid) from public;
grant execute on function public.allocate_property(uuid, uuid) to authenticated;
