import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList, FileWarning, History, LayoutGrid, Shapes, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useExam, useExamTests, useIsPro } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Message, Skeleton } from '@/components/ui/Feedback';
import { ExamLogo } from '@/components/ui/Brand';
import { Button } from '@/components/ui/Button';
import { ProDialog } from '@/components/domain/ProDialog';
import { TestCard } from './TestCard';

const TABS = [
  { key: 'All Tests', icon: LayoutGrid },
  { key: 'Full Test', icon: FileText },
  { key: 'Topic Test', icon: Shapes },
  { key: 'PYQ', icon: History },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function ExamTestsPage() {
  const { examId = '' } = useParams();
  const exam = useExam(examId);
  const tests = useExamTests(examId);
  const isPro = useIsPro();
  const [tab, setTab] = useState<TabKey>('All Tests');
  const [proOpen, setProOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 'All Tests': tests.data?.length ?? 0 };
    for (const t of tests.data ?? []) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [tests.data]);
  const list = (tests.data ?? []).filter((t) => tab === 'All Tests' || t.category === tab);
  const title = exam.data?.title ?? 'Exam Tests';

  return (
    <div>
      <PageHeader title={title} back="/exams" />
      {exam.data !== null && (
        <div className="mb-5 flex items-center gap-4 rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-card">
          {exam.isLoading ? <Skeleton className="h-16 w-16 rounded-full" /> : <ExamLogo title={title} iconUrl={exam.data?.iconUrl} size={64} />}
          <div className="min-w-0">
            <p className="text-[18px] font-black text-[#0F172A]">{exam.data?.title ?? (exam.isLoading ? '' : 'Mock Tests')}</p>
            <p className="line-clamp-2 text-[13px] font-medium text-[#64748B]">{exam.data?.description?.trim() || exam.data?.subtitle || 'State Competitive Exam'}</p>
            <div className="mt-1.5 flex gap-1.5">
              <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">{counts['All Tests']} Tests</span>
              {exam.data?.category && <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-bold text-[#475569]">{exam.data.category}</span>}
            </div>
          </div>
        </div>
      )}

      {tests.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[92px]" />
          ))}
        </div>
      ) : tests.isError ? (
        <ErrorState message="Could not load tests." error={tests.error} onRetry={() => void tests.refetch()} />
      ) : (tests.data ?? []).length === 0 ? (
        <Message icon={<ClipboardList />} title="No tests yet" message="Tests for this exam will appear here soon." />
      ) : (
        <>
          <div role="tablist" aria-label="Test type" className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 py-0.5">
            {TABS.map(({ key, icon: Icon }) => {
              const sel = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  onClick={() => setTab(key)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-3xl border-[1.2px] px-3.5 py-2 text-[13px] transition',
                    sel ? 'border-[#2563EB] bg-[#2563EB] font-extrabold text-white shadow-[0_3px_8px_rgba(37,99,235,0.2)]' : 'border-[#E2E8F0] bg-white font-semibold text-[#334155]'
                  )}
                >
                  <Icon className={cn('h-4 w-4', !sel && 'text-[#64748B]')} />
                  {key}
                  <span className={cn('rounded-[10px] px-1.5 text-[11px] font-extrabold', sel ? 'bg-white/20' : 'bg-[#F1F5F9] text-[#64748B]')}>{counts[key] ?? 0}</span>
                </button>
              );
            })}
          </div>
          {list.length === 0 ? (
            <div className="flex flex-col items-center rounded-[18px] border border-[#E2E8F0] bg-white px-5 py-9 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                <FileWarning className="h-7 w-7" />
              </span>
              <p className="text-[16px] font-extrabold text-ink">No {tab} available yet</p>
              <p className="mt-1 text-[13px] text-[#64748B]">Tests for this category will be uploaded soon.</p>
              <Button size="sm" className="mt-4" onClick={() => setTab('All Tests')}>
                View All Tests
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {list.map((t, i) => (
                <TestCard key={t.id} test={t} index={i} locked={t.isPro && !isPro} onLocked={() => setProOpen(true)} />
              ))}
            </div>
          )}
        </>
      )}
      <ProDialog open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  );
}
