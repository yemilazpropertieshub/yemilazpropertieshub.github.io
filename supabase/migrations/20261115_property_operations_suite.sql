-- Property operations suite: account controls, maintenance, rent schedules,
-- evidence, saved listings/searches, notifications and tenancy signatures.

-- Platform-admin controlled suspension. This is separate from Supabase Auth so
-- no auth.users credentials or tokens are exposed to the browser.
create table if not exists public.platform_account_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','suspended')),
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
alter table public.platform_account_controls enable row level security;
revoke all on public.platform_account_controls from public, anon, authenticated;

create or replace function public.is_platform_account_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    public.is_platform_admin() or not exists (
      select 1 from public.platform_account_controls c
      where c.user_id = auth.uid() and c.status = 'suspended'
    )
  );
$$;
revoke all on function public.is_platform_account_active() from public, anon;
grant execute on function public.is_platform_account_active() to authenticated;

create or replace function public.set_platform_account_status(p_user_id uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
  if p_status not in ('active','suspended') then raise exception 'Invalid account status.'; end if;
  if p_user_id = auth.uid() and p_status = 'suspended' then raise exception 'You cannot suspend your own administrator account.'; end if;
  insert into public.platform_account_controls(user_id,status,reason,changed_by,changed_at)
  values (p_user_id,p_status,nullif(trim(p_reason),''),auth.uid(),now())
  on conflict (user_id) do update set status=excluded.status,reason=excluded.reason,changed_by=excluded.changed_by,changed_at=now();
end;
$$;
revoke all on function public.set_platform_account_status(uuid,text,text) from public, anon;
grant execute on function public.set_platform_account_status(uuid,text,text) to authenticated;

-- Additional operational data.
alter table public.properties add column if not exists latitude double precision;
alter table public.properties add column if not exists longitude double precision;
alter table public.service_charges add column if not exists evidence_path text;
alter table public.service_charges add column if not exists evidence_uploaded_at timestamptz;

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  requester_role text not null check (requester_role in ('landlord','tenant','agent','caretaker')),
  title text not null check (char_length(title) between 3 and 160),
  description text not null check (char_length(description) between 10 and 4000),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','assigned','in_progress','waiting','completed','cancelled')),
  assigned_staff_id uuid references public.staff(id) on delete set null,
  due_date date, resolution_notes text, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.maintenance_requests enable row level security;
drop policy if exists "Owners manage maintenance requests" on public.maintenance_requests;
create policy "Owners manage maintenance requests" on public.maintenance_requests for all to authenticated
  using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists "Tenants view and lodge maintenance requests" on public.maintenance_requests;
create policy "Tenants view and lodge maintenance requests" on public.maintenance_requests for select to authenticated
  using (exists (select 1 from public.tenants t where t.id=tenant_id and lower(t.email)=lower(auth.jwt()->>'email')));
create policy "Tenants lodge maintenance requests" on public.maintenance_requests for insert to authenticated
  with check (created_by=auth.uid() and requester_role='tenant' and exists (
    select 1 from public.tenants t where t.id=tenant_id and owner_id=maintenance_requests.owner_id
      and lower(t.email)=lower(auth.jwt()->>'email') and t.property_id=maintenance_requests.property_id));
create policy "Assigned staff view maintenance requests" on public.maintenance_requests for select to authenticated
  using (exists (select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id
    where sp.user_id=auth.uid() and s.owner_id=maintenance_requests.owner_id
      and (maintenance_requests.assigned_staff_id=s.id or s.property_id=maintenance_requests.property_id)));
grant select,insert,update,delete on public.maintenance_requests to authenticated;
create index if not exists maintenance_owner_status_idx on public.maintenance_requests(owner_id,status,created_at desc);

-- Add idempotent rent-charge schedules to the existing payment ledger.
create or replace function public.generate_tenant_rent_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_due date; v_step interval; v_count integer := 0; v_amount numeric;
begin
  if new.rent_amount <= 0 or new.lease_start is null then return new; end if;
  v_step := case new.rent_frequency when 'monthly' then interval '1 month' when 'quarterly' then interval '3 months' else interval '1 year' end;
  v_amount := new.rent_amount;
  -- Tenant registration records the initial payment separately. Start recurring
  -- rent after the first lease period to avoid creating a duplicate first charge.
  v_due := (new.lease_start + v_step)::date;
  while v_due <= new.lease_end and v_count < 120 loop
    if not exists (select 1 from public.service_charges c where c.owner_id=new.owner_id and c.tenant_id=new.id and c.category='rent' and c.due_date=v_due) then
      insert into public.service_charges(owner_id,tenant_id,property_id,description,category,amount,due_date,status)
      values(new.owner_id,new.id,new.property_id,'Scheduled rent · '||to_char(v_due,'Mon YYYY'),'rent',v_amount,v_due,'unpaid');
    end if;
    v_due := (v_due + v_step)::date; v_count := v_count + 1;
  end loop;
  return new;
end;
$$;
drop trigger if exists tenants_generate_rent_schedule on public.tenants;
create trigger tenants_generate_rent_schedule after insert or update of lease_start,lease_end,rent_amount,rent_frequency,property_id on public.tenants
for each row execute function public.generate_tenant_rent_schedule();
-- Backfill future rent entries for current tenants as part of this migration.
update public.tenants set rent_frequency=rent_frequency
where rent_amount > 0 and lease_start is not null and lease_end is not null;

-- Private evidence bucket. Paths are landlord-user-id/charge-id/filename.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('payment-evidence','payment-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Owners manage payment evidence" on storage.objects;
create policy "Owners manage payment evidence" on storage.objects for all to authenticated
using(bucket_id='payment-evidence' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='payment-evidence' and (storage.foldername(name))[1]=auth.uid()::text);

create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,property_id)
);
alter table public.saved_listings enable row level security;
create policy "Users manage their saved listings" on public.saved_listings for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,delete on public.saved_listings to authenticated;

