import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { getErrorMessage } from '@/lib/errors';
import { notifyExamsUpdated } from '@/lib/dataSync';
import { validateSubjectInput } from '@/utils/adminSubjectModel';
import { subjectAvailableForExam } from '@/utils/examSubjectLinks';
import type { Exam, Subject, Chapter } from '@/types';
export type CurriculumTarget =
  { kind: 'subject'; exam: Exam } | { kind: 'topic'; exam: Exam; subject: Subject };
/** Context-locked creation using the existing subjects/chapters API, not a second CMS. */
export function ExamCurriculumDialog({
  target,
  onClose,
  onSaved,
}: {
  target: CurriculumTarget;
  onClose: () => void;
  onSaved: (record: Subject | Chapter) => void;
}) {
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const [name, setName] = useState(''),
    [slug, setSlug] = useState(''),
    [slugTouched, setSlugTouched] = useState(false),
    [description, setDescription] = useState(''),
    [order, setOrder] = useState(1),
    [published, setPublished] = useState(false),
    [sharedConfirmed, setSharedConfirmed] = useState(false);
  const [verifiedSubject, setVerifiedSubject] = useState<Subject | null>(null);
  const records = useRef<{ slug: string; orderIndex: number }[]>([]),
    lock = useRef(false),
    dialog = useRef<HTMLDivElement>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    void (async () => {
      const exams = await api.getAllAdminExams();
      if (!exams.some((exam) => exam.id === target.exam.id))
        throw new Error('The selected exam no longer exists or is not accessible.');
      let rows: { slug: string; orderIndex: number }[];
      if (target.kind === 'subject')
        rows = (await api.getAllAdminSubjects()).filter(
          (subject) => subject.examId === target.exam.id
        );
      else {
        const subject = await api.getSubjectById(target.subject.id);
        if (!subject || !subjectAvailableForExam(subject, target.exam.id))
          throw new Error('The selected subject is not available for this exam.');
        if (!cancelled) setVerifiedSubject(subject);
        rows = await api.getAllAdminChapters(subject.id);
      }
      if (!cancelled) {
        records.current = rows;
        setOrder(rows.reduce((max, row) => Math.max(max, row.orderIndex), 0) + 1);
      }
    })()
      .catch((err) => {
        if (!cancelled)
          setLoadError(getErrorMessage(err, 'The creation context could not be verified.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [target, loadRevision]);
  useEffect(() => {
    const previous = document.body.style.overflow,
      opener = document.activeElement;
    document.body.style.overflow = 'hidden';
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !lock.current) {
        event.preventDefault();
        close.current();
      }
      if (event.key === 'Tab') {
        const controls = dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href]'
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keys);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', keys);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  const shared = target.kind === 'topic' && verifiedSubject && !verifiedSubject.examId;
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current || loading || loadError) return;
    try {
      setError('');
      validateSubjectInput({ name: name.trim(), slug: slug.trim(), orderIndex: order });
      if (records.current.some((row) => row.slug.toLowerCase() === slug.trim().toLowerCase()))
        throw new Error('This URL slug already exists in this exam/subject scope.');
      if (shared && !sharedConfirmed)
        throw new Error('Confirm that this topic is being added to a shared subject.');
      lock.current = true;
      setSaving(true);
      const saved =
        target.kind === 'subject'
          ? await api.createSubject({
              examId: target.exam.id,
              name: name.trim(),
              slug: slug.trim(),
              description: description.trim(),
              iconName: 'BookOpen',
              orderIndex: order,
              isActive: published,
            })
          : await api.createChapter({
              subjectId: target.subject.id,
              name: name.trim(),
              slug: slug.trim(),
              description: description.trim(),
              iconName: 'Layers',
              orderIndex: order,
              isActive: published,
            });
      if (
        !saved?.id ||
        (target.kind === 'subject'
          ? (saved as Subject).examId !== target.exam.id
          : (saved as Chapter).subjectId !== target.subject.id)
      )
        throw new Error(
          'The backend did not confirm the requested parent association. Refresh before retrying.'
        );
      notifyExamsUpdated();
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err, 'The record could not be saved.'));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  const title = target.kind === 'subject' ? 'Add Subject' : 'Add Topic';
  const inputClass =
    'w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="curriculum-dialog-title"
        className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="curriculum-dialog-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close curriculum editor"
            disabled={saving}
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-xl border border-slate-200 dark:border-slate-700 grid place-items-center"
          >
            <X size={20} />
          </button>
        </div>
        <div className="my-4 rounded-xl border border-blue-200 bg-blue-50 p-3 leading-relaxed dark:border-blue-800 dark:bg-blue-950/30">
          <p>
            <strong>Exam:</strong> {target.exam.title}
          </p>
          {target.kind === 'topic' && (
            <p>
              <strong>Parent subject:</strong> {verifiedSubject?.name || target.subject.name}
            </p>
          )}
          <p>
            {target.kind === 'subject'
              ? 'This subject will belong to this exam only.'
              : 'The parent subject is locked; existing topics and tests will not be moved.'}
          </p>
        </div>
        {loading ? (
          <p role="status">Verifying exam and parent records…</p>
        ) : loadError ? (
          <div role="alert" className="text-red-700 dark:text-red-300">
            {loadError}
            <Button
              type="button"
              onClick={() => setLoadRevision((n) => n + 1)}
              className="mt-3 min-h-11"
            >
              Retry verification
            </Button>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-red-800 dark:bg-red-950/30 dark:text-red-200"
              >
                {error}
              </p>
            )}
            <fieldset disabled={saving} className="space-y-4">
              <label className="block font-semibold">
                {target.kind === 'subject' ? 'Subject name' : 'Topic name'}
                <input
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched)
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      );
                  }}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="block font-semibold">
                URL slug
                <input
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <p className="text-slate-600 dark:text-slate-300">
                Use a separate lowercase URL slug for Bengali names.
              </p>
              <label className="block font-semibold">
                Description
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="block font-semibold">
                Display order
                <input
                  type="number"
                  min="0"
                  max="2147483647"
                  required
                  value={order}
                  onChange={(e) => setOrder(e.target.value === '' ? NaN : Number(e.target.value))}
                  className={`${inputClass} mt-1`}
                />
              </label>
              {shared && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200">
                  <p>
                    This is a shared subject. Its topics can appear in all exams, subject to
                    existing topic filters. For exclusive content, first add an exam-specific
                    subject.
                  </p>
                  <label className="mt-2 flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={sharedConfirmed}
                      onChange={(e) => setSharedConfirmed(e.target.checked)}
                    />
                    I understand this topic belongs to a shared subject.
                  </label>
                </div>
              )}
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Publish on platform (otherwise save as Draft)
              </label>
              {target.kind === 'topic' && (
                <p className="text-slate-600 dark:text-slate-300">
                  Existing optional exam-topic filters are not changed. Publishing a topic does not
                  publish its parent subject.
                </p>
              )}
            </fieldset>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onClose}
                className="min-h-11"
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={saving} disabled={saving} className="min-h-11">
                {title}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
