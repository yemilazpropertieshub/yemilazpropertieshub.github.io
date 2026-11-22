import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationDir = resolve(root, 'supabase/migrations');
const manifestPath = resolve(root, 'supabase/migration-manifest.json');
const files = (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort();
const invalid = files.filter((name) => !/^\d{8}_[a-z0-9_]+\.sql$/i.test(name));
if (invalid.length) {
  console.error('Migration naming check failed.');
  if (invalid.length) console.error(`Invalid filenames: ${invalid.join(', ')}`);
  process.exit(1);
}

const entries = await Promise.all(files.map(async (file) => {
  const sql = await readFile(resolve(migrationDir, file));
  return { file, sha256: createHash('sha256').update(sql).digest('hex') };
}));
const next = `${JSON.stringify({ format: 1, migrations: entries }, null, 2)}\n`;
if (process.argv.includes('--write')) {
  await writeFile(manifestPath, next, 'utf8');
  console.log(`Wrote checksum manifest for ${entries.length} migrations.`);
  process.exit(0);
}

let current;
try { current = await readFile(manifestPath, 'utf8'); }
catch { console.error('Migration manifest is missing. Run npm run migrations:manifest.'); process.exit(1); }
if (current !== next) {
  console.error('Migration files changed since the checksum manifest was reviewed.');
  console.error('Review SQL changes, then run npm run migrations:manifest and include both files in the same release.');
  process.exit(1);
}
console.log(`Migration names and SHA-256 checksums verified (${entries.length} files).`);
