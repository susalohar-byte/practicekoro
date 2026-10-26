import { useMemo } from 'react';
import { BadgeCheck, CheckSquare, ClipboardCheck, LineChart, Target } from 'lucide-react';
import { fmtDate } from '@/lib/format';
import { useAttemptHistory, useTopics, useAllTests } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar, scoreColor } from '@/components/ui/ProgressBar';
import type { Attempt } from '@/types/models';

function hm(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function groupRows(attempts: Attempt[], keyOf: (a: Attempt) => string) {
  const m = new Map<string, { title: string; n: number; correct: number; answered: number; best: number }>();
  for (const a of attempts) {
    const k = keyOf(a);
    const g = m.get(k) ?? { title: k, n: 0, correct: 0, answered: 0, best: 0 };
    g.n += 1;
    g.correct += a.correctCount;
    g.answered += a.correctCount + a.wrongCount;
    g.best = Math.max(g.best, a.percentage);
    m.set(k, g);
  }
  return [...m.values()]
    .map((g) => ({ ...g, acc: g.answered > 0 ? g.correct / g.answered : 0 }))
    .sort((a, b) => a.acc - b.acc);
}

function PerfGroup({ title, rows }: { title: string; rows: ReturnType<typeof groupRows> }) {
  return (
    <section>
      <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">{title}</h2>
      <Card className="divide-y divide-line px-4">
        {rows.map((r) => (
          <div key={r.title} className="py-3">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="truncate text-[14px] font-semibold text-ink">{r.title}</span>
              <span className="text-[13px] font-bold" style={{ color: scoreColor(r.acc) }}>
                {Math.round(r.acc * 100)}%
              </span>
            </div>
            <ProgressBar value={r.acc} label={`${r.title} accuracy`} />
            <p className="mt-1 text-[12px] text-muted">
              {r.n} {r.n === 1 ? 'attempt' : 'attempts'} · best {Math.round(r.best)}%
            </p>
          </div>
        ))}
      </Card>
    </section>
  );
}

export default function ProgressPage() {
  const { data, isLoading, isError, error, refetch } = useAttemptHistory();
  const topics = useTopics(null);
  const tests = useAllTests();
  const attempts = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const correct = attempts.reduce((s, a) => s + a.correctCount, 0);
    const wrong = attempts.reduce((s, a) => s + a.wrongCount, 0);
    const solved = correct + wrong;
    return {
      correct,
      wrong,
      solved,
      accuracy: solved > 0 ? Math.round((correct / solved) * 100) : 0,
      avg: attempts.length ? attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length : 0,
      time: attempts.reduce((s, a) => s + a.timeSpentSeconds, 0),
    };
  }, [attempts]);

  const chapterTitle = (a: Attempt) => {
    const ch = tests.data?.find((t) => t.id === a.testId)?.chapterId;
    return topics.data?.find((t) => t.id === ch)?.title ?? a.testTitle;
  };
  const topicRows = groupRows(attempts.filter((a) => a.category === 'Topic Test'), chapterTitle);
  const mockRows = groupRows(attempts.filter((a) => a.category !== 'Topic Test'), (a) => a.testTitle);
  const trend = attempts.slice(0, 10).reverse();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="My Progress" back="/profile" />
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorState message="Your progress could not be loaded." error={error} onRetry={() => void refetch()} />
      ) : attempts.length === 0 ? (
        <Message
          icon={<LineChart />}
          title="No progress yet"
          message="Finish a test or a topic practice to see your accuracy and trends."
          action={<ButtonLink to="/practice" variant="secondary">Start practising</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
          <Card className="grid grid-cols-3 px-2 py-4 text-center">
            {[
              { icon: ClipboardCheck, c: '#1F48E8', v: String(attempts.length), l: 'Tests Attempted' },
              { icon: CheckSquare, c: '#8B5CF6', v: String(stats.solved), l: 'Questions Solved' },
              { icon: Target, c: '#16A34A', v: `${stats.accuracy}%`, l: 'Accuracy' },
            ].map(({ icon: Icon, c, v, l }) => (
              <div key={l} className="flex flex-col items-center gap-1.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${c}1F`, color: c }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[18px] font-extrabold text-ink">{v}</span>
                <span className="text-[12px] text-muted">{l}</span>
              </div>
            ))}
          </Card>
          <Card className="grid grid-cols-4 items-center divide-x divide-line py-3.5 text-center">
            {[
              { v: `${Math.round(stats.avg)}%`, l: 'Avg. Score', c: scoreColor(stats.avg / 100) },
              { v: String(stats.correct), l: 'Correct', c: '#16A34A' },
              { v: String(stats.wrong), l: 'Wrong', c: '#DC2626' },
              { v: hm(stats.time), l: 'Time Spent', c: '#111827' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-[20px] font-extrabold" style={{ color: s.c }}>
                  {s.v}
                </p>
                <p className="text-[12px] text-muted">{s.l}</p>
              </div>
            ))}
          </Card>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          <section>
          <h2 className="mb-2.5 mt-7 text-[16.5px] font-bold text-ink">Score Trend</h2>
          <Card className="p-4">
            <div className="flex h-[150px] items-end gap-1" role="list" aria-label="Score trend">
              {trend.map((a) => {
                const pct = Math.round(a.percentage);
                const h = (Math.min(100, Math.max(0, pct)) / 100) * 110 + 4;
                return (
                  <div key={a.id} role="listitem" aria-label={`${a.testTitle}: ${pct} percent`} className="flex flex-1 flex-col items-center justify-end px-1">
                    <span className="mb-1 text-[10.5px] font-bold text-muted">{pct}</span>
                    <span className="w-full max-w-[40px] rounded-t-md" style={{ height: h, background: scoreColor(pct / 100) }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-[12px] text-muted">
              <span>{fmtDate(trend[0].completedAt).replace(/ \d{4}$/, '')}</span>
              <span>
                Last {trend.length} {trend.length === 1 ? 'test' : 'tests'} (score %)
              </span>
              <span>{fmtDate(trend[trend.length - 1].completedAt).replace(/ \d{4}$/, '')}</span>
            </div>
          </Card>
          </section>
          <div>
          {topicRows.length > 0 && <PerfGroup title="Topic Performance" rows={topicRows} />}
          {mockRows.length > 0 && <PerfGroup title="Mock Test Performance" rows={mockRows} />}
          </div>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted">
            <BadgeCheck className="h-4 w-4" /> Based on tests saved to your account.
          </p>
        </>
      )}
    </div>
  );
}
