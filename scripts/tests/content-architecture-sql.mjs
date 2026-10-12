// Disposable PostgreSQL fixture for the content architecture migration. No production access.
// Run: PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node scripts/tests/content-architecture-sql.mjs
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
const ADMIN = '40000000-0000-0000-0000-000000000001';
const STUDENT = '40000000-0000-0000-0000-000000000002';
const as = async (role, sub = '', admin = false) => {
  await db.query('RESET ROLE');
  await db.query(
    `SELECT set_config('request.jwt.claim.role',$1,false),set_config('request.jwt.claim.sub',$2,false),
     set_config('fixture.admin',$3,false)`,
    [role, sub, String(admin)]
  );
  await db.query(`SET ROLE ${role}`);
};
const rows = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await rows(sql, params))[0];

try {
  // Mirrors the live columns the migration touches (see supabase/migrations 001/006/009/014/017).
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role',true) $$;
    CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT current_setting('fixture.admin',true)='true' $$;
    CREATE FUNCTION public.can_mutate_admin_record(text,boolean DEFAULT false) RETURNS boolean
      LANGUAGE sql STABLE AS $$ SELECT current_setting('fixture.admin',true)='true' $$;
    CREATE FUNCTION public.has_test_access(uuid,text) RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT true $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth,public TO anon,authenticated;

    CREATE TABLE exams(id text PRIMARY KEY, title text NOT NULL, is_active boolean NOT NULL DEFAULT true);
    CREATE TABLE subjects(id text PRIMARY KEY, exam_id text REFERENCES exams(id) ON DELETE CASCADE,
      name text NOT NULL, order_index int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true);
    CREATE TABLE chapters(id text PRIMARY KEY, subject_id text NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      name text NOT NULL, is_active boolean NOT NULL DEFAULT true);
    CREATE TABLE exam_topics(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exam_id text NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      topic_id text NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      order_index int NOT NULL DEFAULT 0, UNIQUE(exam_id, topic_id));
    CREATE TABLE test_series(id text PRIMARY KEY, exam_id text NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      title text NOT NULL, is_active boolean NOT NULL DEFAULT true, status text,
      updated_at timestamptz DEFAULT now());
    CREATE TABLE tests(id text PRIMARY KEY, exam_id text REFERENCES exams(id) ON DELETE CASCADE,
      subject_id text REFERENCES subjects(id) ON DELETE SET NULL,
      chapter_id text REFERENCES chapters(id) ON DELETE SET NULL,
      test_series_id text REFERENCES test_series(id) ON DELETE SET NULL,
      title text NOT NULL, test_type text NOT NULL DEFAULT 'chapter_mock'
        CHECK (test_type IN ('chapter_mock','full_mock','subject_mock','pyq','topic')),
      year int, order_index int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true,
      status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')));
    CREATE TABLE test_exams(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id text NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      exam_id text NOT NULL REFERENCES exams(id) ON DELETE CASCADE, UNIQUE(test_id, exam_id));
    CREATE TABLE questions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_text text NOT NULL,
      question_bengali_text text, image_url text, subject_id text, chapter_id text,
      option_a text, option_b text, option_c text, option_d text, difficulty text,
      default_marks numeric DEFAULT 1, default_negative_marks numeric DEFAULT 0.25,
      is_active boolean NOT NULL DEFAULT true);
    CREATE TABLE test_questions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id text NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      question_order int NOT NULL, marks numeric NOT NULL DEFAULT 1, negative_marks numeric NOT NULL DEFAULT 0,
      UNIQUE(test_id, question_id));
    ALTER TABLE test_series ENABLE ROW LEVEL SECURITY;
    ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
    -- Supabase default grants; RLS + the live "Admin manage ..." policies gate writes.
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    CREATE POLICY "Admin manage test series" ON test_series FOR ALL
      USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
    CREATE POLICY "Admin manage test questions" ON test_questions FOR ALL
      USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

    -- Legacy data: one exam-owned subject, one global subject, an exam topic mapping whose
    -- parent subject is global, and a test already in a series.
    INSERT INTO exams VALUES ('wbp','WBP Constable'),('ssc','WBSSC');
    INSERT INTO subjects(id,exam_id,name) VALUES ('math','wbp','Mathematics'),('gs',NULL,'General Science'),
      ('gk',NULL,'General Awareness');
    INSERT INTO chapters VALUES ('pct','math','Percentage'),('heat','gs','Heat & Temperature'),
      ('hist','gk','Indian History');
    INSERT INTO exam_topics(exam_id,topic_id) VALUES ('wbp','heat');
    INSERT INTO test_series(id,exam_id,title,status) VALUES ('s-wbp','wbp','WBP Complete','published');
    INSERT INTO tests(id,exam_id,title,test_type,test_series_id,order_index)
      VALUES ('t-old','wbp','Legacy Mock','full_mock','s-wbp',3);
    INSERT INTO tests(id,title,test_type) VALUES ('t-legacy-chapter','Old chapter test','chapter_mock');
  `);

  const migration = await readFile(
    'supabase/migrations/20261012100000_content_architecture.sql',
    'utf8'
  );
  await db.exec(migration);
  await db.exec(migration); // re-applying is safe

  // --- Backfills copy only explicit relationships --------------------------------------
  eq(
    await rows(`SELECT exam_id, subject_id FROM exam_subjects ORDER BY 1,2`),
    [
      { exam_id: 'wbp', subject_id: 'gs' },
      { exam_id: 'wbp', subject_id: 'math' },
    ],
    'exam-owned subject + parent of mapped topic backfilled; unrelated global subject not guessed'
  );
  eq(
    await rows(`SELECT series_id, test_id FROM test_series_tests`),
    [{ series_id: 's-wbp', test_id: 't-old' }],
    'series membership backfilled from tests.test_series_id'
  );

  // --- Exam curriculum save ------------------------------------------------------------
  await as('authenticated', STUDENT);
  await rejects(
    db.query(`SELECT admin_save_exam_curriculum('wbp', ARRAY['math'], ARRAY[]::text[])`),
    /privileges/
  );
  await as('authenticated', ADMIN, true);
  await rejects(
    db.query(`SELECT admin_save_exam_curriculum('wbp', ARRAY['math'], ARRAY['hist'])`),
    /not selected/
  );
  await db.query(
    `SELECT admin_save_exam_curriculum('wbp', ARRAY['math','gk','gs'], ARRAY['pct','hist','heat'])`
  );
  eq(
    (await one(`SELECT count(*)::int n FROM exam_topics WHERE exam_id='wbp'`)).n,
    3,
    'topics assigned'
  );
  // Trigger-level checks run as the table owner (staff writes go through the RPCs).
  await db.query('RESET ROLE');
  await rejects(
    db.query(`INSERT INTO exam_topics(exam_id,topic_id) VALUES ('ssc','pct')`),
    /subject to this exam/
  );
  // Deselect General Awareness: its topic assignment goes, the catalogue stays.
  await as('authenticated', ADMIN, true);
  await rejects(
    db.query(`SELECT admin_save_exam_curriculum('wbp', ARRAY['math','gs'], ARRAY['pct','heat','hist'])`),
    /not selected/
  );
  await db.query(`SELECT admin_save_exam_curriculum('wbp', ARRAY['math','gs'], ARRAY['pct','heat'])`);
  eq(
    (await rows(`SELECT topic_id FROM exam_topics WHERE exam_id='wbp' ORDER BY 1`)).map((r) => r.topic_id),
    ['heat', 'pct'],
    'deselected subject topic removed'
  );
  eq((await one(`SELECT count(*)::int n FROM subjects`)).n, 3, 'no subject deleted');
  eq((await one(`SELECT count(*)::int n FROM chapters`)).n, 3, 'no topic deleted');
  // Direct unassign cascades topic assignments too.
  await db.query('RESET ROLE');
  await db.query(`DELETE FROM exam_subjects WHERE exam_id='wbp' AND subject_id='gs'`);
  eq(
    (await rows(`SELECT topic_id FROM exam_topics WHERE exam_id='wbp'`)).map((r) => r.topic_id),
    ['pct'],
    'unassign cascade'
  );
  // Moving a topic to a subject the exam lacks prunes the now-invalid assignment.
  await db.query(`UPDATE chapters SET subject_id='gk' WHERE id='pct'`);
  eq((await one(`SELECT count(*)::int n FROM exam_topics WHERE exam_id='wbp'`)).n, 0, 'reparent prune');
  await db.query(`UPDATE chapters SET subject_id='math' WHERE id='pct'`);

  // --- Test type rules -----------------------------------------------------------------
  await rejects(
    db.query(`INSERT INTO tests(id,title,test_type) VALUES ('x1','No exam mock','full_mock')`),
    /Full Mock/
  );
  await rejects(
    db.query(`INSERT INTO tests(id,exam_id,title,test_type) VALUES ('x2','wbp','PYQ','pyq')`),
    /exam year/
  );
  await rejects(
    db.query(
      `INSERT INTO tests(id,title,test_type,subject_id,chapter_id) VALUES ('x3','T','topic','math','heat')`
    ),
    /does not belong/
  );
  await rejects(
    db.query(`INSERT INTO tests(id,title,test_type,subject_id) VALUES ('x4','S','subject_mock','math')`),
    /Topic Test instead/
  );
  const topic = await one(
    `INSERT INTO tests(id,title,test_type,subject_id,chapter_id)
     VALUES ('t-heat','Heat 01','topic','gs','heat') RETURNING exam_id, status`
  );
  eq(topic, { exam_id: null, status: 'draft' }, 'topic test without exam; defaults to draft');
  await db.query(
    `INSERT INTO tests(id,exam_id,title,test_type,year,status) VALUES
     ('t-pyq','wbp','WBP 2024','pyq',2024,'published'),
     ('t-mock','wbp','Mock 1','full_mock',NULL,'published'),
     ('t-ssc','ssc','SSC Mock','full_mock',NULL,'published')`
  );
  await db.query(`UPDATE tests SET title='Renamed legacy' WHERE id='t-legacy-chapter'`);
  checks++; // cosmetic edit of a legacy row is not blocked

  // --- Series membership ---------------------------------------------------------------
  await db.query(`UPDATE tests SET status='published' WHERE id='t-heat'`);
  await rejects(
    db.query(`SELECT admin_set_series_tests('s-wbp', ARRAY['t-old','t-old'])`),
    /only once/
  );
  await rejects(
    db.query(`SELECT admin_set_series_tests('s-wbp', ARRAY['t-old','t-ssc'])`),
    /different exam/
  );
  await db.query(`SELECT admin_set_series_tests('s-wbp', ARRAY['t-pyq','t-heat','t-old','t-mock'])`);
  eq(
    (
      await rows(`SELECT test_id FROM test_series_tests WHERE series_id='s-wbp' ORDER BY order_index`)
    ).map((r) => r.test_id),
    ['t-pyq', 't-heat', 't-old', 't-mock'],
    'saved order'
  );
  // Same test in a second, exam-independent series.
  await db.query(`INSERT INTO test_series(id,exam_id,title,status) VALUES ('s-sci',NULL,'Science Practice','published')`);
  await db.query(`SELECT admin_assign_series_tests(ARRAY['t-heat'], 's-sci')`);
  eq(
    (await rows(`SELECT series_id FROM test_series_tests WHERE test_id='t-heat' ORDER BY 1`)).map((r) => r.series_id),
    ['s-sci', 's-wbp'],
    'test in two series'
  );
  eq((await one(`SELECT test_series_id FROM tests WHERE id='t-heat'`)).test_series_id, 's-wbp', 'primary series kept');
  // Remove from the primary series: test and questions survive, primary moves.
  const q = await one(`INSERT INTO questions(question_text) VALUES ('Q1') RETURNING id`);
  await db.query(`INSERT INTO test_questions(test_id,question_id,question_order) VALUES ('t-heat',$1,1)`, [q.id]);
  await db.query(`SELECT admin_set_series_tests('s-wbp', ARRAY['t-pyq','t-old','t-mock'])`);
  eq((await one(`SELECT test_series_id FROM tests WHERE id='t-heat'`)).test_series_id, 's-sci', 'primary moved');
  eq((await one(`SELECT count(*)::int n FROM test_questions WHERE test_id='t-heat'`)).n, 1, 'questions intact');
  // Legacy direct writes still create memberships.
  await db.query(`UPDATE tests SET test_series_id='s-sci' WHERE id='t-mock'`);
  eq(
    (await one(`SELECT count(*)::int n FROM test_series_tests WHERE series_id='s-sci' AND test_id='t-mock'`)).n,
    1,
    'legacy write synced'
  );

  // --- Student visibility --------------------------------------------------------------
  await db.query(`INSERT INTO test_series(id,exam_id,title,status,is_active) VALUES ('s-draft','wbp','Draft','draft',true)`);
  eq((await one(`SELECT is_active FROM test_series WHERE id='s-draft'`)).is_active, false, 'status drives is_active');
  await db.query(`INSERT INTO tests(id,exam_id,title,test_type) VALUES ('t-draft','wbp','Draft mock','full_mock')`);
  await db.query(`SELECT admin_set_series_tests('s-wbp', ARRAY['t-pyq','t-old','t-mock','t-draft'])`);
  const q2 = await one(`INSERT INTO questions(question_text) VALUES ('Q2') RETURNING id`);
  await db.query(`INSERT INTO test_questions(test_id,question_id,question_order) VALUES ('t-draft',$1,1)`, [q2.id]);

  await as('authenticated', STUDENT);
  eq(
    (await rows(`SELECT id FROM test_series ORDER BY id`)).map((r) => r.id),
    ['s-sci', 's-wbp'],
    'draft series hidden'
  );
  eq(
    (
      await rows(`SELECT test_id FROM test_series_tests WHERE series_id='s-wbp' ORDER BY order_index`)
    ).map((r) => r.test_id),
    ['t-pyq', 't-old', 't-mock'],
    'draft test hidden from series listing, order kept'
  );
  eq((await rows(`SELECT 1 FROM test_questions WHERE test_id='t-draft'`)).length, 0, 'draft test_questions hidden');
  await rejects(db.query(`SELECT get_student_exam_questions('t-draft')`), /not found/);
  eq((await one(`SELECT jsonb_array_length(get_student_exam_questions('t-heat')) n`)).n, 1, 'published questions served');
  await rejects(db.query(`INSERT INTO exam_subjects(exam_id,subject_id) VALUES ('ssc','math')`), /permission denied/);
  await rejects(db.query(`INSERT INTO test_series_tests(series_id,test_id) VALUES ('s-sci','t-pyq')`), /permission denied/);

  // Deleting a series never deletes its tests.
  await as('authenticated', ADMIN, true);
  await db.query(`DELETE FROM test_series WHERE id='s-sci'`);
  eq((await one(`SELECT count(*)::int n FROM tests WHERE id IN ('t-heat','t-mock')`)).n, 2, 'tests survive series delete');
  eq((await one(`SELECT test_series_id FROM tests WHERE id='t-heat'`)).test_series_id, null, 'primary cleared');

  console.log(`content-architecture-sql: ${checks} checks passed`);
} finally {
  await db.close();
}
