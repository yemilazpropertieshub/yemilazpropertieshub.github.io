# Yemilaz Properties

A responsive property marketing and management website built with Node.js, React, Vite, and Supabase.

## Property and tenant workflow

- The public homepage includes manager sign-in and property advertisements.
- Only properties marked **Advertise** and still **Available** appear on the public homepage.
- Register tenants and record rent or deposit payments. A property can be allocated only after a paid rent or deposit record exists.
- Allocating a property marks it occupied and removes it from public advertisements. Releasing or changing an allocation returns the old property to Available.
- Record later rent, deposit, and service-charge payments in **Payments & charges**.
- Delete a property from **Properties**. Its tenant and payment history are retained, with the tenant allocation cleared.

## One-time Supabase update

Before deploying this version, open the project’s **Supabase Dashboard → SQL Editor** and run these files in order:

1. [`supabase/migrations/20261101_property_allocation_and_advertising.sql`](supabase/migrations/20261101_property_allocation_and_advertising.sql)
2. [`supabase/migrations/20261102_landlord_profiles_and_tenant_packets.sql`](supabase/migrations/20261102_landlord_profiles_and_tenant_packets.sql)
3. [`supabase/migrations/20261103_property_photos_and_pdf_receipts.sql`](supabase/migrations/20261103_property_photos_and_pdf_receipts.sql)

The second migration creates private landlord profiles, per-landlord agreement and house-rule templates, assigned agent/caretaker fields, and a private email delivery history. New Supabase Auth accounts receive their own profile automatically. Existing accounts receive a default profile.

The third migration enables up to five public listing photos per property in the `property-images` bucket and adds the database limit. Each JPG, PNG, or WebP photo may be up to 5 MB.

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
4. Run `supabase/schema.sql` for a new Supabase project, or run all three migrations above for the existing project.
5. For the Node mail service, run `npm install` inside `server`, copy `server/.env.example` to `server/.env`, fill in its values, and run `npm start`.
