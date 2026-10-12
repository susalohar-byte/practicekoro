import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Headphones, Mic, Play, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { formatDuration, youTubeThumbnailUrl } from '@/lib/youtube';
import { YouTubeAudioPlayer } from '@/components/audiobooks/YouTubeAudioPlayer';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import {
  audioBookStudentApi,
  type AudioBook,
  type AudioBookTaxonomy,
} from '@/services/domains/audiobooks';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const cardClass =
  'rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900';

/** Uploaded thumbnail, then the YouTube still, then an icon. */
const Cover: React.FC<{ book: AudioBook; className?: string }> = ({ book, className }) => {
  const sources = [book.thumbnailUrl, youTubeThumbnailUrl(book.youtubeVideoId)].filter(
    Boolean
  ) as string[];
  const [index, setIndex] = useState(0);
  const src = sources[index];
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden bg-blue-50 text-blue-600 dark:bg-blue-950/50',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setIndex((i) => i + 1)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Headphones className="h-8 w-8" aria-hidden="true" />
      )}
    </div>
  );
};

const Empty: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
      <Headphones className="h-6 w-6" aria-hidden="true" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const AudioBooks: React.FC = () => {
  const [books, setBooks] = useState<AudioBook[]>([]);
  const [taxonomy, setTaxonomy] = useState<AudioBookTaxonomy>({
    categories: [],
    subjects: [],
    topics: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [params, setParams] = useSearchParams();
  const playerRef = useRef<HTMLElement>(null);
  const recorded = useRef<string | null>(null);
  const playingId = params.get('play');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, tax] = await Promise.all([
        audioBookStudentApi.listPublished(),
        audioBookStudentApi.getTaxonomy(),
      ]);
      setBooks(list);
      setTaxonomy(tax);
    } catch (err) {
      setError(getErrorMessage(err, 'Audio books could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of [...taxonomy.categories, ...taxonomy.subjects, ...taxonomy.topics])
      map.set(row.id, row.name);
    return map;
  }, [taxonomy]);

  // Only categories that actually have published books.
  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of books) counts.set(b.categoryId, (counts.get(b.categoryId) ?? 0) + 1);
    return [
      { value: 'all', label: 'All', count: books.length },
      ...taxonomy.categories
        .filter((c) => counts.has(c.id))
        .map((c) => ({ value: c.id, label: c.name, count: counts.get(c.id) ?? 0 })),
    ];
  }, [books, taxonomy.categories]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return books.filter((b) => {
      if (category !== 'all' && b.categoryId !== category) return false;
      if (!needle) return true;
      return [b.title, b.narrator, names.get(b.subjectId), b.topicId ? names.get(b.topicId) : '']
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle));
    });
  }, [books, category, search, names]);

  const playing = playingId ? (books.find((b) => b.id === playingId) ?? null) : null;

  const open = (book: AudioBook) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.set('play', book.id);
      return next;
    });
  const close = () =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.delete('play');
      return next;
    });

  useEffect(() => {
    if (playing) playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [playing]);

  const trail = (b: AudioBook) =>
    [names.get(b.subjectId), b.topicId ? names.get(b.topicId) : null].filter(Boolean).join(' · ');

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Audio Books
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Listen to focused lessons and revise topics wherever you are.
        </p>
      </header>

      {loading ? (
        <StudentLoading label="Loading audio books" />
      ) : error ? (
        <StudentLoadError message={error} onRetry={() => void load()} />
      ) : (
        <>
          {playingId && !playing && (
            <Empty
              title="This audio book is not available"
              description="It may have been unpublished or removed."
              action={
                <button
                  type="button"
                  onClick={close}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Browse audio books
                </button>
              }
            />
          )}

          {playing && (
            <section
              ref={playerRef}
              aria-label={`Now playing: ${playing.title}`}
              className={cn(cardClass, 'scroll-mt-24 p-4 sm:p-5')}
            >
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="order-2 min-w-0 md:order-1">
                  <div className="flex items-start gap-3">
                    <Cover book={playing} className="h-16 w-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">
                        {names.get(playing.categoryId) ?? 'Audio Book'}
                      </p>
                      <h2 className="mt-0.5 text-lg font-extrabold leading-snug text-slate-900 dark:text-white">
                        {playing.title}
                      </h2>
                      {trail(playing) && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {trail(playing)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close player"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {playing.narrator && (
                      <span className="inline-flex items-center gap-1">
                        <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                        {playing.narrator}
                      </span>
                    )}
                    {playing.durationSeconds && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDuration(playing.durationSeconds)}
                      </span>
                    )}
                    {playing.publishedAt && (
                      <span>Published {dateFormat.format(new Date(playing.publishedAt))}</span>
                    )}
                  </div>
                  {playing.description && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {playing.description}
                    </p>
                  )}
                </div>
                <div className="order-1 min-w-0 md:order-2">
                  <YouTubeAudioPlayer
                    key={playing.id}
                    videoId={playing.youtubeVideoId}
                    title={playing.title}
                    onFirstPlay={() => {
                      if (recorded.current === playing.id) return;
                      recorded.current = playing.id;
                      void audioBookStudentApi.recordListen(playing.id).catch(() => undefined);
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {books.length === 0 ? (
            <Empty
              title="No audio books yet"
              description="New audio lessons will appear here as soon as they are published."
            />
          ) : (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {categoryTabs.length > 2 && (
                  <div
                    role="tablist"
                    aria-label="Audio book categories"
                    className="flex min-w-0 gap-2 overflow-x-auto pb-1"
                  >
                    {categoryTabs.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={category === tab.value}
                        onClick={() => setCategory(tab.value)}
                        className={cn(
                          'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                          category === tab.value
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        )}
                      >
                        {tab.label} <span className="opacity-70">({tab.count})</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative w-full lg:ml-auto lg:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, subject or topic"
                    aria-label="Search audio books"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {visible.length === 0 ? (
                <Empty
                  title="No audio books match your search"
                  description="Try another word or category."
                />
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((book) => (
                    <li key={book.id}>
                      <button
                        type="button"
                        onClick={() => open(book)}
                        aria-label={`Play ${book.title}`}
                        className={cn(
                          cardClass,
                          'group flex w-full flex-col overflow-hidden text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25',
                          book.id === playingId && 'ring-2 ring-blue-600'
                        )}
                      >
                        <div className="relative">
                          <Cover book={book} className="aspect-video w-full" />
                          <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform group-hover:scale-105">
                            <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
                          </span>
                          {book.durationSeconds && (
                            <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                              {formatDuration(book.durationSeconds)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 p-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-600">
                            {names.get(book.categoryId)}
                          </p>
                          <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">
                            {book.title}
                          </h3>
                          {trail(book) && (
                            <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                              {trail(book)}
                            </p>
                          )}
                          {book.narrator && (
                            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Mic className="h-3 w-3" aria-hidden="true" />
                              {book.narrator}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
};
