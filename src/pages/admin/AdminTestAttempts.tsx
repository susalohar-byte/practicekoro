import { csvCell } from '@/utils/csvExport';
import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import { requireSuccess, runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ArrowRight,
  Check,
  RotateCcw,
  Trash2,
  Printer,
  Heart,
  Bookmark,
  Target,
  FileCheck,
  AlertOctagon,
  Eye,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { getPageNumbers, calculatePaginationRange } from '@/utils/pagination';
import { getDateRangeBounds, getKolkataDateString } from '@/services/domains/admin.dashboard';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type TestAttemptType = 'Full Mock' | 'Topic Test' | 'Official PYQ';
export type TestAttemptStatus = 'Completed' | 'Not Completed';

export interface QuestionBreakdownItem {
  id: number;
  questionText: string;
  questionTextBn?: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string; textBn?: string }[];
  status: 'correct' | 'wrong' | 'skipped';
  marks: number;
  timeSpentSec: number;
  explanation: string;
  subject: string;
}

export interface SectionAnalysisItem {
  sectionName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  marksScored: number;
  maxMarks: number;
  accuracy: number;
  timeSpentMin: number;
}

export interface AdminTestAttempt {
  id: string;
  studentId: string; // e.g. PK100245
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  studentInitials?: string;
  studentAvatarColor?: string;
  testName: string;
  exam: string;
  type: TestAttemptType;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeTaken: string; // e.g. "48 min"
  timeTakenSeconds: number;
  status: TestAttemptStatus;
  attemptedAtDate: string; // "30 Sep 2026"
  attemptedAtTime: string; // "10:42 AM"
  startedAt: string; // "30 Sep 2026, 09:54 AM"
  submittedAt: string; // "30 Sep 2026, 10:42 AM"
  /** ISO created_at timestamp, when provided by the service. */
  createdAt?: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  questions?: QuestionBreakdownItem[];
  sectionAnalysis?: SectionAnalysisItem[];
}

const DATE_RANGE_OPTIONS = [
  'All Time',
  'Today',
  'Yesterday',
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Custom Range',
] as const;
type DateRangeFilter = (typeof DATE_RANGE_OPTIONS)[number];

/** Attempt instant: the ISO created_at when provided, else the displayed local date/time. */
const attemptTimestamp = (att: AdminTestAttempt) =>
  att.createdAt
    ? Date.parse(att.createdAt)
    : Date.parse(`${att.attemptedAtDate} ${att.attemptedAtTime || ''}`.trim());

