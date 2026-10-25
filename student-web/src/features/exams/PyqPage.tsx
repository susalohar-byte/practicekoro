import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ScrollText, Lock } from 'lucide-react';
import { fmtNum } from '@/lib/format';
import { paperYear } from '@/services/catalog';
import { useExamTests, useExams, useIsPro } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Chips } from '@/components/ui/Chips';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { ExamLogo } from '@/components/ui/Brand';
import { Tag } from '@/components/ui/Tag';
import { ProDialog } from '@/components/domain/ProDialog';

export default function PyqPage() {
  const [params, setParams] = useSearchParams();
  const exams = useExams();
  const examId = params.get('exam') ?? exams.data?.[0]?.id ?? '';
  const exam = exams.data?.find((e) => e.id === examId) ?? exams.data?.[0];
  const tests = useExamTests(exam?.id ?? '');
  const isPro = useIsPro();
  const [year, setYear] = useState<number | null>(null);
  const [proOpen, setProOpen] = useState(false);

  const papers = useMemo(
    () => (tests.data ?? []).filter((t) => t.category === 'PYQ').sort((a, b) => (paperYear(b) ?? 0) - (paperYear(a) ?? 0)),
    [tests.data]
  );
  const years = [...new Set(papers.map(paperYear).filter((y): y is number => !!y))].sort((a, b) => b - a);
  const shown = papers.filter((p) => year === null || paperYear(p) === year);

  return (
    <div>
      <PageHeader title="Previous Year Questions" back="/practice" />
      {exams.isLoading ? (
        <Loader />
      ) : exams.isError ? (
        <ErrorState message="Exams could not be loaded." error={exams.error} onRetry={() => void exams.refetch()} />
      ) : !exam ? (
        <Message icon={<ScrollText />} title="No exams available yet" />
      ) : (
        <>
          <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-muted">Exam</p>
          <Chips
            label="Exam"
            value={exam.id}
            onChange={(id) => {
              setParams({ exam: id }, { replace: true });
              setYear(null);
            }}
            options={(exams.data ?? []).map((e) => ({ value: e.id, label: e.title }))}
          />
          {tests.isLoading ? (
            <Loader />
          ) : tests.isError ? (
            <ErrorState message={`Papers for ${exam.title} could not be loaded.`} error={tests.error} onRetry={() => void tests.refetch()} />
          ) : papers.length === 0 ? (
            <Message icon={<ScrollText />} title={`No PYQ papers for ${exam.title} yet`} message="Official papers appear here once they are published." />
          ) : (
            <>
              {years.length > 0 && (
                <>
                  <p className="mb-1.5 mt-5 text-[12px] font-semibold tracking-wide text-muted">Year</p>
                  <Chips
                    label="Year"
                    value={year}
                    onChange={setYear}
                    options={[{ value: null, label: 'All years' }, ...years.map((y) => ({ value: y, label: String(y) }))]}
                  />
                </>
              )}
              <p className="mb-3 mt-5 text-[12px] text-muted">
                {shown.length} {shown.length === 1 ? 'paper' : 'papers'}
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {shown.map((p) => {
                  const locked = p.isPro && !isPro;
                  const y = paperYear(p);
                  const meta = [
                    p.totalQuestions ? `${p.totalQuestions} Qs` : null,
                    p.durationMinutes ? `${p.durationMinutes} min` : null,
                    p.totalMarks ? `${fmtNum(p.totalMarks)} marks` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  const body = (
                    <>
                      <ExamLogo title={exam.title} iconUrl={p.iconUrl} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="flex gap-1.5">
                          {y && <Tag tone="gold">{y}</Tag>}
                          {p.isPro ? (
                            <Tag tone="purple" icon={<Lock />}>
                              Pro
                            </Tag>
                          ) : (
                            <Tag tone="success">Free</Tag>
                          )}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-[14px] font-semibold text-ink">{p.title}</span>
                        {meta && <span className="block text-[12px] text-muted">{meta}</span>}
                      </span>
                      <ChevronRight className="h-5 w-5 text-faint" />
                    </>
                  );
                  const cls = 'flex w-full items-center gap-3 rounded-card border border-line bg-white p-3.5 text-left shadow-card hover:border-primary/30';
                  return locked ? (
                    <button key={p.id} type="button" className={cls} onClick={() => setProOpen(true)}>
                      {body}
                    </button>
                  ) : (
                    <Link key={p.id} to={`/test/${encodeURIComponent(p.id)}/details`} className={cls}>
                      {body}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
      <ProDialog open={proOpen} onClose={() => setProOpen(false)} what="previous year paper" />
    </div>
  );
}
