-- Break the tenants -> staff -> tenants RLS cycle.
-- The assigned-staff tenant policy reads staff, whose tenant-facing policy
-- reads tenants again. Keep the same access rule inside a SECURITY DEFINER
-- helper so its internal lookup bypasses table RLS safely.

create or replace function public.user_is_assigned_to_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.tenants t
    join public.stakeholder_profiles sp on sp.user_id = auth.uid()
    join public.staff s on s.id = sp.staff_id
    where t.id = p_tenant_id
      and s.owner_id = t.owner_id
      and (t.agent_id = s.id or t.caretaker_id = s.id)
  );
$$;

revoke all on function public.user_is_assigned_to_tenant(uuid) from public, anon;
grant execute on function public.user_is_assigned_to_tenant(uuid) to authenticated;

drop policy if exists "Assigned staff view their tenants" on public.tenants;
create policy "Assigned staff view their tenants"
  on public.tenants
  for select
  to authenticated
  using (public.user_is_assigned_to_tenant(id));