create table if not exists public.property_search_alerts (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  email text not null, filters jsonb not null default '{}'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), check(char_length(email) between 5 and 254)
);
alter table public.property_search_alerts enable row level security;
create policy "Users manage their search alerts" on public.property_search_alerts for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid() and lower(email)=lower(auth.jwt()->>'email'));
grant select,insert,update,delete on public.property_search_alerts to authenticated;

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, message text not null, category text not null default 'general', target_path text,
  read_at timestamptz, created_at timestamptz not null default now()
);
alter table public.user_notifications enable row level security;
create policy "Users read and update their notifications" on public.user_notifications for select to authenticated using(user_id=auth.uid());
create policy "Users mark their notifications read" on public.user_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,update on public.user_notifications to authenticated;
create index if not exists notifications_user_unread_idx on public.user_notifications(user_id,created_at desc) where read_at is null;

create or replace function public.notify_landlord_of_new_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_title text; v_message text; v_category text;
begin
  if tg_table_name='property_enquiries' then v_title:='New property enquiry'; v_message:=coalesce(new.name,'A visitor')||' sent an enquiry.'; v_category:='enquiry';
  elsif tg_table_name='property_viewing_requests' then v_title:='New viewing request'; v_message:=coalesce(new.name,'A visitor')||' requested a viewing.'; v_category:='viewing';
  elsif tg_table_name='property_complaints' then v_title:='New property complaint'; v_message:='A new complaint needs review.'; v_category:='complaint';
  else return new; end if;
  if new.owner_id is not null then insert into public.user_notifications(user_id,title,message,category,target_path) values(new.owner_id,v_title,v_message,v_category,'#workspace'); end if;
  return new;
end;
$$;
drop trigger if exists notify_new_enquiry on public.property_enquiries;
create trigger notify_new_enquiry after insert on public.property_enquiries for each row execute function public.notify_landlord_of_new_activity();
drop trigger if exists notify_new_viewing on public.property_viewing_requests;
create trigger notify_new_viewing after insert on public.property_viewing_requests for each row execute function public.notify_landlord_of_new_activity();

create or replace function public.notify_new_property_complaint()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.landlord_id is not null then
    insert into public.user_notifications(user_id,title,message,category,target_path)
    values(new.landlord_id,'New property complaint','A new complaint needs review.','complaint','#workspace');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_new_property_complaint on public.property_complaints;
create trigger notify_new_property_complaint after insert on public.property_complaints
for each row execute function public.notify_new_property_complaint();

create table if not exists public.tenancy_signatures (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check(document_type in ('tenancy_agreement','house_rules','handover')),
  document_version integer not null default 1, document_text text not null,
  signer_id uuid not null references auth.users(id) on delete cascade, signer_role text not null check(signer_role in ('landlord','tenant')),
  signer_name text not null, signature_text text not null check(char_length(signature_text) between 2 and 120),
  signed_at timestamptz not null default now(), ip_hash text,
  unique(tenant_id,document_type,document_version,signer_id)
);
alter table public.tenancy_signatures enable row level security;
create policy "Landlords read tenancy signatures" on public.tenancy_signatures for select to authenticated using(owner_id=auth.uid());
create policy "Landlords sign tenancy documents" on public.tenancy_signatures for insert to authenticated
with check(owner_id=auth.uid() and signer_id=auth.uid() and signer_role='landlord');
create policy "Tenants read and sign their tenancy documents" on public.tenancy_signatures for select to authenticated
using(exists(select 1 from public.tenants t where t.id=tenant_id and lower(t.email)=lower(auth.jwt()->>'email')));
create policy "Tenants sign their tenancy documents" on public.tenancy_signatures for insert to authenticated
with check(signer_id=auth.uid() and signer_role='tenant' and exists(select 1 from public.tenants t where t.id=tenancy_signatures.tenant_id and t.owner_id=tenancy_signatures.owner_id and lower(t.email)=lower(auth.jwt()->>'email')));
grant select,insert on public.tenancy_signatures to authenticated;

