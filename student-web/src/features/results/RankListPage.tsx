import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDate, fmtNum } from '@/lib/format';
import { useAttemptHistory, useLeaderboard, useProfile } from '@/hooks/queries';
import { WEST_BENGAL_DISTRICTS } from '@/data/westBengal';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Message, Skeleton } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Brand';
import type { LeaderboardScope } from '@/types/models';
import { RankListRow } from './RankRow';

const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: 'global', label: 'Global Rank' },
  { value: 'west_bengal', label: 'West Bengal' },
  { value: 'district', label: 'District Rank' },
];

export default function RankListPage() {
  const [params, setParams] = useSearchParams();
  const history = useAttemptHistory();
  const { data: profile } = useProfile();

  // Tests this student has finished — the leaderboards they belong to.
  const tests = useMemo(() => {
    const m = new Map<string, { id: string; title: string; date: Date; marks: number }>();
    for (const a of history.data ?? []) if (!m.has(a.testId)) m.set(a.testId, { id: a.testId, title: a.testTitle, date: a.completedAt, marks: a.totalMarks });
    return [...m.values()];
  }, [history.data]);

  const testId = params.get('testId') ?? tests[0]?.id ?? null;
  const testTitle = params.get('title') ?? tests.find((t) => t.id === testId)?.title ?? null;
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [district, setDistrict] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const effectiveDistrict = district ?? profile?.district ?? WEST_BENGAL_DISTRICTS[0];
  const board = useLeaderboard({ testId, scope, district: scope === 'district' ? effectiveDistrict : null });

  const term = query.trim().toLowerCase().replace(/^#/, '');
  const rows = (board.data ?? []).filter((r) => !term || r.name.toLowerCase().includes(term) || String(r.rank) === term);
  const me = (board.data ?? []).find((r) => r.isCurrentUser);

  return (
    <div className="mx-auto max-w-6xl pb-20 lg:pb-24">
      <PageHeader title="Student Rank List" back="/results" />

      {history.isLoading ? (
        <Skeleton className="mb-4 h-16" />
      ) : tests.length === 0 && !testId ? (
        <Message icon={<Trophy />} title="No rankings yet" message="Finish a test to see where you stand among other students." />
      ) : (
        <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="lg:sticky lg:top-20 lg:rounded-2xl lg:border lg:border-line lg:bg-white lg:p-4 lg:shadow-card">
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">Test</span>
            <span className="relative block">
              <select
                value={testId ?? ''}
                onChange={(e) => {
                  const t = tests.find((x) => x.id === e.target.value);
                  setParams(t ? { testId: t.id, title: t.title } : {}, { replace: true });
                }}
                className="h-14 w-full appearance-none rounded-2xl border border-line bg-white pl-4 pr-10 text-[14.5px] font-bold text-ink shadow-card"
              >
                {testId && !tests.some((t) => t.id === testId) && <option value={testId}>{testTitle ?? 'Selected test'}</option>}
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} — {fmtDate(t.date)} • {fmtNum(t.marks)} Marks
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
            </span>
          </label>

          <div role="tablist" aria-label="Ranking scope" className="mb-4 grid grid-cols-3 gap-2">
            {SCOPES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={scope === s.value}
                onClick={() => setScope(s.value)}
                className={cn(
                  'rounded-full py-2.5 text-[12.5px]',
                  scope === s.value ? 'bg-brand font-bold text-white shadow-[0_3px_8px_rgba(1,88,252,0.25)]' : 'border border-[#E2E8F0] bg-white font-semibold text-[#475569]'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row lg:mb-0 lg:flex-col">
            {scope === 'district' && (
              <label className="sm:w-60 lg:w-full">
                <span className="sr-only">Select District</span>
                <span className="relative block">
                  <select
                    value={effectiveDistrict}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white pl-3.5 pr-9 text-[13.5px] font-bold"
                  >
                    {WEST_BENGAL_DISTRICTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                </span>
              </label>
            )}
            <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3">
              <Search className="h-[18px] w-[18px] text-[#94A3B8]" aria-hidden />
              <span className="sr-only">Search student name or rank</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student name or rank..." className="h-full flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#94A3B8]" />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                  <X className="h-4 w-4 text-[#64748B]" />
                </button>
              )}
            </label>
          </div>
          </div>

          <div>
          {board.isLoading ? (
            <div className="space-y-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : board.isError ? (
            <ErrorState message="Could not load ranking data. Please retry." error={board.error} onRetry={() => void board.refetch()} />
          ) : rows.length === 0 ? (
            <p className="rounded-card border border-line bg-white p-6 text-center text-[13.5px] text-muted">
              {term ? 'No students found matching your search' : 'No ranked students for this selection yet.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {rows.map((r) => (
                <RankListRow key={`${r.rank}-${r.userId}`} row={r} />
              ))}
            </div>
          )}
          </div>
        </div>
      )}

      {me && (
        <div className="fixed inset-x-0 bottom-[86px] z-20 border-t-[1.5px] border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 shadow-[0_-4px_12px_rgba(1,88,252,0.08)] md:bottom-0 md:pl-[92px] xl:pl-[272px]">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <span className="rounded-md bg-brand px-2 py-1 text-[12px] font-extrabold text-white">#{me.rank}</span>
            <Avatar url={me.avatarUrl} name={me.name} size={34} />
            <span className="flex-1 truncate text-[14.5px] font-extrabold text-brand">{me.name} (You)</span>
            <span className="text-[15px] font-extrabold text-brand">
              {fmtNum(me.score)} / {fmtNum(me.totalMarks)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
