// Moves base64 `data:image/...` values out of table rows into the `banners`
// Storage bucket and replaces each with its public URL.
//
// Usage (dry run lists what would move; --apply does it):
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/move-inline-images.mjs [--apply]
//
// The service role key bypasses RLS; never commit it or pass it on a shared shell.
// Re-runnable: rows already holding a URL are skipped.
import { createClient } from '@supabase/supabase-js';

const COLUMNS = [
  ['audiobooks', 'thumbnail_url'],
  ['chapters', 'icon_name'],
  ['exams', 'banner_url'],
  ['exams', 'icon_name'],
  ['live_tests', 'exam_logo'],
  ['live_tests', 'logo'],
  ['profiles', 'avatar_url'],
  ['questions', 'image_url'],
  ['subjects', 'icon_name'],
  ['test_series', 'banner_url'],
  ['test_series', 'icon_url'],
  ['tests', 'icon_url'],
];
const EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('error: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}
const apply = process.argv.includes('--apply');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let found = 0;
let failed = 0;
for (const [table, column] of COLUMNS) {
  // Select only the id and the matching column so the scan itself stays small.
  const { data: rows, error } = await supabase
    .from(table)
    .select(`id, ${column}`)
    .ilike(column, 'data:%');
  if (error) {
    console.error(`skip ${table}.${column}: ${error.message}`);
    failed++;
    continue;
  }
  for (const row of rows) {
    found++;
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(row[column]);
    const ext = match && EXTENSIONS[match[1].toLowerCase()];
    if (!ext) {
      console.error(
        `skip ${table}.${column} id=${row.id}: unsupported data URL (not base64 PNG/JPG/WebP/GIF)`
      );
      failed++;
      continue;
    }
    const bytes = Buffer.from(match[2], 'base64');
    const path = `inline-migrated/${table}-${column}-${row.id}.${ext}`;
    console.log(
      `${apply ? 'move' : 'would move'} ${table}.${column} id=${row.id} (${bytes.length} bytes) -> banners/${path}`
    );
    if (!apply) continue;

    const upload = await supabase.storage
      .from('banners')
      .upload(path, bytes, { contentType: match[1], cacheControl: '31536000', upsert: true });
    if (upload.error) {
      console.error(`  upload failed: ${upload.error.message}`);
      failed++;
      continue;
    }
    const url = supabase.storage.from('banners').getPublicUrl(path).data.publicUrl;
    const update = await supabase
      .from(table)
      .update({ [column]: url })
      .eq('id', row.id);
    if (update.error) {
      console.error(`  row update failed: ${update.error.message}`);
      failed++;
      continue;
    }
    console.log(`  -> ${url}`);
  }
}
console.log(
  `${found} inline image(s) found, ${failed} problem(s)${apply ? '' : ' (dry run; pass --apply)'}`
);
process.exit(failed ? 1 : 0);
