import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { EMPTY_LIVE_TEST_STATS, type LiveTestStats } from '@/services/domains/admin.liveTests';
import { csvCell } from '@/utils/csvExport';
import type { Exam, LiveTest } from '@/types';
import { useNavigate } from 'react-router-dom';
import { formatScheduledDate, type ToastType } from './liveTestsUtils';

let globalToastHandler: ((msg: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (msg: string) => globalToastHandler?.(msg, 'success'),
  error: (msg: string) => globalToastHandler?.(msg, 'error'),
  info: (msg: string) => globalToastHandler?.(msg, 'info'),
};

export function useAdminLiveTests() {
  const navigate = useNavigate();
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  // Real participation numbers per Live Test (from test_attempts), keyed by live test id.
  const [statsById, setStatsById] = useState<Record<string, LiveTestStats>>({});
  const [statsError, setStatsError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('01 Sep 2026 → 30 Sep 2026');

  // Selected row checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<
    'overview' | 'participants' | 'settings' | 'analytics'
  >('overview');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTest, setEditingTest] = useState<LiveTest | null>(null);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<LiveTest | null>(null);
  const [endCandidate, setEndCandidate] = useState<LiveTest | null>(null);

  // Active Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast state
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    globalToastHandler = (message: string, type: ToastType) => {
      setToastNotification({ message, type });
      setTimeout(() => setToastNotification(null), 3200);
    };
    return () => {
      globalToastHandler = null;
    };
  }, []);

  // Click outside to close action menu and Escape key to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setIsDrawerOpen(false);
        setSelectedTestId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Ensure body scroll is never locked on this page
  useEffect(() => {
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allLive, allExams] = await Promise.all([api.getLiveTests(), api.getAllAdminExams()]);
      setLiveTests(allLive);
      setExams(allExams);
    } catch (err) {
      console.error('Failed to load live tests:', err);
      toast.error('Failed to load live tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    if (typeof api.subscribeToLiveTestUpdates === 'function') {
      const unsubscribe = api.subscribeToLiveTestUpdates(() => {
        api
          .getLiveTests()
          .then(setLiveTests)
          .catch(() => {});
      });
      return () => unsubscribe();
    }
  }, [loadData]);

  // Overall KPI Metrics
  const stats = useMemo(() => {
    const total = liveTests.length;
    const liveCount = liveTests.filter((t) => t.status === 'live').length;
    const upcomingCount = liveTests.filter(
      (t) => t.status === 'upcoming' || t.status === 'scheduled'
    ).length;
    const endedCount = liveTests.filter(
      (t) => t.status === 'ended' || t.status === 'completed'
    ).length;
    const totalParticipants = liveTests.reduce(
      (sum, t) => sum + (statsById[t.id]?.participants || 0),
      0
    );

    return {
      total,
      liveCount,
      upcomingCount,
      endedCount,
      totalParticipants,
    };
  }, [liveTests, statsById]);

  // Load real participation stats whenever the list changes
  useEffect(() => {
    if (liveTests.length === 0) {
      setStatsById({});
      return;
    }
    let cancelled = false;
    api
      .getLiveTestsStats(liveTests)
      .then((next) => {
        if (cancelled) return;
        setStatsById(next);
        setStatsError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatsError(
          err instanceof Error ? err.message : 'Participation stats could not be loaded'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [liveTests]);

  // Distinct Exams for Dropdown
  const distinctExams = useMemo(() => {
    const exams = new Set<string>();
    liveTests.forEach((t) => {
      if (t.examTitle) exams.add(t.examTitle);
    });
    return Array.from(exams);
  }, [liveTests]);

  // Filtering
  const filteredTests = useMemo(() => {
    return liveTests.filter((lt) => {
      // Tab filter
      if (activeTab === 'live' && lt.status !== 'live') return false;
      if (activeTab === 'scheduled' && lt.status !== 'upcoming' && lt.status !== 'scheduled')
        return false;
      if (activeTab === 'completed' && lt.status !== 'ended' && lt.status !== 'completed')
        return false;

      // Status dropdown filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'live' && lt.status !== 'live') return false;
        if (statusFilter === 'scheduled' && lt.status !== 'upcoming' && lt.status !== 'scheduled')
          return false;
        if (statusFilter === 'draft' && lt.status !== 'draft') return false;
        if (statusFilter === 'completed' && lt.status !== 'ended' && lt.status !== 'completed')
          return false;
      }

      // Exam dropdown filter
      if (examFilter !== 'all' && lt.examTitle !== examFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (lt.title || '').toLowerCase().includes(q);
        const matchExam = (lt.examTitle || '').toLowerCase().includes(q);
        const matchTest = (lt.testTitle || '').toLowerCase().includes(q);
        if (!matchTitle && !matchExam && !matchTest) return false;
      }

      return true;
    });
  }, [liveTests, activeTab, statusFilter, examFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTests.length / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTests.slice(start, start + pageSize);
  }, [filteredTests, currentPage, pageSize]);

  // Keep currentPage within bounds when tests are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Selected Test for Right Drawer
  const selectedLiveTest = useMemo(() => {
    if (!selectedTestId) return null;
    return liveTests.find((t) => t.id === selectedTestId) || null;
  }, [liveTests, selectedTestId]);

  // Real numbers for the drawer and the monitor
  const selectedStats: LiveTestStats = selectedLiveTest
    ? statsById[selectedLiveTest.id] || EMPTY_LIVE_TEST_STATS
    : EMPTY_LIVE_TEST_STATS;
  const selectedPaperQuestions =
    selectedLiveTest?.test?.totalQuestions ?? selectedLiveTest?.totalQuestions ?? 0;
  const selectedMarks = selectedLiveTest?.test?.totalMarks ?? selectedLiveTest?.totalMarks ?? 0;
  const selectedNegative =
    selectedLiveTest?.test?.negativeMarking ?? selectedLiveTest?.negativeMarking ?? 0;
  const submissionRate =
    selectedStats.participants > 0
      ? Math.round((selectedStats.submitted / selectedStats.participants) * 100)
      : null;
  // Share of the live window that has elapsed (0 before start, 100 after the end).
  const windowProgress = (() => {
    if (!selectedLiveTest) return 0;
    const start = new Date(selectedLiveTest.startAt).getTime();
    const minutes = Number(selectedLiveTest.durationMinutes) || 0;
    if (isNaN(start) || minutes <= 0) return 0;
    const pct = ((Date.now() - start) / (minutes * 60 * 1000)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  })();
  const formatDateTime = (iso?: string | null) => {
    const parts = formatScheduledDate(iso);
    return parts ? `${parts.date}, ${parts.time}` : '—';
  };
  const formatMinutes = (seconds: number | null) =>
    seconds === null ? '—' : `${Math.round(seconds / 60)} min`;
  const STATUS_LABELS: Record<string, string> = {
    live: 'Live Now',
    upcoming: 'Scheduled',
    scheduled: 'Scheduled',
    draft: 'Draft',
    ended: 'Completed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const exportParticipantsCsv = (lt: LiveTest, rows: LiveTestStats['leaderboard']) => {
    if (rows.length === 0) {
      toast.info('No submissions to export yet');
      return;
    }
    const lines = [
      ['Rank', 'Student', 'Score', 'Time (min)'].map(csvCell).join(','),
      ...rows.map((r) =>
        [r.rank, r.name, r.score, Math.round(r.timeSeconds / 60)].map(csvCell).join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(lt.title || 'live-test').replace(/[^a-z0-9]+/gi, '-')}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const drawerSchedStart = useMemo(() => {
    if (!selectedLiveTest) return null;
    return formatScheduledDate(selectedLiveTest.scheduledStartTime || selectedLiveTest.startAt);
  }, [selectedLiveTest]);

  const drawerSchedEnd = useMemo(() => {
    if (!selectedLiveTest) return null;
    const startIso = selectedLiveTest.scheduledStartTime || selectedLiveTest.startAt;
    if (!startIso) return null;
    const startDate = new Date(startIso);
    if (isNaN(startDate.getTime())) return null;
    const duration = selectedLiveTest.durationMinutes || 60;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    return formatScheduledDate(endDate.toISOString());
  }, [selectedLiveTest]);

  const drawerCreatedAt = useMemo(() => {
    if (!selectedLiveTest?.createdAt) return null;
    return formatScheduledDate(selectedLiveTest.createdAt);
  }, [selectedLiveTest]);

  // Select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedTests.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setExamFilter('all');
    setStatusFilter('all');
    setActiveTab('all');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  // Duplicate Live Test (a live-only paper is copied with its questions as a new Draft)
  const handleDuplicate = async (lt: LiveTest) => {
    try {
      const newSchedule = await api.duplicateLiveTest(lt.id);
      setLiveTests((prev) => [newSchedule, ...prev]);
      setSelectedTestId(newSchedule.id);
      setIsDrawerOpen(true);
      toast.success('Live Test duplicated successfully');
      setActiveMenuId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate test');
    }
  };

  // Open the paper's question workspace (upload / review questions)
  const openPaperQuestions = (lt: LiveTest) => {
    setActiveMenuId(null);
    navigate(`/admin/live-tests/${lt.id}/questions`);
  };

  // Release an ended Live Test's paper to regular practice
  const handleReleaseToPractice = async (lt: LiveTest) => {
    try {
      await api.releaseLivePaperToPractice(lt.id);
      setLiveTests((prev) =>
        prev.map((t) =>
          t.id === lt.id && t.test ? { ...t, test: { ...t.test, isLiveOnly: false } } : t
        )
      );
      toast.success(`"${lt.title}" is now available as a practice Full Mock`);
      setActiveMenuId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to release paper');
    }
  };

  // End Live Test
  const handleEndLiveTest = async (lt: LiveTest) => {
    try {
      await api.updateLiveTest(lt.id, { status: 'ended' });
      setLiveTests((prev) => prev.map((t) => (t.id === lt.id ? { ...t, status: 'ended' } : t)));
      toast.success(`Live Test "${lt.title}" ended and rankings finalized`);
      setEndCandidate(null);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to end Live Test');
    }
  };

  // Delete Live Test
  const handleDeleteLiveTest = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteLiveTest(deleteCandidate.id);
      setLiveTests((prev) => prev.filter((t) => t.id !== deleteCandidate.id));
      if (selectedTestId === deleteCandidate.id) {
        setSelectedTestId(null);
      }
      toast.success('Live Test deleted successfully');
      setDeleteCandidate(null);
      setActiveMenuId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete Live Test');
    }
  };

  // Start Live Now
  const handleStartLiveNow = async (lt: LiveTest) => {
    try {
      const nowIso = new Date().toISOString();
      await api.updateLiveTest(lt.id, {
        startAt: nowIso,
        registrationDeadline: nowIso,
        status: 'live',
      });
      setLiveTests((prev) =>
        prev.map((t) => (t.id === lt.id ? { ...t, status: 'live', startAt: nowIso } : t))
      );
      toast.success(`"${lt.title}" is now LIVE!`);
      setActiveMenuId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to launch live test');
    }
  };

  return {
    setLiveTests,
    exams,
    statsById,
    statsError,
    loading,
    setSelectedTestId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    examFilter,
    setExamFilter,
    statusFilter,
    setStatusFilter,
    dateRangeFilter,
    setDateRangeFilter,
    selectedIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isDrawerOpen,
    setIsDrawerOpen,
    drawerTab,
    setDrawerTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingTest,
    setEditingTest,
    isMonitorModalOpen,
    setIsMonitorModalOpen,
    deleteCandidate,
    setDeleteCandidate,
    endCandidate,
    setEndCandidate,
    activeMenuId,
    setActiveMenuId,
    toastNotification,
    navigate,
    stats,
    distinctExams,
    filteredTests,
    totalPages,
    paginatedTests,
    selectedLiveTest,
    selectedStats,
    selectedPaperQuestions,
    selectedMarks,
    selectedNegative,
    submissionRate,
    windowProgress,
    formatDateTime,
    formatMinutes,
    STATUS_LABELS,
    exportParticipantsCsv,
    drawerSchedStart,
    drawerSchedEnd,
    drawerCreatedAt,
    handleSelectAll,
    handleToggleSelectRow,
    handleResetFilters,
    handleDuplicate,
    openPaperQuestions,
    handleReleaseToPractice,
    handleEndLiveTest,
    handleDeleteLiveTest,
    handleStartLiveNow,
  };
}

export type AdminLiveTestsState = ReturnType<typeof useAdminLiveTests>;
