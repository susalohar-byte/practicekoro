import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, CheckCircle2, ChevronDown, Inbox, Lightbulb, MinusCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/auth/AuthProvider';
import { qk, useAttempt, useSolutions } from '@/hooks/queries';
import { addBookmark, removeBookmark } from '@/services/account';
import { deleteSavedQuestion, writeSavedQuestion } from '@/lib/savedQuestions';
import { friendlyError } from '@/lib/errors';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Chips } from '@/components/ui/Chips';
import { useToast } from '@/components/ui/Toast';
import { OPTION_LETTERS, type SolutionQuestion } from '@/types/models';

type Outcome = 'correct' | 'wrong' | 'skipped';
const outcomeOf = (q: SolutionQuestion): Outcome => (!q.selected ? 'skipped' : q.selected === q.correct ? 'correct' : 'wrong');

const PILL: Record<Outcome, string> = {
  correct: 'bg-[#DCFCE7] border-[#22C55E] text-[#15803D]',
  wrong: 'bg-[#FEE2E2] border-[#EF4444] text-[#B91C1C]',
  skipped: 'bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B]',
};

/** Explanation text split into bullet lines (leading "•" or "-" removed). */
export function explanationLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().replace(/^[•-]\s*/, ''))
    .filter(Boolean);
}

