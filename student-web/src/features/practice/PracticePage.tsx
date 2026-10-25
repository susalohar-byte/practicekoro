import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, FilterX, GraduationCap, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSubjects, useTopics } from '@/hooks/queries';
import { useChapterProgress, isChapterWeak } from '@/hooks/useChapterProgress';
import { ErrorState, Message, Skeleton } from '@/components/ui/Feedback';
import { subjectColor, subjectIcon } from '@/components/domain/subjectVisuals';
import type { Subject } from '@/types/models';

type Filter = null | 'gs' | 'sci' | 'quant';
const FILTERS: { value: Filter; label: string }[] = [
  { value: null, label: 'All Subjects' },
  { value: 'gs', label: 'General Studies' },
  { value: 'sci', label: 'Science & Tech' },
  { value: 'quant', label: 'Quantitative' },
];

function matchesFilter(s: Subject, f: Filter): boolean {
  if (!f) return true;
  const slug = `${s.slug} ${s.nameEnglish}`.toLowerCase();
  if (f === 'gs') return ['history', 'geo', 'polity', 'econ', 'gk', 'ca', 'general knowledge', 'current'].some((k) => slug.includes(k));
  if (f === 'sci') return ['sci', 'env'].some((k) => slug.includes(k));
  return slug.includes('math');
}

function SubjectCard({ s, index, chapters }: { s: Subject; index: number; chapters: number }) {
  const color = subjectColor(s.nameEnglish, index);
  const Icon = subjectIcon(s.nameEnglish);
  return (
    <Link
      to={`/topic-tests?subjectId=${encodeURIComponent(s.id)}&subject=${encodeURIComponent(s.nameEnglish)}`}
      className="flex items-center gap-3.5 rounded-2xl border-[1.1px] border-[#E2E8F0] bg-white px-4 py-3.5 shadow-card transition hover:-translate-y-px hover:border-primary/30"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]" style={{ background: `${color}24`, color }}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">
          <span className="text-[16px] font-bold text-[#0F172A]">{s.nameEnglish}</span>
          {s.nameBengali && s.nameBengali !== s.nameEnglish && (
            <span lang="bn" className="ml-1 text-[12.5px] font-medium text-[#64748B]">
              ({s.nameBengali})
            </span>
          )}
        </span>
        <span className="block text-[13px] font-medium text-[#64748B]">
          {chapters} Chapters • {s.totalTests > 0 ? `${s.totalTests} Tests` : 'Mock Tests'}
        </span>
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function PracticePage() {
  const subjects = useSubjects();
  const topics = useTopics(null);
  const { map: progress } = useChapterProgress();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(null);
  const [showFilter, setShowFilter] = useState(false);
  const term = query.trim().toLowerCase();

  const chaptersOf = (s: Subject) => s.chapterCount || (topics.data ?? []).filter((t) => t.subjectId === s.id).length;
  const visibleSubjects = (subjects.data ?? []).filter((s) => matchesFilter(s, filter));

  const search = useMemo(() => {
    if (!term) return null;
    const has = (...v: (string | null)[]) => v.some((x) => (x ?? '').toLowerCase().includes(term));
    return {
      subjects: (subjects.data ?? []).filter((s) => has(s.nameEnglish, s.nameBengali, s.slug)),
      topics: (topics.data ?? []).filter((t) => has(t.title, t.titleBengali, t.slug)),
    };
  }, [term, subjects.data, topics.data]);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">Practice</h1>
        <p className="mt-0.5 text-[13px] text-muted">Subject and chapter-wise tests</p>
      </header>

      <div className="mb-5 flex gap-2.5">
        <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <Search className="h-5 w-5 text-[#64748B]" aria-hidden />
          <span className="sr-only">Search subjects and chapters</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search subjects & chapters... e.g. "History" or "ইতিহাস"'
            className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] font-medium outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-[#64748B]">
              <X className="h-[18px] w-[18px]" />
            </button>
          )}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            aria-expanded={showFilter}
            aria-label="Filter Subjects"
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border',
              filter ? 'border-primary bg-primary/10 text-primary' : 'border-[#E2E8F0] bg-white text-[#475569]'
            )}
          >
            <SlidersHorizontal className="h-[22px] w-[22px]" />
          </button>
          {showFilter && (
            <div className="absolute right-0 top-14 z-20 w-64 rounded-2xl border border-line bg-white p-4 shadow-raised">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[15px] font-bold text-ink">Filter Subjects</p>
                {filter && (
                  <button type="button" onClick={() => setFilter(null)} className="text-[13px] font-semibold text-primary">
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={filter === f.value}
                    onClick={() => {
                      setFilter(f.value);
                      setShowFilter(false);
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[13px]',
                      filter === f.value ? 'border-primary bg-primary/15 font-bold text-primary' : 'border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {subjects.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[78px]" />
          ))}
        </div>
      ) : subjects.isError ? (
        <ErrorState message="Could not load subjects." error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : search ? (
        search.subjects.length + search.topics.length === 0 ? (
          <Message icon={<SearchX />} title="No results found" message={`No subjects or chapters match "${term}".`} />
        ) : (
          <>
            {search.subjects.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 flex items-center gap-1.5 text-[12px] font-extrabold tracking-wider text-[#64748B]">
                  <GraduationCap className="h-4 w-4" /> SUBJECTS ({search.subjects.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {search.subjects.map((s, i) => (
                    <SubjectCard key={s.id} s={s} index={i} chapters={chaptersOf(s)} />
                  ))}
                </div>
              </section>
            )}
            {search.topics.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-1.5 text-[12px] font-extrabold tracking-wider text-[#64748B]">
                  <BookOpen className="h-4 w-4" /> CHAPTERS & TOPICS ({search.topics.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {search.topics.map((t) => {
                    const parent = subjects.data?.find((s) => s.id === t.subjectId);
                    const color = parent ? subjectColor(parent.nameEnglish, 0) : '#016BFC';
                    const p = progress.get(t.id);
                    return (
                      <Link
                        key={t.id}
                        to={`/topic/${encodeURIComponent(t.id)}/tests?title=${encodeURIComponent(t.title)}`}
                        className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 hover:border-primary/30"
                      >
                        <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1F`, color }}>
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[15px] font-bold text-ink">{t.title}</span>
                            {isChapterWeak(p) && <span className="rounded bg-[#EF4444]/10 px-1.5 text-[10.5px] font-bold text-[#EF4444]">Weak</span>}
                          </span>
                          {t.titleBengali && (
                            <span lang="bn" className="block truncate text-[12.5px] text-[#64748B]">
                              {t.titleBengali}
                            </span>
                          )}
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#64748B]">
                            <span className="rounded bg-surface px-1.5 font-semibold">{parent?.nameEnglish ?? 'Chapter'}</span>
                            {t.totalTests > 0 ? `${t.totalTests} Tests` : 'Mock Tests'}
                            {p && p.completed > 0 && p.total > 0 && (
                              <span className="text-success">• {Math.round((p.completed / p.total) * 100)}% done</span>
                            )}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#94A3B8]" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )
      ) : (subjects.data ?? []).length === 0 ? (
        <Message icon={<BookOpen />} title="No subjects yet" message="Subjects will appear here once they are added." />
      ) : visibleSubjects.length === 0 ? (
        <Message icon={<FilterX />} title="No subjects in this category" message="Try resetting the filter to see all subjects." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleSubjects.map((s, i) => (
            <SubjectCard key={s.id} s={s} index={i} chapters={chaptersOf(s)} />
          ))}
        </div>
      )}
    </div>
  );
}
