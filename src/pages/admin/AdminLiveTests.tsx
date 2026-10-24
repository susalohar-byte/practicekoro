import { withAdminSkeleton, AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import {
  EMPTY_LIVE_TEST_STATS,
  isoToLocalDateTimeParts,
  localDateTimeToIso,
  type LiveTestStats,
} from '@/services/domains/admin.liveTests';
import { csvCell } from '@/utils/csvExport';
import type { Exam, LiveTest } from '@/types';
import {
  Radio,
  Calendar,
  CheckCircle2,
  Users,
  Plus,
  Search,
  Filter,
  ExternalLink,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Upload,
  Copy,
  Clock,
  Target,
  FileText,
  Hourglass,
  StopCircle,
  Play,
  Monitor,
  AlertCircle,
  Download,
  ListChecks,
  Unlock,
  ArrowRight,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getPageNumbers } from '@/utils/pagination';

type ToastType = 'success' | 'error' | 'info';
let globalToastHandler: ((msg: string, type: ToastType) => void) | null = null;

const toast = {
  success: (msg: string) => globalToastHandler?.(msg, 'success'),
  error: (msg: string) => globalToastHandler?.(msg, 'error'),
  info: (msg: string) => globalToastHandler?.(msg, 'info'),
};

const PRESET_LOGOS = [
  { name: 'WBP Police', url: '/images/exams/logo_wbp.png' },
  { name: 'Kolkata Police', url: '/images/exams/logo_kp.png' },
  { name: 'WBPSC', url: '/images/exams/logo_wbpsc.png' },
  { name: 'Railway', url: '/images/exams/logo_railway.png' },
  { name: 'SSC', url: '/images/exams/logo_ssc.png' },
  { name: 'WB TET', url: '/images/exams/logo_wbtet.png' },
];

function formatScheduledDate(
  dateStr: string | null | undefined
): { date: string; time: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return {
    date: `${day < 10 ? '0' + day : day} ${month} ${year}`,
    time: `${formattedHours}:${minutes} ${ampm}`,
  };
}

export const AdminLiveTests: React.FC = () => {
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

  return withAdminSkeleton(
    loading,
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Row */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Test</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, schedule and manage live full mock tests for real-time participation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setEditingTest(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Live Test</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Top 4 KPI Cards Matching Reference Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Now */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Live Now</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.liveCount}</h3>
              <p className="text-xs text-slate-400 mt-1">test is currently live</p>
            </div>
          </div>

          {/* Card 2: Scheduled */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Scheduled</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.upcomingCount}</h3>
              <p className="text-xs text-slate-400 mt-1">upcoming live tests</p>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.endedCount}</h3>
              <p className="text-xs text-slate-400 mt-1">live tests finished</p>
            </div>
          </div>

          {/* Card 4: Total Participants */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-500 border border-purple-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Total Participants</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {statsError ? '—' : stats.totalParticipants.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {statsError ? 'stats unavailable' : 'students who sat a live test'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Tabs Matching Reference */}
        <div className="border-b border-slate-200 bg-white px-2 rounded-t-xl">
          <div className="flex items-center gap-8 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              All Live Tests ({stats.total})
            </button>
            <button
              onClick={() => {
                setActiveTab('live');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'live'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Live Now ({stats.liveCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'scheduled'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Scheduled ({stats.upcomingCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('completed');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Completed ({stats.endedCount})
            </button>
          </div>
        </div>

        {/* Filter Toolbar Matching Reference */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Field */}
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search live tests..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Exam Dropdown */}
              <select
                value={examFilter}
                onChange={(e) => {
                  setExamFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Exams</option>
                {distinctExams.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="live">Live Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-xs text-slate-700 w-44"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Table on Left + Details Panel on Right */}
        <div className="flex flex-col lg:flex-row items-start gap-4 w-full">
          {/* Main Table Container */}
          <div
            className={cn(
              'w-full transition-all duration-300 min-w-0',
              isDrawerOpen && selectedLiveTest ? 'lg:flex-1' : 'w-full'
            )}
          >
            <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto min-h-[340px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedTests.length > 0 &&
                          paginatedTests.every((t) => selectedIds.has(t.id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center text-slate-400">#</th>
                    <th className="py-3 px-3">Test Name</th>
                    <th className="py-3 px-3">Exam</th>
                    <th className="py-3 px-3">Scheduled Date & Time</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Participants</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-4">
                        <AdminSectionSkeleton label="Loading live tests..." variant="table" />
                      </td>
                    </tr>
                  ) : paginatedTests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Radio className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">No live tests found</p>
                          <p className="text-xs text-slate-400">
                            Try adjusting your filters or create a new live test
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTests.map((test, index) => {
                      const rowNumber = (currentPage - 1) * pageSize + index + 1;
                      const isRowChecked = selectedIds.has(test.id);
                      const isRowActive = isDrawerOpen && selectedLiveTest?.id === test.id;
                      const schedDate = formatScheduledDate(
                        test.scheduledStartTime || test.startAt
                      );

                      return (
                        <tr
                          key={test.id}
                          onClick={() => {
                            setSelectedTestId(test.id);
                            setIsDrawerOpen(true);
                          }}
                          className={cn(
                            'hover:bg-slate-50/80 transition-colors cursor-pointer group',
                            isRowChecked && 'bg-blue-50/30',
                            isRowActive && 'bg-blue-50/70 ring-1 ring-inset ring-blue-500/30 font-medium'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => handleToggleSelectRow(test.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(test.id)}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Index # */}
                          <td className="py-3.5 px-2 text-center text-xs text-slate-400 font-medium">
                            {rowNumber}
                          </td>

                          {/* Test Name + Emblem + Sub-badge */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center p-1">
                                <img
                                  src={test.logo || test.examLogo || '/images/exams/logo_wbp.png'}
                                  alt={test.title}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      '/images/exams/logo_wbp.png';
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {test.title}
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.2 rounded">
                                    Full Mock Test
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Exam */}
                          <td className="py-3.5 px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                            {test.examTitle || test.test?.examTitle || '—'}
                          </td>

                          {/* Scheduled Date & Time */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {schedDate ? (
                              <div>
                                <div className="text-xs font-medium text-slate-800">
                                  {schedDate.date}
                                </div>
                                <div className="text-[11px] text-slate-400">{schedDate.time}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                            {test.durationMinutes || 60} min
                          </td>

                          {/* Participants */}
                          <td className="py-3.5 px-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {(statsById[test.id]?.participants || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {test.status === 'live' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                                <span>Live Now</span>
                              </span>
                            )}
                            {(test.status === 'upcoming' || test.status === 'scheduled') && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                Scheduled
                              </span>
                            )}
                            {test.status === 'draft' && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                Draft
                              </span>
                            )}
                            {(test.status === 'ended' || test.status === 'completed') && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Completed
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3.5 px-3 text-right relative action-menu-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === test.id ? null : test.id);
                              }}
                              className={cn(
                                'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer',
                                activeMenuId === test.id &&
                                  'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 ring-2 ring-blue-500/20'
                              )}
                              title="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuId === test.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-2 top-10 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTestId(test.id);
                                    setIsDrawerOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Monitor className="w-4 h-4 text-blue-600 shrink-0" />
                                  <span className="font-semibold">View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    openPaperQuestions(test);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <ListChecks className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span className="font-semibold">
                                      {test.status === 'draft'
                                        ? 'Upload Questions'
                                        : 'View Questions'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {test.test?.totalQuestions ?? test.totalQuestions ?? 0}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTest(test);
                                    setIsCreateModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-4 h-4 text-slate-500 shrink-0" />
                                  <span>Edit Test</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDuplicate(test);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-4 h-4 text-purple-600 shrink-0" />
                                  <span>Duplicate Test</span>
                                </button>

                                {/* Contextual actions */}
                                {test.status !== 'live' &&
                                  test.status !== 'ended' &&
                                  test.status !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleStartLiveNow(test);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                    >
                                      <Play className="w-4 h-4 shrink-0" />
                                      <span>Start Live Now</span>
                                    </button>
                                  )}

                                {(test.status === 'ended' ||
                                  test.status === 'completed' ||
                                  test.status === 'cancelled') &&
                                  test.test?.isLiveOnly && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleReleaseToPractice(test);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                    >
                                      <Unlock className="w-4 h-4 shrink-0" />
                                      <span>Release to Practice</span>
                                    </button>
                                  )}

                                {test.status === 'live' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEndCandidate(test);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                  >
                                    <StopCircle className="w-4 h-4 shrink-0" />
                                    <span>End Live Test</span>
                                  </button>
                                )}

                                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteCandidate(test);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 shrink-0" />
                                  <span>Delete Test</span>
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

            {/* Pagination Matching Reference */}
            <div className="py-4 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredTests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredTests.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{filteredTests.length}</span> live
                tests
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'min-w-7 h-7 px-2 rounded-md font-medium text-xs transition-colors cursor-pointer',
                        currentPage === item
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Test Details Panel (Sticky side-by-side like Mock Tests & Question Bank) */}
        {isDrawerOpen && selectedLiveTest && (
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col max-h-[calc(100vh-5rem)] self-start sticky top-4 animate-in fade-in-50 duration-200 overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Test Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overview, candidate leaderboard & controls
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setSelectedTestId(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Close details"
                title="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Top Identity Card */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white shrink-0 p-1 flex items-center justify-center shadow-xs">
                          <img
                            src={
                              selectedLiveTest.logo ||
                              selectedLiveTest.examLogo ||
                              '/images/exams/logo_wbp.png'
                            }
                            alt={selectedLiveTest.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                              {selectedLiveTest.title}
                            </h3>
                            {/* Dynamic Live Status Badge */}
                            {selectedLiveTest.status === 'live' && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                                <Radio className="w-2.5 h-2.5 animate-pulse" />
                                <span>Live Now</span>
                              </span>
                            )}
                            {(selectedLiveTest.status === 'upcoming' ||
                              selectedLiveTest.status === 'scheduled') && (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                                Scheduled
                              </span>
                            )}
                            {selectedLiveTest.status === 'draft' && (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                                Draft
                              </span>
                            )}
                            {(selectedLiveTest.status === 'ended' ||
                              selectedLiveTest.status === 'completed') && (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                                Completed
                              </span>
                            )}
                            {selectedLiveTest.status === 'cancelled' && (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedLiveTest.examTitle || selectedLiveTest.test?.examTitle || '—'} • Full Mock Test
                          </p>
                        </div>
                      </div>

                      {/* Top Quick Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => openPaperQuestions(selectedLiveTest)}
                          className="col-span-2 inline-flex items-center justify-center gap-2 py-2 px-3.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            {selectedLiveTest.status === 'draft' ? 'Upload Questions' : 'View Questions'} ({selectedPaperQuestions})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMonitorModalOpen(true)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                        >
                          <Monitor className="w-3.5 h-3.5 shrink-0" />
                          <span>Live Monitor</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTest(selectedLiveTest);
                            setIsCreateModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Edit Details</span>
                        </button>
                      </div>
                    </div>

                    {/* Drawer Tabs Navigation */}
                    <div className="border-b border-slate-200">
                      <div className="flex items-center gap-6 text-xs font-medium">
                        {(['overview', 'participants', 'settings', 'analytics'] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setDrawerTab(tab)}
                            className={cn(
                              'pb-2.5 transition-colors border-b-2 capitalize font-semibold cursor-pointer text-xs',
                              drawerTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            )}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab 1: Overview */}
                    {drawerTab === 'overview' && (
                      <div className="space-y-5">
                        {/* 6 Key Metric Cards */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* 1. Participants */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-bold text-slate-900">
                                {selectedStats.participants.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Total Candidates</p>
                          </div>

                          {/* 2. Submission Rate */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-bold text-slate-900">
                                {submissionRate === null ? '—' : `${submissionRate}%`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Submission Rate</p>
                          </div>

                          {/* 3. Duration */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 text-purple-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-bold text-slate-900">
                                {selectedLiveTest.durationMinutes || 0} min
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Exam Duration</p>
                          </div>

                          {/* 4. Total Questions */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 text-indigo-600">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-bold text-slate-900">
                                {selectedPaperQuestions}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Total Questions</p>
                          </div>

                          {/* 5. Avg. Score */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 text-rose-600">
                              <Target className="w-4 h-4" />
                              <span className="text-sm font-bold text-slate-900">
                                {selectedStats.avgScore === null
                                  ? '—'
                                  : `${Number(selectedStats.avgScore.toFixed(1))} / ${selectedMarks}`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Avg. Score</p>
                          </div>

                          {/* 6. Avg. Time Taken */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <Hourglass className="w-4 h-4" />
                              <span className="text-sm font-bold text-slate-900">
                                {formatMinutes(selectedStats.avgTimeSeconds)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Avg. Time Taken</p>
                          </div>
                        </div>

                        {/* Live Test Window Progress */}
                        <div className="space-y-1.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">Exam Window Progress</span>
                            <span className="font-bold text-blue-600">{windowProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${windowProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Detailed Key-Value Breakdown */}
                        <div className="text-xs space-y-2 text-slate-600 divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 p-3.5">
                          <div className="flex items-start justify-between pt-1">
                            <span className="text-slate-400 w-32 shrink-0">Start Window</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {drawerSchedStart
                                ? `${drawerSchedStart.date}, ${drawerSchedStart.time}`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">End Window</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {drawerSchedEnd ? `${drawerSchedEnd.date}, ${drawerSchedEnd.time}` : '—'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Duration</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {selectedLiveTest.durationMinutes || 0} minutes
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Target Exam</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {selectedLiveTest.examTitle || selectedLiveTest.test?.examTitle || '—'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Exam Format</span>
                            <span className="font-semibold text-slate-800 text-right">Full Mock Test</span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Questions Count</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {selectedPaperQuestions}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Total Marks</span>
                            <span className="font-semibold text-slate-800 text-right">{selectedMarks}</span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Negative Marking</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {selectedNegative > 0 ? `${selectedNegative} / wrong` : 'None'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Current Status</span>
                            <span className="font-bold text-slate-800 text-right">
                              {STATUS_LABELS[selectedLiveTest.status] || selectedLiveTest.status}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Created Date</span>
                            <span className="font-medium text-slate-700 text-right">
                              {drawerCreatedAt ? `${drawerCreatedAt.date}, ${drawerCreatedAt.time}` : '—'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-2">
                            <span className="text-slate-400 w-32 shrink-0">Last Updated</span>
                            <span className="font-medium text-slate-700 text-right">
                              {formatDateTime(selectedLiveTest.updatedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Contextual Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          {selectedLiveTest.status === 'live' && (
                            <button
                              type="button"
                              onClick={() => setEndCandidate(selectedLiveTest)}
                              className="flex-1 py-2 px-3 border border-rose-200 text-rose-600 bg-rose-50/50 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <StopCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>End Live Test</span>
                            </button>
                          )}

                          {selectedLiveTest.status !== 'live' &&
                            selectedLiveTest.status !== 'ended' &&
                            selectedLiveTest.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleStartLiveNow(selectedLiveTest)}
                                className="flex-1 py-2 px-3 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 shrink-0" />
                                <span>Start Live Now</span>
                              </button>
                            )}

                          {(selectedLiveTest.status === 'ended' || selectedLiveTest.status === 'completed') &&
                            selectedLiveTest.test?.isLiveOnly && (
                              <button
                                type="button"
                                onClick={() => handleReleaseToPractice(selectedLiveTest)}
                                className="flex-1 py-2 px-3 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5 shrink-0" />
                                <span>Release to Practice</span>
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => handleDuplicate(selectedLiveTest)}
                            className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Duplicate</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Participants */}
                    {drawerTab === 'participants' && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            Leaderboard ({selectedStats.submitted} submitted)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              exportParticipantsCsv(selectedLiveTest, selectedStats.leaderboard)
                            }
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </button>
                        </div>

                        {selectedStats.leaderboard.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                            <Users className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-60" />
                            <p className="font-semibold text-slate-700">No submissions yet</p>
                            <p className="text-[11px] text-slate-400">
                              {statsError
                                ? `Error loading participants: ${statsError}`
                                : 'When candidates submit this test, real ranks will appear here.'}
                            </p>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-2xs">
                            <div className="grid grid-cols-12 bg-slate-50 px-3 py-2.5 font-bold text-slate-600 border-b border-slate-200">
                              <span className="col-span-2 text-center">Rank</span>
                              <span className="col-span-5">Candidate</span>
                              <span className="col-span-3 text-right">Score</span>
                              <span className="col-span-2 text-right">Time</span>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                              {selectedStats.leaderboard.map((p) => (
                                <div
                                  key={p.userId}
                                  className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-50/80 transition-colors"
                                >
                                  <span className="col-span-2 text-center font-bold text-slate-700">
                                    #{p.rank}
                                  </span>
                                  <span className="col-span-5 font-semibold text-slate-800 truncate pr-2">
                                    {p.name}
                                  </span>
                                  <span className="col-span-3 text-right font-bold text-emerald-600">
                                    {p.score}
                                  </span>
                                  <span className="col-span-2 text-right text-slate-500 font-medium">
                                    {Math.round(p.timeSeconds / 60)}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Settings */}
                    {drawerTab === 'settings' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Statewide Ranking</span>
                            <span
                              className={cn(
                                'font-bold px-2 py-0.5 rounded text-[11px]',
                                selectedLiveTest.rankingEnabled
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-700'
                              )}
                            >
                              {selectedLiveTest.rankingEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Calculates percentile and statewide rank among all candidates automatically upon submission.
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Negative Marking</span>
                            <span className="font-bold text-slate-800">
                              {selectedNegative > 0 ? `${selectedNegative} Marks` : 'None'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {selectedNegative > 0
                              ? `${selectedNegative} marks deducted per incorrect response.`
                              : 'No marks are deducted for incorrect responses.'}
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Access Level</span>
                            <span className="font-bold text-slate-800">
                              {selectedLiveTest.subscriptionRequired ? 'Pro Pass only' : 'Free for all students'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {selectedLiveTest.subscriptionRequired
                              ? 'Only active Pro Pass subscribers can attempt this Live Test.'
                              : 'All registered candidates can attempt this Live Test.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Analytics */}
                    {drawerTab === 'analytics' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2">
                          <span className="font-bold text-slate-800">
                            Top Participating Districts
                          </span>
                          {selectedStats.topDistricts.length === 0 ? (
                            <p className="pt-1 text-slate-500 text-[11px]">
                              {statsError
                                ? `District data could not be loaded: ${statsError}`
                                : 'No participant district data recorded yet.'}
                            </p>
                          ) : (
                            <div className="space-y-2 pt-1">
                              {selectedStats.topDistricts.map((d) => (
                                <div key={d.name} className="flex justify-between items-center text-slate-700">
                                  <span className="font-medium">
                                    {d.name} <span className="text-slate-400">({d.count})</span>
                                  </span>
                                  <span className="font-bold text-slate-900">{d.percent}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* CREATE / EDIT LIVE TEST MODAL */}
      {isCreateModalOpen && (
        <CreateEditLiveTestModal
          isOpen={isCreateModalOpen}
          initialData={editingTest}
          exams={exams}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTest(null);
          }}
          onSave={async (saved) => {
            if (editingTest) {
              setLiveTests((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
              toast.success('Live Test updated successfully');
              setIsCreateModalOpen(false);
              setEditingTest(null);
            } else {
              // Next step of a new Live Test: upload its paper's questions.
              setIsCreateModalOpen(false);
              navigate(`/admin/live-tests/${saved.id}/questions`);
            }
          }}
        />
      )}

      {/* LIVE TEST MONITOR MODAL */}
      {isMonitorModalOpen && selectedLiveTest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900">
                  Live Test Monitor: {selectedLiveTest.title}
                </h2>
              </div>
              <button
                onClick={() => setIsMonitorModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                <span className="text-2xl font-bold text-blue-700">
                  {selectedStats.participants.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-blue-900 mt-0.5">Students Started</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-2xl font-bold text-emerald-700">
                  {selectedStats.submitted.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-900 mt-0.5">Submitted</p>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                <span className="text-2xl font-bold text-purple-700">
                  {Math.max(0, selectedStats.participants - selectedStats.submitted).toLocaleString(
                    'en-IN'
                  )}
                </span>
                <p className="text-xs text-purple-900 mt-0.5">Currently Writing</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Submission Rate</span>
                <span className="text-blue-600">
                  {submissionRate === null ? '—' : `${submissionRate}%`}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${submissionRate ?? 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMonitorModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* END CONFIRMATION DIALOG */}
      {endCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <StopCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">End Live Test Now</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to end{' '}
              <span className="font-semibold text-slate-900">"{endCandidate.title}"</span>? All
              ongoing candidate attempts will be finalized and ranked statewide.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEndCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEndLiveTest(endCandidate)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                End Test Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Live Test</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">"{deleteCandidate.title}"</span>? This
              will permanently remove this live test event.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLiveTest}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toastNotification && (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2',
            toastNotification.type === 'success' &&
              'bg-emerald-50 text-emerald-800 border-emerald-200',
            toastNotification.type === 'error' && 'bg-rose-50 text-rose-800 border-rose-200',
            toastNotification.type === 'info' && 'bg-blue-50 text-blue-800 border-blue-200'
          )}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastNotification.message}</span>
        </div>
      )}
    </div>,
    { label: 'Loading live tests…', variant: 'table' }
  );
};

// ----------------------------------------------------
// CREATE / EDIT LIVE TEST MODAL COMPONENT
// ----------------------------------------------------

interface CreateEditLiveTestModalProps {
  isOpen: boolean;
  initialData: LiveTest | null;
  exams: Exam[];
  onClose: () => void;
  onSave: (test: LiveTest) => Promise<void>;
}

const getDefaultStartDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const CreateEditLiveTestModal: React.FC<CreateEditLiveTestModalProps> = ({
  initialData,
  exams,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [examId, setExamId] = useState(initialData?.examId || '');
  const [logo, setLogo] = useState(
    initialData?.logo || initialData?.examLogo || PRESET_LOGOS[0].url
  );
  // Date/time inputs are in the admin's local timezone (IST); stored as UTC ISO.
  const initialStartParts = initialData?.startAt
    ? isoToLocalDateTimeParts(initialData.startAt)
    : null;
  const [startDate, setStartDate] = useState(initialStartParts?.date ?? getDefaultStartDate());
  const [startTime, setStartTime] = useState(initialStartParts?.time ?? '10:00');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 60);
  const [totalQuestions, setTotalQuestions] = useState(initialData?.totalQuestions || 100);
  const [totalMarks, setTotalMarks] = useState(initialData?.totalMarks || 100);
  const [negativeMarking, setNegativeMarking] = useState(initialData?.negativeMarking ?? 0.25);
  const [status, setStatus] = useState<string>(initialData?.status || 'upcoming');
  const [rankingEnabled, setRankingEnabled] = useState(
    initialData?.rankingEnabled !== undefined ? initialData.rankingEnabled : true
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  // Prevent background scrolling when dialog is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Auto-suggest title & default logo when an exam is selected
  const handleExamChange = (newExamId: string) => {
    setExamId(newExamId);
    const selected = exams.find((ex) => ex.id === newExamId);
    if (selected) {
      if (!title.trim() || title.includes('Live Test')) {
        setTitle(`${selected.title} Live Test 01`);
      }
      const text = `${selected.title} ${selected.slug || ''}`.toLowerCase();
      let matchedLogo = PRESET_LOGOS[0].url;
      if (text.includes('kolkata') || text.includes('kp')) {
        matchedLogo = '/images/exams/logo_kp.png';
      } else if (
        text.includes('psc') ||
        text.includes('clerkship') ||
        text.includes('miscellaneous')
      ) {
        matchedLogo = '/images/exams/logo_wbpsc.png';
      } else if (text.includes('rail') || text.includes('rrb') || text.includes('alp')) {
        matchedLogo = '/images/exams/logo_railway.png';
      } else if (text.includes('ssc')) {
        matchedLogo = '/images/exams/logo_ssc.png';
      } else if (text.includes('tet') || text.includes('primary')) {
        matchedLogo = '/images/exams/logo_wbtet.png';
      } else if (text.includes('wbp') || text.includes('police')) {
        matchedLogo = '/images/exams/logo_wbp.png';
      }

      if (!logo || logo === PRESET_LOGOS[0].url) {
        setLogo(matchedLogo);
      }
    }
  };

  const scheduleSummary = useMemo(() => {
    try {
      const iso = localDateTimeToIso(startDate, startTime);
      const start = new Date(iso);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      return `${start.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} · ${start.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })} – ${end.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`;
    } catch {
      return `${startDate} at ${startTime}`;
    }
  }, [startDate, startTime, durationMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!initialData && !examId) {
      toast.error('Select the exam for this Live Test');
      return;
    }

    try {
      setIsSubmitting(true);
      const startIso = localDateTimeToIso(startDate, startTime);
      const endIso = new Date(
        new Date(startIso).getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      let result: LiveTest;
      if (initialData) {
        // Keep an explicit earlier registration deadline; otherwise it follows the start time
        // (it defaulted to the start time on create and must never be after the start).
        const prevDeadline = initialData.registrationDeadline
          ? new Date(initialData.registrationDeadline).getTime()
          : NaN;
        const keepDeadline =
          !isNaN(prevDeadline) &&
          prevDeadline !== new Date(initialData.startAt).getTime() &&
          prevDeadline <= new Date(startIso).getTime();
        result = await api.updateLiveTest(initialData.id, {
          registrationDeadline: keepDeadline ? initialData.registrationDeadline : startIso,
          title,
          logo,
          examLogo: logo,
          startAt: startIso,
          scheduledStartTime: startIso,
          scheduledEndTime: endIso,
          durationMinutes: Number(durationMinutes),
          totalQuestions: Number(totalQuestions),
          totalMarks: Number(totalMarks),
          negativeMarking: Number(negativeMarking),
          rankingEnabled,
          status: status as any,
        });
      } else {
        // Creates the Live Test's own paper (hidden Full Mock) and a Draft event for it.
        result = await api.createLiveTestWithPaper({
          examId,
          title,
          startAt: startIso,
          durationMinutes: Number(durationMinutes),
          totalQuestions: Number(totalQuestions),
          totalMarks: Number(totalMarks),
          negativeMarking: Number(negativeMarking),
          rankingEnabled,
          logo,
        });
      }

      await onSave(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save Live Test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-edit-live-test-title"
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2
                id="create-edit-live-test-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate"
              >
                {initialData ? 'Edit Live Test' : 'Create New Live Test'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {initialData
                  ? 'Update event schedule, duration and marking parameters'
                  : 'Step 1 of 2 · Configure parameters and initialize hidden paper'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close dialog (Esc)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
          >
            <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-600 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
              ESC
            </span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container wrapping scrollable body and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Context callout for create mode */}
            {!initialData && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
                <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    Dedicated Live Mock Architecture:
                  </span>{' '}
                  This creates a clean, isolated full mock paper for this live test. Questions are
                  uploaded exclusively inside this test and stay hidden until published.
                </div>
              </div>
            )}

            {/* Exam and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Exam {!initialData && <span className="text-rose-500">*</span>}
                </label>
                {initialData ? (
                  <input
                    type="text"
                    disabled
                    value={
                      initialData.examTitle ||
                      exams.find((ex) => ex.id === examId)?.title ||
                      'Assigned Exam'
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium"
                  />
                ) : (
                  <select
                    required
                    value={examId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">-- Choose Target Exam --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Event Status
                </label>
                {initialData ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="upcoming">Scheduled (Upcoming)</option>
                    <option value="live">Live Now (Ongoing)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="ended">Completed</option>
                    {initialData.status === 'cancelled' && (
                      <option value="cancelled">Cancelled</option>
                    )}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 text-xs font-medium border border-amber-200 dark:border-amber-900/60 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Draft (Auto-switches to Scheduled on Publish)
                  </div>
                )}
              </div>
            </div>

            {/* Test Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Live Test Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WBP Constable Special Full Live Mock 01"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Date & Time with Schedule Summary */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Scheduled Slot (IST)
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {scheduleSummary}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Paper Parameters (4 Clean Metric Cards) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Paper Parameters & Marking Scheme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Duration */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Duration</span>
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">min</span>
                  </div>
                </div>

                {/* Questions */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Total Qs</span>
                    <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">Qs</span>
                  </div>
                </div>

                {/* Total Marks */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Total Marks</span>
                    <Award className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">pts</span>
                  </div>
                </div>

                {/* Negative Marks */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Negative</span>
                    <Target className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      required
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">/err</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam / Live Test Logo Section */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Live Test Logo & Branding
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pick an official preset badge or upload a custom image
                  </span>
                </div>
                {logo && logo !== '/images/exams/logo_wbp.png' && (
                  <button
                    type="button"
                    onClick={() => setLogo('/images/exams/logo_wbp.png')}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Reset to default icon"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3.5">
                {/* Live Preview */}
                <div className="w-13 h-13 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={logo || '/images/exams/logo_wbp.png'}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                    }}
                  />
                </div>

                {/* Upload Controls */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                        isUploadingLogo
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                      )}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingLogo ? 'Uploading...' : 'Upload Custom Icon'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo}
                        className="hidden"
                        onChange={async (ev) => {
                          const file = ev.target.files?.[0];
                          if (!file) return;
                          try {
                            setIsUploadingLogo(true);
                            const uploadedUrl = await api.uploadLiveTestLogo(
                              file,
                              initialData?.id || 'new'
                            );
                            setLogo(uploadedUrl);
                          } catch (err: any) {
                            toast.error('Failed to upload logo: ' + (err?.message || 'Error'));
                          } finally {
                            setIsUploadingLogo(false);
                          }
                        }}
                      />
                    </label>

                    <span className="text-[11px] text-slate-400">or image URL:</span>
                  </div>

                  <input
                    type="text"
                    placeholder="https://... or data:image/..."
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preset Logos */}
              <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Official Exam Badges
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_LOGOS.map((pl) => {
                    const isSelected = logo === pl.url;
                    return (
                      <button
                        type="button"
                        key={pl.name}
                        onClick={() => setLogo(pl.url)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all text-left cursor-pointer',
                          isSelected
                            ? 'border-[#026BFC] bg-blue-50/80 dark:bg-blue-950/40 text-[#026BFC] dark:text-blue-400 font-bold ring-2 ring-[#026BFC]/25 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={pl.url}
                            alt={pl.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="truncate text-xs">{pl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ranking Toggle Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rankingEnabled}
                  onChange={(e) => setRankingEnabled(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Enable Statewide Real-Time Ranking & Percentile
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically computes statewide rank, district rank, and percentile score for
                    every student upon submission.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-10">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{durationMinutes} mins</span>
              <span>•</span>
              <span>{totalQuestions} Qs</span>
              <span>•</span>
              <span>{totalMarks} Marks</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : initialData ? (
                  <span>Update Live Test</span>
                ) : (
                  <>
                    <span>Create & Upload Questions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
