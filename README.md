# Yemilaz Properties

A responsive property marketing and management website built with Node.js, React, Vite, and Supabase.

## Property and tenant workflow

- The public homepage includes manager sign-in and property advertisements.
- Advertised **Available** and **Reserved** properties appear on the public homepage with a clear status badge. Rented and sold properties are hidden.
- Register tenants and record rent or deposit payments. A property can be allocated only after a paid rent or deposit record exists.
- Allocating a property marks it occupied and removes it from public advertisements. Releasing or changing an allocation returns the old property to Available.
- Record later rent, deposit, and service-charge payments in **Payments & charges**.
- Delete a property from **Properties**. Its tenant and payment history are retained, with the tenant allocation cleared.

## One-time Supabase update

Before deploying this version, open the project’s **Supabase Dashboard → SQL Editor** and run these files in order:

1. [`supabase/migrations/20261101_property_allocation_and_advertising.sql`](supabase/migrations/20261101_property_allocation_and_advertising.sql)
2. [`supabase/migrations/20261102_landlord_profiles_and_tenant_packets.sql`](supabase/migrations/20261102_landlord_profiles_and_tenant_packets.sql)
3. [`supabase/migrations/20261103_property_photos_and_pdf_receipts.sql`](supabase/migrations/20261103_property_photos_and_pdf_receipts.sql)
4. [`supabase/migrations/20261104_international_property_locations.sql`](supabase/migrations/20261104_international_property_locations.sql)
5. [`supabase/migrations/20261105_landlord_branding_templates.sql`](supabase/migrations/20261105_landlord_branding_templates.sql)
6. [`supabase/migrations/20261106_landlord_invitation_security.sql`](supabase/migrations/20261106_landlord_invitation_security.sql)
7. [`supabase/migrations/20261107_public_property_complaints.sql`](supabase/migrations/20261107_public_property_complaints.sql)
8. [`supabase/migrations/20261108_listing_and_resolution_workflows.sql`](supabase/migrations/20261108_listing_and_resolution_workflows.sql)

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

## Brand landlord confirmation email and links

The app sends confirmation links back to the current Yemilaz Properties site and shows a branded success or expired-link screen. Old confirmation messages may still point to `localhost:3000`; discard those and use the new confirmation email after deployment.

In the Supabase project dashboard:

1. Open **Authentication → URL Configuration**. Set **Site URL** to `https://yemilazpropertieshub.github.io`. Add `https://yemilazpropertieshub.github.io/**` to **Redirect URLs**. For local development, also add `http://localhost:5173/**`.
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
3. Set `FRONTEND_ORIGINS` to the exact live GitHub Pages origin. For this repository it is `https://yemilazpropertieshub.github.io`.
4. Set `VITE_DOCUMENT_API_URL` in the GitHub Actions repository variable or build environment to the Node service base URL, then deploy the frontend again.
5. In **Landlord profile**, enter the lawyer’s email and review the agreement terms and house rules. Add agents and caretakers with email addresses under their directories.
6. Register a tenant with tenant and guarantor email addresses. Select any assigned agent/caretaker. When saved, the service emails a separate PDF attachment to the landlord, tenant, guarantor, lawyer, and selected agent/caretaker.

Each recipient gets a one-to-one email with a copy labeled for their role. The packet includes the lease/property summary, recorded payment and charge list, agreement terms, house rules, and signature lines. Paid service charges are also attached as individual receipt PDFs. In **Tenants**, **Download PDFs** creates a ZIP containing a separate packet for each recipient and a separate receipt PDF for every payment recorded as paid. Both email and download use only records in the landlord's account. The agreement content is a starting template; have a qualified lawyer review it for each jurisdiction and tenancy. Delivery attempts are logged in `tenant_packet_deliveries` for the landlord to inspect in Supabase.

## Deploy with GitHub Desktop

1. Open the repository in GitHub Desktop and review the changed files.
2. Commit the changes to `main`, then click **Push origin**.
3. GitHub Actions builds and publishes the site automatically. Wait for the newest run to turn green.

The Pages workflow uses the project URL directly and reads `VITE_SUPABASE_ANON_KEY` from repository Actions secrets. Add `VITE_DOCUMENT_API_URL` as a repository Actions variable. Never put a Supabase service-role/secret key or Resend key in this browser app; the Node service uses the signed-in user token and Supabase row-level security.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` and then `npm run dev`.
3. Copy `.env.example` to `.env.local` and set Supabase URL, publishable/anon key, and document API URL.
4. For a new project, run `supabase/schema.sql`, then migrations 6, 7, and 8 above. For the existing project, run all eight migrations above in order. Then bootstrap the platform administrator as described above.
5. For the Node mail service, run `npm install` inside `server`, copy `server/.env.example` to `server/.env`, fill in its values, and run `npm start`.
