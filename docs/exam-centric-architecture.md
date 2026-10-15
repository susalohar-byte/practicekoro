# Exam-Centric Architecture — Audit, Plan and Phase 1 Completion (Admin Panel)

Scope: **Admin Panel only**. No Student Panel, mobile app or public website code was changed.
This repo no longer ships the student web panel. The mobile app and other clients still read the
same Supabase objects, so the database stays backward compatible.

> **Schema source.** The Supabase CLI is linked, but this account gets `403` on the database
> endpoints. The audit below is therefore based on `supabase/migrations/*.sql` and the
> application code, not a live dump. Run the verification queries in §7 against production
> before applying the migration.

---

## 1. Audit — current architecture

| Concept                | Storage                                                                             | Notes                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exam Category          | `exam_categories (id, name, order_index)`                                           | Exams link **by name** (`exams.category` text). Drag-and-drop ordering is on the Exams page.                                                                                         |
| Exam                   | `exams` (text PK = slug)                                                            | Logo URL is stored in `icon_name`. Published/Draft = `is_active`.                                                                                                                    |
| Subject                | `subjects`                                                                          | `exam_id` is optional since migration 011 (legacy single-exam link).                                                                                                                 |
| Topic                  | `chapters` (`subject_id`, optional `parent_id`)                                     | The UI calls these "Topics". `questions.topic_id` / `chapter_id` are kept in sync by a trigger.                                                                                      |
| Exam → Topic mapping   | `exam_topics` + RPC `admin_save_exam_topics`                                        | **No admin UI used it.** The only UI was `AdminExamTopics.tsx`, which is orphaned (`/admin/exam-topics` redirects). Migration 014 seeded every chapter onto `wbp-constable`.         |
| Exam → Subject mapping | —                                                                                   | Did not exist (only the legacy `subjects.exam_id`).                                                                                                                                  |
| Actual tests           | **one table**: `tests`                                                              | `test_type` ∈ `full_mock`, `topic`, `pyq` (+ legacy `chapter_mock`, `subject_mock`). `exam_id` nullable (017). PYQ metadata: `year`, `paper_name`, `set_name`, `shift`, `exam_date`. |
| Extra exam links       | `test_exams` + RPC `admin_save_test_exams`                                          | Lets one Topic Test appear under several exams without copies.                                                                                                                       |
| Question links         | `test_questions (test_id, question_id, order, marks)`                               | Saved through RPC `save_test_questions` (atomic replace, live-test lock). Question content is never copied.                                                                          |
| Test Series            | `test_series` + `tests.test_series_id`                                              | A grouping layer only.                                                                                                                                                               |
| Live Tests             | `live_tests.test_id → tests.id`                                                     | Plus a snapshot of duration/marks. The UI filtered the picker to `full_mock`; the DB did not enforce it.                                                                             |
| Paid access            | `tests.is_premium` + active `subscriptions` (`can_access_test`, `user_test_access`) | **Per test.** Plans are all-access passes.                                                                                                                                           |

### Answers to the audit questions

1. **Exams / series / tests.** `exams` are exams, `test_series` are bundles, and `tests` are the actual tests.
2. **Duplication.** No. Test Series never creates or copies `tests` rows. It only sets `tests.test_series_id` (via `admin_assign_series_tests`), so the same test rows were reachable from both screens.
3. **Full Mock / Topic / PYQ.** All live in `tests`, separated by `test_type`. Mock Test Management already had a three-way type selector.
4. **Questions → tests.** Through the `test_questions` junction, referencing `questions.id`.
5. **Exam / Subject / Topic.** Subject → Topic is `chapters.subject_id`. Exam → Topic is `exam_topics` (with no admin UI). Exam → Subject existed only as the legacy `subjects.exam_id`.
6. **Live Tests → Full Mock.** `live_tests.test_id`. Restricted in the UI only (now enforced, see §4).
7. **Series ↔ commerce.** **No.** Nothing in subscriptions, payments, coupons or plans references series IDs. `test_series.is_premium` is not read by any access function. Only plan feature text mentions "test series".
8. **Code depending on Test Series:**
   - `AdminTestSeries.tsx`, `PopularTestSeriesEditModal.tsx` and `admin.testSeries.ts`.
   - `AdminExams` used it for a KPI, a per-exam count and a drawer tab of **hard-coded fake series**.
   - Dashboard counts in `adminCommerce.ts`.
   - Student services in `catalog.ts`: `getStudentTestSeries`, `getSeriesTestsForStudent` and `get_test_series_analytics`.
   - Student-facing RPCs: `get_test_series_leaderboard`, result-page rankings (`testSeries` block) and `get_test_series_analytics`.
   - The home-screen "Popular Test Series" carousel (`app_settings.popular_test_series_config`).
   - `UploadSeriesIconModal.tsx` is dead code.
