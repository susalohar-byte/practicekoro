import { csvCell } from '@/utils/csvExport';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { LiveTest, LiveTestParticipant } from '@/types';
import {
  type RankingStudent,
  aggregateLiveParticipants,
  mapLiveParticipantToRankingStudent,
} from './rankingsUtils';

export function useAdminRankings() {
  const navigate = useNavigate();

  // Scope Tab: Overall | By Exam | By Subject | By Topic | By Test Series | Live Tests
  const [scopeTab, setScopeTab] = useState<
    'Overall' | 'By Exam' | 'By Subject' | 'By Topic' | 'By Test Series' | 'Live Tests'
  >('Overall');

  // Filter Toolbar State
  const [selectedExam, setSelectedExam] = useState('All Exams');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedTestType, setSelectedTestType] = useState('All Types');
  const [selectedLiveTestId, setSelectedLiveTestId] = useState('All Live Tests');
  const [timePeriod, setTimePeriod] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  // Search typed into the box is applied after a short pause so each keystroke doesn't refetch.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  // Only the latest rankings request may update state; older responses are discarded.
  const latestRankingsRequest = useRef(0);

  // Dynamic dropdown data loaded from database
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbLiveTests, setDbLiveTests] = useState<LiveTest[]>([]);
  const dbLiveTestsRef = useRef<LiveTest[]>([]);
  // Read once per page load and shared by every live leaderboard request: the live test list
  // and the participations app_settings row (not once per live test / per filter change).
  const liveTestsPromiseRef = useRef<Promise<LiveTest[]> | null>(null);
  const loadLiveTestsOnce = useCallback((): Promise<LiveTest[]> => {
    if (!liveTestsPromiseRef.current) {
      liveTestsPromiseRef.current = (api.getLiveTests?.() ?? Promise.resolve([])).catch(
        (err: unknown) => {
          liveTestsPromiseRef.current = null; // allow a retry later
          throw err;
        }
      );
    }
    return liveTestsPromiseRef.current;
  }, []);
  const participationsPromiseRef = useRef<Promise<LiveTestParticipant[]> | null>(null);
  const loadParticipationsOnce = useCallback((): Promise<LiveTestParticipant[] | undefined> => {
    if (typeof api.fetchLiveTestParticipations !== 'function') return Promise.resolve(undefined);
    if (!participationsPromiseRef.current) {
      participationsPromiseRef.current = api.fetchLiveTestParticipations().catch(() => {
        participationsPromiseRef.current = null;
        return [] as LiveTestParticipant[];
      });
    }
    return participationsPromiseRef.current;
  }, []);

  // Live rankings list loaded from Supabase
  const [studentsList, setStudentsList] = useState<RankingStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected Student for Details Widget
  const [selectedStudentRank, setSelectedStudentRank] = useState<number>(1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Load database exams, subjects, and live tests for filter dropdowns
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getAllAdminExams().catch((err) => {
        console.error('Failed to load exams for ranking filters:', err);
        return [];
      }),
      api.getAllAdminSubjects().catch((err) => {
        console.error('Failed to load subjects for ranking filters:', err);
        return [];
      }),
      loadLiveTestsOnce().catch((err: any) => {
        console.error('Failed to load live tests for ranking filters:', err);
        return [];
      }),
    ]).then(([exams, subjects, liveTests]) => {
      if (!isMounted) return;
      if (Array.isArray(exams)) setDbExams(exams);
      if (Array.isArray(subjects)) setDbSubjects(subjects);
      if (Array.isArray(liveTests)) {
        setDbLiveTests(liveTests);
        dbLiveTestsRef.current = liveTests;
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadLiveTestsOnce]);

  // Fetch live rankings from Supabase
  const fetchRankings = useCallback(
    async (overrides?: {
      scope?: 'Overall' | 'By Exam' | 'By Subject' | 'By Topic' | 'By Test Series' | 'Live Tests';
      exam?: string;
      subject?: string;
      testType?: string;
      liveTestId?: string;
      timePeriod?: string;
      search?: string;
    }) => {
      const requestId = ++latestRankingsRequest.current;
      const isStale = () => requestId !== latestRankingsRequest.current;
      setIsLoading(true);
      setLoadError(null);
      try {
        const targetScope = overrides?.scope ?? scopeTab;
        const targetExam = overrides?.exam ?? selectedExam;
        const targetSubject = overrides?.subject ?? selectedSubject;
        const targetTestType = overrides?.testType ?? selectedTestType;
        const targetLiveTestId = overrides?.liveTestId ?? selectedLiveTestId;
        const targetTimePeriod = overrides?.timePeriod ?? timePeriod;
        const targetSearch = overrides?.search ?? debouncedSearch;

        const isLiveTestMode =
          targetScope === 'Live Tests' ||
          targetTestType === 'Live Test' ||
          (targetLiveTestId && targetLiveTestId !== 'All Live Tests');

        if (isLiveTestMode) {
          // 1. Single Live Test Leaderboard
          if (targetLiveTestId && targetLiveTestId !== 'All Live Tests') {
            const knownLiveTest = dbLiveTestsRef.current.find((t) => t.id === targetLiveTestId);
            const participations = await loadParticipationsOnce();
            const participants = await (api.getLiveTestLeaderboard?.(targetLiveTestId, {
              participations,
              liveTest: knownLiveTest,
            }) ?? Promise.resolve([]));
            if (isStale()) return;
            const liveTest = knownLiveTest;
            let list = (participants || []).map((p, idx) =>
              mapLiveParticipantToRankingStudent(p, liveTest, p.rank || idx + 1)
            );
            if (targetSearch.trim()) {
              const q = targetSearch.toLowerCase().trim();
              list = list.filter(
                (s) =>
                  s.name.toLowerCase().includes(q) ||
                  s.studentId.toLowerCase().includes(q) ||
                  s.district.toLowerCase().includes(q) ||
                  s.location.toLowerCase().includes(q)
              );
            }
            setStudentsList(list);
            setSelectedStudentRank(list.length > 0 ? list[0].rank : 1);
          } else {
            // 2. All Live Tests Aggregated Leaderboard
            let liveTestsToFetch = dbLiveTestsRef.current;
            if (liveTestsToFetch.length === 0) {
              liveTestsToFetch = await loadLiveTestsOnce();
              if (Array.isArray(liveTestsToFetch)) {
                setDbLiveTests(liveTestsToFetch);
                dbLiveTestsRef.current = liveTestsToFetch;
              }
            }
            if (targetExam !== 'All Exams') {
              liveTestsToFetch = (liveTestsToFetch || []).filter((lt) => {
                const ex = ((lt as any)?.examName || lt.examTitle || '').toLowerCase();
                const title = (lt.title || '').toLowerCase();
                const q = targetExam.toLowerCase();
                return ex === q || title.includes(q);
              });
            }

            // One participations read for all events; each event's own row is reused.
            const participations = await loadParticipationsOnce();
            const leaderboardPromises = (liveTestsToFetch || []).map(async (lt) => {
              const parts = await (api.getLiveTestLeaderboard?.(lt.id, {
                participations,
                liveTest: lt,
              }) ?? Promise.resolve([]));
              return (parts || []).map((p) => ({ participant: p, liveTest: lt }));
            });
            const results = await Promise.all(leaderboardPromises);
            if (isStale()) return;
            const flattened = results.flat();
            let aggregated = aggregateLiveParticipants(flattened);
            if (targetSearch.trim()) {
              const q = targetSearch.toLowerCase().trim();
              aggregated = aggregated.filter(
                (s) =>
                  s.name.toLowerCase().includes(q) ||
                  s.studentId.toLowerCase().includes(q) ||
                  s.district.toLowerCase().includes(q) ||
                  s.location.toLowerCase().includes(q)
              );
            }
            setStudentsList(aggregated);
            setSelectedStudentRank(aggregated.length > 0 ? aggregated[0].rank : 1);
          }
        } else {
          // Standard mock tests ranking via Reporting RPC / browser aggregation
          const liveRankings = await api.getAdminRankings({
            scope: targetScope,
            exam: targetExam,
            subject: targetSubject,
            testType: targetTestType,
            timePeriod: targetTimePeriod,
            search: targetSearch,
          });

          if (isStale()) return;
          const list = liveRankings || [];
          setStudentsList(list);
          setSelectedStudentRank(list.length > 0 ? list[0].rank : 1);
        }
      } catch (err) {
        if (isStale()) return;
        console.warn('Failed to load admin rankings from database:', err);
        setStudentsList([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load rankings.');
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    },
    [
      scopeTab,
      selectedExam,
      selectedSubject,
      selectedTestType,
      selectedLiveTestId,
      timePeriod,
      debouncedSearch,
      loadLiveTestsOnce,
      loadParticipationsOnce,
    ]
  );

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Handle Scope Tab Changes
  const handleScopeChange = (
    newScope: 'Overall' | 'By Exam' | 'By Subject' | 'By Topic' | 'By Test Series' | 'Live Tests'
  ) => {
    // The fetch effect reruns when the scope changes; fetching here too would load twice.
    setScopeTab(newScope);
    setCurrentPage(1);
  };

  // Dynamic KPI computations
  const totalStudentsCount = studentsList.length;
  const activeTestTakersCount = useMemo(() => {
    return studentsList.filter((s) => s.testsAttempted > 0).length;
  }, [studentsList]);
  const topRankScore = useMemo(() => {
    if (studentsList.length === 0) return 0;
    return Math.max(...studentsList.map((s) => s.accuracy || 0));
  }, [studentsList]);

  // Top 3 Podium Students
  const top1Student = useMemo(() => {
    return (
      studentsList.find((s) => s.rank === 1) || (studentsList.length > 0 ? studentsList[0] : null)
    );
  }, [studentsList]);
  const top2Student = useMemo(() => {
    return (
      studentsList.find((s) => s.rank === 2) || (studentsList.length > 1 ? studentsList[1] : null)
    );
  }, [studentsList]);
  const top3Student = useMemo(() => {
    return (
      studentsList.find((s) => s.rank === 3) || (studentsList.length > 2 ? studentsList[2] : null)
    );
  }, [studentsList]);

  // Row Action Dropdown Popover
  const [openActionRank, setOpenActionRank] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isTop3ModalOpen, setIsTop3ModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isRecentAttemptsModalOpen, setIsRecentAttemptsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Resolve currently active student
  const activeStudent = useMemo(() => {
    return (
      studentsList.find((s) => s.rank === selectedStudentRank) ||
      (studentsList.length > 0 ? studentsList[0] : null)
    );
  }, [studentsList, selectedStudentRank]);

  // Outside click for row actions popover
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionRank(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered Students (Search filter applied instantly)
  const filteredStudents = useMemo(() => {
    let list = studentsList;
    if (selectedSubject !== 'All Subjects') {
      // Applied strictly: no matches means an empty list, not the unfiltered rankings.
      list = list.filter((student) =>
        student.subjectPerformance.some((sp) =>
          sp.subject.toLowerCase().includes(selectedSubject.toLowerCase())
        )
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [studentsList, selectedSubject, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Filtered live tests based on selected exam
  const filteredDbLiveTests = useMemo(() => {
    if (selectedExam === 'All Exams') return dbLiveTests;
    return dbLiveTests.filter((lt) => {
      const ex = ((lt as any)?.examName || lt.examTitle || '').toLowerCase();
      const title = (lt.title || '').toLowerCase();
      const q = selectedExam.toLowerCase();
      return ex === q || title.includes(q);
    });
  }, [dbLiveTests, selectedExam]);

  // CSV Export feature
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Student ID',
      'Student Name',
      'District',
      'Tests Attempted',
      'Questions Answered',
      'Accuracy %',
      'Average Score %',
      'Last Active',
    ];

    const rows = filteredStudents.map((s) => [
      s.rank,
      s.studentId,
      s.name,
      s.district,
      s.testsAttempted,
      s.questionsAnswered,
      `${s.accuracy}%`,
      `${s.avgScore}%`,
      s.lastActive,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');

    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const scopePrefix =
      scopeTab === 'Live Tests' || selectedTestType === 'Live Test'
        ? `live_tests_${selectedLiveTestId !== 'All Live Tests' ? selectedLiveTestId : 'all'}`
        : selectedExam.replace(/\s+/g, '_');
    link.setAttribute('download', `practicekoro_rankings_${scopePrefix}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedExam('All Exams');
    setSelectedSubject('All Subjects');
    setSelectedTestType('All Types');
    setSelectedLiveTestId('All Live Tests');
    setTimePeriod('All Time');
    setSearchQuery('');
    setDebouncedSearch('');
    setScopeTab('Overall');
    setCurrentPage(1);
    // The fetch effect reruns with the reset filters (once, if any filter changed). When
    // nothing changed, reload explicitly so Reset still refreshes the data.
    if (
      selectedExam === 'All Exams' &&
      selectedSubject === 'All Subjects' &&
      selectedTestType === 'All Types' &&
      selectedLiveTestId === 'All Live Tests' &&
      timePeriod === 'All Time' &&
      debouncedSearch === '' &&
      scopeTab === 'Overall'
    ) {
      void fetchRankings();
    }
  };

  return {
    navigate,
    scopeTab,
    selectedExam,
    setSelectedExam,
    selectedSubject,
    setSelectedSubject,
    selectedTestType,
    setSelectedTestType,
    selectedLiveTestId,
    setSelectedLiveTestId,
    timePeriod,
    setTimePeriod,
    searchQuery,
    setSearchQuery,
    dbExams,
    dbSubjects,
    studentsList,
    isLoading,
    loadError,
    selectedStudentRank,
    setSelectedStudentRank,
    isDetailsOpen,
    setIsDetailsOpen,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    fetchRankings,
    handleScopeChange,
    totalStudentsCount,
    activeTestTakersCount,
    topRankScore,
    top1Student,
    top2Student,
    top3Student,
    openActionRank,
    setOpenActionRank,
    actionMenuRef,
    isTop3ModalOpen,
    setIsTop3ModalOpen,
    isPerformanceModalOpen,
    setIsPerformanceModalOpen,
    isRecentAttemptsModalOpen,
    setIsRecentAttemptsModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    activeStudent,
    filteredStudents,
    totalPages,
    paginatedStudents,
    getPageNumbers,
    filteredDbLiveTests,
    handleExportCSV,
    handleResetFilters,
  };
}

export type AdminRankingsState = ReturnType<typeof useAdminRankings>;
