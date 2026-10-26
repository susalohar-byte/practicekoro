import { useState } from 'react';
import { Check, ClipboardList, FileText, FilterX, Tag as TopicIcon, BookOpen } from 'lucide-react';
import { fmtDate, fmtDuration, fmtNum, fmtTime } from '@/lib/format';
import { useAttemptHistory } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Chips } from '@/components/ui/Chips';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { ProgressBar, scoreColor } from '@/components/ui/ProgressBar';

type F = 'all' | 'mock' | 'topic';

export default function TestHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useAttemptHistory();
  const [f, setF] = useState<F>('all');
  const all = data ?? [];
  const topic = all.filter((a) => a.category === 'Topic Test');
  const list = f === 'all' ? all : f === 'topic' ? topic : all.filter((a) => a.category !== 'Topic Test');

  return (
    <div>
      <PageHeader title="My Tests" back="/profile" />
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorState message="Your test history could not be loaded." error={error} onRetry={() => void refetch()} />
      ) : all.length === 0 ? (
        <Message
          icon={<ClipboardList />}
          title="No tests taken yet"
          message="Finished tests and practice sessions appear here."
          action={<ButtonLink to="/exams" variant="secondary">Browse tests</ButtonLink>}
        />
      ) : (
        <>
          <Chips
            label="Filter tests"
            className="mb-4"
            value={f}
            onChange={setF}
            options={[
              { value: 'all', label: 'All', count: all.length },
              { value: 'mock', label: 'Mock & PYQ', count: all.length - topic.length },
              { value: 'topic', label: 'Topic Practice', count: topic.length },
            ]}
          />
          {list.length === 0 ? (
            <Message icon={<FilterX />} title="Nothing in this filter" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((a) => {
                const isTopic = a.category === 'Topic Test';
                const frac = a.percentage / 100;
                return (
                  <Card key={a.id} className="p-3.5">
                    <div className="flex items-start gap-3">
                      <span className={isTopic ? 'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple' : 'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'}>
                        {isTopic ? <TopicIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[14px] font-semibold text-ink">{a.testTitle}</p>
                        <p className="text-[12px] text-muted">
                          {fmtDate(a.completedAt)}, {fmtTime(a.completedAt)} · {a.timeSpentSeconds > 0 ? fmtDuration(a.timeSpentSeconds) : '–'}
                        </p>
                      </div>
                      <Tag tone="success" icon={<Check />}>
                        Completed
                      </Tag>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[16.5px] font-bold" style={{ color: scoreColor(frac) }}>
                        {fmtNum(a.score)} / {fmtNum(a.totalMarks)}
                      </span>
                      <span className="text-[12px] text-muted">{Math.round(a.percentage)}%</span>
                      <span className="ml-auto text-[12px] text-muted">
                        {a.correctCount} correct · {a.wrongCount} wrong · {a.skippedCount} skipped
                      </span>
                    </div>
                    <ProgressBar value={frac} className="mt-2" label="Score" />
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <ButtonLink to={`/solutions/${a.id}`} variant="secondary" size="sm" icon={<BookOpen className="h-4 w-4" />}>
                        Solutions
                      </ButtonLink>
                      <ButtonLink to={`/result/${a.id}`} size="sm">
                        View Result
                      </ButtonLink>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