9. **Necessary vs avoidable.**
   - **Necessary:**
     - an Exam → Subject mapping;
     - a mapping UI on the Exams page;
     - real related-tests views;
     - an optional exam link for Topic Tests;
     - a PYQ Set field;
     - server-side type rules;
     - the Live Test guard.
   - **Avoidable:**
     - a new tests table;
     - a PYQ table;
     - copying questions;
     - touching subscriptions, payments or coupons;
     - dropping `test_series`.

### Business rules found

- **Topic Tests carry no exam.** The create form forced `exam_id = NULL` for topic tests.
- **10-question batches:** "1–10, 11–20…" quick-select batches in Manage Questions (`AdminTestQuestions.tsx`, `step = 10`). There was **no** multi-test generator.
- **Duplicate live events are blocked.** A test can't have two upcoming or live Live Test events, and its questions are locked while a published Live Test is upcoming or live.
- **Content writers can't delete tests.** They can create and update tests but not delete them (`can_mutate_admin_record`).

## 2. Target architecture and dependency map

```
Exam Category ──(name)── Exam ──┬── exam_subjects ──► Subject ──► Topic (chapters) ──► Topic Tests
                                ├── exam_topics ─────────────────► Topic
                                ├── tests.exam_id ──► Full Mock / Official PYQ
                                └── test_exams ─────► any test (optional extra links)
tests ──► test_questions ──► questions (Question Bank)
live_tests.test_id ──► tests (Full Mock only)
Paid access: tests.is_premium + subscriptions   (independent of test_series)
test_series: legacy grouping, still read by student leaderboards and the carousel
```

## 3. Database changes (`20261016090000_exam_centric_test_architecture.sql`, additive)

| Change                                                                                                                                                                                                                       | Why                                                                                                                                        | Effect on existing data                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `exam_subjects` table, with RLS matching `exam_topics`: public read, admin write plus the restrictive `admin_scope_allowed('content')` guards. It also gets the audit trigger and indexes, with UNIQUE(exam_id, subject_id). | Lets a subject be mapped before or without its topics.                                                                                     | Backfilled from `subjects.exam_id` and from the parent subjects of the existing `exam_topics`. |
| RPC `admin_save_exam_subject_topics(exam, subjects[], topics[])`                                                                                                                                                             | Atomic replace. Rejects topics whose subject is not selected, so deselecting a subject drops its topic mappings. Writes mapping rows only. | None until used.                                                                               |
| `tests_type_required_links` CHECK **NOT VALID**                                                                                                                                                                              | Full Mock / PYQ need `exam_id`; Topic needs `chapter_id`.                                                                                  | Existing rows are not validated. Only new or updated rows must comply.                         |
| Trigger `enforce_live_test_full_mock` (on INSERT, or UPDATE OF `test_id`)                                                                                                                                                    | Live Tests only from Full Mocks.                                                                                                           | Existing live rows are untouched.                                                              |

Nothing is dropped. The migration has **not been applied**: there is no DB access, and applying
it is your call. The admin code works before it is applied. Mapping saves fall back to
`admin_save_exam_topics`, and subjects are then implied by their topics. The UI says so.

### Rollback

```sql
BEGIN;
DROP TRIGGER IF EXISTS enforce_live_test_full_mock ON public.live_tests;
DROP FUNCTION IF EXISTS public.enforce_live_test_full_mock();
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_type_required_links;
DROP FUNCTION IF EXISTS public.admin_save_exam_subject_topics(text, text[], text[]);
DROP TABLE IF EXISTS public.exam_subjects;   -- mapping rows only; exam_topics is untouched
COMMIT;
```

The front-end rollback is a revert of the commit. Old screens keep working against the new schema.

## 4. Admin Panel changes

