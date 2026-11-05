import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const migration = (name) =>
  fs.readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');
const STUDENT = '00000000-0000-0000-0000-000000000001';
const A_PLAIN = '10000000-0000-0000-0000-000000000001';
const A_LIVE = '10000000-0000-0000-0000-000000000002';
const A_ENDED = '10000000-0000-0000-0000-000000000003';
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE public.current_uid(id uuid);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM public.current_uid $$;
    CREATE SCHEMA private;
    CREATE FUNCTION private.has_role(p_user_id uuid, p_role text) RETURNS boolean
      LANGUAGE sql AS $$ SELECT false $$;
    CREATE TABLE public.subjects(id text PRIMARY KEY, name text);
    CREATE TABLE public.chapters(id text PRIMARY KEY, name text);
    CREATE TABLE public.tests(id text PRIMARY KEY, negative_marking numeric, duration_minutes int);
    CREATE TABLE public.questions(id text PRIMARY KEY, question_text text, question_bengali_text text,
      image_url text, subject_id text, chapter_id text, option_a text, option_b text, option_c text,
      option_d text, correct_option text, explanation text, explanation_bengali text,
      default_marks numeric);
    CREATE TABLE public.test_questions(test_id text, question_id text, question_order int, marks numeric);
    CREATE TABLE public.test_attempts(id uuid PRIMARY KEY, user_id uuid, test_id text, status text);
    CREATE TABLE public.attempt_answers(attempt_id uuid, question_id text, selected_option text,
      is_correct boolean, marks_awarded numeric);
    CREATE TABLE public.bookmarks(user_id uuid, question_id text);
    -- Real live_tests columns: no is_active, no window_end.
    CREATE TABLE public.live_tests(id text PRIMARY KEY, test_id text, start_at timestamptz,
      duration_minutes int, status text, is_published boolean);
    -- Same window rule as 20261023080121_content_integrity_guards.sql.
    CREATE FUNCTION public.is_live_test_active(lt public.live_tests, p_running_only boolean)
    RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT coalesce(lt.is_published, true)
        AND coalesce(lt.status, 'upcoming') NOT IN ('cancelled', 'draft', 'ended', 'completed')
        AND (NOT p_running_only OR now() >= lt.start_at)
        AND now() <= lt.start_at + greatest(1, coalesce(
              (SELECT nullif(t.duration_minutes, 0) FROM public.tests t WHERE t.id = lt.test_id),
              nullif(lt.duration_minutes, 0), 90)) * interval '1 minute';
    $$;

    INSERT INTO public.current_uid VALUES ('${STUDENT}');
    INSERT INTO public.subjects VALUES ('gk', 'General Knowledge');
    INSERT INTO public.tests VALUES ('plain', 0.33, 60), ('live', 0.25, 60), ('ended', 0.25, 60);
    INSERT INTO public.questions VALUES
      ('q1', 'Q1', 'প্রশ্ন ১', NULL, 'gk', NULL, 'a', 'b', 'c', 'd', 'A', 'Full explanation', 'Notes', 1),
      ('q2', 'Q2', NULL, 'https://x/img.png', 'gk', NULL, 'a', 'b', 'c', 'd', 'B', NULL, NULL, 1);
    INSERT INTO public.test_questions VALUES
      ('plain', 'q1', 1, 2), ('plain', 'q2', 2, NULL),
      ('live', 'q1', 1, 1), ('ended', 'q1', 1, 1);
    INSERT INTO public.test_attempts VALUES
      ('${A_PLAIN}', '${STUDENT}', 'plain', 'completed'),
      ('${A_LIVE}', '${STUDENT}', 'live', 'completed'),
      ('${A_ENDED}', '${STUDENT}', 'ended', 'completed');
    INSERT INTO public.attempt_answers VALUES ('${A_PLAIN}', 'q1', 'A', true, 2);
    INSERT INTO public.live_tests VALUES
      ('l1', 'live', now() - interval '10 minutes', 60, 'upcoming', true),
      ('l2', 'ended', now() - interval '2 days', 60, 'upcoming', true);
  `);
  await db.exec(migration('20261105110000_attempt_solutions_private_has_role.sql'));

  const solutions = async (id) =>
    (await db.query(`SELECT public.get_attempt_solutions('${id}') AS r`)).rows[0].r;

  // A normal test loads, with answers, explanations, images and real marks.
  const plain = await solutions(A_PLAIN);
  assert.equal(plain.length, 2);
  assert.equal(plain[0].correctOption, 'A');
  assert.equal(plain[0].selectedOption, 'A');
  assert.equal(plain[0].explanation, 'Full explanation');
  assert.equal(plain[0].explanationBengali, 'Notes');
  assert.equal(Number(plain[0].marks), 2);
  assert.equal(Number(plain[1].marks), 1); // falls back to the question's default
  assert.equal(Number(plain[0].negativeMarks), 0.33);
  assert.equal(plain[1].imageUrl, 'https://x/img.png');
  assert.equal(plain[0].subjectName, 'General Knowledge');

  // A Live Test whose window is still open stays hidden.
  await assert.rejects(db.query(`SELECT public.get_attempt_solutions('${A_LIVE}')`), (err) =>
    /revealed only after the contest window/.test(String(err.message))
  );

  // Once the window has passed (status still "upcoming"), answers load.
  assert.equal((await solutions(A_ENDED)).length, 1);

  // Someone else's attempt is refused.
  await db.exec(`UPDATE public.current_uid SET id = '00000000-0000-0000-0000-000000000009'`);
  await assert.rejects(db.query(`SELECT public.get_attempt_solutions('${A_PLAIN}')`), (err) =>
    /do not own this attempt/.test(String(err.message))
  );
  console.log('PASS solutions load; open Live Test hidden; ended Live Test shown; others refused');
} finally {
  await db.close();
}
