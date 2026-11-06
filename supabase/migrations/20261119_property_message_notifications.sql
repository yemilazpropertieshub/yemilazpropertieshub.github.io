-- Notify the receiving account when a property conversation or complaint gets a message.
-- Complaint notifications are linked to the complaint so each portal can show
-- a pending count until the participant opens that case.

alter table public.user_notifications
  add column if not exists target_id uuid;

create index if not exists user_notifications_target_unread_idx
  on public.user_notifications(user_id, category, target_id)
  where read_at is null;

create or replace function public.notify_property_message_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.recipient_id is not null and new.recipient_id <> new.sender_id then
    insert into public.user_notifications(user_id, title, message, category, target_path, target_id)
    values (
      new.recipient_id,
      'New property message',
      'A property participant sent you a message. Open your property workspace to read it.',
      'property_message',
      '#workspace',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_property_message_recipient on public.property_messages;
create trigger notify_property_message_recipient
  after insert on public.property_messages
  for each row execute function public.notify_property_message_recipient();

-- Replace the earlier landlord-only complaint alert, which could notify a
-- landlord even when a tenant complaint is assigned only to staff.
drop trigger if exists notify_new_property_complaint on public.property_complaints;

create or replace function public.notify_new_complaint_recipients()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient uuid;
begin
  for v_recipient in
    select distinct recipient_id
    from unnest(array[
      new.other_participant_id,
      case
        when not (new.stakeholder_role = 'Tenant'
          and new.assigned_recipient_id is not null
          and new.assigned_recipient_id <> new.landlord_id)
        then new.landlord_id
        else null
      end
    ]) as recipients(recipient_id)
    where recipient_id is not null
      and recipient_id is distinct from new.authenticated_reporter_id
  loop
    insert into public.user_notifications(user_id, title, message, category, target_path, target_id)
    values (
      v_recipient,
      'New complaint needs your attention',
      'A property participant has lodged a complaint for you to review.',
      'complaint_message',
      '#workspace',
      new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists notify_new_complaint_recipients on public.property_complaints;
create trigger notify_new_complaint_recipients
  after insert on public.property_complaints
  for each row execute function public.notify_new_complaint_recipients();

create or replace function public.notify_complaint_message_recipients()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case public.property_complaints%rowtype;
  v_recipient uuid;
begin
  select * into v_case
  from public.property_complaints
  where id = new.complaint_id;

  if not found then
    return new;
  end if;

  for v_recipient in
    select distinct recipient_id
    from unnest(array[
      v_case.authenticated_reporter_id,
      v_case.other_participant_id,
      case
        when not (v_case.stakeholder_role = 'Tenant'
          and v_case.assigned_recipient_id is not null
          and v_case.assigned_recipient_id <> v_case.landlord_id)
        then v_case.landlord_id
        else null
      end
    ]) as recipients(recipient_id)
    where recipient_id is not null
      and recipient_id <> new.sender_id
  loop
    insert into public.user_notifications(user_id, title, message, category, target_path, target_id)
    values (
      v_recipient,
      'Complaint message needs your attention',
      'There is a new message in a property complaint. Open the complaint room to review it.',
      'complaint_message',
      '#workspace',
      new.complaint_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_complaint_message_recipients on public.property_complaint_messages;
create trigger notify_complaint_message_recipients
  after insert on public.property_complaint_messages
  for each row execute function public.notify_complaint_message_recipients();
