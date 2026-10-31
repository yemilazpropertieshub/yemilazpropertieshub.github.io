# Yemilaz Properties

A responsive property marketing and management starter built with Node.js, React, Vite, and Supabase. The dashboard preview uses sample data until Supabase is configured. The featured Lagos listings, tenant names, activity, and summary totals are illustrative placeholders; replace them with verified company information before publishing.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install` then `npm run dev`.
3. Copy `.env.example` to `.env.local` and set your Supabase project URL and **publishable/anon** key.
4. Run `supabase/schema.sql` in the Supabase SQL Editor.

Never put a Supabase service-role key in this browser app. The schema enables row-level security for owner-private management records. Create the first user in Supabase Authentication; use that account for property-management data.

## What's included

- Public-facing featured rental and for-sale property cards, with a responsive brand homepage/dashboard.
- Tenant lease form plus record forms for properties, service charges, guarantors, caretakers, and agents.
- Supabase schema for properties, lease dates and amounts, deposits, guarantors, staff, and individually tracked service charges.
- Owner-scoped RLS policies for private records.

## GitHub Pages

The included GitHub Actions workflow builds and deploys on pushes to `main`. In repository Settings → Pages, choose **GitHub Actions** as the build source. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under repository Settings → Secrets and variables → Actions. For custom Node server-side work or private server credentials, use a Node host (for example Render or Railway) instead of Pages.