export default function SolutionsPage() {
  const { attemptId = '' } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const attempt = useAttempt(attemptId);
  const solutions = useSolutions(attemptId);
  const [filter, setFilter] = useState<'all' | Outcome>('all');
  const [index, setIndex] = useState(() => Number(params.get('initialIndex')) || 0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => solutions.data ?? [], [solutions.data]);
  const counts = useMemo(() => {
    const c = { correct: 0, wrong: 0, skipped: 0 };
    for (const q of all) c[outcomeOf(q)] += 1;
    return c;
  }, [all]);
  const visible = useMemo(() => all.map((q, i) => ({ q, i })).filter(({ q }) => filter === 'all' || outcomeOf(q) === filter), [all, filter]);

  useEffect(() => {
    if (visible.length && !visible.some((v) => v.i === index)) setIndex(visible[0].i);
  }, [visible, index]);
  useEffect(() => {
    paletteRef.current?.querySelector<HTMLElement>(`[data-q="${index}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  if (attempt.isLoading || solutions.isLoading) return <Loader />;
  if (solutions.isError) return <ErrorState message="Could not load solutions." error={solutions.error} onRetry={() => void solutions.refetch()} />;
  if (all.length === 0) {
    return (
      <>
        <PageHeader title="View Answer" back={`/result/${attemptId}`} />
        <Message icon={<Inbox />} title="No questions available for this test." />
      </>
    );
  }

  const q = all[Math.min(index, all.length - 1)];
  const pos = visible.findIndex((v) => v.i === index);
  const outcome = outcomeOf(q);
  const saved = bookmarks[q.id] ?? q.isBookmarked;
  const expl = q.explanationBengali || q.explanation;
  const correctText = q.correct ? q.options[q.correct] : '';
  const isOpen = !collapsed.has(q.id);
  const move = (p: number) => {
    const v = visible[p];
    if (v) {
      setIndex(v.i);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleBookmark = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (saved) {
        await removeBookmark(user.id, q.id);
        deleteSavedQuestion(user.id, q.id);
        toast('Question removed from saved bookmarks');
      } else {
        await addBookmark(user.id, q.id);
        writeSavedQuestion(user.id, { ...q, isBookmarked: true });
        toast('Question saved to Bookmarks', 'success');
      }
      setBookmarks((b) => ({ ...b, [q.id]: !saved }));
      void queryClient.invalidateQueries({ queryKey: qk.bookmarks(user.id) });
    } catch (e) {
      toast(friendlyError(e, 'Could not update the bookmark.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div ref={topRef} />
      <PageHeader
        title="View Answer"
        subtitle={`${attempt.data?.testTitle ?? ''}${attempt.data ? ' · ' : ''}Question ${index + 1} of ${all.length}`}
        back={`/result/${attemptId}`}
        actions={
          <button
            type="button"
            onClick={toggleBookmark}
            disabled={busy}
            aria-pressed={saved}
            aria-label={saved ? 'Remove Bookmark' : 'Bookmark Question'}
            title={saved ? 'Remove Bookmark' : 'Bookmark Question'}
            className={cn('flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-surface', saved ? 'text-brand' : 'text-[#0F172A]')}
          >
            {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </button>
        }
      />

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        <div className="order-2 lg:order-1">
          {/* Mobile navigator */}
          <div className="mb-4 rounded-card border border-line bg-white p-3 lg:hidden">
            <div ref={paletteRef} className="no-scrollbar flex gap-2 overflow-x-auto">
              {visible.map(({ q: x, i }) => (
                <button
                  key={x.id}
                  type="button"
                  data-q={i}
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Question ${i + 1}, ${outcomeOf(x)}`}
                  className={cn('h-[38px] w-[38px] shrink-0 rounded-[10px] text-[13px]', PILL[outcomeOf(x)], i === index ? 'border-[2.4px] border-brand font-black text-brand' : 'border-[1.2px] font-semibold')}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <article className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-lg bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-bold text-brand">Question {index + 1}</span>
              {outcome === 'correct' ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-extrabold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                </span>
              ) : outcome === 'wrong' ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-extrabold text-danger">
                  <XCircle className="h-3.5 w-3.5" /> Incorrect
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F1F5F9] px-2.5 py-1 text-[12px] font-extrabold text-[#64748B]">
                  <MinusCircle className="h-3.5 w-3.5" /> Skipped
                </span>
              )}
            </div>

            {q.textBengali ? (
              <>
                <p lang="bn" className="whitespace-pre-line text-[17px] font-extrabold leading-relaxed text-[#0F172A]">
                  {q.textBengali}
                </p>
                <p className="mt-1 whitespace-pre-line text-[14px] font-medium text-[#475569]">{q.textEnglish}</p>
              </>
            ) : (
              <p className="whitespace-pre-line text-[17px] font-extrabold leading-relaxed text-[#0F172A]">{q.textEnglish}</p>
            )}
            {q.imageUrl && <img src={q.imageUrl} alt="Question figure" className="mt-4 max-h-80 max-w-full rounded-card border border-line object-contain" />}

            <ul className="mt-5 space-y-3">
              {OPTION_LETTERS.filter((l) => q.options[l]).map((l) => {
                const isCorrect = l === q.correct;
                const pickedWrong = l === q.selected && !isCorrect;
                return (
                  <li
                    key={l}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3.5 py-3',
                      isCorrect ? 'border-[1.5px] border-[#4ADE80] bg-[#F0FDF4]' : pickedWrong ? 'border-[1.5px] border-[#FDA4AF] bg-[#FFF1F2]' : 'border-[1.2px] border-[#E2E8F0] bg-white'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold',
                        isCorrect ? 'bg-[#10B981] text-white' : pickedWrong ? 'bg-[#FFE4E6] text-[#E11D48]' : 'bg-[#F1F5F9] text-[#0F172A]'
                      )}
                    >
                      {l}
                    </span>
                    <span className="flex-1 whitespace-pre-line text-[15px] font-semibold text-[#0F172A]">{q.options[l]}</span>
                    {(isCorrect || pickedWrong) && (
                      <span className={cn('hidden text-[11px] font-bold sm:inline', isCorrect ? 'text-success' : 'text-[#E11D48]')}>
                        {isCorrect && l === q.selected ? 'Your Answer · Correct' : isCorrect ? 'Correct Answer' : 'Your Answer'}
                      </span>
                    )}
                    {isCorrect ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-white" aria-label="Correct answer">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : pickedWrong ? (
                      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2.2px] border-[#E11D48]" aria-label="Your answer">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#E11D48]" />
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <section className={cn('mt-5 rounded-2xl border bg-[#F4F7FF]', isOpen ? 'border-[#C7D7FE]' : 'border-[#E0E7FF]')}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setCollapsed((s) => {
                    const n = new Set(s);
                    if (n.has(q.id)) n.delete(q.id);
                    else n.add(q.id);
                    return n;
                  })
                }
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2563EB] text-white">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <span className="flex-1 text-[16.5px] font-extrabold text-[#1E3A8A]">Explanation</span>
                <ChevronDown className={cn('h-5 w-5 transition-transform', isOpen ? 'rotate-180 text-[#2563EB]' : 'text-[#64748B]')} />
              </button>
              {isOpen && (
                <div className="border-t border-[#E0E7FF] px-4 pb-4 pt-3.5">
                  {expl ? (
                    <ul className="space-y-3">
                      {explanationLines(expl).map((line, i) => (
                        <li key={i} lang={q.explanationBengali ? 'bn' : undefined} className="flex gap-2.5 text-[14.5px] font-medium leading-relaxed text-[#0F172A]">
                          <span className="mt-[7px] h-2 w-2 shrink-0 rotate-45 rounded-[2px] bg-brand" aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p lang="bn" className="text-[14.5px] font-medium text-[#0F172A]">
                      সঠিক উত্তরটি অফিসিয়াল উত্তরপত্র অনুযায়ী "{q.correct}. {correctText}"।
                    </p>
                  )}
                  {q.explanationBengali && q.explanation && q.explanation !== q.explanationBengali && (
                    <p className="mt-3 whitespace-pre-line text-[13px] italic text-[#475569]">{q.explanation}</p>
                  )}
                </div>
              )}
            </section>
          </article>

          <div className="sticky bottom-[86px] mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 backdrop-blur md:bottom-3">
            <Button variant="secondary" className="flex-1" disabled={pos <= 0} onClick={() => move(pos - 1)} icon={<ArrowLeft className="h-4 w-4" />}>
              Previous
            </Button>
            <span className="tabular text-[13.5px] font-bold text-[#64748B]">
              {pos + 1} / {visible.length}
            </span>
            <Button className="flex-1" disabled={pos >= visible.length - 1} onClick={() => move(pos + 1)} trailingIcon={<ArrowRight className="h-4 w-4" />}>
              Next
            </Button>
          </div>
        </div>

        <aside className="order-1 mb-4 lg:order-2 lg:mb-0">
          <div className="space-y-3 lg:sticky lg:top-20">
            <Chips
              label="Filter questions"
              wrap
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'correct', label: 'Correct', count: counts.correct },
                { value: 'wrong', label: 'Wrong', count: counts.wrong },
                { value: 'skipped', label: 'Skipped', count: counts.skipped },
              ]}
            />
            <div className="hidden rounded-2xl border border-line bg-white p-4 shadow-card lg:block">
              <p className="mb-3 text-[12.5px] font-bold text-[#475569]">Select Question</p>
              <div className="grid grid-cols-6 gap-2">
                {visible.map(({ q: x, i }) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Question ${i + 1}, ${outcomeOf(x)}`}
                    className={cn('h-[38px] rounded-[10px] text-[13px]', PILL[outcomeOf(x)], i === index ? 'border-[2.4px] border-brand font-black text-brand' : 'border-[1.2px] font-semibold')}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
