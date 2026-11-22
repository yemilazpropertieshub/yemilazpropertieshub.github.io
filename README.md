# Yemilaz Properties

## Custom domain

The GitHub Pages site uses `https://yemilazproperties.com` (the `CNAME` file is in `public/CNAME`). In the repository, open **Settings → Pages → Custom domain**, enter `yemilazproperties.com`, and save. At the domain registrar, point the apex (`@`) to GitHub Pages using these four `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`. Add a `CNAME` record for `www` pointing to `yemilazpropertieshub.github.io`. Remove conflicting existing records for `@` or `www`, then enable **Enforce HTTPS** in Pages after GitHub verifies the DNS and issues the certificate. GitHub recommends setting the repository custom domain before changing DNS; propagation and certificate issuance can take time. See [GitHub's custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

A responsive property marketing and management website built with Node.js, React, Vite, and Supabase.

## Property and tenant workflow

- The public homepage includes manager sign-in and property advertisements.
- Advertised **Available** and **Reserved** properties appear on the public homepage with a clear status badge. Rented and sold properties are hidden.
- Register tenants and record rent or deposit payments. A property can be allocated only after a paid rent or deposit record exists.
- Allocating a property marks it occupied and removes it from public advertisements. Releasing or changing an allocation returns the old property to Available.
- Record later rent, deposit, and service-charge payments in **Payments & charges**.
- Delete a property from **Properties**. Its tenant and payment history are retained, with the tenant allocation cleared.
- Tenants have their own sign-in profile, document downloads, complaint conversation, document-signature history, and maintenance request form.
- Tenant workspaces include recorded rent/charge history, landlord notices, lease and inspection dates, maintenance evidence and two-way updates, searchable document categories, and landlord-reviewed profile correction requests.
- The landlord workspace includes rent schedules, manual email reminders, maintenance tracking with caretaker/agent assignment, a viewing calendar, activity notifications, payment evidence, and CSV portfolio reports.
- Platform administrators can inspect registered contact information and suspend/reactivate linked accounts from **Administration → People directory**. The app checks account status at sign-in and periodically during a session after the account-status migration is applied.
- Signed-in users can request an account-role change with a written explanation and private supporting files. Platform administrators and designated internal staff reviewers can review the evidence and approve or decline the request. An approval changes the account role only after review; linked tenant or staff roles still require a matching property record.
- Public visitors can save homes and searches in their browser. The existing map browser uses the filtered locations; property records can include latitude/longitude for a more precise map result.

## Portfolio enhancements

1. **Account access:** Administrators can suspend and reactivate linked landlord, tenant, agent and caretaker accounts, with a recorded reason.
2. **Maintenance:** Landlords can log, assign and track work. Tenants can submit repairs and follow the status in their own profile.
3. **Rent planning:** Tenant lease terms generate recurring future rent ledger entries. Landlords can review overdue amounts and email reminders.
4. **Payment evidence:** Landlords can attach a private JPG, PNG, WebP or PDF proof file (up to 10 MB) to a new charge and open it using a temporary signed link.
5. **Saved homes/searches:** Visitors can favourite homes, view only their shortlist, and save a search in the current browser.
6. **Map browsing:** Existing map browsing follows current location filters; landlords may supply coordinates for more precise map positioning.
7. **Viewing calendar:** Viewings can be reviewed and moved between new, confirmed, declined and completed states.
8. **Document signatures:** Landlords can share a versioned agreement, property-rules or handover snapshot. Tenants can review and add their typed signature.
9. **Activity notifications:** In-app notifications are created for property enquiries, viewing requests and linked complaints.
10. **Portfolio report:** Property insights can export the current properties, tenant records and payment ledger as CSV.

## One-time Supabase update

Before deploying this version, open the project’s **Supabase Dashboard → SQL Editor** and run these files in order. Run each file once, from top to bottom; do not skip earlier schema updates:

1. [`supabase/migrations/20261101_property_allocation_and_advertising.sql`](supabase/migrations/20261101_property_allocation_and_advertising.sql)
2. [`supabase/migrations/20261102_landlord_profiles_and_tenant_packets.sql`](supabase/migrations/20261102_landlord_profiles_and_tenant_packets.sql)
3. [`supabase/migrations/20261103_property_photos_and_pdf_receipts.sql`](supabase/migrations/20261103_property_photos_and_pdf_receipts.sql)
4. [`supabase/migrations/20261104_international_property_locations.sql`](supabase/migrations/20261104_international_property_locations.sql)
5. [`supabase/migrations/20261105_landlord_branding_templates.sql`](supabase/migrations/20261105_landlord_branding_templates.sql)
6. [`supabase/migrations/20261105_transaction_edit_void.sql`](supabase/migrations/20261105_transaction_edit_void.sql)
7. [`supabase/migrations/20261106_landlord_invitation_security.sql`](supabase/migrations/20261106_landlord_invitation_security.sql)
8. [`supabase/migrations/20261107_public_property_complaints.sql`](supabase/migrations/20261107_public_property_complaints.sql)
9. [`supabase/migrations/20261108_listing_and_resolution_workflows.sql`](supabase/migrations/20261108_listing_and_resolution_workflows.sql)
10. [`supabase/migrations/20261109_tenant_workspace.sql`](supabase/migrations/20261109_tenant_workspace.sql)
11. [`supabase/migrations/20261110_platform_contact_directory.sql`](supabase/migrations/20261110_platform_contact_directory.sql)
12. [`supabase/migrations/20261111_property_wanted_requests.sql`](supabase/migrations/20261111_property_wanted_requests.sql)
13. [`supabase/migrations/20261112_people_account_invitations.sql`](supabase/migrations/20261112_people_account_invitations.sql)
14. [`supabase/migrations/20261113_platform_admin_complaint_inbox.sql`](supabase/migrations/20261113_platform_admin_complaint_inbox.sql)
15. [`supabase/migrations/20261114_fix_tenant_rls_recursion.sql`](supabase/migrations/20261114_fix_tenant_rls_recursion.sql)
16. [`supabase/migrations/20261115_property_operations_suite.sql`](supabase/migrations/20261115_property_operations_suite.sql)
17. [`supabase/migrations/20261116_accountability_and_operations.sql`](supabase/migrations/20261116_accountability_and_operations.sql)
18. [`supabase/migrations/20261117_property_communication_roles.sql`](supabase/migrations/20261117_property_communication_roles.sql)
19. [`supabase/migrations/20261118_fix_property_contact_rpc_types.sql`](supabase/migrations/20261118_fix_property_contact_rpc_types.sql)
20. [`supabase/migrations/20261119_property_message_notifications.sql`](supabase/migrations/20261119_property_message_notifications.sql)
21. [`supabase/migrations/20261120_universal_property_categories.sql`](supabase/migrations/20261120_universal_property_categories.sql)
22. [`supabase/migrations/20261121_property_rules_and_shared_document_library.sql`](supabase/migrations/20261121_property_rules_and_shared_document_library.sql)
23. [`supabase/migrations/20261123_tenant_portal_daily_tools.sql`](supabase/migrations/20261123_tenant_portal_daily_tools.sql)
24. [`supabase/migrations/20261124_account_upgrade_requests.sql`](supabase/migrations/20261124_account_upgrade_requests.sql)
25. [`supabase/migrations/20261125_nigeria_market_overview.sql`](supabase/migrations/20261125_nigeria_market_overview.sql)
26. [`supabase/migrations/20261126_platform_staff_permissions.sql`](supabase/migrations/20261126_platform_staff_permissions.sql)

The additional migrations below were added after the original 26-file list. Apply any that are not already present in the database in filename order:

- [`supabase/migrations/20261121_service_charge_period_dates.sql`](supabase/migrations/20261121_service_charge_period_dates.sql)
- [`supabase/migrations/20261121_staff_payment_records.sql`](supabase/migrations/20261121_staff_payment_records.sql)
- [`supabase/migrations/20261127_caretaker_operations.sql`](supabase/migrations/20261127_caretaker_operations.sql)
- [`supabase/migrations/20261128_rent_schedule_accounting.sql`](supabase/migrations/20261128_rent_schedule_accounting.sql)
- [`supabase/migrations/20261129_rent_renewal_due_charge.sql`](supabase/migrations/20261129_rent_renewal_due_charge.sql)
- [`supabase/migrations/20261130_create_rent_charges_when_due.sql`](supabase/migrations/20261130_create_rent_charges_when_due.sql)
- [`supabase/migrations/20261201_reconcile_initial_rent_receipts.sql`](supabase/migrations/20261201_reconcile_initial_rent_receipts.sql)
- [`supabase/migrations/20261202_tenant_dashboard_expired_renewal_charge.sql`](supabase/migrations/20261202_tenant_dashboard_expired_renewal_charge.sql)
- [`supabase/migrations/20261203_payment_transaction_actions.sql`](supabase/migrations/20261203_payment_transaction_actions.sql)
- [`supabase/migrations/20261204_professional_agreement_and_property_rules.sql`](supabase/migrations/20261204_professional_agreement_and_property_rules.sql)
- [`supabase/migrations/20261205_extend_lease_on_rent_renewal_payment.sql`](supabase/migrations/20261205_extend_lease_on_rent_renewal_payment.sql)
- [`supabase/migrations/20261206_rent_renewal_duration.sql`](supabase/migrations/20261206_rent_renewal_duration.sql)
- [`supabase/migrations/20261207_tenant_team_assignments_and_notifications.sql`](supabase/migrations/20261207_tenant_team_assignments_and_notifications.sql)
- [`supabase/migrations/20261208_profile_standing_levels.sql`](supabase/migrations/20261208_profile_standing_levels.sql)
- [`supabase/migrations/20261209_opt_in_public_member_spotlight.sql`](supabase/migrations/20261209_opt_in_public_member_spotlight.sql)
- [`supabase/migrations/20261210_public_profile_contact_and_messages.sql`](supabase/migrations/20261210_public_profile_contact_and_messages.sql)
- [`supabase/migrations/20261211_multi_role_account_portals.sql`](supabase/migrations/20261211_multi_role_account_portals.sql)
- [`supabase/migrations/20261212_account_profile_photos.sql`](supabase/migrations/20261212_account_profile_photos.sql)
- [`supabase/migrations/20261213_spotlight_profile_photos.sql`](supabase/migrations/20261213_spotlight_profile_photos.sql)
- [`supabase/migrations/20261214_member_profile_and_identity_status.sql`](supabase/migrations/20261214_member_profile_and_identity_status.sql)

The second migration creates private landlord profiles, per-landlord agreement and house-rule templates, assigned agent/caretaker fields, and a private email delivery history. New Supabase Auth accounts receive their own profile automatically. Existing accounts receive a default profile.

The third migration enables up to five public listing photos per property in the `property-images` bucket and adds the database limit. Each JPG, PNG, or WebP photo may be up to 5 MB.

The fourth migration adds country and state/province fields to property listings. Nigeria and Lagos are selected by default. Country and first-level administrative-area dropdown options are loaded from the CountriesNow dataset; if its service is unavailable, the fields remain editable so listings can still be entered.

Yemilaz Properties uses one official identity throughout the public website, sign-in screens, participant and staff portals, workspace, loading screens, and browser favicon. The transparent master logo is `public/yemilaz-properties-logo.png`; `public/yemilaz-mark.svg` crops its emblem for compact brand marks and the favicon. Property managers can still personalize workspace colours and their business name; the official Yemilaz logo remains consistent across pages.

Listings support residential homes, shops and retail, offices, stores and warehouses, industrial/workshop spaces, hospitality and mixed-use buildings, residential/commercial plots, farms, parking, and event spaces. Owners can offer a property for rent/lease or sale. Optional size and suitable-use details work across property types; bedroom and bathroom counts are relevant only to residential listings. Rental prices can be shown per day, week, month, or year.

### Role-based property communications

Migration 18 adds the Lawyer staff role, lets landlords edit a staff member’s role (including syncing an already activated login), provides portfolio-wide lawyer contact access, a property contact directory and direct messages between linked landlords, tenants, lawyers, agents and caretakers. Tenants can file a continuing complaint with their landlord or assigned agent/caretaker. A landlord can disable direct tenant complaints in **Landlord profile**; in that case new tenant complaints must go to an assigned agent or caretaker, and the landlord is excluded from that case thread. Assigned agents and caretakers can reply and use the existing two-party resolution approval flow. Run migration 18 after migrations 1–17 before deploying the updated app and invitation service.

Migration 19 corrects the PostgreSQL result-column types returned by the complaint-recipient and property-conversation RPC functions. If migration 18 has already been applied, run migration 19 alone in Supabase SQL Editor to fix the `structure of query does not match function result type` error shown in tenant and caretaker/agent portals.

Migration 20 creates in-app notifications when a property message or complaint reply is sent. Each recipient sees notifications in their account header; unread complaint replies also show a pending count on the complaint row, which clears when they open that conversation. Apply this migration in Supabase SQL Editor before deploying the frontend changes.

Migration 21 adds property size, suitable-use, and rental price-period fields, and expands wanted-request categories to include residential, commercial, land, farm, and other property types. Run it in Supabase SQL Editor before deploying the updated frontend. Existing listings keep their current values and remain compatible.

Migration 22 updates the generated rule document to **Property rules**, replaces the exact old residential-only default with inclusive wording for different property types while preserving custom landlord text, and enables each emailed participant to access only the PDF copies addressed to their registered email from their account. Landlords retain access to their full document records. It also repairs tenant access to the linked landlord profile and uses non-recursive security-definer checks for document and private-file access. Apply it in Supabase SQL Editor before deploying the updated document service and frontend. Previously emailed PDFs are not retroactively added to account libraries; resend the packet to save a fresh copy for each recipient.

Migration 23 enables landlord notices with tenant notifications, landlord-reviewed tenant profile corrections, private maintenance photo evidence, tenant-visible maintenance timelines and replies, and tenant access to assigned upcoming inspections. The tenant portal also displays the existing rent ledger; it does not collect online payments. Apply this migration in Supabase SQL Editor before deploying the updated frontend. The landlord workspace adds **Property notices** and **Tenant profile requests** under Operations & governance.

Migration 24 adds private account-upgrade requests and evidence storage, a role-change review queue, and secure approval logic. Users submit from **Account upgrades** in their portal. Platform administrators can review from **Administration → Account upgrade review** and assign existing Yemilaz staff as reviewers; assigned reviewers see an **Upgrade reviews** shortcut in their portal. Reviewers can read submitted evidence and approve, decline, or mark requests as reviewing. Landlord/developer approvals create the owner profile after review. Tenant, agent, caretaker, and lawyer approvals require the corresponding landlord-managed record to match the account email. Existing owner records must be transferred or closed before an account can change out of its owner role. Apply migration 24 in Supabase SQL Editor before deploying the frontend. This repository cannot apply the migration to the hosted Supabase project automatically.

Migration 25 adds a Nigerian market overview based on advertised asking prices. It records a listing’s initial advertised price and subsequent changes, then compares current median asking prices with observations at least 30 days old. A trend is shown only where at least three current comparable listings share the same area, property type, rent/sale category, and (for rentals) price period. The overview is not an official market index or a record of completed transactions. Apply migration 25 in Supabase SQL Editor before deploying the frontend; until then, the homepage shows a graceful unavailable state. Existing listings establish their baseline when this migration is applied, so trends appear after sufficient history has accumulated.

Migration 26 lets the platform administrator grant selected work permissions to existing registered accounts: account-upgrade review, listing verification, and read-only complaint oversight. Assignments are managed in **Platform administration → Platform staff**; staff sign in through the separate administration entry and see only their assigned work pages. Staff cannot grant permissions, manage landlord access codes, or use the administrator-only people directory. Complaint reviewers can read cases and replies but cannot message or resolve them. Revoke or change assignments from the same page. A staff member must register their Yemilaz account before access can be assigned by email. Apply migration 26 in Supabase SQL Editor before deploying the frontend.

The member-profile migration adds private profile details shared by every account role and an identity-check status table. Users can edit their name, phone, contact location, occupation, optional date of birth and emergency contact; property professionals can also add private business and licence details. Row-level security restricts profile details and verification status to the signed-in account. The website does not store raw NIN or biometric data. To activate live NIN verification, Yemilaz must first obtain the required NIMC/NINAuth verification-partner access and deploy an authenticated server endpoint that creates a hosted verification session and records provider results. Set `VITE_NINAUTH_START_URL` to that endpoint; never place provider credentials in browser variables. Until configured, the identity check is clearly shown as unavailable and no NIN is requested or collected. Apply `20261214_member_profile_and_identity_status.sql` before deploying the updated frontend.

The sixth migration makes landlord account creation invitation-only. Each code is single-use, expires after a chosen period (1 hour to 7 days), and can be revoked. The code manager appears only to a platform administrator. After applying the migration, bootstrap the first administrator in SQL Editor by replacing `OWNER_EMAIL_HERE` with the email on the Yemilaz Properties owner account:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where lower(email) = lower('OWNER_EMAIL_HERE')
on conflict (user_id) do nothing;
```

The administrator then signs in, opens **Landlord access**, and generates codes for landlords. Do not issue a code publicly. Each landlord enters their code once during signup; it becomes unusable as soon as the account is created.

The seventh migration adds public complaint intake. The eighth adds listing enquiries, viewing requests, listing reports, viewing analytics, listing verification review, complaint message history, stakeholder complaint accounts, and two-party resolution approval. Stakeholder accounts can access only cases they lodge or are linked to; landlord accounts remain invitation-only. For continuous complaint chat, submit while signed in or create a **Tenant or complainant** account with the email address on the complaint or tenant record. The other participant can propose a resolution, and only the other participant can approve it; either may request more work. Landlords can approve verification requests only after checking ownership evidence outside the website; the administrator records the decision under **Listing verification**. Public enquiry and viewing submissions appear in the property manager’s private workspace.

The ninth migration adds auditable payment edit/void fields. The tenth provides the private tenant portal and profile links. The eleventh adds the administrator-only contact directory. The twelfth adds anonymous property-wanted requests and landlord opt-in preferences. The thirteenth adds stakeholder invitation links and the personal address/contact fields used by account profiles. The fourteenth makes all linked complaints visible in platform administration. The fifteenth fixes the recursive tenant row-security policy that can make tenant queries fail. The sixteenth adds account suspension controls, maintenance requests, future rent charges, private payment-evidence storage, saved-listing/search tables, notifications, and versioned tenancy-signature records. It also adds property coordinates. The seventeenth adds record-level audit history, opt-in authenticator MFA, tenant/staff messaging, private property files, inspections, maintenance vendor costs, report date filters, and privacy requests. It creates the private `property-documents` and `maintenance-invoices` storage buckets.

Rent schedules start after the lease’s initial period because registration records the initial payment separately. The landlord can email an outstanding-rent reminder from the schedule, then update the payment ledger when paid. Typed tenancy signatures are an audit record, not a certified e-signature service; have a qualified lawyer review agreements for your jurisdiction. Saved searches and favourites on the public site are browser-local. Email delivery of search alerts is not configured by this website version.

After running migration 17, landlords can open **Audit history**, **Property messages**, **Property documents**, **Inspections**, **Email delivery**, and **Security & privacy** from the workspace navigation. Tenants have the matching private message thread and access to files their landlord shared in their tenant profile; agents and caretakers can message their landlord from their account. After migration 22 and a fresh packet send, each participant also has a sorted **Documents shared with you** library with individual PDF downloads. The audit history records inserts, updates, and deletions for supported property, tenant, payment, staff, maintenance, enquiry, viewing, complaint, file, inspection, message, and privacy-request records. Optional two-step verification is controlled per account in **Security & privacy**; the user must enroll an authenticator app and verify a code. **Property insights** filters rent/payment totals, arrears, occupancy, and recorded maintenance costs by property and date range. Privacy requests can be submitted from a signed-in account and reviewed by the platform administrator. Uploaded private property files are limited to PDF and common image formats, up to 20 MB; access is provided through short-lived signed links. Inspection reports support checklists and photo attachments; maintenance requests can include contractor invoices. Email delivery history covers tenant packet emails sent through the Node service. Resend delivery webhooks are not configured, so later bounces are not reflected unless the provider integration is added.

## Brand landlord confirmation email and links

The app sends confirmation links back to the current Yemilaz Properties site and shows a branded success or expired-link screen. Old confirmation messages may still point to `localhost:3000`; discard those and use the new confirmation email after deployment.

In the Supabase project dashboard:

1. Open **Authentication → URL Configuration**. Set **Site URL** to `https://yemilazproperties.com`. Add `https://yemilazproperties.com/**` and `https://www.yemilazproperties.com/**` to **Redirect URLs**. For local development, also add `http://localhost:5173/**`.
2. Open **Authentication → Emails → SMTP Settings** and enable custom SMTP. With a verified Resend sending domain, use host `smtp.resend.com`, port `465`, username `resend`, and a Resend API key as the password. Set the sender name to **Yemilaz Properties** and the sender address to an address on the verified domain, such as `tenancy@yemilazproperties.com` only after that domain is verified in Resend.
3. Open **Authentication → Emails → Templates → Confirm signup**. Use subject `Confirm your Yemilaz Properties account` and paste the HTML from [`supabase/email-templates/confirm-signup.html`](supabase/email-templates/confirm-signup.html) as the message body. The template uses Supabase’s `{{ .ConfirmationURL }}` variable only to produce the secure confirmation link; the email sender and displayed copy are Yemilaz Properties.
4. Replace the **Reset password** template with [`supabase/email-templates/password-reset.html`](supabase/email-templates/password-reset.html) as well, so password recovery uses the same brand.
5. Deploy this frontend. Request a new signup confirmation if an earlier email expired. If the expiry screen appears, enter the signup email and use **Resend confirmation email**; use the newest link.

The authentication email sender name, sending domain, template, Site URL, and redirect allowlist are managed in the Supabase project dashboard; they cannot be changed by a frontend code deployment alone. The app’s tenant, guarantor, lawyer, caretaker, and agent document emails use the Yemilaz-branded sender configured in the Node service.

Landlords can create accounts from the website sign-in dialog. Every landlord’s profile and records are scoped to their own Supabase user ID using row-level security. The account email is used for that landlord’s packet copy.

## Individual tenant PDF emails

GitHub Pages serves only the static website; it cannot safely keep an email API secret. The PDFs and email sending run in the separate Node service in [`server`](server).

1. Create a Resend account and verify the email domain/address that will appear in the From field.
2. Deploy the `server` folder to a hosting service that runs Node.js. Set the variables listed in [`server/.env.example`](server/.env.example) in that host’s private environment settings. Do not commit a real `.env` file or Resend key.
3. Set `FRONTEND_ORIGINS` to `https://yemilazproperties.com,https://www.yemilazproperties.com` in the Node service's environment settings, then redeploy it.
4. Set `VITE_DOCUMENT_API_URL` in GitHub Actions repository variables (or repository secrets) to the Node service base URL, then deploy the frontend again. The Pages workflow accepts either location, with the variable taking priority.
5. In **Landlord profile**, enter the lawyer’s email and review the agreement terms and property rules. Add agents and caretakers with email addresses under their directories.
6. Register a tenant with tenant and guarantor email addresses. Select any assigned agent/caretaker. When saved, the service emails a separate PDF attachment to the landlord, tenant, guarantor, lawyer, and selected agent/caretaker.

PDFs use a consistent branded layout with clear headers, tables, footers, and page numbers. In **Tenants**, **Download PDFs** creates a ZIP containing a document guide, tenancy overview, agreement draft, property rules, rent schedule, payment ledger, property handover checklist, contact sheet, individual landlord/tenant/other-recipient copies, and a separate receipt for every charge recorded as paid. The agreement content is a starting template; have a qualified lawyer review it for each jurisdiction and tenancy. Email delivery sends the recipient copy plus the shared documents and recorded paid receipts. Both email and download use only records in the landlord's account. Delivery attempts are logged in `tenant_packet_deliveries` for the landlord to inspect in Supabase. Open the Render service's `/health` URL to check whether the service is online and whether download and email configuration are ready.

## Deploy with GitHub Desktop

1. Open the repository in GitHub Desktop and review the changed files.
2. Commit the changes to `main`, then click **Push origin**.
3. GitHub Actions builds and publishes the site automatically. Wait for the newest run to turn green.

The Pages workflow uses the project URL directly and reads `VITE_SUPABASE_ANON_KEY` from repository Actions secrets. It reads `VITE_DOCUMENT_API_URL` from repository Actions variables or secrets. Never put a Supabase service-role/secret key or Resend key in this browser app; the Node service uses the signed-in user token and Supabase row-level security.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` and then `npm run dev`.
3. Copy `.env.example` to `.env.local` and set Supabase URL, publishable/anon key, and document API URL.
4. For a new project, run `supabase/schema.sql`, then every migration above in order. For the existing project, apply any migrations not yet run, in order. Then bootstrap the platform administrator as described above.
5. For the Node mail service, run `npm install` inside `server`, copy `server/.env.example` to `server/.env`, fill in its values, and run `npm start`.
