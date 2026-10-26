import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, ClipboardCheck, ClipboardList, FileText, History, Radio, Trophy } from 'lucide-react';
import { fmtDate, fmtNum, ordinal } from '@/lib/format';
import { useAttemptHistory, useLeaderboard } from '@/hooks/queries';
import { Chips } from '@/components/ui/Chips';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import type { Attempt } from '@/types/models';
import { RankListRow } from './RankRow';

type Kind = 'all' | 'mock' | 'topic' | 'pyq' | 'live';
const kindOf = (a: Attempt): Exclude<Kind, 'all'> =>
  a.isLive ? 'live' : a.category === 'Topic Test' ? 'topic' : a.category === 'PYQ' ? 'pyq' : 'mock';

const KIND_STYLE = {
  live: { icon: Radio, fg: '#0158FC', bg: '#EFF6FF' },
  topic: { icon: BookOpen, fg: '#EA580C', bg: '#FFF7ED' },
  pyq: { icon: History, fg: '#9333EA', bg: '#FAF5FF' },
  mock: { icon: ClipboardCheck, fg: '#DC2626', bg: '#FEF2F2' },
};

function Stat({ icon: Icon, fg, bg, value, label }: { icon: typeof FileText; fg: string; bg: string; value: string; label: string }) {
  return (
    <Card className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px]" style={{ background: bg, color: fg }}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[20px] font-extrabold text-[#0F172A]">{value}</span>
        <span className="block text-[12px] font-semibold text-[#64748B]">{label}</span>
      </span>
    </Card>
  );
}

export default function ResultsPage() {
  const history = useAttemptHistory();
  const [kind, setKind] = useState<Kind>('all');
  const attempts = useMemo(() => history.data ?? [], [history.data]);
  const latest = attempts[0];
  const board = useLeaderboard({ testId: latest?.testId ?? null, scope: 'global' });

  const avg = attempts.length ? attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length : null;
  const ranks = attempts.map((a) => a.rank ?? 0).filter((r) => r > 0);
  const best = ranks.length ? Math.min(...ranks) : null;
  const list = attempts.filter((a) => kind === 'all' || kindOf(a) === kind);
  const preview = useMemo(() => {
    const rows = board.data ?? [];
    const top = rows.filter((r) => r.rank <= 3).slice(0, 3);
    const me = rows.find((r) => r.isCurrentUser);
    return me && !top.includes(me) ? [...top, me] : top;
  }, [board.data]);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0B1F44] sm:text-2xl">My Results</h1>
        <p className="mt-0.5 text-[13px] text-muted">Every test you have finished, with scores and ranks</p>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat icon={FileText} fg="#0158FC" bg="#EFF6FF" value={history.isLoading ? '…' : String(attempts.length)} label="Tests Taken" />
        <Stat icon={BarChart3} fg="#16A34A" bg="#F0FDF4" value={avg === null ? '–' : `${fmtNum(avg, 1)}%`} label="Avg. Score" />
        <Stat icon={Trophy} fg="#9333EA" bg="#FAF5FF" value={best ? ordinal(best) : '–'} label="Best Rank" />
      </div>

      <div className="mt-6">
        <section aria-labelledby="recent-results">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-results" className="text-[17px] font-extrabold text-ink">
              Recent Results
            </h2>
            <Link to="/test-history" className="-my-2 py-2 text-[13.5px] font-bold text-brand hover:underline">
              View All →
            </Link>
          </div>
          <Chips
            label="Result type"
            className="mb-4"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: 'All' },
              { value: 'mock', label: 'Full Mock' },
              { value: 'topic', label: 'Topic Tests' },
              { value: 'pyq', label: 'PYQ' },
              { value: 'live', label: 'Live Tests' },
            ]}
          />
          {history.isLoading ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[70px]" />
              ))}
            </div>
          ) : history.isError ? (
            <ErrorState message="Could not load your recent results." error={history.error} onRetry={() => void history.refetch()} />
          ) : list.length === 0 ? (
            <Card className="flex flex-col items-center p-8 text-center">
              <ClipboardList className="h-10 w-10 text-[#90A4AE]" />
              <p className="mt-2 text-[15px] font-bold text-[#334155]">{attempts.length === 0 ? 'No results yet' : 'No results for this category'}</p>
              <p className="mt-1 text-[13px] text-[#64748B]">
                {attempts.length === 0 ? 'Your scores appear here after your first test.' : 'Complete a test in this section to view your detailed result.'}
              </p>
              {attempts.length === 0 && (
                <ButtonLink to="/exams" className="mt-4" size="sm">
                  Take a test
                </ButtonLink>
              )}
            </Card>
          ) : (
            <div className="grid gap-2.5 lg:grid-cols-2">
              {list.map((a) => {
                const k = kindOf(a);
                const st = KIND_STYLE[k];
                const Icon = st.icon;
                const low = a.percentage < 35;
                return (
                  <Link key={a.id} to={`/result/${a.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 shadow-card hover:border-primary/30">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: st.bg, color: st.fg }}>
                      <Icon className="h-5 w-5" />
                      {k === 'live' && (
                        <span className="absolute -bottom-1.5 rounded bg-brand px-1 text-[7.5px] font-extrabold text-white">LIVE TEST</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-bold text-ink">{a.testTitle}</span>
                      <span className="block text-[12px] text-[#64748B]">
                        {fmtDate(a.completedAt)} • {a.correctCount + a.wrongCount} / {a.correctCount + a.wrongCount + a.skippedCount} Questions
                      </span>
                    </span>
                    <span
                      className={
                        low
                          ? 'rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-2.5 py-1.5 text-center'
                          : 'rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1.5 text-center'
                      }
                    >
                      <span className={low ? 'text-[15px] font-extrabold text-danger' : 'text-[15px] font-extrabold text-success'}>{fmtNum(a.score)}</span>
                      <span className={low ? 'text-[11px] font-bold text-[#B91C1C]/70' : 'text-[11px] font-bold text-[#15803D]/70'}>/{fmtNum(a.totalMarks)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="rank-preview" className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="rank-preview" className="text-[17px] font-extrabold text-ink">
              Student Rank List
            </h2>
            <Link to={latest ? `/results/rankings?testId=${encodeURIComponent(latest.testId)}&title=${encodeURIComponent(latest.testTitle)}` : '/results/rankings'} className="-my-2 py-2 text-[13.5px] font-bold text-brand hover:underline">
              View All →
            </Link>
          </div>
          <Card className="p-3">
            {latest && <p className="mb-2 px-1 text-[12px] font-semibold text-muted">{latest.testTitle}</p>}
            {board.isLoading ? (
              <Skeleton className="h-40" />
            ) : board.isError ? (
              <p className="p-4 text-[13px] text-muted">Could not load ranking data. Please retry.</p>
            ) : preview.length === 0 ? (
              <p className="p-4 text-center text-[13px] text-muted">Rankings appear once students finish this test.</p>
            ) : (
              <div className="grid gap-1.5 lg:grid-cols-2">
                {preview.map((r) => (
                  <RankListRow key={`${r.rank}-${r.userId}`} row={r} />
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
