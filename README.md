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

Before deploying this version, open the project’s **Supabase Dashboard → SQL Editor**, open [`supabase/migrations/20261101_property_allocation_and_advertising.sql`](supabase/migrations/20261101_property_allocation_and_advertising.sql), paste its contents into a new query, and run it. This adds the advertisement flag, public read access for advertised available properties, safe property deletion behavior, and the transaction that allocates properties after payment.

Create the manager account under **Authentication → Users** in Supabase. The website has a manager sign-in, not a public sign-up form.

## Deploy with GitHub Desktop

1. Open the repository in GitHub Desktop and review the changed files.
2. Commit the changes to `main`, then click **Push origin**.
3. GitHub Actions builds and publishes the site automatically. Wait for the newest run to turn green.

The Pages workflow uses the project URL directly and reads `VITE_SUPABASE_ANON_KEY` from repository Actions secrets. Never put a Supabase service-role/secret key in this browser app.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` and then `npm run dev`.
3. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable/anon key.
4. Run `supabase/schema.sql` for a new Supabase project, or use the migration above for an existing project.
