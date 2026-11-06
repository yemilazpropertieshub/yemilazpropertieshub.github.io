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
- The landlord workspace includes rent schedules, manual email reminders, maintenance tracking with caretaker/agent assignment, a viewing calendar, activity notifications, payment evidence, and CSV portfolio reports.
- Platform administrators can inspect registered contact information and suspend/reactivate linked accounts from **Administration → People directory**. The app checks account status at sign-in and periodically during a session after the account-status migration is applied.
- Public visitors can save homes and searches in their browser. The existing map browser uses the filtered locations; property records can include latitude/longitude for a more precise map result.

## Portfolio enhancements

1. **Account access:** Administrators can suspend and reactivate linked landlord, tenant, agent and caretaker accounts, with a recorded reason.
2. **Maintenance:** Landlords can log, assign and track work. Tenants can submit repairs and follow the status in their own profile.
3. **Rent planning:** Tenant lease terms generate recurring future rent ledger entries. Landlords can review overdue amounts and email reminders.
4. **Payment evidence:** Landlords can attach a private JPG, PNG, WebP or PDF proof file (up to 10 MB) to a new charge and open it using a temporary signed link.
5. **Saved homes/searches:** Visitors can favourite homes, view only their shortlist, and save a search in the current browser.
6. **Map browsing:** Existing map browsing follows current location filters; landlords may supply coordinates for more precise map positioning.
7. **Viewing calendar:** Viewings can be reviewed and moved between new, confirmed, declined and completed states.
8. **Document signatures:** Landlords can share a versioned agreement, house-rules or handover snapshot. Tenants can review and add their typed signature.
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

The second migration creates private landlord profiles, per-landlord agreement and house-rule templates, assigned agent/caretaker fields, and a private email delivery history. New Supabase Auth accounts receive their own profile automatically. Existing accounts receive a default profile.

The third migration enables up to five public listing photos per property in the `property-images` bucket and adds the database limit. Each JPG, PNG, or WebP photo may be up to 5 MB.

The fourth migration adds country and state/province fields to property listings. Nigeria and Lagos are selected by default. Country and first-level administrative-area dropdown options are loaded from the CountriesNow dataset; if its service is unavailable, the fields remain editable so listings can still be entered.

The fifth migration adds a per-landlord business name, logo mark, and professional colour template. New landlords choose these while creating an account; existing landlords can change them under **Landlord profile**. The public Yemilaz homepage and favicon use the Horizon Homes mark. Each signed-in workspace displays the landlord’s own brand while retaining Yemilaz Properties as its hosting platform.

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

After running migration 17, landlords can open **Audit history**, **Property messages**, **Property documents**, **Inspections**, **Email delivery**, and **Security & privacy** from the workspace navigation. Tenants have the matching private message thread and access to files their landlord shared in their tenant profile; agents and caretakers can message their landlord from their account. The audit history records inserts, updates, and deletions for supported property, tenant, payment, staff, maintenance, enquiry, viewing, complaint, file, inspection, message, and privacy-request records. Optional two-step verification is controlled per account in **Security & privacy**; the user must enroll an authenticator app and verify a code. **Property insights** filters rent/payment totals, arrears, occupancy, and recorded maintenance costs by property and date range. Privacy requests can be submitted from a signed-in account and reviewed by the platform administrator. Uploaded private property files are limited to PDF and common image formats, up to 20 MB; access is provided through short-lived signed links. Inspection reports support checklists and photo attachments; maintenance requests can include contractor invoices. Email delivery history covers tenant packet emails sent through the Node service. Resend delivery webhooks are not configured, so later bounces are not reflected unless the provider integration is added.

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
5. In **Landlord profile**, enter the lawyer’s email and review the agreement terms and house rules. Add agents and caretakers with email addresses under their directories.
6. Register a tenant with tenant and guarantor email addresses. Select any assigned agent/caretaker. When saved, the service emails a separate PDF attachment to the landlord, tenant, guarantor, lawyer, and selected agent/caretaker.

PDFs use a consistent branded layout with clear headers, tables, footers, and page numbers. In **Tenants**, **Download PDFs** creates a ZIP containing a document guide, tenancy overview, agreement draft, house rules, rent schedule, payment ledger, property handover checklist, contact sheet, individual landlord/tenant/other-recipient copies, and a separate receipt for every charge recorded as paid. The agreement content is a starting template; have a qualified lawyer review it for each jurisdiction and tenancy. Email delivery sends the recipient copy plus the shared documents and recorded paid receipts. Both email and download use only records in the landlord's account. Delivery attempts are logged in `tenant_packet_deliveries` for the landlord to inspect in Supabase. Open the Render service's `/health` URL to check whether the service is online and whether download and email configuration are ready.

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
