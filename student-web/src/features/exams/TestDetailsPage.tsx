import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Clock, Crown, HelpCircle, History, Info, MinusCircle, SearchX, Timer, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { fmtDate, fmtNum, fmtSchedule } from '@/lib/format';
import { isLiveNow } from '@/services/catalog';
import { useAttemptHistory, useExams, useInProgressAttempts, useIsPro, useLiveTests, useSubscription, useTest } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { MockTest } from '@/types/models';

/** Rules built from this test's real numbers (test_details_screen.dart). */
export function buildRules(t: Pick<MockTest, 'totalQuestions' | 'durationMinutes' | 'totalMarks' | 'negativeMarking'>): string[] {
  const per = t.totalQuestions > 0 && t.totalMarks > 0 ? t.totalMarks / t.totalQuestions : null;
  return [
    `The test contains ${t.totalQuestions} multiple choice questions.`,
    `Total duration of this test is ${t.durationMinutes} minutes.`,
    per !== null ? `Each correct answer carries ${fmtNum(per)} ${per === 1 ? 'mark' : 'marks'}.` : null,
    t.negativeMarking > 0
      ? `Negative marking of ${fmtNum(t.negativeMarking)} marks will be deducted for each wrong answer.`
      : 'There is no negative marking for wrong answers.',
    'You can review and change your answers before final submission.',
    'The test will be automatically submitted when the timer reaches 00:00.',
  ].filter(Boolean) as string[];
}

function Metric({ icon, color, value, label }: { icon: ReactNode; color: string; value: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-[#E2E8F0] bg-white p-3.5">
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] [&>svg]:h-5 [&>svg]:w-5" style={{ background: `${color}1F`, color }}>
        {icon}
      </span>
      <span>
        <span className="block text-[16px] font-extrabold text-[#0F172A]">{value}</span>
        <span className="block text-[12px] font-medium text-[#64748B]">{label}</span>
      </span>
    </div>
  );
}

