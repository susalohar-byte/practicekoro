// Disposable PostgreSQL fixture for the Audio Book module. No production/network access.
// Run: PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node scripts/tests/audiobooks-sql.mjs
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let checks = 0;
const eq = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  checks++;
};
const rejects = async (promise, pattern) => {
  await assert.rejects(promise, pattern);
  checks++;
};
const STAFF = '30000000-0000-0000-0000-000000000001';
const STUDENT = '30000000-0000-0000-0000-000000000002';
const as = async (role, sub = '', staff = false) => {
  await db.query('RESET ROLE');
  await db.query(
    `SELECT set_config('request.jwt.claim.role',$1,false),set_config('request.jwt.claim.sub',$2,false),
     set_config('fixture.staff',$3,false)`,
    [role, sub, String(staff)]
  );
  await db.query(`SET ROLE ${role}`);
};
const one = async (sql, params) => (await db.query(sql, params)).rows[0];
const URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const THUMB = 'https://x.supabase.co/storage/v1/object/public/banners/u/a.png';
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid primary key);
    INSERT INTO auth.users VALUES('${STAFF}'),('${STUDENT}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role',true) $$;
    CREATE FUNCTION public.admin_scope_allowed(text) RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT current_setting('fixture.staff',true)='true' $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    GRANT EXECUTE ON FUNCTION auth.uid(), auth.role(), public.admin_scope_allowed(text) TO anon,authenticated;
    GRANT SELECT ON auth.users TO authenticated;
  `);
  const migration = await readFile('supabase/migrations/20261012090000_audiobooks.sql', 'utf8');
  await db.exec(migration);
  await db.exec(migration); // re-applying is safe

  // Students cannot write taxonomy or books.
  await as('authenticated', STUDENT);
  await rejects(
    db.query(`INSERT INTO audiobook_categories(name) VALUES('Hack')`),
    /row-level security/
  );

  // Staff build an independent taxonomy.
  await as('authenticated', STAFF, true);
  const cat = await one(
    `INSERT INTO audiobook_categories(name) VALUES('  History ') RETURNING id,name`
  );
  eq(cat.name, 'History', 'names are trimmed');
  await rejects(
    db.query(`INSERT INTO audiobook_categories(name) VALUES('history')`),
    /duplicate key/
  );
  const cat2 = (await one(`INSERT INTO audiobook_categories(name) VALUES('Science') RETURNING id`))
    .id;
  const sub = (
    await one(
      `INSERT INTO audiobook_subjects(category_id,name) VALUES($1,'Ancient Indian History') RETURNING id`,
      [cat.id]
    )
  ).id;
  const sub2 = (
    await one(
      `INSERT INTO audiobook_subjects(category_id,name) VALUES($1,'Physics') RETURNING id`,
      [cat2]
    )
  ).id;
  const topic = (
    await one(
      `INSERT INTO audiobook_topics(subject_id,name) VALUES($1,'Mauryan Empire') RETURNING id`,
      [sub]
    )
  ).id;

  const insertBook = (title, category, subject, topicId, status = 'draft', extra = {}) =>
    one(
      `INSERT INTO audiobooks(title,category_id,subject_id,topic_id,youtube_url,youtube_video_id,status,thumbnail_url,duration_seconds)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        title,
        category,
        subject,
        topicId,
        extra.url ?? URL,
        extra.id ?? 'dQw4w9WgXcQ',
        status,
        extra.thumb ?? null,
        extra.duration ?? null,
      ]
    );

  const draft = await insertBook('Emperor Ashoka', cat.id, sub, topic);
  eq(
    [draft.status, draft.published_at, draft.created_by],
    ['draft', null, STAFF],
    'draft has no publish date'
  );
  const pub = await insertBook('Chandragupta', cat.id, sub, null, 'published', {
    thumb: THUMB,
    duration: 2720,
  });
  assert.ok(pub.published_at, 'publishing stamps published_at');
  checks++;

  // Integrity: subject must match category; topic must match subject; URL/ID/thumbnail rules.
  await rejects(insertBook('Bad', cat2, sub, null), /audiobooks_subject_category_fkey/);
  await rejects(
    insertBook('Bad', cat.id, sub, '00000000-0000-0000-0000-000000000000'),
    /audiobooks_topic_subject_fkey/
  );
  await rejects(
    insertBook('Bad', cat.id, sub, null, 'draft', {
      url: 'https://vimeo.com/1',
      id: 'dQw4w9WgXcQ',
    }),
    /check constraint/
  );
  await rejects(
    insertBook('Bad', cat.id, sub, null, 'draft', { id: 'AAAAAAAAAAA' }),
    /audiobooks_video_id_in_url/
  );
  await rejects(
    insertBook('Bad', cat.id, sub, null, 'draft', { thumb: 'blob:http://x/1' }),
    /check constraint/
  );
  await rejects(
    insertBook('Bad', cat.id, sub, null, 'draft', { thumb: 'data:image/png;base64,AA' }),
    /check constraint/
  );
  await rejects(insertBook('   ', cat.id, sub, null), /check constraint/);

  // Deletes that would orphan books are refused.
  await rejects(db.query(`DELETE FROM audiobook_topics WHERE id=$1`, [topic]), /foreign key/);
  await rejects(db.query(`DELETE FROM audiobook_subjects WHERE id=$1`, [sub]), /foreign key/);
  await rejects(db.query(`DELETE FROM audiobook_categories WHERE id=$1`, [cat.id]), /foreign key/);
  eq(
    (await db.query(`DELETE FROM audiobook_subjects WHERE id=$1 RETURNING id`, [sub2])).rows.length,
    1,
    'unused subject deletes'
  );

  // Students see published books only and cannot change them.
  await as('authenticated', STUDENT);
  eq(
    (await db.query(`SELECT title FROM audiobooks ORDER BY title`)).rows,
    [{ title: 'Chandragupta' }],
    'drafts hidden'
  );
  eq(
    (await db.query(`UPDATE audiobooks SET title='x' RETURNING id`)).rows.length,
    0,
    'student updates nothing'
  );
  eq(
    (await db.query(`DELETE FROM audiobooks RETURNING id`)).rows.length,
    0,
    'student deletes nothing'
  );
  await rejects(db.query(`SELECT * FROM audiobook_listens`), /permission denied/);
  await rejects(db.query(`SELECT public.get_admin_audiobook_stats()`), /Insufficient/);

  // Listens: one per student/book/day, published books only.
  eq(
    (await one(`SELECT public.record_audiobook_listen($1) AS ok`, [pub.id])).ok,
    true,
    'listen recorded'
  );
  eq(
    (await one(`SELECT public.record_audiobook_listen($1) AS ok`, [pub.id])).ok,
    true,
    'repeat is idempotent'
  );
  eq(
    (await one(`SELECT public.record_audiobook_listen($1) AS ok`, [draft.id])).ok,
    false,
    'drafts are not counted'
  );
  await as('anon');
  await rejects(db.query(`SELECT * FROM audiobooks`), /permission denied/);
  await rejects(
    db.query(`SELECT public.record_audiobook_listen($1)`, [pub.id]),
    /permission denied/
  );

  // Staff stats are computed from real rows.
  await as('authenticated', STAFF, true);
  eq(
    (await one(`SELECT public.get_admin_audiobook_stats() AS s`)).s,
    {
      total: 2,
      published: 1,
      drafts: 1,
      total_duration_seconds: 2720,
      timed_count: 1,
      total_listens: 1,
    },
    'stats'
  );

  // Unpublishing clears the publish date; republishing stamps a new one.
  const unpub = await one(
    `UPDATE audiobooks SET status='draft' WHERE id=$1 RETURNING published_at`,
    [pub.id]
  );
  eq(unpub.published_at, null, 'unpublish clears date');
  // Moving a subject to another category carries its books along.
  await db.query(`UPDATE audiobook_subjects SET category_id=$1 WHERE id=$2`, [cat2, sub]);
  eq(
    (await one(`SELECT count(*)::int AS n FROM audiobooks WHERE category_id=$1`, [cat2])).n,
    2,
    'category cascades'
  );

  console.log(`audiobooks-sql: ${checks} checks passed`);
} finally {
  await db.close();
}