| Area                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sidebar (`AdminLayout.tsx`)     | Removed the **Test Series** item and its header-search shortcut. Everything else is unchanged.                                                                                                                                                                                                                                                                                                                                             |
| `/admin/test-series`            | Route kept (not deleted). The page shows a "Legacy module" notice. It is still the only editor for existing series rows and the home "Popular Test Series" carousel.                                                                                                                                                                                                                                                                       |
| Exams drawer (`AdminExams.tsx`) | **Subjects & Topics** tab: a new `ExamSubjectTopicMapper` with searchable subjects, topics grouped under each subject, select all/clear, and deselecting a subject clears its topics. It saves mappings only. **Tests** tab: a new `ExamRelatedTests` with Full Mocks, Official PYQs and Topic Practice (Topic Tests through mapped topics), each linking to the central test. These replace the hard-coded fake subject and series lists. |
| Exams list / KPIs               | "Test Series" column → **Full Mocks**. "Total Test Series" KPI → **Official PYQs**. Subjects count now comes from the mappings (legacy `subjects.exam_id` fallback).                                                                                                                                                                                                                                                                       |
| Create Mock Test modal          | **Topic Test:** optional "Show under Exams" links (stored in `test_exams`, no copies), plus **Generate tests from Question Bank (10 questions each)**. **Official PYQ:** separate **Set** field (`set_name`). Auto-titles follow `<Topic> Test 01`.                                                                                                                                                                                        |
| Mock Test list                  | Hard-coded tab counts (248/85/120/43) replaced with real counts.                                                                                                                                                                                                                                                                                                                                                                           |
| `admin.tests.ts`                | Server-mirrored type validation in `createTest`. Exam links are saved through the confirmed `admin_save_test_exams` RPC; the old silent upsert ignored errors. Adds `generateTopicTests`, which uses the topic's questions not yet used by its Topic Tests, oldest first, in batches of `TOPIC_TEST_QUESTION_COUNT = 10`. Leftovers stay unused and the new tests are drafts.                                                              |
| Live Tests                      | The service rejects non-Full-Mock sources on create and on re-pointing. Removed the hard-coded `'test-indus-01'` fallback that could schedule an unrelated test.                                                                                                                                                                                                                                                                           |
| New service                     | `admin.examMappings.ts`: `getExamSubjectTopicMappings`, `saveExamSubjectTopicMappings`, `getExamRelatedTests`, `getExamMappingCounts`.                                                                                                                                                                                                                                                                                                     |

Mock Test Management keeps its name (renaming had no functional benefit). Subjects and Topics
pages are unchanged; nothing outside them creates subjects or topics.

## 5. Preserved

- **IDs and records:** all exam, category, subject, topic, test, question, series, live-test, attempt, result, subscription, payment and coupon rows and IDs.
- **Access and ordering:**
  - per-test Free/Pro access;
  - category drag-and-drop ordering;
  - category, exam and test icons;
  - existing delete guards: `admin_delete_record` blocks deletion of anything still referenced.
- **Student-facing objects** still reference series: the series leaderboard RPC, series analytics and the result-page series rank.

## 6. Validation run

- **Checks that pass:**
  - `tsc -b`
  - `eslint .`
  - `vite build`
- **New tests** (`admin.examCentric.test.ts`) cover:
  - the mapping RPC and its confirmation;
  - the pre-migration fallback;
  - exam required for Full Mock/PYQ but not Topic;
  - 53 questions → 5 tests of 10 with 3 left over, no duplicates, oldest first;
  - fewer than 10 questions refused.
- **Updated tests:**
  - the AdminExams test mocks: `getTestSeries` → `getExamMappingCounts`;
  - two icon tests now pass an `examId` for Full Mocks.
- **Failures not caused by this change** (all in files this change does not touch; they come from uncommitted work-in-progress already in the tree):
  - `admin.crudIntegrity.test.ts` (4): the uncommitted `withApiCache` change in `admin.exams.ts`.
  - `admin.reporting.test.ts` (1) and `AdminPayments.reporting.test.tsx` (1).
  - `AdminTests.iconUpload.test.tsx` "renders icon upload…" (1): it expects the button text `+ Create Mock Test`, which the uncommitted modal redesign removed.
- **Not run:**
  - Live DB checks: no DB access.
  - In-browser click-through: admin routes need an authenticated admin session.

## 7. Remaining risks and next steps

1. **Apply the migration** after checking production with these queries:

   ```sql
   SELECT test_type, count(*) FILTER (WHERE exam_id IS NULL) AS no_exam,
          count(*) FILTER (WHERE chapter_id IS NULL) AS no_topic
   FROM tests GROUP BY 1;                                   -- legacy rows violating the new rules
   SELECT lt.id FROM live_tests lt JOIN tests t ON t.id = lt.test_id
   WHERE t.test_type <> 'full_mock';                        -- non-Full-Mock live tests
   SELECT exam_id, count(*) FROM exam_topics GROUP BY 1;    -- 014 seeded all topics onto wbp-constable
   ```

   Legacy rows that violate the rules keep working. If an admin edits one, it must be given the missing link.

2. **`wbp-constable` mappings.** Migration 014 mapped every topic to `wbp-constable`, so its mapper will show every topic selected. Review it before saving.
3. **Test Series is still live for students.** The leaderboard and result-page series rank read `test_series`, and so does the "Popular Test Series" carousel. Before dropping `test_series`, the mobile app and RPCs need an exam-based replacement. This is a student-side phase and needs explicit approval.
4. **Existing series assignments.** Series membership (`tests.test_series_id`) is preserved but can no longer be edited from the sidebar flow. The legacy page is still reachable by URL.
5. **Remote write errors are swallowed.** `admin.liveTests.scheduleLiveTest` hides remote sync errors (`syncLiveTestsToRemote` … `catch {}`). The new client-side guard and the DB trigger prevent wrong types, but other remote write failures can still be hidden.
