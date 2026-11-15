import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const migration = (name) =>
  fs.readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');
const STUDENT = '00000000-0000-0000-0000-000000000001';
const ADMIN = '00000000-0000-0000-0000-000000000002';
const as = (uid) => db.exec(`UPDATE public.current_uid SET id = '${uid}'`);
const questions = async (id) =>
  (await db.query(`SELECT public.get_student_exam_questions('${id}') AS r`)).rows[0].r;
try {
  // Helpers exist only in "private", as in production since 20261029140000.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE SCHEMA private;
    CREATE TABLE public.current_uid(id uuid);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM public.current_uid $$;
    CREATE FUNCTION private.has_role(p_user_id uuid, p_role text) RETURNS boolean
      LANGUAGE sql AS $$ SELECT p_user_id = '${ADMIN}' $$;
    CREATE FUNCTION private.has_test_access(p_user_id uuid, p_test_id text) RETURNS boolean
      LANGUAGE sql AS $$ SELECT p_test_id <> 'premium' $$;
    CREATE FUNCTION public.live_paper_access_error(p_user_id uuid, p_test_id text) RETURNS text
      LANGUAGE sql AS $$ SELECT NULL::text $$;
    CREATE TABLE public.tests(id text PRIMARY KEY, status text, is_active boolean);
    CREATE TABLE public.questions(id text PRIMARY KEY, question_text text, question_bengali_text text,
      option_a text, option_b text, option_c text, option_d text,
      option_a_image_url text, option_b_image_url text, option_c_image_url text, option_d_image_url text,
      difficulty text, default_marks numeric, default_negative_marks numeric, image_url text, is_active boolean);
    CREATE TABLE public.test_questions(test_id text, question_id text, question_order int,
      marks numeric, negative_marks numeric);
    INSERT INTO public.current_uid VALUES ('${STUDENT}');
    INSERT INTO public.tests VALUES ('pub', 'published', true), ('draft', 'draft', true),
      ('archived', 'archived', false), ('premium', 'published', true);
    INSERT INTO public.questions VALUES
      ('q1', 'Q1', NULL, 'a', 'b', 'c', 'd', 'https://x/a.png', NULL, NULL, NULL, 'easy', 2, 0.5, NULL, true);
    INSERT INTO public.test_questions VALUES ('pub', 'q1', 1, NULL, NULL), ('draft', 'q1', 1, NULL, NULL),
      ('archived', 'q1', 1, NULL, NULL), ('premium', 'q1', 1, NULL, NULL);
  `);
  await db.exec(migration('20261115090000_restore_exam_questions_guards.sql'));

  // A student loads a published test, option images included.
  const q = await questions('pub');
  assert.equal(q.length, 1);
  assert.equal(q[0].optionAImageUrl, 'https://x/a.png');
  assert.equal(Number(q[0].marks), 2);

  // Draft / archived papers stay hidden; paid tests still need access.
  await assert.rejects(questions('draft'), /Test not found or unavailable/);
  await assert.rejects(questions('archived'), /Test not found or unavailable/);
  await assert.rejects(questions('premium'), /Pro Pass required/);

  // An admin can preview a draft.
  await as(ADMIN);
  assert.equal((await questions('draft')).length, 1);
  console.log('PASS published test loads; draft/archived hidden; access checked; admin preview');
} finally {
  await db.close();
}