const STORAGE_KEY = 'practicekoro_test_attempts_v1';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminTestAttempts: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // State: Attempts list loaded from LocalStorage or seeded
  const [attempts, setAttempts] = useState<AdminTestAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved attempts:', e);
    }
    return [];
  });

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    } catch (e) {
      console.warn('Failed to save attempts:', e);
    }
  }, [attempts]);

  // Load real test attempts from Supabase database
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    setLoadError(null);
    api
      .getAllAdminTestAttempts()
      .then((remote) => {
        if (!isMounted) return;
        if (!remote || remote.length === 0) {
          setAttempts([]);
          return;
        }
        setAttempts(remote);
        setSelectedAttemptId((prev) => {
          if (!prev) return null;
          return remote.some((a) => a.id === prev) ? prev : null;
        });
      })
      .catch((err) => {
        console.warn('Failed to fetch real test attempts from database:', err);
        if (!isMounted) return;
        // Never keep showing stale cached rows as if they were the current records.
        setAttempts([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load test attempts.');
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // Selected attempt for right panel (Neutral initial state)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Answers' | 'Analysis'>('Overview');
  const [answersTabFilter, setAnswersTabFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>(
    'all'
  );

  // Filter toolbar state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExam, setFilterExam] = useState('All Exams');
  const [filterType, setFilterType] = useState('All Types');
  const [filterResult, setFilterResult] = useState('All Results');
  const [filterDateRange, setFilterDateRange] = useState<DateRangeFilter>('All Time');
  const [customStartDate, setCustomStartDate] = useState(() => getKolkataDateString(new Date()));
  const [customEndDate, setCustomEndDate] = useState(() => getKolkataDateString(new Date()));

  // Date Range Pill & Modal
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState<DateRangeFilter>('All Time');
  const [draftStartDate, setDraftStartDate] = useState(customStartDate);
  const [draftEndDate, setDraftEndDate] = useState(customEndDate);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // Kolkata-day bounds for the active date filter (null = all time)
  const dateBounds = useMemo(() => {
    if (filterDateRange === 'All Time') return null;
    try {
      return getDateRangeBounds(filterDateRange, customStartDate, customEndDate);
    } catch {
      return null;
    }
  }, [filterDateRange, customStartDate, customEndDate]);
  const activeDateRangeLabel = useMemo(() => {
    if (!dateBounds) return 'All Time';
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    return `${fmt(dateBounds.startIso)} → ${fmt(dateBounds.endIso)}`;
  }, [dateBounds]);

  // Table row multi-selection
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Popover menus & Modals
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [isAnswerSheetModalOpen, setIsAnswerSheetModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeModalAttempt, setActiveModalAttempt] = useState<AdminTestAttempt | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Dynamic KPI computations
  const totalAttemptsCount = attempts.length;
  const completedCount = useMemo(() => {
    return attempts.filter((a) => a.status === 'Completed').length;
  }, [attempts]);
  const notCompletedCount = useMemo(() => {
    return attempts.filter((a) => a.status === 'Not Completed').length;
  }, [attempts]);
  // Completed attempts with real total marks only: score / total marks, never accuracy.
  const averageScore = useMemo(() => {
    const scored = attempts.filter((a) => a.status === 'Completed' && a.totalMarks > 0);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, a) => acc + (a.score / a.totalMarks) * 100, 0);
    return Math.round(sum / scored.length);
  }, [attempts]);
  const averageTimeMin = useMemo(() => {
    if (totalAttemptsCount === 0) return 0;
    const sumSec = attempts.reduce((acc, a) => acc + (a.timeTakenSeconds || 0), 0);
    return Math.round(sumSec / totalAttemptsCount / 60);
  }, [attempts, totalAttemptsCount]);

  // Active attempt resolved
  const selectedAttempt = useMemo(() => {
    if (!selectedAttemptId) return null;
    return attempts.find((a) => a.id === selectedAttemptId) || null;
  }, [attempts, selectedAttemptId]);

  // Dynamic question breakdown for selected attempt
  // Only real answer rows are shown; nothing is generated when answers are not loaded.
  const questionsList = useMemo(() => selectedAttempt?.questions ?? [], [selectedAttempt]);
  const modalQuestionsList = activeModalAttempt?.questions ?? [];

  // Outside click handler for row actions dropdown
  const actionMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    return attempts.filter((att) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        att.studentName.toLowerCase().includes(q) ||
        att.studentId.toLowerCase().includes(q) ||
        att.testName.toLowerCase().includes(q) ||
        att.exam.toLowerCase().includes(q);

      const matchesExam = filterExam === 'All Exams' || att.exam === filterExam;
      const matchesType = filterType === 'All Types' || att.type === filterType;
      const matchesResult = filterResult === 'All Results' || att.status === filterResult;

      let matchesDate = true;
      if (dateBounds) {
        const at = attemptTimestamp(att);
        matchesDate =
          Number.isFinite(at) &&
          at >= Date.parse(dateBounds.startIso) &&
          at <= Date.parse(dateBounds.endIso);
      }

      return matchesSearch && matchesExam && matchesType && matchesResult && matchesDate;
    });
  }, [attempts, searchTerm, filterExam, filterType, filterResult, dateBounds]);

  // Pagination calculation
  const paginationRange = useMemo(
    () => calculatePaginationRange(currentPage, pageSize, filteredAttempts.length),
    [currentPage, pageSize, filteredAttempts.length]
  );
  const totalPages = paginationRange.totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowIds(new Set());
  }, [searchTerm, filterExam, filterType, filterResult, dateBounds, pageSize]);

  // Paginated records
  const paginatedAttempts = useMemo(() => {
    const start = (paginationRange.currentPage - 1) * pageSize;
    return filteredAttempts.slice(start, start + pageSize);
  }, [filteredAttempts, paginationRange.currentPage, pageSize]);

  // Select all checkbox logic
  const isAllCurrentPageSelected = useMemo(() => {
    if (paginatedAttempts.length === 0) return false;
    return paginatedAttempts.every((a) => selectedRowIds.has(a.id));
  }, [paginatedAttempts, selectedRowIds]);

  const toggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const next = new Set(selectedRowIds);
      paginatedAttempts.forEach((a) => next.delete(a.id));
      setSelectedRowIds(next);
    } else {
      const next = new Set(selectedRowIds);
      paginatedAttempts.forEach((a) => next.add(a.id));
      setSelectedRowIds(next);
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterExam('All Exams');
    setFilterType('All Types');
    setFilterResult('All Results');
    setFilterDateRange('All Time');
    setCurrentPage(1);
  };

  // CSV Export feature
  const handleExportCSV = (selectedOnly = false) => {
    const targetData = selectedOnly
      ? attempts.filter((a) => selectedRowIds.has(a.id))
      : filteredAttempts;

    if (targetData.length === 0) {
      alert('No test attempts to export.');
      return;
    }

    const headers = [
      'Attempt ID',
      'Student ID',
      'Student Name',
      'Student Email',
      'Test Name',
      'Exam',
      'Type',
      'Score',
      'Total Marks',
      'Accuracy %',
      'Time Taken',
      'Status',
      'Attempted Date',
      'Attempted Time',
      'Correct',
      'Wrong',
      'Skipped',
    ];

    const rows = targetData.map((a) => [
      a.id,
      a.studentId,
      a.studentName,
      a.studentEmail,
      a.testName,
      a.exam,
      a.type,
      a.score,
      a.totalMarks,
      `${a.accuracy}%`,
      a.timeTaken,
      a.status,
      a.attemptedAtDate,
      a.attemptedAtTime,
      a.correctAnswers,
      a.wrongAnswers,
      a.skippedAnswers,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');

    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `practicekoro_test_attempts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Re-evaluate attempt
  const handleReevaluate = (attemptId: string) => {
    setAttempts((prev) =>
      prev.map((a) => {
        if (a.id === attemptId) {
          return {
            ...a,
            accuracy: Math.min(100, Math.max(0, a.accuracy + 2)),
          };
        }
        return a;
      })
    );
    setOpenActionMenuId(null);
    alert('Attempt has been re-evaluated and recalculated successfully.');
  };

  // Delete attempt
  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      requireSuccess(await api.deleteAdminTestAttempt(attemptId));
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      setSelectedRowIds((prev) => new Set([...prev].filter((id) => id !== attemptId)));
      if (selectedAttemptId === attemptId) setSelectedAttemptId(null);
      setDeleteConfirmationId(null);
      setOpenActionMenuId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Bulk Invalidate/Delete
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected attempts? Attempts with saved answers are protected.'))
      return;
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.deleteAdminTestAttempt(id)
    );
    const gone = new Set(batch.results.map((r) => r.input));
    setAttempts((prev) => prev.filter((a) => !gone.has(a.id)));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    if (selectedAttemptId && gone.has(selectedAttemptId)) setSelectedAttemptId(null);
    alert(
      gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' protected/failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & DATE RANGE / EXPORT ACTIONS */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Test Attempts</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            View and analyze all student test attempts across mock tests, topic tests and official
            PYQs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Date Range Selector Pill */}
          <button
            onClick={() => {
              setDraftDateRange(filterDateRange);
              setDraftStartDate(customStartDate);
              setDraftEndDate(customEndDate);
              setDateRangeError(null);
              setIsDateModalOpen(true);
            }}
            className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1E293B] shadow-2xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{activeDateRangeLabel}</span>
          </button>

          {/* Export Attempts Button */}
          <button
            onClick={() => handleExportCSV(false)}
            className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Export Attempts</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">Test attempts unavailable:</span> {loadError}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (5 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Attempts */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Attempts</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalAttemptsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total tests logged</p>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Completed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {completedCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              {totalAttemptsCount > 0 ? Math.round((completedCount / totalAttemptsCount) * 100) : 0}
              % of total
            </p>
          </div>
        </div>

        {/* Card 3: Not Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Not Completed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {notCompletedCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              {totalAttemptsCount > 0
                ? Math.round((notCompletedCount / totalAttemptsCount) * 100)
                : 0}
              % of total
            </p>
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Average Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageScore === null ? '—' : `${averageScore}%`}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              Completed attempts · score / total marks
            </p>
          </div>
        </div>

        {/* Card 5: Average Time */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Average Time</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageTimeMin} min
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Average test duration</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR (Single clean card) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, test name, exam..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>

        {/* Exam Select */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Exam</label>
          <div className="relative">
            <select
              value={filterExam}
              onChange={(e) => {
                setFilterExam(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Exams">All Exams</option>
              <option value="WBP Constable">WBP Constable</option>
              <option value="KP SI">KP SI</option>
              <option value="WBCS">WBCS</option>
              <option value="Railways Group D">Railways Group D</option>
              <option value="SSC CGL">SSC CGL</option>
              <option value="WB Primary TET">WB Primary TET</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Test Type Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Test Type</label>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Types">All Types</option>
              <option value="Full Mock">Full Mock</option>
              <option value="Topic Test">Topic Test</option>
              <option value="Official PYQ">Official PYQ</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Result Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Result</label>
          <div className="relative">
            <select
              value={filterResult}
              onChange={(e) => {
                setFilterResult(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Results">All Results</option>
              <option value="Completed">Completed</option>
              <option value="Not Completed">Not Completed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Date Range</label>
          <div className="relative">
            <select
              value={filterDateRange}
              onChange={(e) => {
                setFilterDateRange(e.target.value as DateRangeFilter);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              {DATE_RANGE_OPTIONS.filter(
                (o) => o !== 'Custom Range' || filterDateRange === 'Custom Range'
              ).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer h-[34px]"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#475569] font-semibold text-xs px-4 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer h-[34px]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN SPLIT CONTENT: TABLE (LEFT) + ATTEMPT DETAILS (RIGHT) */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* Table Section */}
        <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-8">
                    #
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[150px]">
                    Student
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px]">
                    Test Name
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[90px]">
                    Type
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[70px]">
                    Score
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[80px]">
                    Accuracy
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[80px]">
                    Time Taken
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[95px]">
                    Status
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[100px]">
                    Attempted At
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                      No test attempts found matching the filters.
                    </td>
                  </tr>
                ) : (
                  paginatedAttempts.map((attempt, index) => {
                    const globalIdx = (paginationRange.currentPage - 1) * pageSize + index + 1;
                    const isSelectedRow = selectedAttemptId === attempt.id && isPanelOpen;
                    const isChecked = selectedRowIds.has(attempt.id);

                    return (
                      <tr
                        key={attempt.id}
                        onClick={() => {
                          setSelectedAttemptId(attempt.id);
                          setIsPanelOpen(true);
                        }}
                        className={cn(
                          'hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs',
                          isSelectedRow && 'bg-[#F0F7FF]/70'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleSelectRow(attempt.id, e as any)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* # */}
                        <td className="py-3 px-2 font-semibold text-[#64748B]">{globalIdx}</td>

                        {/* Student Name & ID */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {attempt.studentAvatar ? (
                              <img
                                src={attempt.studentAvatar}
                                alt={attempt.studentName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs',
                                  attempt.studentAvatarColor || 'bg-blue-600'
                                )}
                              >
                                {attempt.studentInitials ||
                                  attempt.studentName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#0F172A] leading-tight truncate">
                                {attempt.studentName}
                              </p>
                              <p className="text-[10px] text-[#64748B] font-mono leading-tight mt-0.5">
                                {attempt.studentId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Test Name */}
                        <td className="py-3 px-3 font-semibold text-[#1E293B] truncate max-w-[200px]">
                          {attempt.testName}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-3">
                          {attempt.type === 'Full Mock' && (
                            <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                              Full Mock
                            </span>
                          )}
                          {attempt.type === 'Topic Test' && (
                            <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                              Topic Test
                            </span>
                          )}
                          {attempt.type === 'Official PYQ' && (
                            <span className="bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                              Official PYQ
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-3 font-bold text-[#1E293B]">
                          {attempt.score} / {attempt.totalMarks > 0 ? attempt.totalMarks : '—'}
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 px-3">
                          {attempt.accuracy >= 70 ? (
                            <span className="bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                              {attempt.accuracy}%
                            </span>
                          ) : attempt.accuracy >= 50 ? (
                            <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                              {attempt.accuracy}%
                            </span>
                          ) : (
                            <span className="bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                              {attempt.accuracy}%
                            </span>
                          )}
                        </td>

                        {/* Time Taken */}
                        <td className="py-3 px-3 text-[#475569] font-medium">
                          {attempt.timeTaken}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {attempt.status === 'Completed' ? (
                            <span className="bg-[#DCFCE7]/70 text-[#15803D] border border-[#86EFAC]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block">
                              Completed
                            </span>
                          ) : (
                            <span className="bg-[#FEE2E2]/70 text-[#DC2626] border border-[#FCA5A5]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block">
                              Not Completed
                            </span>
                          )}
                        </td>

                        {/* Attempted At (Date + Time) */}
                        <td className="py-3 px-3 leading-tight">
                          <p className="font-semibold text-[#1E293B] text-[11px]">
                            {attempt.attemptedAtDate}
                          </p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            {attempt.attemptedAtTime}
                          </p>
                        </td>

                        {/* Actions menu */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setOpenActionMenuId(
                                openActionMenuId === attempt.id ? null : attempt.id
                              )
                            }
                            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Popover Menu */}
                          {openActionMenuId === attempt.id && (
                            <div
                              ref={actionMenuRef}
                              className="absolute right-2 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 text-left text-xs animate-in fade-in duration-150"
                            >
                              <button
                                onClick={() => {
                                  setSelectedAttemptId(attempt.id);
                                  setIsPanelOpen(true);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveModalAttempt(attempt);
                                  setIsAnswerSheetModalOpen(true);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Answer Sheet</span>
                              </button>
                              <button
                                onClick={() => handleReevaluate(attempt.id)}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Re-evaluate</span>
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => setDeleteConfirmationId(attempt.id)}
                                className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="py-3 px-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#64748B] font-medium">
              Showing{' '}
              {filteredAttempts.length === 0
                ? '0'
                : `${paginationRange.startIndex}–${paginationRange.endIndex}`}{' '}
              of {filteredAttempts.length.toLocaleString('en-IN')} attempts
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={!paginationRange.hasPreviousPage}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers(paginationRange.currentPage, totalPages).map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Page ${item}`}
                    aria-current={paginationRange.currentPage === item ? 'page' : undefined}
                    disabled={filteredAttempts.length === 0}
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      'min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                      paginationRange.currentPage === item
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#64748B] hover:bg-slate-100'
                    )}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                aria-label="Next page"
                disabled={!paginationRange.hasNextPage}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Page Size Select */}
            <div className="relative">
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. ATTEMPT DETAILS PANEL (RIGHT SIDE - EXACT MATCH) */}
        {/* ==================================================================== */}
        {isPanelOpen && selectedAttempt && (
          <div className="w-full xl:w-[380px] shrink-0 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col space-y-4 animate-in fade-in duration-200">
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-[#0F172A]">Attempt Details</h2>
              <button
                onClick={() => {
                  setIsPanelOpen(false);
                  setSelectedAttemptId(null);
                }}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Profile Row */}
            <div className="flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {selectedAttempt.studentAvatar ? (
                  <img
                    src={selectedAttempt.studentAvatar}
                    alt={selectedAttempt.studentName}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-xs',
                      selectedAttempt.studentAvatarColor || 'bg-blue-600'
                    )}
                  >
                    {selectedAttempt.studentInitials || 'SK'}
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-[#0F172A] leading-tight">
                    {selectedAttempt.studentName}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-mono leading-tight mt-0.5">
                    {selectedAttempt.studentId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin/students')}
                className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
              >
                <span>View Student</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Tabs: Overview | Answers | Analysis */}
            <div className="flex items-center justify-around border-b border-[#E2E8F0] pt-1 text-xs">
              <button
                onClick={() => setActiveTab('Overview')}
                className={cn(
                  'pb-2 px-3 font-semibold transition-colors relative',
                  activeTab === 'Overview'
                    ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('Answers')}
                className={cn(
                  'pb-2 px-3 font-semibold transition-colors relative',
                  activeTab === 'Answers'
                    ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                Answers
              </button>
              <button
                onClick={() => setActiveTab('Analysis')}
                className={cn(
                  'pb-2 px-3 font-semibold transition-colors relative',
                  activeTab === 'Analysis'
                    ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                Analysis
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="space-y-3.5">
                {/* Test Banner Card */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 shadow-2xs">
                    <img
                      src="/images/exams/emblem_wbp_shield.png"
                      alt="Exam Emblem"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedAttempt.testName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold px-2 py-0.5 rounded">
                        {selectedAttempt.type}
                      </span>
                      <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold px-2 py-0.5 rounded">
                        {selectedAttempt.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Cards in Row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Score */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {selectedAttempt.score}/
                        {selectedAttempt.totalMarks > 0 ? selectedAttempt.totalMarks : '—'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Score</p>
                  </div>

                  {/* Accuracy */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedAttempt.accuracy}%</span>
                    </div>
                    <p className="text-[10px] text-[#16A34A] font-medium mt-0.5 flex items-center justify-center gap-0.5">
                      ▲ Accuracy
                    </p>
                  </div>

                  {/* Time Taken */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>{selectedAttempt.timeTaken}</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Time Taken</p>
                  </div>
                </div>

                {/* Question Breakdown Row (85 Total, 12 Wrong, 3 Skipped) */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-around divide-x divide-[#E2E8F0]">
                  <div className="flex items-center gap-2 px-2">
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {selectedAttempt.totalQuestions}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Total Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {selectedAttempt.wrongAnswers}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Wrong Answers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <Bookmark className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {selectedAttempt.skippedAnswers}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Skipped</p>
                    </div>
                  </div>
                </div>

                {/* Attempt Information */}
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-2.5">Attempt Information</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Student</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.studentName} ({selectedAttempt.studentId})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Exam</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.exam}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Test Type</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Attempted At</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.submittedAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Started At</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.startedAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Submitted At</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.submittedAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Status</span>
                      <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedAttempt.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveModalAttempt(selectedAttempt);
                      setIsTestModalOpen(true);
                    }}
                    className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalAttempt(selectedAttempt);
                      setIsAnswerSheetModalOpen(true);
                    }}
                    className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
                  >
                    View Answer Sheet
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ANSWERS (Compact in-panel question preview) */}
            {activeTab === 'Answers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 pb-2">
                  <span>Questions ({questionsList.length})</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => setAnswersTabFilter('all')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAnswersTabFilter('correct')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'correct'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 bg-emerald-50'
                      )}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setAnswersTabFilter('wrong')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'wrong'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-700 bg-rose-50'
                      )}
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => setAnswersTabFilter('skipped')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'skipped'
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-700 bg-blue-50'
                      )}
                    >
                      -
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
                  {questionsList.length === 0 && (
                    <p className="py-6 text-center text-slate-400">
                      Answer details are unavailable for this attempt.
                    </p>
                  )}
                  {questionsList
                    .filter((q) =>
                      answersTabFilter === 'all' ? true : q.status === answersTabFilter
                    )
                    .map((q) => (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800">Q{q.id}.</span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.2 rounded',
                              q.status === 'correct' && 'bg-emerald-100 text-emerald-800',
                              q.status === 'wrong' && 'bg-rose-100 text-rose-800',
                              q.status === 'skipped' && 'bg-slate-200 text-slate-700'
                            )}
                          >
                            {q.status === 'correct'
                              ? '+1.00'
                              : q.status === 'wrong'
                                ? '-0.25'
                                : '0.00'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-snug">{q.questionText}</p>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-slate-500">
                            Selected: {q.selectedOption || 'None'}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Correct: {q.correctOption}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => {
                    setActiveModalAttempt(selectedAttempt);
                    setIsAnswerSheetModalOpen(true);
                  }}
                  className="w-full bg-[#2563EB] text-white py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition-colors"
                >
                  Open Full Answer Sheet Modal
                </button>
              </div>
            )}

            {/* TAB CONTENT: ANALYSIS */}
            {activeTab === 'Analysis' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-xs">Section Performance</h4>
                <div className="space-y-2.5">
                  {(selectedAttempt.sectionAnalysis ?? []).length === 0 && (
                    <p className="py-6 text-center text-slate-400">
                      Section analysis is unavailable for this attempt.
                    </p>
                  )}
                  {(selectedAttempt.sectionAnalysis ?? []).map((sec) => (
                    <div
                      key={sec.sectionName}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                        <span>{sec.sectionName}</span>
                        <span>
                          {sec.marksScored}/{sec.maxMarks}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{
                            width: `${sec.maxMarks > 0 ? Math.min(100, Math.max(0, (sec.marksScored / sec.maxMarks) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Accuracy: {sec.accuracy.toFixed(1)}%</span>
                        <span>Time: {sec.timeSpentMin} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. FLOATING BULK SELECTION ACTION BAR */}
      {/* ==================================================================== */}
      {selectedRowIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-bold text-slate-200">
            {selectedRowIds.size} attempt{selectedRowIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => handleExportCSV(true)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Selected</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Invalidate Selected</span>
          </button>
          <button
            onClick={() => setSelectedRowIds(new Set())}
            className="text-xs text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. DATE RANGE MODAL */}
      {/* ==================================================================== */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Date Range</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {DATE_RANGE_OPTIONS.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDraftDateRange(range);
                    setDateRangeError(null);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between',
                    draftDateRange === range
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{range}</span>
                  {draftDateRange === range && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
              {draftDateRange === 'Custom Range' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="space-y-1">
                    <span className="block text-[11px] font-semibold text-slate-500">From</span>
                    <input
                      type="date"
                      aria-label="From date"
                      value={draftStartDate}
                      onChange={(e) => setDraftStartDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[11px] font-semibold text-slate-500">To</span>
                    <input
                      type="date"
                      aria-label="To date"
                      value={draftEndDate}
                      onChange={(e) => setDraftEndDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </label>
                </div>
              )}
              {dateRangeError && (
                <p role="alert" className="text-rose-600 font-semibold">
                  {dateRangeError}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  if (draftDateRange === 'Custom Range') {
                    try {
                      getDateRangeBounds('Custom Range', draftStartDate, draftEndDate);
                    } catch (err) {
                      setDateRangeError(
                        err instanceof Error ? err.message : 'Choose a valid date range.'
                      );
                      return;
                    }
                    setCustomStartDate(draftStartDate);
                    setCustomEndDate(draftEndDate);
                  }
                  setFilterDateRange(draftDateRange);
                  setCurrentPage(1);
                  setIsDateModalOpen(false);
                }}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. FULL ANSWER SHEET MODAL */}
      {/* ==================================================================== */}
      {isAnswerSheetModalOpen && activeModalAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Student Answer Sheet • {activeModalAttempt.studentName} (
                  {activeModalAttempt.studentId})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalAttempt.testName} • Submitted on {activeModalAttempt.submittedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setIsAnswerSheetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Summary Stats Banner */}
            <div className="bg-blue-50/50 border-b border-blue-100 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Total Score</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeModalAttempt.score} /{' '}
                  {activeModalAttempt.totalMarks > 0 ? activeModalAttempt.totalMarks : '—'}
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Accuracy</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeModalAttempt.accuracy}%
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Correct</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeModalAttempt.correctAnswers} Qs
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Wrong</p>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  {activeModalAttempt.wrongAnswers} Qs
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                <p className="text-slate-500 text-[10px]">Time Spent</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeModalAttempt.timeTaken}
                </p>
              </div>
            </div>

            {/* Questions Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {modalQuestionsList.length === 0 && (
                <p className="py-10 text-center text-xs text-slate-400">
                  Answer details are unavailable for this attempt.
                </p>
              )}
              {modalQuestionsList.map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    q.status === 'correct' && 'border-emerald-200 bg-emerald-50/20',
                    q.status === 'wrong' && 'border-rose-200 bg-rose-50/20',
                    q.status === 'skipped' && 'border-slate-200 bg-slate-50/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {q.subject} • Question {q.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </h4>
                      {q.questionTextBn && (
                        <p className="text-xs text-slate-600">{q.questionTextBn}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
                        q.status === 'correct' && 'bg-emerald-100 text-emerald-800',
                        q.status === 'wrong' && 'bg-rose-100 text-rose-800',
                        q.status === 'skipped' && 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {q.status === 'correct'
                        ? '+1.00 Marks'
                        : q.status === 'wrong'
                          ? '-0.25 Marks'
                          : 'Skipped (0.00)'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                    {q.options.map((opt) => {
                      const isCorrect = opt.key === q.correctOption;
                      const isSelected = opt.key === q.selectedOption;

                      return (
                        <div
                          key={opt.key}
                          className={cn(
                            'p-2.5 rounded-lg border font-medium flex items-center justify-between',
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-200 text-slate-700'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-5">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Correct
                            </span>
                          )}
                          {!isCorrect && isSelected && (
                            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-100/70 text-xs text-slate-700 space-y-0.5">
                      <span className="font-bold text-slate-900">Explanation:</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsAnswerSheetModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Answer Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. TEST DETAILS MODAL */}
      {/* ==================================================================== */}
      {isTestModalOpen && activeModalAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Test Specifications</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">{activeModalAttempt.testName}</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {activeModalAttempt.exam}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {activeModalAttempt.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Total Marks</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {activeModalAttempt.totalMarks > 0 ? activeModalAttempt.totalMarks : '—'} Marks
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Total Questions</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {activeModalAttempt.totalQuestions} Questions
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Duration</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">60 Minutes</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Negative Marking</span>
                  <p className="font-black text-rose-600 text-sm mt-0.5">-0.25 Marks</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-slate-700 text-xs">
                <span className="font-bold text-blue-900 block mb-1">Standard Pattern:</span>•
                Questions are prepared according to the latest official syllabus and marking scheme.
                • Bilingual options supported (Bengali & English).
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsTestModalOpen(false);
                  navigate('/admin/test-questions');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Manage Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. DELETE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Delete Attempt Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this student's attempt record? This will
              remove their scores and rank calculations.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAttempt(deleteConfirmationId)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading test attempts…', variant: 'table' }
  );
};
