import { csvCell } from '@/utils/csvExport';
import { requireSuccess, runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { calculatePaginationRange } from '@/utils/pagination';
import { getDateRangeBounds, getKolkataDateString } from '@/services/domains/admin.dashboard';
import { AdminTestAttempt, DateRangeFilter, LEGACY_STORAGE_KEY } from './testAttemptTypes';
import { attemptTimestamp } from './testAttemptUtils';

export function useAdminTestAttempts() {
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Attempts are kept in memory only; never persist student data to browser storage.
  const [attempts, setAttempts] = useState<AdminTestAttempt[]>([]);

  // Purge attempt data cached in browser storage by earlier versions.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode); nothing to purge.
    }
  }, []);

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

  return {
    pageLoading,
    setPageLoading,
    navigate,
    attempts,
    setAttempts,
    loadError,
    setLoadError,
    reloadKey,
    setReloadKey,
    selectedAttemptId,
    setSelectedAttemptId,
    isPanelOpen,
    setIsPanelOpen,
    activeTab,
    setActiveTab,
    answersTabFilter,
    setAnswersTabFilter,
    searchTerm,
    setSearchTerm,
    filterExam,
    setFilterExam,
    filterType,
    setFilterType,
    filterResult,
    setFilterResult,
    filterDateRange,
    setFilterDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isDateModalOpen,
    setIsDateModalOpen,
    draftDateRange,
    setDraftDateRange,
    draftStartDate,
    setDraftStartDate,
    draftEndDate,
    setDraftEndDate,
    dateRangeError,
    setDateRangeError,
    dateBounds,
    activeDateRangeLabel,
    selectedRowIds,
    setSelectedRowIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    openActionMenuId,
    setOpenActionMenuId,
    isAnswerSheetModalOpen,
    setIsAnswerSheetModalOpen,
    isTestModalOpen,
    setIsTestModalOpen,
    activeModalAttempt,
    setActiveModalAttempt,
    deleteConfirmationId,
    setDeleteConfirmationId,
    totalAttemptsCount,
    completedCount,
    notCompletedCount,
    averageScore,
    averageTimeMin,
    selectedAttempt,
    questionsList,
    modalQuestionsList,
    actionMenuRef,
    filteredAttempts,
    paginationRange,
    totalPages,
    paginatedAttempts,
    isAllCurrentPageSelected,
    toggleSelectAll,
    toggleSelectRow,
    handleResetFilters,
    handleExportCSV,
    handleReevaluate,
    handleDeleteAttempt,
    handleBulkDelete,
  };
}

export type AdminTestAttemptsState = ReturnType<typeof useAdminTestAttempts>;
