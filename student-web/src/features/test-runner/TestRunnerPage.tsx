import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  Inbox,
  Keyboard,
  LockKeyhole,
  LogOut,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtClock, fmtNum } from '@/lib/format';
import { friendlyError, isProLockedError } from '@/lib/errors';
import {
  clearDraft,
  fetchQuestions,
  loadDraft,
  saveAnswers,
  saveDraft,
  startAttempt,
  submitAttempt,
} from '@/services/attempts';
import { qk } from '@/hooks/queries';
import { useAuth } from '@/auth/AuthProvider';
import { useBack } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DialogHero, Modal } from '@/components/ui/Modal';
import { ErrorState, Loader, Message, RetryButton } from '@/components/ui/Feedback';
import { LogoIcon } from '@/components/ui/Brand';
import { OPTION_LETTERS, type OptionLetter, type Question, type ServerAttempt } from '@/types/models';

type Phase = 'starting' | 'start-error' | 'ready';

function QuestionText({ q }: { q: Question }) {
  // Bengali first with English underneath, as in the app (QuestionText).
  return (
    <div>
      {q.textBengali ? (
        <>
          <p lang="bn" className="whitespace-pre-line text-[17px] font-bold leading-relaxed text-ink">
            {q.textBengali}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-muted">{q.textEnglish}</p>
        </>
      ) : (
        <p className="whitespace-pre-line text-[17px] font-bold leading-relaxed text-ink">{q.textEnglish}</p>
      )}
      {q.imageUrl && <img src={q.imageUrl} alt="Question figure" className="mt-4 max-h-80 max-w-full rounded-card border border-line object-contain" />}
    </div>
  );
}

