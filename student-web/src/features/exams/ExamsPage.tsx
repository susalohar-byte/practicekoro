import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, SearchX, X } from 'lucide-react';
import { useExams } from '@/hooks/queries';
import { Chips } from '@/components/ui/Chips';
import { ErrorState, Message, Skeleton } from '@/components/ui/Feedback';
import { ExamLogo } from '@/components/ui/Brand';
import type { Exam } from '@/types/models';

const keyOf = (e: Exam) => (e.category ?? '').trim().toLowerCase() || '__other__';

/** Category chip labels from exam_list_screen.dart */
function categoryLabel(key: string, original: string): string {
  if (key === '__other__') return 'Other';
  if (key.includes('state')) return 'State Govt';
  if (key.includes('central')) return 'Central Govt';
  if (key.includes('rail')) return 'Railway';
  if (key.includes('bank')) return 'Banking';
  if (key.includes('teach') || key.includes('tet')) return 'Teaching';
  return original.trim() || key;
}

export default function ExamsPage() {
  const { data, isLoading, isError, error, refetch } = useExams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('__all__');

  const categories = useMemo(() => {
    const keys: string[] = [];
    for (const e of data ?? []) if (!keys.includes(keyOf(e))) keys.push(keyOf(e));
    keys.sort((a, b) => (a === '__other__' ? 1 : b === '__other__' ? -1 : 0));
    return keys;
  }, [data]);

  const term = query.trim().toLowerCase();
  const list = (data ?? []).filter(
    (e) =>
      (category === '__all__' || keyOf(e) === category) &&
      (!term || e.title.toLowerCase().includes(term) || (e.description ?? '').toLowerCase().includes(term))
  );

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">Exams</h1>
        <p className="mt-0.5 text-[13px] text-muted">Choose your exam to see its mock tests, topic tests and previous year papers</p>
      </header>
      <label className="mb-3 flex h-[50px] items-center gap-2.5 rounded-2xl border-[1.2px] border-[#CBD5E1] bg-white px-4 shadow-[0_2px_6px_rgba(30,41,59,0.04)] focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(1,88,252,0.10)] md:max-w-lg">
        <Search className="h-[22px] w-[22px] text-[#64748B]" aria-hidden />
        <span className="sr-only">Search exams</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search exams... e.g. "WBP Constable"'
          className="h-full flex-1 bg-transparent text-[15px] font-medium text-[#0B1F44] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
            <X className="h-5 w-5 text-[#64748B]" />
          </button>
        )}
      </label>

      {isLoading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[90px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load exams." error={error} onRetry={() => void refetch()} />
      ) : (data ?? []).length === 0 ? (
        <Message icon={<BookOpen />} title="No exams yet" message="Exams will appear here once they are added." />
      ) : (
        <>
          {categories.length > 1 && (
            <Chips
              label="Exam category"
              className="mb-4 mt-3"
              value={category}
              onChange={setCategory}
              options={[{ value: '__all__', label: 'All Exams' }, ...categories.map((k) => ({ value: k, label: categoryLabel(k, (data ?? []).find((e) => keyOf(e) === k)?.category ?? k) }))]}
            />
          )}
          {list.length === 0 ? (
            <Message icon={<SearchX />} title="No exams match" message="Try a different name or filter." />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((e) => (
                <Link
                  key={e.id}
                  to={`/exams/${encodeURIComponent(e.id)}`}
                  className="flex items-center gap-3.5 rounded-card border border-line bg-white p-3.5 shadow-card transition hover:-translate-y-px hover:border-primary/30 hover:shadow-raised"
                >
                  <ExamLogo title={e.title} iconUrl={e.iconUrl} size={54} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-bold text-[#0F172A]">{e.title}</span>
                    <span className="block truncate text-[13px] text-[#64748B]">{e.description || e.subtitle || e.category || 'State Competitive Exam'}</span>
                    <span className="block text-[13px] font-bold text-[#0F172A]">
                      {e.totalTests} {e.totalTests === 1 ? 'Test' : 'Tests'}
                    </span>
                  </span>
                  <ChevronRight className="h-[22px] w-[22px] text-[#94A3B8]" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