export default function TestDetailsPage() {
  const { testId = '' } = useParams();
  const navigate = useNavigate();
  const test = useTest(testId);
  const exams = useExams();
  const live = useLiveTests();
  const history = useAttemptHistory();
  const inProgress = useInProgressAttempts();
  const subscription = useSubscription();
  const isPro = useIsPro();

  if (test.isLoading) return <Loader />;
  if (test.isError) return <ErrorState message="Could not load test details." error={test.error} onRetry={() => void test.refetch()} />;
  const t = test.data;
  if (!t) {
    return (
      <>
        <PageHeader title="Test Instructions" back="/exams" />
        <Message icon={<SearchX />} title="Test not found" message="It may have been removed. Go back and select another test." />
      </>
    );
  }

  const examTitle = exams.data?.find((e) => e.id === t.examId)?.title ?? null;
  const liveInfo = (live.data ?? []).find((l) => l.testId === t.id);
  const liveUpcoming = !!liveInfo && !isLiveNow(liveInfo) && !!liveInfo.startAt && liveInfo.startAt > new Date();
  const needsPro = (t.isPro || liveInfo?.subscriptionRequired === true) && !isPro && !subscription.isLoading;
  const resumable = (inProgress.data ?? []).find(
    (a) => a.testId === t.id && a.startedAt.getTime() + a.durationMinutes * 60_000 > Date.now()
  );
  const past = (history.data ?? []).filter((a) => a.testId === t.id);
  const best = past.reduce<(typeof past)[number] | null>((b, a) => (!b || a.percentage > b.percentage ? a : b), null);
  const runnerTitle = examTitle ? `${examTitle} - ${t.title}` : t.title;
  const start = () => navigate(`/test/${encodeURIComponent(t.id)}/active?title=${encodeURIComponent(runnerTitle)}`);

  const cta = needsPro ? (
    <Button size="lg" block icon={<Crown className="h-5 w-5" />} onClick={() => navigate('/plans')}>
      Unlock with Pro
    </Button>
  ) : liveUpcoming ? (
    <Button size="lg" block disabled icon={<Clock className="h-5 w-5" />}>
      Starts {fmtSchedule(liveInfo!.startAt)}
    </Button>
  ) : (
    <Button size="lg" block onClick={start} trailingIcon={<ArrowRight className="h-5 w-5" />}>
      {resumable ? 'Resume Test' : past.length > 0 ? 'Re-attempt Test' : 'Start Test'}
    </Button>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Test Instructions" back={t.examId ? `/exams/${t.examId}` : '/exams'} />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="space-y-4">
          <Card className="flex items-center gap-4 p-4">
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#EFF6FF] text-[#2563EB]">
              <BookOpen className="h-[26px] w-[26px]" />
            </span>
            <div className="min-w-0">
              {examTitle && <p className="text-[13px] font-semibold text-[#64748B]">{examTitle}</p>}
              <h2 className="text-[18px] font-extrabold leading-snug text-[#0F172A]">{t.title}</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {t.category}
                {t.year ? ` · ${t.year}` : ''}
                {t.isPro ? ' · PRO' : ' · Free'}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<HelpCircle />} color="#2563EB" value={t.totalQuestions} label="Questions" />
            <Metric icon={<Timer />} color="#0D9488" value={t.durationMinutes} label="Minutes" />
            <Metric icon={<Trophy />} color="#D97706" value={fmtNum(t.totalMarks)} label="Total Marks" />
            <Metric icon={<MinusCircle />} color="#DC2626" value={t.negativeMarking > 0 ? `-${fmtNum(t.negativeMarking)}` : 'None'} label="Negative Marking" />
          </div>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[16px] font-bold text-ink">
              <Info className="h-[22px] w-[22px] text-[#2563EB]" /> Important Instructions
            </h3>
            <ul className="space-y-2.5">
              {buildRules(t).map((r) => (
                <li key={r} className="flex gap-2.5 text-[13.5px] font-medium leading-relaxed text-[#334155]">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#2563EB]" />
                  {r}
                </li>
              ))}
              {liveInfo?.instructions && (
                <li className="flex gap-2.5 whitespace-pre-line text-[13.5px] font-medium leading-relaxed text-[#334155]">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#2563EB]" />
                  {liveInfo.instructions}
                </li>
              )}
            </ul>
          </Card>
        </div>

        <aside className="mt-4 space-y-4 lg:mt-0">
          {needsPro && (
            <Card className="border-[#FDE68A] bg-gold-soft p-4">
              <p className="flex items-center gap-2 text-[14px] font-extrabold text-[#92400E]">
                <Crown className="h-4 w-4" /> PracticeKoro PRO
              </p>
              <p className="mt-1 text-[13px] text-[#92400E]">
                This test requires a PRO membership. Unlock full tests, detailed solutions, and performance rankings with PRO.
              </p>
            </Card>
          )}
          {resumable && !needsPro && (
            <Card className="border-primary/30 bg-primary-soft p-4 text-[13px] text-primary">
              You have an unfinished attempt. Your saved answers are kept while time remains.
            </Card>
          )}
          {best && (
            <Card className="p-4">
              <p className="flex items-center gap-2 text-[13px] font-bold text-muted">
                <History className="h-4 w-4" /> Your attempts ({past.length})
              </p>
              <p className="mt-1 text-[22px] font-extrabold text-ink">
                Best {Math.round(best.percentage)}%
                <span className="ml-1 text-[13px] font-semibold text-muted">
                  ({fmtNum(best.score)} / {fmtNum(best.totalMarks)})
                </span>
              </p>
              <p className="text-[12px] text-faint">Last attempted {fmtDate(past[0].completedAt)}</p>
              <Link to={`/result/${past[0].id}`} className="mt-2 inline-block text-[13px] font-bold text-primary hover:underline">
                View last result →
              </Link>
            </Card>
          )}
          <div className="hidden lg:block">{cta}</div>
        </aside>
      </div>

      {/* Sticky start bar on small screens (above the bottom navigation) */}
      <div className="fixed inset-x-0 bottom-[86px] z-20 border-t border-[#E2E8F0] bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:pl-[92px] lg:hidden">
        {cta}
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}
