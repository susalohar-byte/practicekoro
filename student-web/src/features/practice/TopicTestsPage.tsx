import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FileText, Inbox, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtNum } from '@/lib/format';
import { useAttemptHistory, useIsPro, useTopicTests } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Message, Skeleton } from '@/components/ui/Feedback';
import { ProDialog } from '@/components/domain/ProDialog';
import type { Attempt } from '@/types/models';

export default function TopicTestsPage() {
  const { topicId = '' } = useParams();
  const [params] = useSearchParams();
  const tests = useTopicTests(topicId);
  const history = useAttemptHistory();
  const isPro = useIsPro();
  const [proOpen, setProOpen] = useState(false);

  const best = useMemo(() => {
    const m = new Map<string, Attempt>();
    for (const a of history.data ?? []) {
      const cur = m.get(a.testId);
      if (!cur || a.percentage > cur.percentage) m.set(a.testId, a);
    }
    return m;
  }, [history.data]);

  const count = tests.data?.length;
  return (
    <div>
      <PageHeader
        title={params.get('title') || 'Topic Tests'}
        subtitle={count !== undefined ? `${count} Tests Available` : 'Available Tests'}
        back="/practice"
      />
      {tests.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[74px]" />
          ))}
        </div>
      ) : tests.isError ? (
        <ErrorState message="Could not load tests for this topic." error={tests.error} onRetry={() => void tests.refetch()} />
      ) : (tests.data ?? []).length === 0 ? (
        <Message icon={<Inbox />} title="No tests available" message="Tests for this chapter will appear here soon." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(tests.data ?? []).map((t) => {
            const locked = t.isPro && !isPro;
            const attempt = best.get(t.id);
            const content = (
              <>
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', locked ? 'bg-[#F1F5F9] text-[#94A3B8]' : 'bg-[#EFF6FF] text-[#2563EB]')}>
                  {locked ? <Lock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[15.5px] font-bold', locked ? 'text-[#64748B]' : 'text-[#0F172A]')}>{t.title}</span>
                  <span className="block text-[12px] font-medium text-[#64748B]">
                    {t.totalQuestions} Questions • {t.durationMinutes} Mins • {fmtNum(t.totalMarks)} Marks
                  </span>
                </span>
                {locked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-extrabold text-[#B45309]">
                    <Lock className="h-3 w-3" /> PRO
                  </span>
                ) : attempt ? (
                  <span className="rounded-[10px] border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-center text-[#059669]">
                    <span className="block text-[12.5px] font-extrabold">
                      {attempt.correctCount}/{t.totalQuestions}
                    </span>
                    <span className="block text-[10.5px] font-semibold">{Math.round(attempt.percentage)}%</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-primary px-[18px] py-2 text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(31,72,232,0.25)]">Start</span>
                )}
              </>
            );
            const cls = cn(
              'flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition hover:-translate-y-px',
              locked ? 'border-[#F1F5F9]' : 'border-[#E2E8F0] hover:border-primary/30'
            );
            return locked ? (
              <button key={t.id} type="button" className={cls} onClick={() => setProOpen(true)} aria-label={`${t.title} — PRO, locked`}>
                {content}
              </button>
            ) : (
              <Link key={t.id} to={`/test/${encodeURIComponent(t.id)}/details`} className={cls}>
                {content}
              </Link>
            );
          })}
        </div>
      )}
      <ProDialog open={proOpen} onClose={() => setProOpen(false)} what="topic test" />
    </div>
  );
}
