import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MockTest, Exam, Subject, Chapter } from '@/types';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { TestTypeTab } from './testTypes';
import { REFERENCE_DEFAULT_TESTS } from './referenceTests';

export function useAdminTests() {
  const { hasPermission } = useAuth();
  const canDeleteTests = hasPermission('canDeleteTests');
  const [searchParams, setSearchParams] = useSearchParams();

  // Data State
  const [tests, setTests] = useState<MockTest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Type Tab (Strictly: all, full_mock, topic, pyq - NO Subject Test)
  const [activeTab, setActiveTab] = useState<TestTypeTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'full_mock' || tabParam === 'topic' || tabParam === 'pyq') {
      return tabParam;
    }
    return 'all';
  });

  // Filter Toolbar State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Applied Filter State
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    examId: '',
    subjectId: '',
    chapterId: '',
    status: 'all',
  });

  // Table Selection & Pagination
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Split-screen Test Details panel
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'questions' | 'settings' | 'analytics'>(
    'overview'
  );

  // Action Menu open state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<'full_mock' | 'topic' | 'pyq'>(
    'full_mock'
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTest, setPreviewTest] = useState<MockTest | null>(null);
  const [isAddQuestionsModalOpen, setIsAddQuestionsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Drawer Settings editing state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState(90);
  const [editTotalMarks, setEditTotalMarks] = useState(100);
  const [editPassingMarks, setEditPassingMarks] = useState(40);
  const [editNegativeMarking, setEditNegativeMarking] = useState(0.25);
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [editIconUrl, setEditIconUrl] = useState('');
  const [isUploadingDrawerIcon, setIsUploadingDrawerIcon] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync edit form state whenever selectedTest changes
  const syncedTestIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedTest) {
      setEditTitle(selectedTest.title || '');
      setEditDescription(selectedTest.description || '');
      setEditDurationMinutes(selectedTest.durationMinutes || 90);
      setEditTotalMarks(selectedTest.totalMarks ?? 0);
      setEditPassingMarks(selectedTest.passingMarks ?? 0);
      setEditNegativeMarking(selectedTest.negativeMarking ?? 0.25);
      setEditIsPremium(Boolean(selectedTest.isPremium));
      setEditStatus(selectedTest.status || 'published');
      setEditIconUrl(selectedTest.iconUrl || '');
      // Keep the "saved" confirmation when the same test is refreshed after a save.
      if (syncedTestIdRef.current !== selectedTest.id) setSaveSuccessMsg(null);
      syncedTestIdRef.current = selectedTest.id;
    }
  }, [selectedTest]);

  const handleQuickIconUpload = async (file: File, targetTest: MockTest) => {
    try {
      setIsUploadingDrawerIcon(true);
      const url = await api.uploadTestIcon(file, targetTest.id);
      const saved = await api.updateTest(targetTest.id, { iconUrl: url });
      if (saved.iconUrl !== url)
        throw new Error('The backend did not confirm the saved test icon.');
      setTests((prev) => prev.map((t) => (t.id === targetTest.id ? { ...t, iconUrl: url } : t)));
      setSelectedTest((prev) =>
        prev && prev.id === targetTest.id ? { ...prev, iconUrl: url } : prev
      );
      setEditIconUrl(url);
      setSaveSuccessMsg('Icon uploaded and saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Failed to upload icon: ' + (err?.message || 'Error'));
    } finally {
      setIsUploadingDrawerIcon(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    try {
      setIsSavingSettings(true);
      setSaveSuccessMsg(null);
      // Publishing goes through validation (exam, marks, at least one valid question), so save
      // the other settings first and then publish separately.
      const isPublishing = editStatus === 'published' && selectedTest.status !== 'published';
      let updated = await api.updateTest(selectedTest.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        durationMinutes: Number(editDurationMinutes),
        totalMarks: Number(editTotalMarks),
        passingMarks: Number(editPassingMarks),
        negativeMarking: Number(editNegativeMarking),
        isPremium: editIsPremium,
        status: isPublishing ? selectedTest.status : editStatus,
        iconUrl: editIconUrl.trim(),
      });
      if (isPublishing) {
        const publishResult = await api.publishTest(selectedTest.id);
        if (!publishResult.success) {
          setTests((prev) => prev.map((t) => (t.id === selectedTest.id ? updated : t)));
          setSelectedTest(updated);
          alert(
            'Settings saved, but the test was not published: ' +
              (publishResult.error || 'Publish validation failed')
          );
          return;
        }
        updated = { ...updated, status: 'published', isActive: true };
      }
      setTests((prev) => prev.map((t) => (t.id === selectedTest.id ? updated : t)));
      setSelectedTest(updated);
      setSaveSuccessMsg('Changes saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Failed to save changes: ' + getErrorMessage(err, 'Save failed'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [testsData, examsData, subjectsData, chaptersData] = await Promise.all([
        api.getAllAdminTests(),
        api.getExams(),
        api.getSubjects(),
        api.getAllAdminChapters(),
      ]);

      let freshTests: MockTest[];
      if (isSupabaseConfigured) {
        freshTests = testsData || [];
      } else {
        // If DB tests exist, merge with reference tests prioritizing DB tests
        if (testsData && testsData.length > 0) {
          const dbSlugs = new Set(testsData.map((t) => t.slug || t.id));
          freshTests = [
            ...testsData,
            ...REFERENCE_DEFAULT_TESTS.filter((ref) => !dbSlugs.has(ref.slug)),
          ];
        } else {
          freshTests = REFERENCE_DEFAULT_TESTS;
        }
      }
      setTests(freshTests);
      // Keep the open details panel in sync (e.g. totals recomputed after Manage Questions).
      setSelectedTest((prev) => (prev ? (freshTests.find((t) => t.id === prev.id) ?? prev) : prev));

      setExams(examsData || []);
      setSubjects(subjectsData || []);
      setChapters(chaptersData || []);
    } catch (err) {
      console.error('Failed to load mock tests data:', err);
      if (!isSupabaseConfigured) {
        setTests(REFERENCE_DEFAULT_TESTS);
        setSelectedTest((prev) => prev ?? REFERENCE_DEFAULT_TESTS[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sync tab change
  const handleTabChange = (tab: TestTypeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'all') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  // Filter handlers
  const handleApplyFilter = () => {
    setAppliedFilters({
      search: searchTerm.trim().toLowerCase(),
      examId: selectedExamId,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      status: selectedStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedExamId('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedStatus('all');
    setAppliedFilters({
      search: '',
      examId: '',
      subjectId: '',
      chapterId: '',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Filter available chapters for Subject dropdown
  const filteredChapters = useMemo(() => {
    if (!selectedSubjectId) return chapters;
    return chapters.filter((c) => c.subjectId === selectedSubjectId);
  }, [chapters, selectedSubjectId]);

  // Counts for Top KPI cards and Tabs
  const counts = useMemo(() => {
    if (isSupabaseConfigured) {
      const total = tests.length;
      const fullMock = tests.filter((t) => t.testType === 'full_mock').length;
      const topic = tests.filter((t) => t.testType === 'topic').length;
      const pyq = tests.filter((t) => t.testType === 'pyq').length;
      const attemptsSum = tests.reduce((acc, t) => acc + ((t as any).attemptsCount || 0), 0);
      return {
        total,
        fullMock,
        topic,
        pyq,
        attempts: attemptsSum.toLocaleString('en-IN'),
      };
    }
    return {
      total: 248,
      fullMock: 85,
      topic: 120,
      pyq: 43,
      attempts: '1,24,860',
    };
  }, [tests]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Tab filter
      if (activeTab === 'full_mock' && t.testType !== 'full_mock') return false;
      if (activeTab === 'topic' && t.testType !== 'topic') return false;
      if (activeTab === 'pyq' && t.testType !== 'pyq') return false;

      // Search term
      if (appliedFilters.search) {
        const matchesTitle = t.title.toLowerCase().includes(appliedFilters.search);
        const matchesExam = t.examTitle?.toLowerCase().includes(appliedFilters.search);
        const matchesSubject = t.subjectName?.toLowerCase().includes(appliedFilters.search);
        const matchesTopic = t.chapterName?.toLowerCase().includes(appliedFilters.search);
        if (!matchesTitle && !matchesExam && !matchesSubject && !matchesTopic) {
          return false;
        }
      }

      // Exam filter
      if (appliedFilters.examId && t.examId !== appliedFilters.examId) {
        return false;
      }

      // Subject filter
      if (appliedFilters.subjectId && t.subjectId !== appliedFilters.subjectId) {
        return false;
      }

      // Topic filter
      if (appliedFilters.chapterId && t.chapterId !== appliedFilters.chapterId) {
        return false;
      }

      // Status filter
      if (appliedFilters.status !== 'all') {
        if (appliedFilters.status === 'published' && t.status !== 'published') return false;
        if (appliedFilters.status === 'draft' && t.status !== 'draft') return false;
        if (appliedFilters.status === 'under_review' && t.status !== 'archived') return false;
      }

      return true;
    });
  }, [tests, activeTab, appliedFilters]);

  // Pagination calculation
  const totalItems = filteredTests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedTests = filteredTests.slice(startIndex, startIndex + pageSize);

  // Keep currentPage within bounds when tests are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Row selection
  const toggleSelectAll = () => {
    if (selectedTestIds.size === pagedTests.length) {
      setSelectedTestIds(new Set());
    } else {
      setSelectedTestIds(new Set(pagedTests.map((t) => t.id)));
    }
  };

  const toggleSelectTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedTestIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTestIds(next);
  };

  // Click on row to display in Right-Side Details Panel
  const handleSelectRow = (test: MockTest) => {
    setSelectedTest(test);
    setShowDetailsPanel(true);
  };

  // Actions
  const handleOpenCreateModal = (type: 'full_mock' | 'topic' | 'pyq' = 'full_mock') => {
    setCreateInitialType(type);
    setIsCreateModalOpen(true);
  };

  const handleTestCreated = (newTest: MockTest) => {
    setTests((prev) => [newTest, ...prev]);
    setSelectedTest(newTest);
    setShowDetailsPanel(true);
  };

  const handleDeleteTest = async (testId: string) => {
    if (!canDeleteTests) {
      alert('You do not have permission to delete mock tests.');
      return;
    }
    try {
      await api.deleteTest(testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      if (selectedTest?.id === testId) {
        setSelectedTest(null);
        setShowDetailsPanel(false);
      }
      alert('Mock test deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete mock test: ' + getErrorMessage(err, 'Delete failed'));
    }
  };

  const handleDuplicateTest = async (testId: string) => {
    try {
      const duplicated = await api.duplicateTest(testId);
      if (duplicated) {
        setTests((prev) => [duplicated, ...prev]);
        setSelectedTest(duplicated);
        setShowDetailsPanel(true);
        alert('Mock test duplicated successfully!');
      }
    } catch (err) {
      console.error('Duplicate failed:', err);
      alert('Failed to duplicate test: ' + getErrorMessage(err, 'Duplicate failed'));
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'title',
      'testType',
      'examName',
      'subjectName',
      'topicName',
      'durationMinutes',
      'totalMarks',
      'passingMarks',
      'negativeMarking',
      'status',
      'isPremium',
      'iconUrl',
    ];
    const sample = [
      'WBP Constable Full Mock 01,full_mock,WBP Constable,,,60,100,40,0.25,published,false,',
      'Modern India - Test 01,topic,,History,Modern India,25,30,12,0.25,published,false,',
      'WBP Constable PYQ 2024,pyq,WBP Constable,,,60,85,34,0.25,published,false,',
    ];
    const content = [headers.join(','), ...sample].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mock_tests_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    canDeleteTests,
    searchParams,
    setSearchParams,
    tests,
    setTests,
    exams,
    setExams,
    subjects,
    setSubjects,
    chapters,
    setChapters,
    isLoading,
    setIsLoading,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedExamId,
    setSelectedExamId,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedChapterId,
    setSelectedChapterId,
    selectedStatus,
    setSelectedStatus,
    appliedFilters,
    setAppliedFilters,
    selectedTestIds,
    setSelectedTestIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedTest,
    setSelectedTest,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    openActionMenuId,
    setOpenActionMenuId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createInitialType,
    setCreateInitialType,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewTest,
    setPreviewTest,
    isAddQuestionsModalOpen,
    setIsAddQuestionsModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editDurationMinutes,
    setEditDurationMinutes,
    editTotalMarks,
    setEditTotalMarks,
    editPassingMarks,
    setEditPassingMarks,
    editNegativeMarking,
    setEditNegativeMarking,
    editIsPremium,
    setEditIsPremium,
    editStatus,
    setEditStatus,
    editIconUrl,
    setEditIconUrl,
    isUploadingDrawerIcon,
    setIsUploadingDrawerIcon,
    isSavingSettings,
    setIsSavingSettings,
    saveSuccessMsg,
    setSaveSuccessMsg,
    handleQuickIconUpload,
    handleSaveSettings,
    loadAllData,
    handleTabChange,
    handleApplyFilter,
    handleResetFilters,
    filteredChapters,
    counts,
    filteredTests,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pagedTests,
    toggleSelectAll,
    toggleSelectTest,
    handleSelectRow,
    handleOpenCreateModal,
    handleTestCreated,
    handleDeleteTest,
    handleDuplicateTest,
    handleDownloadTemplate,
  };
}

export type AdminTestsState = ReturnType<typeof useAdminTests>;