-- Keep contact directory account controls private and return safe status fields.
drop function if exists public.list_platform_contacts();
create function public.list_platform_contacts()
returns table(person_key text,user_id uuid,role text,full_name text,email text,phone text,organization text,related_to text,property_label text,created_at timestamptz,account_status text,suspension_reason text)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_platform_admin() then raise exception 'Administrator access required.'; end if;
 return query
 select q.person_key,q.user_id,q.role,q.full_name,q.email,q.phone,q.organization,q.related_to,q.property_label,q.created_at,
   coalesce(ac.status,'active'),ac.reason
 from (
  select 'landlord:'||u.id::text person_key,u.id user_id,'Landlord'::text role,coalesce(nullif(lp.full_name,''),u.raw_user_meta_data->>'full_name','Landlord') full_name,u.email::text email,lp.phone,lp.business_name organization,lp.business_address related_to,null::text property_label,u.created_at
    from auth.users u left join public.landlord_profiles lp on lp.user_id=u.id where coalesce(u.raw_user_meta_data->>'account_role','landlord')='landlord'
  union all
  select 'tenant:'||t.id::text,u.id,'Tenant'::text,t.full_name,t.email,t.phone,lp.business_name,coalesce(nullif(p.name,''),'Tenancy'),nullif(concat_ws(', ',p.address,p.city,p.state,p.country),''),t.created_at
    from public.tenants t left join auth.users u on lower(u.email)=lower(t.email) left join public.landlord_profiles lp on lp.user_id=t.owner_id left join public.properties p on p.id=t.property_id
  union all
  select 'staff:'||s.id::text,u.id,case when s.role='caretaker' then 'Caretaker' else 'Agent' end,s.full_name,s.email,s.phone,lp.business_name,lp.full_name,nullif(concat_ws(', ',p.name,p.city,p.state),''),s.created_at
    from public.staff s left join auth.users u on lower(u.email)=lower(s.email) left join public.landlord_profiles lp on lp.user_id=s.owner_id left join public.properties p on p.id=s.property_id
  union all
  select 'guarantor:'||g.id::text,u.id,'Guarantor'::text,g.full_name,g.email,g.phone,lp.business_name,t.full_name,nullif(concat_ws(', ',g.address,p.name,p.city,p.state),''),g.created_at
    from public.guarantors g left join auth.users u on lower(u.email)=lower(g.email) left join public.landlord_profiles lp on lp.user_id=g.owner_id left join public.tenants t on t.id=g.tenant_id left join public.properties p on p.id=t.property_id
  union all
  select 'stakeholder:'||sp.user_id::text,sp.user_id,'Other account'::text,coalesce(nullif(sp.full_name,''),u.raw_user_meta_data->>'full_name','Account holder'),u.email::text,u.phone::text,'Complaint workspace'::text,null::text,null::text,sp.created_at
    from public.stakeholder_profiles sp join auth.users u on u.id=sp.user_id where sp.role<>'tenant'
  union all
  select 'complainant:'||c.id::text,c.authenticated_reporter_id,'Complainant'::text,c.complainant_name,c.email,c.phone,c.category,lp.full_name,nullif(concat_ws(', ',p.name,p.city,p.state),''),c.created_at
    from public.property_complaints c left join public.landlord_profiles lp on lp.user_id=c.landlord_id left join public.properties p on p.id=c.property_id where c.complainant_name is not null
 ) q left join public.platform_account_controls ac on ac.user_id=q.user_id;
end;
$$;
revoke all on function public.list_platform_contacts() from public,anon;
grant execute on function public.list_platform_contacts() to authenticated;

-- Activity feeds for each user; a server/cron can later deliver opted-in email alerts.
create or replace function public.get_due_rent_summary(p_days integer default 30)
returns table(due_count bigint,overdue_count bigint,due_total numeric)
language sql stable security definer set search_path = '' as $$
 select count(*) filter(where c.status='unpaid' and c.due_date<=current_date+p_days),
        count(*) filter(where c.status='unpaid' and c.due_date<current_date),
        coalesce(sum(c.amount) filter(where c.status='unpaid' and c.due_date<=current_date+p_days),0)
 from public.service_charges c where c.owner_id=auth.uid() and c.category='rent'
   and (public.is_platform_admin() or c.owner_id=auth.uid());
$$;
revoke all on function public.get_due_rent_summary(integer) from public,anon;
grant execute on function public.get_due_rent_summary(integer) to authenticated;
