// Checks supabase/migrations for problems `supabase db push` would hit:
//   * two files with the same version prefix (only one of them gets applied),
//   * a file that does not start with a version prefix.
// Usage: node scripts/check-migrations.mjs
import { readdirSync } from 'node:fs';

const dir = new URL('../supabase/migrations/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));
const byVersion = new Map();
const problems = [];

for (const file of files) {
  const match = /^(\d+)_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) {
    problems.push(`${file}: name must be <version>_<snake_case_name>.sql`);
    continue;
  }
  const seen = byVersion.get(match[1]);
  if (seen) problems.push(`${file}: version ${match[1]} is already used by ${seen}`);
  else byVersion.set(match[1], file);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${files.length} migrations, all versions unique`);
