# Yemilaz Properties release checklist

Use this before publishing a frontend or document-service update. A checklist item is complete only after the listed result is observed in the target environment.

## 1. Prepare

- [ ] Confirm the intended branch, files, and release scope; keep unrelated changes out.
- [ ] Review `git diff` and confirm no `.env`, API key, service-role key, identity number, private document, or customer data is included.
- [ ] Run `npm run release:check` from the repository root. Resolve any migration-manifest or production-build failure.
- [ ] Read the new SQL migration and [the Supabase migration runbook](../supabase/MIGRATION_RUNBOOK.md). Verify a current backup/recovery path and the latest applied migration before proceeding.
- [ ] Apply required Supabase migrations to staging first where available. Confirm success and record the environment, filename, checksum, operator, and time.
- [ ] Confirm the server service has only server-side secrets and the configured frontend origins.

## 2. Verify the main workflows

- [ ] **Payments:** reconcile paid, unpaid, overdue, and voided entries; verify paid dates and evidence links; confirm a filtered export matches the visible rows.
- [ ] **Move-out:** save a move-out inspection, meter readings, key return, and deposit settlement; complete close-out; confirm the tenant moves to expired, the property is released only when no other tenant is active, and a positive balance creates one unpaid settlement charge.
- [ ] **Identity:** confirm the flow asks for explicit consent, logs only the consent version/time, sends the user to HTTPS provider hosting, and never stores raw NIN, identity images, or biometric data.
- [ ] **Email delivery:** cause one controlled failure in staging; confirm the owner sees the failure and can retry only the same failed recipient; confirm each retry adds a new attempt and successful provider webhooks update the delivery status.
- [ ] **Documents:** upload, search, filter, and open a private file; verify landlord-only files remain private and a tenant sees only a file explicitly shared with that tenant.
- [ ] **Reports:** compare date/property filters, recorded income, unpaid balance, maintenance/team costs, and net cash-flow figures against source ledger records.
- [ ] **Access:** check a landlord, tenant, caretaker, agent, and lawyer account; confirm each sees only their assigned pages and records.

## 3. Publish and close out

- [ ] Apply each remaining production SQL migration in order and record success before deploying code that depends on it.
- [ ] Deploy the frontend and document service; confirm the hosting release is healthy.
- [ ] On a phone-sized viewport, open and close the navigation, notifications, forms, tables, and file controls. Confirm there is no horizontal overflow and primary actions remain reachable.
- [ ] Recheck sign-in, account switching, sign-out, notification panel, and return navigation.
- [ ] Confirm required provider secrets, email sender domain, NIN provider endpoint, and webhook URL are configured in hosting dashboards—not in GitHub Pages or `VITE_*` secrets.
- [ ] Record the deployed commit, migrations applied, services changed, and any known follow-up in the release log.

## Go/no-go

Do not publish if the migration status is uncertain, private records cross account boundaries, the move-out action changes the wrong property, or a payment/email retry produces duplicate accounting records. Stop, capture the error without exposing private data, and prepare a corrective release.
