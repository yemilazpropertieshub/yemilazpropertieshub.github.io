-- Admin-only contact directory. Personal contact data is returned through a
-- guarded RPC rather than granting platform administrators broad table access.
create or replace function public.list_platform_contacts()
returns table (
  person_key text,
  role text,
  full_name text,
  email text,
  phone text,
  organization text,
  related_to text,
  property_label text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only a Yemilaz Properties administrator can view the contact directory.';
  end if;

  return query
    select 'landlord:' || u.id::text, 'Landlord'::text,
      coalesce(nullif(lp.full_name, ''), u.raw_user_meta_data->>'full_name', 'Landlord'),
      u.email::text, lp.phone, lp.business_name, lp.business_address, null::text, u.created_at
    from auth.users u
    left join public.landlord_profiles lp on lp.user_id = u.id
    where coalesce(u.raw_user_meta_data->>'account_role', 'landlord') = 'landlord'

    union all

    select 'tenant:' || t.id::text, 'Tenant'::text, t.full_name, t.email, t.phone,
      lp.business_name, coalesce(nullif(p.name, ''), 'Tenancy'),
      nullif(concat_ws(', ', p.address, p.city, p.state, p.country), ''), t.created_at
    from public.tenants t
    left join public.landlord_profiles lp on lp.user_id = t.owner_id
    left join public.properties p on p.id = t.property_id

    union all

    select 'staff:' || s.id::text,
      case when s.role = 'caretaker' then 'Caretaker' else 'Agent' end,
      s.full_name, s.email, s.phone, lp.business_name, lp.full_name,
      nullif(concat_ws(', ', p.name, p.city, p.state), ''), s.created_at
    from public.staff s
    left join public.landlord_profiles lp on lp.user_id = s.owner_id
    left join public.properties p on p.id = s.property_id

    union all

    select 'guarantor:' || g.id::text, 'Guarantor'::text, g.full_name, g.email, g.phone,
      lp.business_name, t.full_name,
      nullif(concat_ws(' · ', nullif(g.address, ''), nullif(concat_ws(', ', p.name, p.city, p.state), '')), ''), g.created_at
    from public.guarantors g
    left join public.tenants t on t.id = g.tenant_id
    left join public.landlord_profiles lp on lp.user_id = g.owner_id
    left join public.properties p on p.id = t.property_id

    union all

    select 'stakeholder:' || sp.user_id::text, 'Other account'::text,
      coalesce(nullif(sp.full_name, ''), u.raw_user_meta_data->>'full_name', 'Account holder'),
      u.email::text, u.phone::text, 'Complaint workspace'::text, null::text, null::text, sp.created_at
    from public.stakeholder_profiles sp
    join auth.users u on u.id = sp.user_id
    where sp.role <> 'tenant'

    union all

    select 'complainant:' || c.id::text, 'Complainant'::text, c.complainant_name, c.email, c.phone,
      c.category, lp.full_name,
      nullif(concat_ws(', ', p.name, p.city, p.state), ''), c.created_at
    from public.property_complaints c
    left join public.landlord_profiles lp on lp.user_id = c.landlord_id
    left join public.properties p on p.id = c.property_id
    where c.complainant_name is not null;
end;
$$;

revoke all on function public.list_platform_contacts() from public, anon;
grant execute on function public.list_platform_contacts() to authenticated;
