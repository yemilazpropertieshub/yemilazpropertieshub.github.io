# Supabase migration runbook

This repository's SQL files are forward-only, ordered migration scripts. They are not a replacement for the live Supabase database, and merging website code does not run SQL against production.

## Before a release

1. Review each new SQL file in `supabase/migrations` and confirm it only changes the intended tables, policies, functions, and storage rules.
2. Run `npm run migrations:check`. It verifies filenames and SHA-256 checksums against `supabase/migration-manifest.json`.
3. For an intentional SQL edit or a new migration, review the diff and run `npm run migrations:manifest` to refresh the manifest. Include both the SQL and manifest in the same release.
4. Confirm the last successfully applied migration in the Supabase project before choosing the next file. The project database is the source of truth for what is live.
5. Take a current Supabase backup or confirm the project's point-in-time recovery window before any production schema change.

## Applying a migration

1. Open the intended Supabase project and verify the project name and production/staging environment.
2. Open **SQL Editor**, create a new query, and paste one complete migration file in filename order. Never run a set of migrations out of order.
3. Review the SQL, run it once, and wait for a successful result. If it fails, stop and resolve that error before continuing to later migrations.
4. Record the filename, checksum, environment, date, operator, and SQL Editor result in the project's release record. Do not mark a migration applied just because it was pasted or partially executed.
5. Deploy the matching frontend/server change only after the migration succeeds. If the release needs multiple migrations, apply and record each one in order.

After `20261215_release_reconciliation_moveout_identity_delivery.sql` has succeeded, record each confirmed production migration in the protected database ledger. Use the SHA-256 value from `supabase/migration-manifest.json`:

```sql
insert into public.yemilaz_migration_history
  (migration_file, sha256, environment, applied_by, release_reference)
values
  ('20261215_release_reconciliation_moveout_identity_delivery.sql', 'PASTE_64_CHARACTER_SHA256_HERE', 'production', 'operator name', 'deployment or commit reference')
on conflict (migration_file) do update
set sha256 = excluded.sha256,
    environment = excluded.environment,
    applied_by = excluded.applied_by,
    release_reference = excluded.release_reference,
    applied_at = now();
```

Do not insert a history row until the full migration has completed successfully. The app roles have no access to this internal ledger.

## Recovery rules

- Treat production migrations as forward-only. Prefer a corrective migration over hand-editing an already applied file.
- If a migration fails partway through, inspect the database before rerunning it. A file is safe to rerun only where every statement is designed to be idempotent.
- If the deployed code needs a schema change that has not been applied, roll back the code deployment or restore the compatible release; do not invent or run unrelated SQL to work around it.
- Keep service-role keys, database passwords, NIN data, and identity-provider secrets out of migration files, browser variables, and Git.

## Local integrity commands

```powershell
npm run migrations:check
npm run migrations:manifest   # only after reviewing intentional SQL changes
```

The manifest protects the checked-in migration files from unnoticed edits. It does not claim a file has been applied to the hosted project; verify that in Supabase before deployment.
