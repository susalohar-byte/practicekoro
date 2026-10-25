import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Search, SearchX, Tag as TagIcon } from 'lucide-react';
import { useExams, useSubjects, useTopics } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { ExamLogo } from '@/components/ui/Brand';
import { paletteAt, subjectIcon } from '@/components/domain/subjectVisuals';

function Row({ to, leading, title, subtitle }: { to: string; leading: ReactNode; title: string; subtitle?: string | null }) {
  return (
    <Link to={to} className="flex min-h-[60px] items-center gap-3.5 px-1 py-2.5 hover:bg-surface/60">
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-ink">{title}</span>
        {subtitle && <span className="block truncate text-[12px] text-muted">{subtitle}</span>}
      </span>
      <ChevronRight className="h-5 w-5 text-faint" />
    </Link>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[16.5px] font-bold text-ink">{title}</h2>
      <div className="divide-y divide-line rounded-card border border-line bg-white px-3 shadow-card">{children}</div>
    </section>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const exams = useExams();
  const subjects = useSubjects();
  const topics = useTopics(null);
  const term = q.trim().toLowerCase();

  const results = useMemo(() => {
    const has = (...v: (string | null | undefined)[]) => v.some((x) => (x ?? '').toLowerCase().includes(term));
    if (!term) return null;
    return {
      exams: (exams.data ?? []).filter((e) => has(e.title, e.category, e.description)),
      subjects: (subjects.data ?? []).filter((s) => has(s.nameEnglish, s.nameBengali, s.slug)),
      topics: (topics.data ?? []).filter((t) => has(t.title, t.titleBengali, t.slug)),
    };
  }, [term, exams.data, subjects.data, topics.data]);

  const loading = exams.isLoading || subjects.isLoading || topics.isLoading;
  const allFailed = exams.isError && subjects.isError && topics.isError;
  const subjectName = (id: string) => subjects.data?.find((s) => s.id === id)?.nameEnglish;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Search" back="/home" />
      <label className="flex h-12 items-center gap-2.5 rounded-card bg-surface px-3.5 ring-primary/30 focus-within:bg-white focus-within:ring-2">
        <Search className="h-5 w-5 text-muted" aria-hidden />
        <span className="sr-only">Search exams, subjects, topics</span>
        <input
          autoFocus={!q}
          value={q}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="Search exams, subjects, topics"
          className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
        />
      </label>

      {loading && term ? (
        <Loader />
      ) : allFailed ? (
        <ErrorState
          message="Search data could not be loaded."
          onRetry={() => {
            void exams.refetch();
            void subjects.refetch();
            void topics.refetch();
          }}
        />
      ) : !results ? (
        <Message icon={<Search />} title="What do you want to practise?" message='Try an exam like "WBP", a subject like "History", or a topic.' />
      ) : results.exams.length + results.subjects.length + results.topics.length === 0 ? (
        <Message icon={<SearchX />} title={`No results for "${q.trim()}"`} message="Check the spelling or try a shorter word." />
      ) : (
        <>
          {results.exams.length > 0 && (
            <Group title={`Exams (${results.exams.length})`}>
              {results.exams.map((e) => (
                <Row key={e.id} to={`/exams/${encodeURIComponent(e.id)}`} leading={<ExamLogo title={e.title} iconUrl={e.iconUrl} size={40} />} title={e.title} subtitle={e.category} />
              ))}
            </Group>
          )}
          {results.subjects.length > 0 && (
            <Group title={`Subjects (${results.subjects.length})`}>
              {results.subjects.map((s, i) => {
                const Icon = subjectIcon(s.nameEnglish);
                const c = paletteAt(i);
                return (
                  <Row
                    key={s.id}
                    to={`/topic-tests?subjectId=${encodeURIComponent(s.id)}&subject=${encodeURIComponent(s.nameEnglish)}`}
                    leading={
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${c}1F`, color: c }}>
                        <Icon className="h-[22px] w-[22px]" />
                      </span>
                    }
                    title={s.nameEnglish}
                    subtitle={s.nameBengali}
                  />
                );
              })}
            </Group>
          )}
          {results.topics.length > 0 && (
            <Group title={`Topics (${results.topics.length})`}>
              {results.topics.map((t) => (
                <Row
                  key={t.id}
                  to={`/topic/${encodeURIComponent(t.id)}/tests?title=${encodeURIComponent(t.title)}`}
                  leading={
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple/10 text-purple">
                      <TagIcon className="h-[22px] w-[22px]" />
                    </span>
                  }
                  title={t.title}
                  subtitle={subjectName(t.subjectId)}
                />
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  );
}
