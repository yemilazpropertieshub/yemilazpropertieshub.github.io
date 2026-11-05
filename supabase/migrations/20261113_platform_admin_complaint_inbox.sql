-- Allow the platform manager to review every complaint and its conversation.
-- Regular landlords and complaint participants remain restricted to their own cases.

drop policy if exists "Platform admins read all complaints" on public.property_complaints;
create policy "Platform admins read all complaints"
  on public.property_complaints
  for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "Platform admins read all complaint messages" on public.property_complaint_messages;
create policy "Platform admins read all complaint messages"
  on public.property_complaint_messages
  for select
  to authenticated
  using (public.is_platform_admin());
