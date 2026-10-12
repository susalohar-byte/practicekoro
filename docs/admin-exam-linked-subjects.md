# Admin Exams — linked subjects architecture and fixes

## Existing model, preserved

`subjects.exam_id` references one exam. A NULL `exam_id` means a shared/global subject that the existing student catalog makes available in every exam. `chapters.subject_id` links topics to their subject; tests retain their existing subject/chapter/exam references.

No new table, many-to-many junction, migration, storage bucket or permission policy is introduced. Global subjects are **not** unlinked subjects. Clearing ownership would make a subject shared across all exams, not remove it from one exam. Existing subjects and their topic/test ownership are not moved by the scoped editor.

## Root causes

- Admin Exams was using the student `getSubjects` API: it excluded drafts and converted read failures to empty arrays.
- Counts matched only direct `examId` ownership, ignoring the global-subject availability used by students.
- The Subjects tab used `subjectsCount || 10`, so a real zero became a fictional ten.
- The drawer sliced the first subjects instead of filtering by the selected exam, and could show invented fallback subjects.
- Manage Subjects lost the selected exam context.
- Subject creation omitted the selected `examId`, unintentionally creating shared subjects.

## Corrected flow

1. Admin Exams reads complete actual records using existing `getAllAdminSubjects`, including draft subjects and real topic counts.
2. A shared model helper defines effective availability: selected exam owner OR global/shared ownership.
3. Table, overview, Subjects tab and linked-list totals use the same effective relationship. Real zero remains zero; read failure is **Unavailable**, with Retry, not a fake empty result.
4. The drawer labels **Exam-specific / Shared**, **Published / Draft**, and actual topic counts. Search/status filters change the visible list without changing the linked total.
5. Manage Subjects uses `/admin/subjects?examId=...`. Individual subject links additionally carry the real `subjectId`.
6. Subject management verifies the exam against real admin exam records before allowing scoped creation. Unknown/inaccessible exam scope fails closed.
7. New subjects send the selected `examId` through existing `createSubject`, which persists `subjects.exam_id`. The UI checks that the returned record confirms the requested association.
8. Editing preserves existing ownership, especially global subjects, with an explicit all-exams warning. Copying creates a new draft record in the current context without moving/copying existing topics/tests.
9. Scoped imports fill the selected exam ownership, reject foreign-exam rows and reject slug collisions after scope normalization. Existing partial-failure reporting is retained.
10. Subject order operates on visible scope records; shared-subject order remains global and is explained in the UI.
11. Back to Exams restores the selected exam's Subjects tab. Existing successful mutation events and window focus refresh authoritative exam relationship data. Late responses cannot overwrite a newer exam load.

## Permissions and safety

All reads/writes reuse the normal caller-session API and existing Supabase RLS/mutation confirmation. No service-role credential or permission bypass. No production records were created, reassigned or deleted while implementing/testing this change.

This fix does not pretend that the current schema supports linking one subject to an arbitrary subset of exams or removing a shared subject from only one exam. That would require a separately designed relation model and coordinated backend/student-catalog changes.

## Validation

- TypeScript project check: passed.
- Full app suite: **866 tests across 116 files passed**.
- Production build: passed.
- ESLint: zero errors; existing warnings remain in unrelated admin/rank modules.
- Desktop/mobile linked-list, shared/draft labels, actual zero, read-error recovery, scoped creation and dark mode were rendered and visually inspected with local fixture records.
- Feature tests cover exam isolation, coherent counts, mutation refresh, scope verification, real returned association, preserving shared ownership, safe imports and deep-linked subject management.
- Student homepage and existing sidebars are unchanged.

## Release and manual verification

Source-only GitHub update: no hosting deployment was performed, and no database migration is required. Build/deploy through the existing release process to make it live.

After release: Exams → select a real exam → Subjects → Manage Subjects → Create Subject. Verify that the displayed scope is the selected exam, save, then use Back to Exams. The new subject should appear in that exam's linked list and count. Shared subjects should be clearly marked, while subjects owned by a different exam must not appear. Use a draft subject for a safe initial manual check, then publish intentionally.

## Direct creation in the Exams drawer

The Subjects tab now offers **Add Subject**, and each real linked-subject card offers **Add Topic** and **Manage Topics**. Creation happens in a context-locked modal without leaving Exams:

- Add Subject verifies the selected exam, checks existing exam-scoped slugs and uses `createSubject` with that exact `examId`.
- Add Topic re-reads the parent subject, verifies that it belongs to the exam or is shared, checks sibling topic slugs and calls `createChapter` with the locked `subjectId`.
- Shared-subject topics require explicit acknowledgement. They belong to the shared subject, not exclusively to the selected exam. Optional existing exam-topic filters are not modified. For exclusive content, create an exam-specific subject first.
- Both forms support name, separate URL slug (including Bengali names), description, display order and intentional publication. New records default to Draft. Publishing a topic does not publish its parent.
- Failed verification prevents writes; API errors keep the form open; synchronous duplicate submissions are locked. Confirmed response IDs and parent associations are required before success. The linked list and counts reload from the normal API, clearing list filters so the new record can be found.
- Manage Topics retains the exact parent subject filter and exam return context. Create Topic there prefills a valid currently selected parent rather than silently choosing the first subject. Resetting list filters retains the Back to Exams context. This remains the existing general-purpose topic manager, not a separate scoped CMS.
- Modal keyboard focus is contained, Escape closes only when not saving, background scrolling is blocked and opener focus is restored on close.

No data migration is required. No live records are created by local tests or fixture-based preview validation.

After deployment: **Exams → select exam → Subjects → Add Subject → save**. Then on that subject card: **Add Topic → save**. Use Manage Topics for the existing detailed topic-management screen.

Direct-creation validation: 11 dedicated regression tests plus the existing exam-linked tests passed. Desktop/mobile, dark mode, shared confirmation and write-error states were rendered and inspected with fixture data. Mobile dialog scrolling keeps both save and cancel reachable. A browser fixture flow created a subject, added its topic and verified the refreshed topic count. ESLint reported no errors (10 existing warnings elsewhere); production build passed.
