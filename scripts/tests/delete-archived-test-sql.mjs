import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const migration = (name) =>
  fs.readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');
const SUPER = '00000000-0000-0000-0000-000000000001';
const WRITER = '00000000-0000-0000-0000-000000000002';
const STUDENT = '00000000-0000-0000-0000-000000000003';
const ATTEMPT = '10000000-0000-0000-0000-000000000001';
const as = (uid) => db.exec(`UPDATE public.current_uid SET id = '${uid}'`);
const purge = (id) => db.query(`SELECT public.admin_delete_archived_test('${id}') AS r`);
const count = async (sql) => Number((await db.query(sql)).rows[0].n);
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE public.current_uid(id uuid);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM public.current_uid $$;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY, role text, admin_role text, account_status text);
    CREATE TABLE public.tests(id text PRIMARY KEY, status text, duration_minutes int);
    -- Same ON DELETE rules as the real schema (001_initial_schema, 009, 044, 20261003061413).
    CREATE TABLE public.test_questions(test_id text NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE, question_id text);
    CREATE TABLE public.test_exams(test_id text NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE, exam_id text);
    CREATE TABLE public.test_attempts(id uuid PRIMARY KEY, user_id uuid,
      test_id text NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE);
    CREATE TABLE public.attempt_answers(attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE);
    CREATE TABLE public.test_results(attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
      test_id text NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE);
    CREATE TABLE public.live_tests(id text PRIMARY KEY, test_id text NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
      start_at timestamptz, duration_minutes int, status text, is_published boolean);
    CREATE TABLE public.live_test_participants(live_test_id text NOT NULL REFERENCES public.live_tests(id) ON DELETE CASCADE,
      attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE SET NULL);
    -- Same window rule as 20261023080121_content_integrity_guards.sql.
    CREATE FUNCTION public.is_live_test_active(lt public.live_tests, p_running_only boolean)
    RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT coalesce(lt.is_published, true)
        AND coalesce(lt.status, 'upcoming') NOT IN ('cancelled', 'draft', 'ended', 'completed')
        AND (NOT p_running_only OR now() >= lt.start_at)
        AND now() <= lt.start_at + greatest(1, coalesce(nullif(lt.duration_minutes, 0), 90)) * interval '1 minute';
    $$;

    INSERT INTO public.current_uid VALUES ('${SUPER}');
    INSERT INTO public.profiles VALUES
      ('${SUPER}', 'admin', 'super_admin', 'active'),
      ('${WRITER}', 'admin', 'content_writer', 'active'),
      ('${STUDENT}', 'student', NULL, 'active');
    INSERT INTO public.tests VALUES ('trial', 'archived', 60), ('live', 'archived', 60), ('kept', 'published', 60);
    INSERT INTO public.test_questions VALUES ('trial', 'q1'), ('trial', 'q2'), ('kept', 'q1');
    INSERT INTO public.test_exams VALUES ('trial', 'wbp');
    INSERT INTO public.test_attempts VALUES ('${ATTEMPT}', '${STUDENT}', 'trial');
    INSERT INTO public.attempt_answers VALUES ('${ATTEMPT}');
    INSERT INTO public.test_results VALUES ('${ATTEMPT}', 'trial');
    INSERT INTO public.live_tests VALUES
      ('l-past', 'trial', now() - interval '3 days', 60, 'upcoming', true),
      ('l-soon', 'live', now() + interval '1 day', 60, 'upcoming', true);
    INSERT INTO public.live_test_participants VALUES ('l-past', '${ATTEMPT}');
  `);
  await db.exec(migration('20261115100000_admin_delete_archived_test.sql'));

  // Students and non-super admins are refused.
  await as(STUDENT);
  await assert.rejects(purge('trial'), /administrator privileges required/);
  await as(WRITER);
  await assert.rejects(purge('trial'), /Only a super admin/);
  await as(SUPER);

  // A test that is not archived, or has an upcoming Live Test, stays.
  await assert.rejects(purge('kept'), /Only archived tests/);
  await assert.rejects(purge('live'), /upcoming or running Live Test/);
  await assert.rejects(purge('missing'), /Test not found/);

  // An archived trial test goes with its attempts, answers, results and past Live Test.
  const r = (await purge('trial')).rows[0].r;
  assert.deepEqual(r, {
    success: true,
    deleted_id: 'trial',
    attempts_deleted: 1,
    live_tests_deleted: 1,
  });
  assert.equal(await count(`SELECT count(*) n FROM public.tests WHERE id='trial'`), 0);
  for (const t of [
    'test_questions',
    'test_exams',
    'test_attempts',
    'attempt_answers',
    'test_results',
    'live_test_participants',
  ]) {
    const where =
      t === 'test_questions' || t === 'test_exams' || t === 'test_attempts'
        ? `WHERE test_id='trial'`
        : '';
    assert.equal(await count(`SELECT count(*) n FROM public.${t} ${where}`), 0, t);
  }
  // Other tests are untouched.
  assert.equal(await count(`SELECT count(*) n FROM public.test_questions WHERE test_id='kept'`), 1);
  console.log('PASS archived test deleted with its history; guards hold; others untouched');
} finally {
  await db.close();
}
