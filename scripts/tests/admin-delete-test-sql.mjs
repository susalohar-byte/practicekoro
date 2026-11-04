import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const fail = async (sql, pattern) => {
  await assert.rejects(db.exec(sql), (err) => pattern.test(String(err.message)));
};
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE public.current_uid(id text);
    CREATE FUNCTION auth.uid() RETURNS text LANGUAGE sql AS $$ SELECT id FROM public.current_uid $$;
    CREATE TABLE public.profiles(id text PRIMARY KEY, role text, admin_role text, account_status text);
    INSERT INTO public.profiles VALUES ('admin','admin','super_admin','active');
    INSERT INTO public.current_uid VALUES ('admin');
    CREATE TABLE public.exam_categories(id text PRIMARY KEY, name text);
    CREATE TABLE public.exams(id text PRIMARY KEY, category text);
    CREATE TABLE public.questions(id text PRIMARY KEY);
    CREATE TABLE public.tests(id text PRIMARY KEY, title text);
    CREATE TABLE public.test_questions(test_id text REFERENCES public.tests(id) ON DELETE CASCADE,
      question_id text REFERENCES public.questions(id));
    CREATE TABLE public.test_exams(test_id text REFERENCES public.tests(id) ON DELETE CASCADE,
      exam_id text REFERENCES public.exams(id));
    CREATE TABLE public.test_attempts(id text PRIMARY KEY,
      test_id text REFERENCES public.tests(id) ON DELETE CASCADE);
    CREATE TABLE public.live_tests(id text PRIMARY KEY,
      test_id text REFERENCES public.tests(id) ON DELETE CASCADE);
    INSERT INTO public.exams VALUES ('wbp');
    INSERT INTO public.questions VALUES ('q1'),('q2');
    INSERT INTO public.tests VALUES ('plain','With questions'),('taken','Attempted'),('live','Live paper');
    INSERT INTO public.test_questions VALUES ('plain','q1'),('plain','q2'),('taken','q1'),('live','q2');
    INSERT INTO public.test_exams VALUES ('plain','wbp');
    INSERT INTO public.test_attempts VALUES ('a1','taken');
    INSERT INTO public.live_tests VALUES ('l1','live');
  `);
  await db.exec(
    fs.readFileSync(
      new URL(
        '../../supabase/migrations/20261104120000_allow_deleting_tests_with_questions.sql',
        import.meta.url
      ),
      'utf8'
    )
  );

  // A test with questions and exam tags is deleted, along with its own links only.
  const res = await db.query(`SELECT public.admin_delete_record('tests','plain') AS r`);
  assert.deepEqual(res.rows[0].r, { success: true, deleted_id: 'plain' });
  const left = async (sql) => Number((await db.query(sql)).rows[0].n);
  assert.equal(await left(`SELECT count(*) n FROM public.tests WHERE id='plain'`), 0);
  assert.equal(await left(`SELECT count(*) n FROM public.test_questions WHERE test_id='plain'`), 0);
  assert.equal(await left(`SELECT count(*) n FROM public.test_exams WHERE test_id='plain'`), 0);
  assert.equal(await left(`SELECT count(*) n FROM public.questions`), 2); // bank questions kept

  // Student history and Live Tests still block it, with advice to archive.
  await fail(`SELECT public.admin_delete_record('tests','taken')`, /test_attempts.*Archive it/);
  await fail(`SELECT public.admin_delete_record('tests','live')`, /live_tests.*Archive it/);
  assert.equal(await left(`SELECT count(*) n FROM public.tests`), 2);

  // Other tables keep the strict rule: a question used by a test cannot be deleted.
  await fail(`SELECT public.admin_delete_record('questions','q1')`, /linked records exist/);

  // Non-admins are still refused.
  await db.exec(`UPDATE public.current_uid SET id='someone'`);
  await fail(`SELECT public.admin_delete_record('tests','taken')`, /administrator privileges/);
  console.log(
    'PASS test with questions deletes; attempts, live tests, question links and non-admins still blocked'
  );
} finally {
  await db.close();
}
