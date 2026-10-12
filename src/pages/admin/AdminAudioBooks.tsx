import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FilterX,
  Headphones,
  Home,
  ImageIcon,
  Link2,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { getPageNumbers } from '@/utils/pagination';
import { formatDuration, formatTotalDuration } from '@/lib/youtube';
import { YouTubeAudioPlayer } from '@/components/audiobooks/YouTubeAudioPlayer';
import {
  audioBookAdminApi,
  type AudioBook,
  type AudioBookSort,
  type AudioBookStats,
  type AudioBookStatus,
  type AudioBookTaxonomy,
  type AudioBookUsage,
} from '@/services/domains/audiobooks';
import { AudioBookFormDrawer } from './audioBooks/AudioBookFormDrawer';
import { AudioBookTaxonomyManager } from './audioBooks/AudioBookTaxonomyManager';
import {
  AudioBookThumb,
  ConfirmDialog,
  Toast,
  getSubjectBadgeClass,
  type ConfirmRequest,
  type ToastMessage,
} from './audioBooks/shared';

type Tab = 'books' | 'categories' | 'settings';
const EMPTY_TAXONOMY: AudioBookTaxonomy = { categories: [], subjects: [], topics: [] };
const EMPTY_USAGE: AudioBookUsage = { byCategory: {}, bySubject: {}, byTopic: {} };
const PAGE_SIZES = [8, 10, 20, 50];
const selectClass =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  iconTone: string;
}> = ({ label, value, hint, icon: Icon, tone, iconTone }) => (
  <div className={cn('flex items-center gap-3.5 rounded-2xl border p-4', tone)}>
    <div
      className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', iconTone)}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      <p className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-white">
        {value}
      </p>
      {hint && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  </div>
);

export const AdminAudioBooks: React.FC = () => {
  const [tab, setTab] = useState<Tab>('books');
  const [taxonomy, setTaxonomy] = useState<AudioBookTaxonomy>(EMPTY_TAXONOMY);
  const [usage, setUsage] = useState<AudioBookUsage>(EMPTY_USAGE);
  const [stats, setStats] = useState<AudioBookStats | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [items, setItems] = useState<AudioBook[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<'' | AudioBookStatus>('');
  const [sort, setSort] = useState<AudioBookSort>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerBook, setDrawerBook] = useState<AudioBook | null | undefined>(undefined);
  const [previewBook, setPreviewBook] = useState<AudioBook | null>(null);
  const [menu, setMenu] = useState<{ book: AudioBook; top: number; left: number } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const listRequest = useRef(0);
  // Search needs taxonomy names, but taxonomy reloads must not refetch the list by themselves.
  const taxonomyRef = useRef(taxonomy);
  taxonomyRef.current = taxonomy;

  const notify = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ id: Date.now(), type, text });
  }, []);
  const closeConfirm = useCallback(() => setConfirm(null), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const loadMeta = useCallback(async () => {
    setMetaError(null);
    try {
      const [tax, use, st] = await Promise.all([
        audioBookAdminApi.getTaxonomy(),
        audioBookAdminApi.getUsage(),
        audioBookAdminApi.getStats(),
      ]);
      setTaxonomy(tax);
      setUsage(use);
      setStats(st);
    } catch (err) {
      setMetaError(getErrorMessage(err, 'Audio book data could not be loaded.'));
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    const request = ++listRequest.current;
    setListLoading(true);
    setListError(null);
    try {
      const result = await audioBookAdminApi.list(
        {
          search,
          categoryId: categoryId || undefined,
          subjectId: subjectId || undefined,
          status: status || undefined,
          sort,
          page,
          pageSize,
        },
        taxonomyRef.current
      );
      if (request !== listRequest.current) return;
      // A delete can empty the last page; step back instead of showing a blank table.
      if (!result.items.length && result.total > 0 && page > 1) {
        setPage(Math.max(1, Math.ceil(result.total / pageSize)));
        return;
      }
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (request === listRequest.current)
        setListError(getErrorMessage(err, 'Audio books could not be loaded.'));
    } finally {
      if (request === listRequest.current) setListLoading(false);
    }
  }, [search, categoryId, subjectId, status, sort, page, pageSize]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!metaLoading) void loadList();
  }, [loadList, metaLoading]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => setSelected(new Set()), [items]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMeta(), loadList()]);
  }, [loadMeta, loadList]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of taxonomy.categories) map.set(c.id, c.name);
    for (const s of taxonomy.subjects) map.set(s.id, s.name);
    for (const t of taxonomy.topics) map.set(t.id, t.name);
    return map;
  }, [taxonomy]);

  const filterSubjects = categoryId
    ? taxonomy.subjects.filter((s) => s.categoryId === categoryId)
    : taxonomy.subjects;
  const hasFilters = Boolean(search || categoryId || subjectId || status || sort !== 'newest');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryId('');
    setSubjectId('');
    setStatus('');
    setSort('newest');
    setPage(1);
  };

  const changeStatus = async (ids: string[], next: AudioBookStatus) => {
    try {
      await audioBookAdminApi.setStatus(ids, next);
      notify(
        'success',
        ids.length > 1
          ? `${ids.length} audio books ${next === 'published' ? 'published' : 'moved to draft'}.`
          : next === 'published'
            ? 'Audio book published. Students can now see it.'
            : 'Audio book unpublished and hidden from students.'
      );
      await refreshAll();
    } catch (err) {
      notify('error', getErrorMessage(err, 'Status could not be updated.'));
    }
  };

  const requestDelete = (book: AudioBook) =>
    setConfirm({
      title: `Delete “${book.title}”?`,
      message:
        'This permanently removes the audio book and its listen history. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await audioBookAdminApi.delete(book.id);
          notify('success', 'Audio book deleted.');
          await refreshAll();
        } catch (err) {
          notify('error', getErrorMessage(err, 'The audio book could not be deleted.'));
          throw err;
        }
      },
    });

  const requestBulkDelete = () => {
    const ids = [...selected];
    setConfirm({
      title: `Delete ${ids.length} audio book${ids.length === 1 ? '' : 's'}?`,
      message: 'The selected audio books and their listen history will be permanently removed.',
      confirmLabel: 'Delete all',
      onConfirm: async () => {
        setBulkBusy(true);
        try {
          for (const id of ids) await audioBookAdminApi.delete(id);
          notify('success', `${ids.length} audio book${ids.length === 1 ? '' : 's'} deleted.`);
        } catch (err) {
          notify('error', getErrorMessage(err, 'Some audio books could not be deleted.'));
        } finally {
          setBulkBusy(false);
          await refreshAll();
        }
      },
    });
  };

  const runBulkStatus = async (next: AudioBookStatus) => {
    setBulkBusy(true);
    await changeStatus([...selected], next);
    setBulkBusy(false);
  };

  const openMenu = (book: AudioBook, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ book, top: rect.bottom + 4, left: Math.max(8, rect.right - 180) });
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const allOnPageSelected = items.length > 0 && items.every((b) => selected.has(b.id));
  const timedHint =
    stats && stats.total > 0 && stats.timedCount < stats.total
      ? `${stats.timedCount} of ${stats.total} have a duration`
      : undefined;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            to="/admin"
            aria-label="Dashboard"
            className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
          </Link>
          <span>Content</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium text-slate-700 dark:text-slate-200" aria-current="page">
            Audio Book
          </span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-400">
              <Headphones className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Audio Book
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage audiobook content for students. Add, edit, organize and publish audiobooks
                easily.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerBook(null)}
            disabled={metaLoading || Boolean(metaError)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:bg-[#6D28D9] disabled:opacity-60 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Audio Book
          </button>
        </div>
      </div>

      {metaError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <span>{metaError}</span>
          <button
            type="button"
            onClick={() => void loadMeta()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100 dark:border-rose-800"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Stats — all computed in real time from database data */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {metaLoading && !stats ? (
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-[84px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
            />
          ))
        ) : (
          <>
            <StatCard
              label="Total Audio Books"
              value={stats?.total ?? '—'}
              icon={BookOpen}
              tone="border-[#E0EFFF] bg-[#F0F7FF] dark:border-blue-900/40 dark:bg-blue-950/20"
              iconTone="bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300"
            />
            <StatCard
              label="Published"
              value={stats?.published ?? '—'}
              icon={CheckCircle2}
              tone="border-[#DCFCE7] bg-[#F0FDF4] dark:border-emerald-900/40 dark:bg-emerald-950/20"
              iconTone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300"
            />
            <StatCard
              label="Drafts"
              value={stats?.drafts ?? '—'}
              icon={Clock}
              tone="border-[#FEF3C7] bg-[#FFFBEB] dark:border-amber-900/40 dark:bg-amber-950/20"
              iconTone="bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300"
            />
            <StatCard
              label="Total Duration"
              value={
                stats && stats.timedCount > 0
                  ? formatTotalDuration(stats.totalDurationSeconds)
                  : '—'
              }
              hint={
                timedHint ??
                (stats && stats.timedCount === 0 ? 'No durations recorded yet' : undefined)
              }
              icon={Clock}
              tone="border-[#F3E8FF] bg-[#FAF5FF] dark:border-purple-900/40 dark:bg-purple-950/20"
              iconTone="bg-purple-100 text-[#7C3AED] dark:bg-purple-900/60 dark:text-purple-300"
            />
            <StatCard
              label="Total Listens"
              value={
                stats
                  ? new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(
                      stats.totalListens
                    )
                  : '—'
              }
              hint="One per student per day"
              icon={Users}
              tone="border-[#FCE7F3] bg-[#FDF2F8] dark:border-rose-900/40 dark:bg-rose-950/20"
              iconTone="bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Audio book sections"
        className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800"
      >
        {(
          [
            ['books', 'All Audio Books'],
            ['categories', 'Categories'],
            ['settings', 'Settings'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
              tab === key
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <AudioBookTaxonomyManager
          taxonomy={taxonomy}
          usage={usage}
          onChanged={refreshAll}
          confirm={setConfirm}
          notify={notify}
        />
      )}

      {tab === 'settings' && <SettingsPanel />}

      {tab === 'books' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search audiobooks..."
                aria-label="Search audio books"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              aria-label="Filter by subject"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Subjects</option>
              {filterSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubjectId('');
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Categories</option>
              {taxonomy.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | AudioBookStatus);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              aria-label="Sort audio books"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as AudioBookSort);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
              <option value="longest">Longest First</option>
            </select>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              title={hasFilters ? 'Clear filters' : 'Filters'}
              aria-label={hasFilters ? 'Clear filters' : 'Filters'}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
                hasFilters
                  ? 'border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE]'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              {hasFilters ? (
                <FilterX className="h-4 w-4" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-purple-100 bg-purple-50/70 px-4 py-2.5 text-sm dark:border-purple-900/60 dark:bg-purple-950/30">
              <span className="font-semibold text-purple-800 dark:text-purple-200">
                {selected.size} selected
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => void runBulkStatus('published')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 disabled:opacity-50 dark:bg-slate-900"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" /> Publish
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => void runBulkStatus('draft')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50 disabled:opacity-50 dark:bg-slate-900"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Unpublish
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={requestBulkDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50 dark:bg-slate-900"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  aria-label="Clear selection"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allOnPageSelected}
                      onChange={() =>
                        setSelected(allOnPageSelected ? new Set() : new Set(items.map((b) => b.id)))
                      }
                      className="h-4 w-4 rounded accent-[#7C3AED]"
                    />
                  </th>
                  <th className="w-10 px-2 py-3">#</th>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Subject</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Created At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listLoading && items.length === 0 ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : listError ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center">
                      <p className="text-sm font-semibold text-rose-600">{listError}</p>
                      <button
                        type="button"
                        onClick={() => void loadList()}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                      </button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] dark:bg-purple-950/50 dark:text-purple-300">
                        <Headphones className="h-6 w-6" aria-hidden="true" />
                      </div>
                      {hasFilters ? (
                        <>
                          <p className="mt-4 font-bold text-slate-900 dark:text-white">
                            No audio books match these filters
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Try a different search or clear the filters.
                          </p>
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                          >
                            Clear filters
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="mt-4 font-bold text-slate-900 dark:text-white">
                            No audio books yet
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {taxonomy.categories.length
                              ? 'Add your first audio book with a YouTube link.'
                              : 'Start by creating a category and subject in the Categories tab.'}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              taxonomy.categories.length
                                ? setDrawerBook(null)
                                : setTab('categories')
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9]"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {taxonomy.categories.length ? 'Add Audio Book' : 'Create a category'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  items.map((book, index) => {
                    const category = names.get(book.categoryId) ?? '—';
                    const subject = names.get(book.subjectId) ?? '—';
                    const topic = book.topicId ? names.get(book.topicId) : null;
                    return (
                      <tr
                        key={book.id}
                        className={cn(
                          'border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30',
                          listLoading && 'opacity-60'
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${book.title}`}
                            checked={selected.has(book.id)}
                            onChange={() =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (next.has(book.id)) next.delete(book.id);
                                else next.add(book.id);
                                return next;
                              })
                            }
                            className="h-4 w-4 rounded accent-[#7C3AED]"
                          />
                        </td>
                        <td className="px-2 py-3 text-slate-500">{from + index}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <AudioBookThumb
                              src={book.thumbnailUrl}
                              videoId={book.youtubeVideoId}
                              alt=""
                              className="h-12 w-12"
                            />
                            <div className="min-w-0">
                              <p
                                className="max-w-[240px] truncate font-semibold text-slate-900 dark:text-white"
                                title={book.title}
                              >
                                {book.title}
                              </p>
                              <p className="max-w-[240px] truncate text-xs text-slate-500">
                                {topic ?? book.narrator ?? 'No topic'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'inline-block max-w-[160px] truncate rounded-full px-2.5 py-0.5 text-xs font-medium',
                              getSubjectBadgeClass(subject)
                            )}
                          >
                            {subject}
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-3 text-slate-600 dark:text-slate-300">
                          {category}
                        </td>
                        <td className="px-3 py-3">
                          {book.durationSeconds ? (
                            <span className="inline-flex items-center gap-1.5 tabular-nums text-slate-700 dark:text-slate-200">
                              <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                              {formatDuration(book.durationSeconds)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not set</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'rounded-md px-2 py-1 text-xs font-semibold',
                              book.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            )}
                          >
                            {book.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-300">
                          {dateFormat.format(new Date(book.createdAt))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewBook(book)}
                              aria-label={`Play ${book.title}`}
                              title="Preview"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDrawerBook(book)}
                              aria-label={`Edit ${book.title}`}
                              title="Edit"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openMenu(book, e)}
                              aria-label={`More actions for ${book.title}`}
                              aria-haspopup="menu"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">
                Showing {from} to {to} of {total} audio book{total === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`e${i}`} className="px-1 text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === page ? 'page' : undefined}
                      className={cn(
                        'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold',
                        p === page
                          ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                Rows per page
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={cn(selectClass, 'h-9')}
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Row action menu */}
      {menu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setMenu(null)}
              aria-hidden="true"
            />
            <div
              role="menu"
              style={{ top: menu.top, left: menu.left }}
              className="fixed z-[56] w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              {menu.book.status === 'draft' ? (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    const b = menu.book;
                    setMenu(null);
                    void changeStatus([b.id], 'published');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Send className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Publish
                </button>
              ) : (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    const b = menu.book;
                    setMenu(null);
                    void changeStatus([b.id], 'draft');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Undo2 className="h-4 w-4 text-amber-600" aria-hidden="true" /> Unpublish
                </button>
              )}
              <a
                role="menuitem"
                href={menu.book.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenu(null)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" aria-hidden="true" /> Open on
                YouTube
              </a>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  const b = menu.book;
                  setMenu(null);
                  requestDelete(b);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
              </button>
            </div>
          </>,
          document.body
        )}

      {/* Preview modal */}
      {previewBook &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
            onClick={() => setPreviewBook(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Preview ${previewBook.title}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <AudioBookThumb
                    src={previewBook.thumbnailUrl}
                    videoId={previewBook.youtubeVideoId}
                    alt=""
                    className="h-12 w-12"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {previewBook.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {[
                        names.get(previewBook.categoryId),
                        names.get(previewBook.subjectId),
                        previewBook.topicId && names.get(previewBook.topicId),
                      ]
                        .filter(Boolean)
                        .join(' › ')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewBook(null)}
                  aria-label="Close preview"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <YouTubeAudioPlayer
                videoId={previewBook.youtubeVideoId}
                title={previewBook.title}
                autoPlay
              />
              {previewBook.status === 'draft' && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  Draft — students cannot see this audio book yet.
                </p>
              )}
            </div>
          </div>,
          document.body
        )}

      <AudioBookFormDrawer
        book={drawerBook}
        taxonomy={taxonomy}
        onClose={() => setDrawerBook(undefined)}
        onManageTaxonomy={() => {
          setDrawerBook(undefined);
          setTab('categories');
        }}
        onSaved={(book, created) => {
          setDrawerBook(undefined);
          notify(
            'success',
            created
              ? book.status === 'published'
                ? 'Audio book saved and published.'
                : 'Audio book saved as draft.'
              : 'Audio book updated.'
          );
          void refreshAll();
        }}
      />
      <ConfirmDialog request={confirm} onClose={closeConfirm} />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
};

const SettingsPanel: React.FC = () => {
  const rows: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: React.ReactNode;
  }[] = [
    {
      icon: Link2,
      title: 'Audio source: YouTube link',
      body: 'Each audio book plays from a YouTube video through the official embedded player. Audio file uploads are turned off for now. Videos that are private, removed, region-restricted or not embeddable show an "unavailable" message to students.',
    },
    {
      icon: CheckCircle2,
      title: 'Visibility',
      body: 'Only Published audio books are visible to signed-in students. Drafts are visible to content staff only — this is enforced by the database, not just the UI.',
    },
    {
      icon: ImageIcon,
      title: 'Thumbnails',
      body: 'PNG, JPG or WebP up to 2 MB. Images are re-encoded and stored in secure storage. Without a thumbnail, the YouTube video still is shown.',
    },
    {
      icon: Clock,
      title: 'Durations',
      body: 'Filled automatically from the YouTube player when you paste a link. You can correct it manually. If YouTube does not report a duration, it stays empty — it is never estimated.',
    },
    {
      icon: Users,
      title: 'Listens',
      body: 'A listen is recorded when a student starts playback, counted at most once per student, audio book and day (IST).',
    },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] dark:bg-purple-950/50 dark:text-purple-300">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
      <a
        href="/audio-books"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Open student Audio Books page
      </a>
    </div>
  );
};
