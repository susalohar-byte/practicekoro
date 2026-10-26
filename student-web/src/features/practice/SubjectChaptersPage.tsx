import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronRight, Search, SearchX, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSubjects, useTopics } from '@/hooks/queries';
import { isChapterDone, isChapterWeak, useChapterProgress } from '@/hooks/useChapterProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message, Skeleton } from '@/components/ui/Feedback';

type Filter = 'all' | 'weak' | 'completed';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All Topics' },
  { value: 'weak', label: 'Weak Topics' },
  { value: 'completed', label: 'Completed' },
];

export default function SubjectChaptersPage() {
  const [params] = useSearchParams();
  const subjects = useSubjects();
  const wantedId = params.get('subjectId') ?? params.get('id');
  const wantedName = params.get('subject');
  const subject =
    (subjects.data ?? []).find((s) => s.id === wantedId) ??
    (subjects.data ?? []).find((s) => wantedId && s.id.toLowerCase() === wantedId.toLowerCase()) ??
    (subjects.data ?? []).find((s) =>
      wantedName ? [s.nameEnglish, s.nameBengali, s.slug].some((v) => v.toLowerCase() === wantedName.toLowerCase()) : false
    );
  const topics = useTopics(subject?.id ?? '__none__');
  const { map: progress } = useChapterProgress();
  const initial = params.get('filter');
  const [filter, setFilter] = useState<Filter>(initial === 'weak' || initial === 'completed' ? initial : 'all');
  const [query, setQuery] = useState('');

  if (subjects.isLoading) return <Loader />;
  if (subjects.isError) return <ErrorState message="Could not load subjects." error={subjects.error} onRetry={() => void subjects.refetch()} />;
  if (!subject) {
    return (
      <>
        <PageHeader title="Chapters" back="/practice" />
        <Message icon={<SearchX />} title="Subject not found" message="It may have been removed. Go back and choose another subject." />
      </>
    );
  }

  const term = query.trim().toLowerCase();
  const list = (topics.data ?? [])
    .filter((t) => (!term ? true : [t.title, t.titleBengali ?? ''].some((v) => v.toLowerCase().includes(term))))
    .filter((t) => (filter === 'weak' ? isChapterWeak(progress.get(t.id)) : filter === 'completed' ? isChapterDone(progress.get(t.id)) : true));
  const chapterCount = topics.data?.length ?? subject.chapterCount;

  const empty = term
    ? { icon: <SearchX />, title: 'No matching topics', message: 'Try a different keyword.' }
    : filter === 'weak'
      ? { icon: <Trophy />, title: 'No weak topics — great work', message: 'Topics needing improvement will show here.' }
      : filter === 'completed'
        ? { icon: <CheckCircle2 />, title: 'No topics completed yet', message: 'Finish all tests in a chapter to see it here.' }
        : { icon: <BookOpen />, title: 'No chapters available', message: 'Chapters for this subject will be added soon.' };

  return (
    <div>
      <PageHeader
        title={subject.nameEnglish}
        subtitle={`${chapterCount} Chapters • ${subject.totalTests} Tests`}
        back="/practice"
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-[46px] flex-1 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 focus-within:border-primary">
          <Search className="h-5 w-5 text-[#64748B]" aria-hidden />
          <span className="sr-only">Search chapters or topics</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters or topics..."
            className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#94A3B8]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X className="h-[18px] w-[18px] text-[#64748B]" />
            </button>
          )}
        </label>
        <div role="radiogroup" aria-label="Filter topics" className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-2 text-[13px]',
                filter === f.value ? 'bg-primary font-bold text-white' : 'border border-[#E2E8F0] bg-white font-medium text-[#475569]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {topics.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[74px]" />
          ))}
        </div>
      ) : topics.isError ? (
        <ErrorState message="Could not load topics." error={topics.error} onRetry={() => void topics.refetch()} />
      ) : list.length === 0 ? (
        <Message {...empty} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => {
            const index = (topics.data ?? []).indexOf(t);
            const p = progress.get(t.id);
            const total = p?.total ?? t.totalTests;
            const done = isChapterDone(p);
            return (
              <Link
                key={t.id}
                to={`/topic/${encodeURIComponent(t.id)}/tests?title=${encodeURIComponent(t.title)}`}
                className="flex items-center gap-3 rounded-2xl border-[1.1px] border-[#E2E8F0] bg-white p-3.5 transition hover:-translate-y-px hover:border-primary/30"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] text-[15px] font-extrabold text-[#2563EB]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-ink">{t.title}</span>
                  <span className="block truncate text-[12.5px] font-medium text-[#64748B]">
                    {total} {total === 1 ? 'Test' : 'Tests'}
                    {t.titleBengali && (
                      <>
                        {' • '}
                        <span lang="bn">{t.titleBengali}</span>
                      </>
                    )}
                  </span>
                </span>
                <span className="w-16 shrink-0 text-right">
                  <span className={cn('block text-[12px] font-bold', done ? 'text-success' : 'text-[#64748B]')}>
                    {done ? 'Done' : `${p?.completed ?? 0}/${total}`}
                  </span>
                  <span className="mt-1 block h-[5px] overflow-hidden rounded bg-[#E2E8F0]">
                    <span
                      className={cn('block h-full rounded', done ? 'bg-success' : 'bg-[#2563EB]')}
                      style={{ width: `${total > 0 ? ((p?.completed ?? 0) / total) * 100 : 0}%` }}
                    />
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#94A3B8]" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
