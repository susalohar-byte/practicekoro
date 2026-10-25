import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, MapPin, RotateCcw, SearchX, Share2, Trophy, Users } from 'lucide-react';
import { fmtDate, fmtDuration, fmtNum, fmtTime, ordinal } from '@/lib/format';
import { useAttempt, useAttemptRankings, useTest } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

function ScoreRing({ score, total }: { score: number; total: number }) {
  const r = 73;
  const c = 2 * Math.PI * r;
  const p = total > 0 ? Math.min(1, Math.max(0, score / total)) : 0;
  return (
    <div className="relative h-[170px] w-[170px]" role="img" aria-label={`Score ${fmtNum(score)} out of ${fmtNum(total)}`}>
      <svg viewBox="0 0 170 170" className="h-full w-full -rotate-90">
        <circle cx="85" cy="85" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle cx="85" cy="85" r={r} fill="none" stroke="#0158FC" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p>
          <span className="text-[28px] font-black text-ink">{fmtNum(score, 1)}</span>
          <span className="text-[16px] font-bold text-[#64748B]"> / {fmtNum(total, 0)}</span>
        </p>
        <p className="text-[13px] font-semibold text-[#64748B]">Score</p>
      </div>
    </div>
  );
}

function Row({ label, value, tone, strong }: { label: string; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className={strong ? 'text-[13.5px] font-bold text-[#0F172A]' : 'text-[13.5px] font-medium text-[#64748B]'}>{label}</dt>
      <dd className={strong ? 'text-[14px] font-extrabold' : 'text-[14px] font-bold text-ink'} style={tone ? { color: tone } : undefined}>
        {value}
      </dd>
    </div>
  );
}

export default function ResultPage() {
  const { attemptId = '' } = useParams();
  const toast = useToast();
  const attempt = useAttempt(attemptId);
  const a = attempt.data;
  const rankings = useAttemptRankings(attemptId, !!a);
  const test = useTest(a?.testId ?? '');

  if (attempt.isLoading) return <Loader />;
  if (attempt.isError) return <ErrorState message="Could not load your result detail." error={attempt.error} onRetry={() => void attempt.refetch()} />;
  if (!a) {
    return (
      <>
        <PageHeader title="Result Detail" back="/results" />
        <Message icon={<SearchX />} title="Result not found" message="This result does not exist or is not yours." action={<ButtonLink to="/results" variant="secondary">My Results</ButtonLink>} />
      </>
    );
  }

  const attempted = a.correctCount + a.wrongCount;
  const totalQs = attempted + a.skippedCount;
  const negPer = test.data?.negativeMarking ?? null;
  const negative = negPer !== null ? a.wrongCount * negPer : null;
  const wb = rankings.data?.westBengal;
  const district = rankings.data?.district;
  const rank = wb?.rank ?? a.rank;
  const outOf = wb?.rank ? wb.participants : a.totalCandidates;

  const share = async () => {
    const text = `I scored ${fmtNum(a.score)}/${fmtNum(a.totalMarks)} (${Math.round(a.percentage)}%) in ${a.testTitle} on PracticeKoro.`;
    try {
      if (navigator.share) await navigator.share({ title: 'My PracticeKoro result', text });
      else {
        await navigator.clipboard.writeText(text);
        toast('Result summary copied to clipboard!', 'success');
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Result Detail"
        back="/results"
        actions={
          <button type="button" onClick={share} aria-label="Share Result" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-surface">
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        }
      />

      <Card className="mb-5 flex items-center gap-3 px-3.5 py-3">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-danger">
          <ClipboardCheck className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold text-ink">{a.testTitle}</p>
          <p className="text-[11.5px] font-medium text-[#64748B]">
            {fmtDate(a.completedAt)} • {fmtTime(a.completedAt)}
          </p>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="flex flex-col items-center p-6">
          <ScoreRing score={a.score} total={a.totalMarks} />
          <div className="mt-6 grid w-full grid-cols-3 text-center">
            <div>
              <p className="text-[18px] font-extrabold text-success">{Math.round(a.accuracy)}%</p>
              <p className="text-[12px] font-semibold text-[#64748B]">Accuracy</p>
            </div>
            <div>
              <p className="text-[18px] font-extrabold text-brand">{fmtDuration(a.timeSpentSeconds)}</p>
              <p className="text-[12px] font-semibold text-[#64748B]">Time Taken</p>
            </div>
            <div>
              <p className="text-[18px] font-extrabold text-[#9333EA]">{rank ? ordinal(rank) : '–'}</p>
              <p className="text-[12px] font-semibold text-[#64748B]">Rank</p>
              {rank && outOf ? <p className="text-[10px] text-[#94A3B8]">(Out of {outOf.toLocaleString('en-IN')})</p> : null}
            </div>
          </div>
          {a.percentile !== null && (
            <p className="mt-4 rounded-full bg-purple-soft px-3 py-1 text-[12px] font-bold text-[#7C3AED]">Percentile {fmtNum(a.percentile, 2)}</p>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="px-4 py-2">
            <dl className="divide-y divide-[#F1F5F9]">
              <Row label="Total Questions" value={String(totalQs || test.data?.totalQuestions || 0)} />
              <Row label="Attempted" value={String(attempted)} />
              <Row label="Correct" value={String(a.correctCount)} tone="#16A34A" />
              <Row label="Incorrect" value={String(a.wrongCount)} tone="#DC2626" />
              <Row label="Skipped" value={String(a.skippedCount)} />
              {negative !== null && <Row label="Negative Marking" value={`-${fmtNum(negative)}`} tone="#DC2626" />}
              <Row label="Final Score" value={`${fmtNum(a.score)} / ${fmtNum(a.totalMarks)}`} tone="#0158FC" strong />
            </dl>
          </Card>

          {(wb?.rank || district?.rank) && (
            <Card className="grid grid-cols-2 divide-x divide-line">
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <Users className="h-3.5 w-3.5" /> West Bengal
                </p>
                <p className="mt-1 text-[18px] font-extrabold text-ink">{wb?.rank ? ordinal(wb.rank) : '–'}</p>
                {wb?.rank ? <p className="text-[11px] text-faint">of {wb.participants.toLocaleString('en-IN')}</p> : null}
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <MapPin className="h-3.5 w-3.5" /> {district?.name ?? 'District'}
                </p>
                <p className="mt-1 text-[18px] font-extrabold text-ink">{district?.rank ? ordinal(district.rank) : '–'}</p>
                {district?.rank ? (
                  <p className="text-[11px] text-faint">of {district.participants.toLocaleString('en-IN')}</p>
                ) : (
                  !district?.name && (
                    <Link to="/profile/edit?section=location" className="text-[11.5px] font-semibold text-primary hover:underline">
                      Add your district
                    </Link>
                  )
                )}
              </div>
            </Card>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            <ButtonLink to={`/solutions/${a.id}`} size="lg" block trailingIcon={<ArrowRight className="h-5 w-5" />} className="sm:col-span-2">
              View Answer
            </ButtonLink>
            <ButtonLink to={`/test/${encodeURIComponent(a.testId)}/details`} variant="secondary" size="lg" block icon={<RotateCcw className="h-4 w-4" />}>
              Re-attempt Test
            </ButtonLink>
            <ButtonLink
              to={`/results/rankings?testId=${encodeURIComponent(a.testId)}&title=${encodeURIComponent(a.testTitle)}`}
              variant="secondary"
              size="lg"
              block
              icon={<Trophy className="h-4 w-4" />}
            >
              Rank List
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
