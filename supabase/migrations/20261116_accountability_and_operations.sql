-- Auditing, optional MFA preferences, team messaging, files, inspections,
-- maintenance costs, report-ready dates, and privacy requests.

create table if not exists public.account_security_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 mfa_opt_in boolean not null default false, login_alerts_opt_in boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.account_security_preferences enable row level security;
create policy "Users manage own security preferences" on public.account_security_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update on public.account_security_preferences to authenticated;

create table if not exists public.audit_events (
 id bigint generated always as identity primary key, owner_id uuid, actor_id uuid,
 table_name text not null, record_id text, action text not null check(action in ('INSERT','UPDATE','DELETE')),
 old_data jsonb, new_data jsonb, created_at timestamptz not null default now()
);
alter table public.audit_events enable row level security;
create policy "Owners and platform admins read audit events" on public.audit_events for select to authenticated
 using(owner_id=auth.uid() or public.is_platform_admin());
grant select on public.audit_events to authenticated;
create or replace function public.capture_audit_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_row jsonb; new_row jsonb; row_data jsonb; v_owner uuid; v_id text;
begin
 if tg_op<>'INSERT' then old_row:=to_jsonb(old); end if;
 if tg_op<>'DELETE' then new_row:=to_jsonb(new); end if;
 row_data:=coalesce(new_row,old_row);
 v_owner:=nullif(row_data->>'owner_id','')::uuid;
 if v_owner is null then v_owner:=nullif(row_data->>'landlord_id','')::uuid; end if;
 if v_owner is null then v_owner:=nullif(row_data->>'user_id','')::uuid; end if;
 v_id:=row_data->>'id';
 insert into public.audit_events(owner_id,actor_id,table_name,record_id,action,old_data,new_data)
 values(v_owner,auth.uid(),tg_table_name,v_id,tg_op,old_row,new_row);
 if tg_op='DELETE' then return old; else return new; end if;
end; $$;
create table if not exists public.property_messages (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 property_id uuid references public.properties(id) on delete set null, tenant_id uuid references public.tenants(id) on delete set null,
 sender_id uuid not null references auth.users(id) on delete cascade, recipient_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 5000), created_at timestamptz not null default now(), read_at timestamptz
);
alter table public.property_messages enable row level security;
create policy "Conversation participants read messages" on public.property_messages for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid() or owner_id=auth.uid());
create policy "Participants send messages" on public.property_messages for insert to authenticated with check(sender_id=auth.uid() and (owner_id=auth.uid() or exists(select 1 from public.tenants t where t.id=property_messages.tenant_id and t.owner_id=property_messages.owner_id and lower(t.email)=lower(auth.jwt()->>'email')) or exists(select 1 from public.stakeholder_profiles sp join public.staff s on s.id=sp.staff_id where sp.user_id=auth.uid() and s.owner_id=property_messages.owner_id)));
create policy "Recipients mark messages read" on public.property_messages for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
grant select,insert,update on public.property_messages to authenticated;
create index if not exists property_messages_thread_idx on public.property_messages(owner_id,tenant_id,created_at);

create table if not exists public.property_documents (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 property_id uuid references public.properties(id) on delete set null, tenant_id uuid references public.tenants(id) on delete set null,
 uploaded_by uuid not null references auth.users(id) on delete cascade, title text not null,
 storage_path text not null, mime_type text not null, created_at timestamptz not null default now()
);
alter table public.property_documents enable row level security;
create policy "Landlords manage property documents" on public.property_documents for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and uploaded_by=auth.uid());
create policy "Tenants view their documents" on public.property_documents for select to authenticated using(exists(select 1 from public.tenants t where t.id=tenant_id and lower(t.email)=lower(auth.jwt()->>'email')));
grant select,insert,update,delete on public.property_documents to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('property-documents','property-documents',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;
create policy "Landlords manage property document files" on storage.objects for all to authenticated using(bucket_id='property-documents' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='property-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Tenants read their property document files" on storage.objects for select to authenticated using(bucket_id='property-documents' and exists(select 1 from public.property_documents d join public.tenants t on t.id=d.tenant_id where d.storage_path=name and lower(t.email)=lower(auth.jwt()->>'email')));

create table if not exists public.property_inspections (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 property_id uuid references public.properties(id) on delete set null, tenant_id uuid references public.tenants(id) on delete set null,
 inspection_type text not null check(inspection_type in ('move_in','routine','move_out')),
 inspection_date date not null, condition text not null, notes text, checklist jsonb not null default '[]'::jsonb, photo_paths text[] not null default '{}', created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
alter table public.property_inspections add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.property_inspections add column if not exists photo_paths text[] not null default '{}';
alter table public.property_inspections enable row level security;
create policy "Landlords manage property inspections" on public.property_inspections for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and created_by=auth.uid());
grant select,insert,update,delete on public.property_inspections to authenticated;

alter table public.maintenance_requests add column if not exists vendor_name text;
alter table public.maintenance_requests add column if not exists actual_cost numeric(12,2) check(actual_cost is null or actual_cost>=0);
alter table public.maintenance_requests add column if not exists invoice_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('maintenance-invoices','maintenance-invoices',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;
create policy "Landlords manage maintenance invoice files" on storage.objects for all to authenticated using(bucket_id='maintenance-invoices' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='maintenance-invoices' and (storage.foldername(name))[1]=auth.uid()::text);

create table if not exists public.privacy_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
 full_name text not null, email text not null, request_type text not null check(request_type in ('access','correction','deletion','other')),
 details text not null check(char_length(details) between 10 and 3000), status text not null default 'new' check(status in ('new','reviewing','completed','declined')),
 admin_notes text, created_at timestamptz not null default now(), resolved_at timestamptz
);
alter table public.privacy_requests enable row level security;
create policy "Anyone can submit privacy request" on public.privacy_requests for insert to anon,authenticated with check(char_length(email) between 5 and 254 and (user_id is null or user_id=auth.uid()));
create policy "Users view their own privacy requests" on public.privacy_requests for select to authenticated using(user_id=auth.uid() or lower(email)=lower(auth.jwt()->>'email') or public.is_platform_admin());
create policy "Administrators manage privacy requests" on public.privacy_requests for update to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
grant insert on public.privacy_requests to anon,authenticated;
grant select,update on public.privacy_requests to authenticated;

-- Install audit triggers only after all tables in this migration exist.
do $$ declare t text; begin
 foreach t in array array['properties','tenants','service_charges','staff','maintenance_requests','property_complaints','property_enquiries','property_viewing_requests','property_documents','property_inspections','property_messages','privacy_requests'] loop
  execute format('drop trigger if exists capture_audit on public.%I',t);
  execute format('create trigger capture_audit after insert or update or delete on public.%I for each row execute function public.capture_audit_event()',t);
 end loop;
end $$;

create or replace function public.list_property_conversation_contacts()
returns table(user_id uuid,tenant_id uuid,full_name text,email text,property_id uuid,role text)
language sql stable security definer set search_path = '' as $$
 select u.id,t.id,t.full_name,t.email,t.property_id,'tenant'::text
 from public.tenants t join auth.users u on lower(u.email)=lower(t.email)
 where t.owner_id=auth.uid()
 union all
 select u.id,null::uuid,s.full_name,s.email,s.property_id,s.role
 from public.staff s join auth.users u on lower(u.email)=lower(s.email)
 where s.owner_id=auth.uid();
$$;
revoke all on function public.list_property_conversation_contacts() from public,anon;
grant execute on function public.list_property_conversation_contacts() to authenticated;
