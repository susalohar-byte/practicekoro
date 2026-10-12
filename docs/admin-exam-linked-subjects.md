# Admin Exams — assigned subjects and topics (assign-only model)

## Business rules

- Subjects are created **only** on the Subjects page (`/admin/subjects`). Topics are created **only** on the Topics page (`/admin/topics`); they are stored in the `chapters` table with a `subject_id` parent.
- The Exam page never creates, edits or deletes subjects or topics. It only **assigns** existing ones to an exam.
- A topic can be assigned only when its parent subject is assigned. Removing a subject from an exam also removes its topics from that exam (after confirmation). Subject and topic records are never deleted by this flow.
- All assignments are persisted; counts shown in Admin Exams come from real records. A failed read shows **Unavailable**, never a placeholder number.

## Data model

| Relation             | Storage                                                                           | API                                                    |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Exam → Subjects      | `exam_subjects (exam_id, subject_id, order_index)`                                | `api.getExamCurriculum(examId)`                        |
| Exam → Topics        | `exam_topics (exam_id, topic_id, order_index)`                                    | `api.getExamCurriculum(examId)`                        |
| Save both atomically | RPC `admin_save_exam_curriculum` (replaces both lists, validates the parent rule) | `api.saveExamCurriculum(examId, subjectIds, topicIds)` |

`subjects.exam_id` (legacy ownership) is unchanged and is no longer used by Admin Exams to decide which subjects belong to an exam.

## Exam Create / Edit modal

The modal contains an **Assigned Subjects & Topics** section (`src/components/admin/ExamCurriculumPicker.tsx`):

- Subjects: searchable checkbox list, **Select all** / **Clear selection** (apply to the visible, filtered subjects), selected count, an **Assigned** badge for subjects that were assigned when the form opened, and an **Inactive** label for draft subjects.
- Topics: shown only for selected subjects, grouped by subject. Each group can be collapsed, has its own select all / clear and an "x of y selected" count. Topic search filters every group. Subjects without topics show "No topics yet — create them on the Topics page" with a link.
- **Add Subject** and **Manage Topics** are links to `/admin/subjects` and `/admin/topics`. They open in a new tab so unsaved form changes are not lost; **Refresh lists** reloads subjects and topics while keeping the current selection.
- Deselecting a subject that has selected topics asks for confirmation inline ("Removing X also unassigns its N selected topics. Subjects and topics are not deleted.") and then prunes those topics.

Save flow (`handleSaveExam` in `src/pages/admin/AdminExams.tsx`):

1. Create or update the exam with the existing calls.
2. If the assignments changed, call `api.saveExamCurriculum(examId, subjectIds, topicIds)`.
3. If step 2 fails after the exam was saved, the modal stays open, switches to edit mode for the saved exam id (so a retry updates instead of creating a duplicate) and shows the error. Save is disabled while saving.
4. When editing, if the existing assignments could not be read, the picker shows an error and assignments are **not** written, so a read failure can never wipe saved assignments.

## Exam drawer

- **Subjects** tab (`src/components/admin/ExamLinkedSubjects.tsx`) lists the exam's assigned subjects with their assigned topics and counts ("x of y topics assigned"), a search box, links to Manage Subjects / Manage Topics, and **Edit assignments**, which opens the exam edit modal. The empty state is "No subjects assigned yet" with Edit assignments. There are no creation controls.
- **Test Series** tab reads real series with `api.getTestSeries(examId)` and shows status, test totals and Full Mock / PYQ / Topic counts, with loading, empty and error (retry) states and a **Manage Test Series** link to `/admin/test-series`. The previous hardcoded series list and the `|| 5` fallback were removed.
- The exams table "Subjects" column and the drawer counts use the number of assigned subjects per exam.

## Tests

- `src/components/admin/ExamCurriculumPicker.test.tsx` — selection, search, select all / clear, topics only for selected subjects, confirm-then-prune, navigation-only Add Subject link, loading/error.
- `src/components/admin/ExamLinkedSubjects.test.tsx` — assigned view, empty state, unavailable state, no creation controls.
- `src/pages/admin/AdminExams.subjectLinks.test.tsx` — drawer counts, preselection on edit, save calls `saveExamCurriculum` with the selected ids, retry after a partial failure without re-creating the exam, no write when saved assignments could not be read, real Test Series tab.