export default function TestRunnerPage() {
  const { testId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const leave = useBack(`/test/${encodeURIComponent(testId)}/details`);
  const title = params.get('title') || 'Practice';

  const [phase, setPhase] = useState<Phase>('starting');
  const [startError, setStartError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState<ServerAttempt | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionLetter>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const submittedRef = useRef(false);
  const startedRef = useRef(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  // 1. Start (or resume) the server attempt. The server owns the clock.
  const begin = useCallback(async () => {
    setPhase('starting');
    setStartError(null);
    try {
      const a = await startAttempt(testId);
      const draft = loadDraft(a.id);
      if (draft) {
        setAnswers(draft.answers ?? {});
        setMarked(new Set(draft.marked ?? []));
        setIndex(draft.index ?? 0);
      }
      setAttempt(a);
      setPhase('ready');
    } catch (e) {
      setStartError(e);
      setPhase('start-error');
    }
  }, [testId]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void begin();
  }, [begin]);

  const questions = useQuery({
    queryKey: ['runner-questions', testId, attempt?.id],
    queryFn: () => fetchQuestions(testId),
    enabled: phase === 'ready' && !!attempt,
    staleTime: Infinity,
    gcTime: 0,
  });
  const qs = useMemo(() => questions.data ?? [], [questions.data]);
  const q = qs[Math.min(index, Math.max(0, qs.length - 1))];

  // 2. Timer, recomputed from the server start time each tick (no drift; resumes keep time).
  useEffect(() => {
    if (!attempt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [attempt]);
  const totalSeconds = (attempt?.durationMinutes ?? 0) * 60;
  const spentSeconds = attempt ? Math.max(0, (now - attempt.startedAt.getTime()) / 1000) : 0;
  const secondsLeft = Math.max(0, totalSeconds - spentSeconds);

  // Keep the local draft in step so a refresh restores the screen.
  useEffect(() => {
    if (attempt && !submittedRef.current) saveDraft(attempt.id, { answers, marked: [...marked], index });
  }, [attempt, answers, marked, index]);

  // Warn before closing the tab mid-test.
  useEffect(() => {
    if (phase !== 'ready') return;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [phase]);

  const pick = (questionId: string, option: OptionLetter | null) => {
    if (!attempt) return;
    const next = { ...answers };
    if (option) next[questionId] = option;
    else delete next[questionId];
    setAnswers(next);
    // Autosave on every pick or clear (save_test_answers); submit resends everything.
    void saveAnswers(attempt.id, next, spentSeconds);
  };

  const toggleMark = (questionId: string) =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });

  const submit = useCallback(
    async (auto: boolean) => {
      if (!attempt || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setSubmitError(null);
      try {
        await submitAttempt(attempt.id, answers, Math.min(spentSeconds, totalSeconds || spentSeconds));
        clearDraft(attempt.id);
        if (user) {
          void queryClient.invalidateQueries({ queryKey: qk.history(user.id) });
          void queryClient.invalidateQueries({ queryKey: qk.inProgress(user.id) });
        }
        if (auto) {
          setConfirmOpen(false);
          setTimeUp(true);
        } else {
          navigate(`/result/${attempt.id}`, { replace: true });
        }
      } catch (e) {
        submittedRef.current = false;
        setSubmitError(friendlyError(e, 'Your test could not be submitted. Please retry.'));
      } finally {
        setSubmitting(false);
      }
    },
    [attempt, answers, spentSeconds, totalSeconds, user, queryClient, navigate]
  );

  // 3. Auto-submit when the clock runs out.
  useEffect(() => {
    if (phase === 'ready' && attempt && totalSeconds > 0 && secondsLeft <= 0 && qs.length > 0 && !submittedRef.current && !submitError) {
      void submit(true);
    }
  }, [phase, attempt, totalSeconds, secondsLeft, qs.length, submit, submitError]);

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(qs.length - 1, i))), [qs.length]);

  // Keep the current palette item visible.
  useEffect(() => {
    paletteRef.current?.querySelector<HTMLElement>(`[data-q="${index}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  // Keyboard: A–D / 1–4 pick, ←/→ move, M marks, C clears.
  useEffect(() => {
    if (phase !== 'ready' || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if (confirmOpen || leaveOpen || helpOpen || timeUp) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const n = ['1', '2', '3', '4'].indexOf(k);
      const l = ['a', 'b', 'c', 'd'].indexOf(k);
      if (n >= 0 || (l >= 0 && !(k === 'c' && e.shiftKey))) {
        const letter = OPTION_LETTERS[n >= 0 ? n : l];
        if (q.options[letter]) pick(q.id, letter);
      } else if (k === 'arrowright') go(index + 1);
      else if (k === 'arrowleft') go(index - 1);
      else if (k === 'm') toggleMark(q.id);
      else if (k === 'backspace' || k === 'delete') pick(q.id, null);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // pick/toggleMark are stable enough for this listener; it re-binds on question change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, q, index, go, confirmOpen, leaveOpen, helpOpen, timeUp]);

  // ----- Starting / errors --------------------------------------------------------------
  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen bg-page">
      <header className="flex h-14 items-center gap-3 border-b border-line bg-white px-4">
        <button type="button" onClick={leave} aria-label="Back" className="rounded-full p-2 hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="truncate text-[14px] font-semibold">{title}</p>
      </header>
      <main className="mx-auto max-w-xl px-4">{body}</main>
    </div>
  );

  if (phase === 'starting') return shell(<Loader label="Starting your test…" />);
  if (phase === 'start-error') {
    const pro = isProLockedError(startError);
    return shell(
      <Message
        icon={pro ? <Crown /> : <LockKeyhole />}
        title="Could not start this test"
        message={friendlyError(startError)}
        action={
          <div className="flex flex-col items-center gap-2.5">
            {pro && (
              <Button onClick={() => navigate('/plans')} icon={<Crown className="h-4 w-4" />}>
                View Plans
              </Button>
            )}
            <RetryButton onClick={() => void begin()} />
          </div>
        }
      />
    );
  }
  if (questions.isLoading) return shell(<Loader label="Loading questions…" />);
  if (questions.isError) return shell(<ErrorState message="Could not load the questions." error={questions.error} onRetry={() => void questions.refetch()} />);
  if (!q) return shell(<Message icon={<Inbox />} title="No questions in this test yet" />);

  // ----- Running ----------------------------------------------------------------------
  const answeredCount = qs.filter((x) => answers[x.id]).length;
  const notAnswered = qs.length - answeredCount;
  const timerTone = secondsLeft < 60 ? 'text-danger bg-danger/10' : secondsLeft < 300 ? 'text-gold bg-gold/10' : 'text-primary bg-primary/10';
  const isLast = index === qs.length - 1;
  const selected = answers[q.id];
  const isMarked = marked.has(q.id);

  const paletteItem = (x: Question, i: number) => {
    const ans = !!answers[x.id];
    const mk = marked.has(x.id);
    const cur = i === index;
    return (
      <button
        key={x.id}
        type="button"
        data-q={i}
        onClick={() => go(i)}
        aria-label={`Question ${i + 1}, ${ans ? 'answered' : 'not answered'}${mk ? ', marked for review' : ''}${cur ? ', current' : ''}`}
        aria-current={cur ? 'step' : undefined}
        className={cn(
          'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13.5px] transition',
          mk ? 'bg-purple text-white' : ans ? 'bg-success-bright text-white' : 'bg-white',
          !mk && !ans && (cur ? 'text-primary' : 'text-ink-soft'),
          cur ? 'border-2 border-primary font-extrabold' : mk ? 'border border-purple font-semibold' : ans ? 'border border-success-bright font-semibold' : 'border border-line font-semibold'
        )}
      >
        {i + 1}
        {mk && ans && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-success-bright" aria-hidden />}
      </button>
    );
  };

  const legend = (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12px] text-muted">
      <span className="inline-flex items-center gap-1.5">
        <i className="h-3 w-3 rounded-[3px] border-[1.4px] border-success-bright bg-success-bright" /> Answered
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="h-3 w-3 rounded-[3px] border-[1.4px] border-primary bg-white" /> Current
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="h-3 w-3 rounded-[3px] border-[1.4px] border-line bg-white" /> Not Answered
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="h-3 w-3 rounded-[3px] border-[1.4px] border-purple bg-purple" /> Marked
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-page">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-2 sm:px-4">
          <button type="button" onClick={() => setLeaveOpen(true)} aria-label="Leave test" className="rounded-full p-2 hover:bg-surface">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <LogoIcon className="hidden h-8 w-8 sm:block" />
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{title}</p>
          <span role="timer" aria-label={`Time left ${fmtClock(secondsLeft)}`} className={cn('tabular inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13.5px] font-bold', timerTone)}>
            <Timer className="h-4 w-4" />
            {fmtClock(secondsLeft)}
          </span>
          <button type="button" onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts" className="hidden rounded-full p-2 text-muted hover:bg-surface lg:block">
            <Keyboard className="h-5 w-5" />
          </button>
          <Button size="sm" onClick={() => setConfirmOpen(true)} className="ml-1">
            Submit
          </Button>
        </div>
      </header>

      {/* Mobile/tablet palette row */}
      <div className="border-b border-line bg-white lg:hidden">
        <div ref={paletteRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
          {qs.map(paletteItem)}
        </div>
        <div className="px-4 pb-2.5">{legend}</div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-0 sm:px-4 lg:py-6">
        {/* Question */}
        <main className="flex min-w-0 flex-1 flex-col bg-white sm:rounded-2xl sm:border sm:border-line lg:shadow-card">
          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h1 className="text-[17px] font-extrabold text-[#0F172A]">
                Question {index + 1} of {qs.length}
              </h1>
              <span className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-bold text-[#2563EB]">
                +{fmtNum(q.marks)}&nbsp;&nbsp;-{fmtNum(q.negativeMarks)}
              </span>
            </div>
            <QuestionText q={q} />
            <div role="radiogroup" aria-label={`Options for question ${index + 1}`} className="mt-5 space-y-2.5">
              {OPTION_LETTERS.filter((l) => q.options[l]).map((l, i) => {
                const sel = selected === l;
                return (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => pick(q.id, l)}
                    className={cn(
                      'flex min-h-[58px] w-full items-center gap-3 rounded-card px-3.5 py-3 text-left transition',
                      sel ? 'border-[1.6px] border-primary bg-primary-soft' : 'border-[1.2px] border-line bg-white hover:border-primary/40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold',
                        sel ? 'bg-primary text-white' : 'border border-line bg-white text-ink-soft'
                      )}
                    >
                      {l}
                    </span>
                    <span className="flex-1 whitespace-pre-line text-[14.5px] font-medium leading-snug text-ink">{q.options[l]}</span>
                    <span className="hidden text-[11px] font-semibold text-faint lg:inline">{i + 1}</span>
                    {sel && <CheckCircle2 className="h-[22px] w-[22px] shrink-0 text-primary" aria-hidden />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => toggleMark(q.id)}
              aria-pressed={isMarked}
              className={cn(
                'mt-4 inline-flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] font-semibold transition',
                isMarked ? 'border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED]' : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-surface'
              )}
            >
              {isMarked ? <BookmarkCheck className="h-[19px] w-[19px]" /> : <Bookmark className="h-[19px] w-[19px] text-[#64748B]" />}
              {isMarked ? 'Marked for Review' : 'Mark for Review'}
            </button>
          </div>

          {/* Bottom nav */}
          <div className="sticky bottom-0 grid grid-cols-[3fr_2fr_3fr] gap-2 border-t border-line bg-white px-4 py-3 sm:rounded-b-2xl" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <Button variant="secondary" size="lg" disabled={index === 0} onClick={() => go(index - 1)} icon={<ArrowLeft className="hidden h-4 w-4 min-[360px]:block" />}>
              Previous
            </Button>
            <Button variant="secondary" size="lg" disabled={!selected} onClick={() => pick(q.id, null)}>
              Clear
            </Button>
            {isLast ? (
              <Button size="lg" onClick={() => setConfirmOpen(true)}>
                Submit
              </Button>
            ) : (
              <Button size="lg" onClick={() => go(index + 1)} trailingIcon={<ArrowRight className="hidden h-4 w-4 min-[360px]:block" />}>
                Next
              </Button>
            )}
          </div>
        </main>

        {/* Desktop palette */}
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-line bg-white p-4 shadow-card">
            <p className="mb-3 text-[14px] font-bold text-ink">Question Palette</p>
            <div className="grid grid-cols-6 gap-2">{qs.map(paletteItem)}</div>
            <div className="mt-4 border-t border-line pt-3">{legend}</div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#ECFDF5] py-2">
                <dt className="text-[11px] font-semibold text-[#059669]">Answered</dt>
                <dd className="text-[17px] font-extrabold text-[#059669]">{answeredCount}</dd>
              </div>
              <div className="rounded-xl bg-[#FEF2F2] py-2">
                <dt className="text-[11px] font-semibold text-danger">Not Answered</dt>
                <dd className="text-[17px] font-extrabold text-danger">{notAnswered}</dd>
              </div>
              <div className="rounded-xl bg-[#F5F3FF] py-2">
                <dt className="text-[11px] font-semibold text-[#7C3AED]">Marked</dt>
                <dd className="text-[17px] font-extrabold text-[#7C3AED]">{marked.size}</dd>
              </div>
            </dl>
            <Button block className="mt-4" onClick={() => setConfirmOpen(true)} icon={<ClipboardCheck className="h-4 w-4" />}>
              Submit Test
            </Button>
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      <Modal open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} hideClose size="sm" dismissible={!submitting}>
        <DialogHero
          icon={<ClipboardCheck />}
          title="Submit Test?"
          message="Are you sure you want to submit your test? Once submitted, you cannot change your answers."
        />
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[#ECFDF5] px-2 py-2.5 text-[#059669]">
            <p className="text-[18px] font-extrabold">{answeredCount}</p>
            <p className="text-[11.5px] font-semibold opacity-85">Answered</p>
          </div>
          <div className={cn('rounded-xl px-2 py-2.5', notAnswered > 0 ? 'bg-[#FEF2F2] text-danger' : 'bg-[#F1F5F9] text-[#64748B]')}>
            <p className="text-[18px] font-extrabold">{notAnswered}</p>
            <p className="text-[11.5px] font-semibold opacity-85">Not Answered</p>
          </div>
          <div className="rounded-xl bg-[#F5F3FF] px-2 py-2.5 text-[#7C3AED]">
            <p className="text-[18px] font-extrabold">{marked.size}</p>
            <p className="text-[11.5px] font-semibold opacity-85">Marked</p>
          </div>
        </div>
        <p className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-2xl bg-[#F1F5F9] px-3 py-1.5 text-[12.5px] font-semibold text-[#475569]">
          <Timer className="h-4 w-4" /> Time Remaining: <span className="tabular">{fmtClock(secondsLeft)}</span>
        </p>
        {submitError && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-[13px] font-medium text-danger">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" /> {submitError}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2.5">
          <Button block size="lg" loading={submitting} onClick={() => void submit(false)}>
            {submitError ? 'Retry' : 'Submit Test'}
          </Button>
          <Button block variant="secondary" disabled={submitting} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Auto-submit failure surfaces here too */}
      {submitError && !confirmOpen && (
        <div role="alert" className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center gap-3 rounded-card bg-danger px-4 py-3 text-[13.5px] text-white shadow-raised">
          <span className="flex-1">Submission Failed: {submitError}</span>
          <button type="button" className="font-bold underline" onClick={() => void submit(false)}>
            Retry
          </button>
        </div>
      )}

      {/* Leave */}
      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} hideClose size="sm">
        <DialogHero icon={<LogOut />} tone="danger" title="Leave test?" message="Your answers are saved. You can come back and finish while time remains." />
        <div className="mt-6 flex flex-col gap-2.5">
          <Button block variant="danger" onClick={leave}>
            Leave
          </Button>
          <Button block variant="secondary" onClick={() => setLeaveOpen(false)}>
            Stay
          </Button>
        </div>
      </Modal>

      {/* Time's up */}
      <Modal open={timeUp} onClose={() => undefined} dismissible={false} hideClose size="sm">
        <DialogHero icon={<CheckCircle2 />} tone="success" title="Time's Up!" message="Your test duration has ended. Your answers have been submitted." />
        <Button block size="lg" className="mt-6 bg-[#059669] hover:bg-[#047857]" onClick={() => attempt && navigate(`/result/${attempt.id}`, { replace: true })}>
          View Results
        </Button>
      </Modal>

      {/* Shortcuts */}
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts" size="sm">
        <ul className="space-y-2 text-[14px] text-ink-soft">
          {[
            ['A–D or 1–4', 'Choose an option'],
            ['← / →', 'Previous / next question'],
            ['M', 'Mark for Review'],
            ['Backspace', 'Clear response'],
          ].map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4">
              <kbd className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[12.5px]">{k}</kbd>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
