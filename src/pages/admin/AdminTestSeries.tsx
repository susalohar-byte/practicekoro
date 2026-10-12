import { csvCell } from '@/utils/csvExport';
import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import {
  Layers,
  FileText,
  CheckCircle2,
  Users,
  Search,
  RotateCcw,
  Plus,
  Upload,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Archive,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Award,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Download,
} from 'lucide-react';
import type { TestSeries, Exam, MockTest, TestSeriesStatus, PopularTestSeriesCard } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getPageNumbers } from '@/utils/pagination';
import { PopularTestSeriesEditModal } from '@/pages/admin/PopularTestSeriesEditModal';
import {
  DEFAULT_POPULAR_TEST_SERIES,
  DEFAULT_SHOWCASE_SERIES,
} from '@/services/domains/admin.testSeries';
import type { SeriesMembership } from '@/services/domains/admin.contentLinks';
import { IncludedTestsPanel } from '@/components/admin/testSeries/IncludedTestsPanel';

/** Access model is Free / Paid only (`isPremium`). */
export const accessLabel = (isPremium?: boolean) => (isPremium ? 'Paid' : 'Free');
const NO_EXAM_LABEL = 'No target exam (subject/topic collection)';

export const AdminTestSeries: React.FC = () => {
  const [seriesList, setSeriesList] = useState<TestSeries[]>(() =>
    isSupabaseConfigured ? [] : DEFAULT_SHOWCASE_SERIES
  );
  const [exams, setExams] = useState<Exam[]>([]);
  const [allAvailableTests, setAllAvailableTests] = useState<MockTest[]>([]);
  const [testExamLinks, setTestExamLinks] = useState<Record<string, string[]>>({});
  const [memberships, setMemberships] = useState<SeriesMembership[]>([]);
  const [testsLoadError, setTestsLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Selected Table Rows (for batch actions)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Active / Opened Test Series in Right Details Drawer (Defaults to null - neutral initial state)
  const [activeSeries, setActiveSeries] = useState<TestSeries | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'tests' | 'settings' | 'analytics'>(
    'overview'
  );
  // Included Tests: staged edits live in IncludedTestsPanel; we only track whether any are unsaved.
  const [includedTestsDirty, setIncludedTestsDirty] = useState(false);
  const [addTestsRequested, setAddTestsRequested] = useState(false);
  const addTestsAfterCreateRef = useRef(false);

  // Drawer Inline Edit Description State
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [drawerDescriptionText, setDrawerDescriptionText] = useState('');

  // Drawer Settings State
  const [drawerSettingsForm, setDrawerSettingsForm] = useState({
    title: '',
    subtitle: '',
    examId: '',
    isPremium: false,
    isActive: true,
    orderIndex: 1,
    status: 'published' as TestSeriesStatus,
    description: '',
    iconUrl: '/images/exams/logo_wbp.png',
    bannerUrl: '',
  });

  // Row Action Dropdown state (which row's 3-dot menu is open)
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<TestSeries | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Popular Showcase Modal State
  const [popularCards, setPopularCards] = useState<PopularTestSeriesCard[]>(
    DEFAULT_POPULAR_TEST_SERIES
  );
  const [editingPopularCard, setEditingPopularCard] = useState<PopularTestSeriesCard | null>(null);
  const [isPopularModalOpen, setIsPopularModalOpen] = useState(false);

  // Create / Edit Form State
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formExamId, setFormExamId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconUrl, setFormIconUrl] = useState('/images/exams/logo_wbp.png');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formOrderIndex, setFormOrderIndex] = useState(1);
  const [formStatus, setFormStatus] = useState<TestSeriesStatus>('published');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  const handleIconFileUpload = async (file: File, isDrawer = false) => {
    try {
      setIsUploadingIcon(true);
      const url = await api.uploadTestSeriesIcon(file);
      if (isDrawer) {
        setDrawerSettingsForm((prev) => ({ ...prev, iconUrl: url }));
      } else {
        setFormIconUrl(url);
      }
      setActionNotice({ message: 'Emblem image uploaded successfully!', type: 'success' });
    } catch (err) {
      alert(`Upload failed: ${getErrorMessage(err, 'Failed to upload icon')}`);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveActionMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Notice auto-dismiss
  useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  // Load Initial Data from Backend API / Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      let testsError: string | null = null;
      const noteTestsError = (err: unknown) => {
        testsError ??= getErrorMessage(err, 'Tests could not be loaded.');
      };
      const [allExams, allSeries, allTests, examLinks, allMemberships, popCards] =
        await Promise.all([
          api.getAllAdminExams().catch(() => []),
          api.getTestSeries(),
          api.getAllAdminTests().catch((err: unknown) => {
            noteTestsError(err);
            return [] as MockTest[];
          }),
          api.getTestExamLinks().catch((err: unknown) => {
            noteTestsError(err);
            return {} as Record<string, string[]>;
          }),
          api.getSeriesMemberships().catch((err: unknown) => {
            noteTestsError(err);
            return [] as SeriesMembership[];
          }),
          api
            .getPopularTestSeriesCards()
            .catch(() => (isSupabaseConfigured ? [] : DEFAULT_POPULAR_TEST_SERIES)),
        ]);

      setExams(allExams);
      setAllAvailableTests(allTests);
      setTestExamLinks(examLinks);
      setMemberships(allMemberships);
      setTestsLoadError(testsError);
      if (popCards && popCards.length > 0) setPopularCards(popCards);

      if (allSeries && allSeries.length > 0) {
        setSeriesList(allSeries);
        setActiveSeries((prev) => {
          if (!prev) return null;
          const matched = allSeries.find((s) => s.id === prev.id);
          return matched || null;
        });
      } else if (isSupabaseConfigured) {
        setSeriesList([]);
        setActiveSeries(null);
      }
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: getErrorMessage(err, 'Test series could not be loaded.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync drawer forms when the active series changes
  useEffect(() => {
    if (!activeSeries) return;
    setDrawerDescriptionText(activeSeries.description || '');
    setDrawerSettingsForm({
      title: activeSeries.title,
      subtitle: activeSeries.subtitle || '',
      examId: activeSeries.examId || '',
      isPremium: Boolean(activeSeries.isPremium),
      isActive: Boolean(activeSeries.isActive),
      orderIndex: activeSeries.orderIndex || 1,
      status: activeSeries.status || (activeSeries.isActive ? 'published' : 'draft'),
      description: activeSeries.description || '',
      iconUrl: activeSeries.iconUrl || '/images/exams/logo_wbp.png',
      bannerUrl: activeSeries.bannerUrl || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeries?.id]); // Only reset when the active series ID changes

  // Admin tests with every exam they are linked to (test_exams), for series compatibility.
  const testsWithExamLinks = useMemo(
    () =>
      allAvailableTests.map((t) =>
        testExamLinks[t.id] ? { ...t, associatedExamIds: testExamLinks[t.id] } : t
      ),
    [allAvailableTests, testExamLinks]
  );
  const examOptions = useMemo(() => exams.map((e) => ({ id: e.id, title: e.title })), [exams]);

  /** Guard against silently dropping staged Included Tests edits. */
  const confirmLeaveIncludedTests = useCallback(
    () =>
      !includedTestsDirty ||
      window.confirm('Discard unsaved changes to this series’ included tests?'),
    [includedTestsDirty]
  );
  const openSeries = (series: TestSeries | null) => {
    if (series?.id === activeSeries?.id) return;
    if (!confirmLeaveIncludedTests()) return;
    setIncludedTestsDirty(false);
    setActiveSeries(series);
  };
  const handleAddRequestHandled = useCallback(() => setAddTestsRequested(false), []);

  // Real counts come from test_series_tests: refresh series + memberships after a save.
  const handleIncludedTestsSaved = useCallback(async () => {
    try {
      const [allSeries, allMemberships] = await Promise.all([
        api.getTestSeries(),
        api.getSeriesMemberships(),
      ]);
      setSeriesList(allSeries);
      setMemberships(allMemberships);
      setActiveSeries((prev) => (prev ? allSeries.find((s) => s.id === prev.id) || prev : prev));
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: getErrorMessage(err, 'Saved, but series counts could not be refreshed.'),
      });
    }
  }, []);

  // Derived Summary Analytics
  const stats = useMemo(() => {
    const total = seriesList.length;
    let totalTests = 0;
    let published = 0;
    let draft = 0;
    let totalEnrollments = 0;

    for (const s of seriesList) {
      totalTests +=
        s.testCount ||
        s.testsCount ||
        (s.fullMockCount || 0) + (s.topicTestCount || 0) + (s.pyqTestCount || 0);
      if (s.status === 'published' || (s.isActive && !s.status)) {
        published += 1;
      } else if (s.status === 'draft' || !s.isActive) {
        draft += 1;
      }
      totalEnrollments += s.enrollmentCount || 0;
    }

    return {
      total,
      totalTests,
      published,
      draft,
      totalEnrollments,
    };
  }, [seriesList]);

  // Dynamic Exam Options for Filter
  const examFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    exams.forEach((e) => map.set(e.id, e.title));
    seriesList.forEach((s) => {
      if (s.examId && !map.has(s.examId)) {
        map.set(s.examId, s.examTitle || s.examId);
      }
    });
    return Array.from(map.entries()).map(([val, label]) => ({ val, label }));
  }, [exams, seriesList]);

  // Filtered Test Series Dataset
  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = s.title.toLowerCase().includes(query);
        const matchesSubtitle = (s.subtitle || '').toLowerCase().includes(query);
        const matchesExam = (s.examTitle || s.examId).toLowerCase().includes(query);
        if (!matchesName && !matchesSubtitle && !matchesExam) return false;
      }

      // Exam Filter
      if (selectedExamFilter !== 'all') {
        const matchesExam =
          s.examId === selectedExamFilter ||
          s.examTitle === selectedExamFilter ||
          s.title === selectedExamFilter ||
          s.title.toLowerCase().includes(selectedExamFilter.toLowerCase());
        if (!matchesExam) return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all') {
        const sStatus = s.status || (s.isActive ? 'published' : 'draft');
        if (sStatus !== selectedStatusFilter) return false;
      }

      // Category Filter
      if (selectedCategoryFilter !== 'all') {
        if (s.examCategory !== selectedCategoryFilter) return false;
      }

      return true;
    });
  }, [seriesList, searchTerm, selectedExamFilter, selectedStatusFilter, selectedCategoryFilter]);

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredSeries.length / pageSize));
  const paginatedSeries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSeries.slice(start, start + pageSize);
  }, [filteredSeries, currentPage, pageSize]);

  // Keep currentPage within bounds when series are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Handlers for Row Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(paginatedSeries.map((s) => s.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedExamFilter('all');
    setSelectedStatusFilter('all');
    setSelectedCategoryFilter('all');
    setCurrentPage(1);
  };

  // Batch Operations
  const handleBatchPublish = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.updateTestSeries(id, { isActive: true, status: 'published' })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setSeriesList((prev) =>
      prev.map((s) => (changed.has(s.id) ? { ...s, ...changed.get(s.id) } : s))
    );
    setActiveSeries((prev) =>
      prev && changed.has(prev.id) ? { ...prev, ...changed.get(prev.id) } : prev
    );
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDraft = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.updateTestSeries(id, { isActive: false, status: 'draft' })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setSeriesList((prev) =>
      prev.map((s) => (changed.has(s.id) ? { ...s, ...changed.get(s.id) } : s))
    );
    setActiveSeries((prev) =>
      prev && changed.has(prev.id) ? { ...prev, ...changed.get(prev.id) } : prev
    );
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchArchive = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.updateTestSeries(id, { status: 'archived', isActive: false })
    );
    const saved = new Map(batch.results.map((r) => [r.input, r.value]));
    setSeriesList((prev) => prev.map((s) => (saved.has(s.id) ? { ...s, ...saved.get(s.id) } : s)));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' archived; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDelete = async () => {
    if (!window.confirm('Delete selected series? Linked records will block deletion.')) return;
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.deleteTestSeries(id)
    );
    const gone = new Set(batch.results.map((r) => r.input));
    setSeriesList((prev) => prev.filter((s) => !gone.has(s.id)));
    setActiveSeries((prev) => (prev && gone.has(prev.id) ? null : prev));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  // Export CSV Handler
  const handleExportCsv = (selectedOnly = false) => {
    const dataToExport = selectedOnly
      ? seriesList.filter((s) => selectedRowIds.has(s.id))
      : filteredSeries;

    if (dataToExport.length === 0) {
      alert('No test series to export.');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Subtitle',
      'Target Exam',
      'Category',
      'Full Mocks',
      'Topic Tests',
      'PYQs',
      'Total Tests',
      'Enrollments',
      'Status',
      'Access',
    ];

    const rows = dataToExport.map((s) => [
      s.id,
      s.title || '',
      s.subtitle || '',
      s.examId ? s.examTitle || s.examId : '',
      s.examCategory || '',
      s.fullMockCount || 0,
      s.topicTestCount || 0,
      s.pyqTestCount || 0,
      s.testCount ||
        s.testsCount ||
        (s.fullMockCount || 0) + (s.topicTestCount || 0) + (s.pyqTestCount || 0),
      s.enrollmentCount || 0,
      s.status || (s.isActive ? 'published' : 'draft'),
      accessLabel(s.isPremium),
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `PracticeKoro_Test_Series_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionNotice({
      message: `Exported ${dataToExport.length} test series to CSV!`,
      type: 'success',
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSeries(null);
    setFormName('');
    setFormSubtitle('');
    // Target exam is optional; the admin picks one explicitly or keeps "No target exam".
    setFormExamId('');
    setFormDescription('');
    setFormIconUrl('/images/exams/logo_wbp.png');
    setFormBannerUrl('');
    setFormIsPremium(false);
    setFormOrderIndex(seriesList.length + 1);
    setFormStatus('published');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (series: TestSeries) => {
    setEditingSeries(series);
    setFormName(series.title);
    setFormSubtitle(series.subtitle || '');
    setFormExamId(series.examId || '');
    setFormDescription(series.description || '');
    setFormIconUrl(series.iconUrl || '/images/exams/logo_wbp.png');
    setFormBannerUrl(series.bannerUrl || '');
    setFormIsPremium(Boolean(series.isPremium));
    setFormOrderIndex(series.orderIndex || 1);
    setFormStatus(series.status || (series.isActive ? 'published' : 'draft'));
    setIsEditModalOpen(true);
  };

  // Submit Create / Edit Series
  const handleSubmitSeriesForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingForm) return;
    try {
      setIsSubmittingForm(true);
      if (!formName.trim()) throw new Error('Series title is required.');
      const addTestsNext = !editingSeries && addTestsAfterCreateRef.current;
      addTestsAfterCreateRef.current = false;
      const input = {
        title: formName.trim(),
        subtitle: formSubtitle.trim(),
        slug:
          editingSeries?.slug ||
          formName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        examId: formExamId,
        description: formDescription.trim(),
        iconUrl: formIconUrl,
        bannerUrl: formBannerUrl || undefined,
        isPremium: formIsPremium,
        orderIndex: Number(formOrderIndex),
        status: formStatus,
        isActive: formStatus === 'published',
      };
      const saved = editingSeries
        ? await api.updateTestSeries(editingSeries.id, input)
        : await api.createTestSeries(input);
      setSeriesList((prev) =>
        editingSeries
          ? prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s))
          : [{ ...saved, testCount: 0, testsCount: 0 }, ...prev]
      );
      if (activeSeries?.id === saved.id)
        setActiveSeries((prev) => (prev ? { ...prev, ...saved } : saved));
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
      setEditingSeries(null);
      if (addTestsNext && confirmLeaveIncludedTests()) {
        setIncludedTestsDirty(false);
        setActiveSeries({ ...saved, testCount: 0, testsCount: 0 });
        setDrawerTab('tests');
        setAddTestsRequested(true);
        setActionNotice({ type: 'success', message: 'Test series created. Add existing tests.' });
      } else {
        setActionNotice({ type: 'success', message: 'Test series saved.' });
      }
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Toggle Publish / Unpublish
  const handleTogglePublish = async (series: TestSeries) => {
    try {
      const status = series.status === 'published' ? 'draft' : 'published';
      const saved = await api.updateTestSeries(series.id, {
        status,
        isActive: status === 'published',
      });
      setSeriesList((prev) => prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
      if (activeSeries?.id === saved.id)
        setActiveSeries((prev) => (prev ? { ...prev, ...saved } : saved));
      setActionNotice({ type: 'success', message: 'Series status saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    }
  };

  // Archive Series
  const handleArchiveSeries = async (series: TestSeries) => {
    try {
      const saved = await api.updateTestSeries(series.id, { status: 'archived', isActive: false });
      setSeriesList((prev) => prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
      if (activeSeries?.id === saved.id)
        setActiveSeries((prev) => (prev ? { ...prev, ...saved } : saved));
      setActionNotice({ type: 'success', message: 'Series archived.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Archive failed') });
    }
  };

  // Duplicate Series
  const handleDuplicateSeries = async (series: TestSeries) => {
    try {
      const saved = await api.createTestSeries({
        ...series,
        title: series.title + ' (Copy)',
        slug: series.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        status: 'draft',
        isActive: false,
      });
      setSeriesList((prev) => [{ ...saved, testCount: 0, testsCount: 0 }, ...prev]);
      setActionNotice({
        type: 'success',
        message: 'Draft series created. Its tests are not copied — add existing tests to it.',
      });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Duplicate failed') });
    }
  };

  // Delete Series Confirm
  const handleConfirmDelete = async () => {
    if (!seriesToDelete) return;
    try {
      const id = seriesToDelete.id;
      await api.deleteTestSeries(id);
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
      setActiveSeries((prev) => (prev?.id === id ? null : prev));
      setSeriesToDelete(null);
      setIsDeleteModalOpen(false);
      setActionNotice({ type: 'success', message: 'Series deleted.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Delete failed') });
    }
  };

  // Save Description from Details Drawer
  const handleSaveDescription = async () => {
    if (!activeSeries) return;
    try {
      const saved = await api.updateTestSeries(activeSeries.id, {
        description: drawerDescriptionText,
      });
      setSeriesList((prev) => prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
      setActiveSeries((prev) => (prev ? { ...prev, ...saved } : saved));
      setIsEditingDescription(false);
      setActionNotice({ type: 'success', message: 'Description saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    }
  };

  // Save Settings from Details Drawer
  const handleSaveDrawerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeries) return;

    try {
      const targetExam = exams.find((ex) => ex.id === drawerSettingsForm.examId);
      const updated: TestSeries = {
        ...activeSeries,
        title: drawerSettingsForm.title.trim(),
        subtitle: drawerSettingsForm.subtitle.trim() || undefined,
        examId: drawerSettingsForm.examId,
        examTitle: drawerSettingsForm.examId
          ? targetExam?.title || activeSeries.examTitle
          : undefined,
        examCategory: drawerSettingsForm.examId
          ? targetExam?.category || activeSeries.examCategory
          : undefined,
        isPremium: drawerSettingsForm.isPremium,
        isActive: drawerSettingsForm.status === 'published',
        orderIndex: Number(drawerSettingsForm.orderIndex),
        status: drawerSettingsForm.status,
        description: drawerSettingsForm.description.trim(),
        iconUrl: drawerSettingsForm.iconUrl || activeSeries.iconUrl,
        bannerUrl: drawerSettingsForm.bannerUrl || undefined,
      };

      const saved = await api.updateTestSeries(activeSeries.id, updated);
      setSeriesList((prev) => prev.map((s) => (s.id === activeSeries.id ? { ...s, ...saved } : s)));
      setActiveSeries((prev) => (prev ? { ...prev, ...saved } : saved));
      setActionNotice({ message: 'Series settings saved successfully!', type: 'success' });
    } catch (err) {
      alert(`Error saving settings: ${getErrorMessage(err, 'Failed to update')}`);
    }
  };

  // Move Series up / down in Order Modal
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= seriesList.length) return;

    const reordered = [...seriesList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
    setSeriesList(updated);

    try {
      await api.reorderTestSeries(updated);
    } catch (err) {
      console.warn('Could not save reordered list to backend:', err);
    }
  };

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div
          className={cn(
            'p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all',
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-300'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Test Series
            </h1>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-[#026BFC]" />}
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Create and manage test series with full mocks, topic tests and official PYQs.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Full CSV */}
          <button
            type="button"
            onClick={() => handleExportCsv(false)}
            title="Export Test Series to CSV"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Add existing tests to the open series */}
          <button
            type="button"
            onClick={() => {
              if (!activeSeries) {
                setActionNotice({
                  type: 'error',
                  message: 'Open a test series first, then add existing tests to it.',
                });
                return;
              }
              setDrawerTab('tests');
              setAddTestsRequested(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Existing Tests</span>
          </button>

          {/* Test Series Order */}
          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Test Series Order</span>
          </button>

          {/* + Create Test Series */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test Series</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS (5 INTERACTIVE CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Test Series */}
        <div
          onClick={handleResetFilters}
          title="Click to reset filters"
          className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Total Test Series
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.total.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">all series</p>
        </div>

        {/* Total Tests */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Total Tests
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.totalTests.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">across all series</p>
        </div>

        {/* Published */}
        <div
          onClick={() => {
            setSelectedStatusFilter('published');
            setCurrentPage(1);
          }}
          title="Click to filter by Published"
          className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Published
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.published.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">active in apps</p>
        </div>

        {/* Draft */}
        <div
          onClick={() => {
            setSelectedStatusFilter('draft');
            setCurrentPage(1);
          }}
          title="Click to filter by Draft"
          className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Draft</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.draft.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">in preparation</p>
        </div>

        {/* Total Enrollments */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Total Enrollments
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.totalEnrollments.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">student attempts</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search test series..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-2 text-xs font-semibold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-[#026BFC] text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Exam Filter */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedExamFilter}
              onChange={(e) => {
                setSelectedExamFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 text-xs font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 pr-8 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">All Exams</option>
              {examFilterOptions.map(({ val, label }) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 text-xs font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 pr-8 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 text-xs font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 pr-8 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Police">Police Exams</option>
              <option value="SSC & Central Govt.">SSC & Central Govt.</option>
              <option value="Railways (RRB)">Railways (RRB)</option>
              <option value="WBPSC">WBPSC</option>
              <option value="Teaching">Teaching (TET)</option>
              <option value="General Knowledge">General Knowledge</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Action */}
          {(searchTerm ||
            selectedExamFilter !== 'all' ||
            selectedStatusFilter !== 'all' ||
            selectedCategoryFilter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* BATCH OPERATIONS FLOATING BAR (When rows are selected) */}
      {selectedRowIds.size > 0 && (
        <div className="bg-[#0B132B] text-white p-3 px-4 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#026BFC] animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              {selectedRowIds.size} Test Series Selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchPublish}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={handleBatchDraft}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Draft
            </button>
            <button
              type="button"
              onClick={handleBatchArchive}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN LAYOUT: TABLE + DETAILS DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: TEST SERIES TABLE */}
        <div
          className={cn(
            activeSeries ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12',
            'space-y-4 transition-all duration-300'
          )}
        >
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#1E293B]/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedSeries.length > 0 &&
                          paginatedSeries.every((s) => selectedRowIds.has(s.id))
                        }
                        className="rounded border-slate-300 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Test Series</th>
                    <th className="py-3 px-3 min-w-[110px]">Exam</th>
                    <th className="py-3 px-3 min-w-[170px] text-center">
                      <div>Tests</div>
                      <div className="grid grid-cols-4 gap-1 text-[9px] font-semibold text-slate-400 normal-case mt-0.5">
                        <span>Full Mock</span>
                        <span>Topic</span>
                        <span>PYQ</span>
                        <span>Total</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right min-w-[90px]">Enrollments</th>
                    <th className="py-3 px-3 text-center min-w-[95px]">Status</th>
                    <th className="py-3 px-3 text-right w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {paginatedSeries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm">No test series found</p>
                        <p className="text-xs mt-0.5">
                          Try adjusting your filters or search keywords.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedSeries.map((series, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      const isRowActive = activeSeries?.id === series.id;
                      const isSelected = selectedRowIds.has(series.id);
                      const fullMocks = series.fullMockCount || 0;
                      const topicTests = series.topicTestCount || 0;
                      const pyqs = series.pyqTestCount || 0;
                      const totalTests =
                        series.testCount || series.testsCount || fullMocks + topicTests + pyqs;

                      return (
                        <tr
                          key={series.id}
                          onClick={() => openSeries(series)}
                          className={cn(
                            'hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer select-none',
                            isRowActive && 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(series.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(series.id)}
                              className="rounded border-slate-300 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                            />
                          </td>

                          {/* Row Number */}
                          <td className="py-3 px-2 text-center text-slate-400 font-bold text-[11px]">
                            {rowNum}
                          </td>

                          {/* Test Series Emblem, Name & Subtitle */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={series.iconUrl || '/images/exams/logo_wbp.png'}
                                  alt={series.title}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      '/images/exams/logo_wbp.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                  {series.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {series.subtitle || series.description || 'Complete Test Series'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Associated Exam */}
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                            {series.examId ? (
                              series.examTitle || series.examId
                            ) : (
                              <span className="text-slate-400 font-semibold">No target exam</span>
                            )}
                          </td>

                          {/* Tests breakdown: Full Mock, Topic, PYQ, Total */}
                          <td className="py-3 px-3 text-center">
                            <div className="grid grid-cols-4 gap-1 items-center">
                              {/* Full Mock (Light Blue) */}
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                                {fullMocks}
                              </span>

                              {/* Topic Tests (Light Green) */}
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                                {topicTests}
                              </span>

                              {/* PYQs (Light Rose) */}
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900">
                                {pyqs}
                              </span>

                              {/* Total */}
                              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                {totalTests}
                              </span>
                            </div>
                          </td>

                          {/* Enrollments Count */}
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {(series.enrollmentCount || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {series.status === 'published' ||
                            (series.isActive && !series.status) ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                Published
                              </span>
                            ) : series.status === 'under_review' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                                Under Review
                              </span>
                            ) : series.status === 'archived' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                Archived
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Row Actions Menu */}
                          <td
                            className="py-3 px-3 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(
                                    activeActionMenuId === series.id ? null : series.id
                                  );
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeActionMenuId === series.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1 animate-in fade-in"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openSeries(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3 text-blue-500" /> View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenEditModal(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3 text-indigo-500" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDuplicateSeries(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3 text-purple-500" /> Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleTogglePublish(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    {series.status === 'published' ? 'Unpublish' : 'Publish'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleArchiveSeries(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Archive className="w-3 h-3" /> Archive
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSeriesToDelete(series);
                                      setIsDeleteModalOpen(true);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 border-t border-slate-200/80 dark:border-slate-800 text-xs gap-3">
              <span className="font-semibold text-slate-500">
                Showing{' '}
                {filteredSeries.length === 0
                  ? 0
                  : Math.min(filteredSeries.length, (currentPage - 1) * pageSize + 1)}
                -{Math.min(filteredSeries.length, currentPage * pageSize)} of{' '}
                {filteredSeries.length} test series
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'min-w-7 h-7 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer',
                        currentPage === item
                          ? 'bg-[#026BFC] text-white shadow-2xs'
                          : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Page Size Select */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TEST SERIES DETAILS DRAWER */}
        {activeSeries && (
          <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden animate-in slide-in-from-right-4">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Test Series Details
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openSeries(null);
                  }}
                  title="Close Details"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Series Identity Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                    <img
                      src={activeSeries.iconUrl || '/images/exams/logo_wbp.png'}
                      alt={activeSeries.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {activeSeries.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {activeSeries.subtitle || 'Complete Preparation Series'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {activeSeries.status === 'published'
                      ? 'Published'
                      : activeSeries.status || 'Active'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeSeries)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Drawer Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 text-xs font-bold text-slate-500 overflow-x-auto">
              {(['overview', 'tests', 'settings', 'analytics'] as const).map((tab) => {
                const label =
                  tab === 'overview'
                    ? 'Overview'
                    : tab === 'tests'
                      ? `Tests (${activeSeries.testCount ?? 0})`
                      : tab === 'settings'
                        ? 'Settings'
                        : 'Analytics';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      'py-2.5 px-3 border-b-2 transition-all capitalize whitespace-nowrap cursor-pointer',
                      drawerTab === tab
                        ? 'border-[#026BFC] text-[#026BFC] font-extrabold'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerTab === 'overview' && (
              <div className="p-4 space-y-4">
                {/* 6 Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Full Mock Tests */}
                  <div className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.fullMockCount ?? 0}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Full Mock Tests</p>
                  </div>

                  {/* Topic Tests */}
                  <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.topicTestCount ?? 0}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Topic Tests</p>
                  </div>

                  {/* Official PYQs */}
                  <div className="p-2.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
                    <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                      <Award className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.pyqTestCount ?? 0}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Official PYQs</p>
                  </div>

                  {/* Total Enrollments */}
                  <div className="p-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/60">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {(activeSeries.enrollmentCount ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Total Enrollments</p>
                  </div>

                  {/* Avg. Completion */}
                  <div className="p-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.avgCompletion != null
                          ? `${activeSeries.avgCompletion}%`
                          : '—'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Avg. Completion</p>
                  </div>

                  {/* Avg. Accuracy */}
                  <div className="p-2.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/60">
                    <div className="flex items-center gap-1.5 text-teal-600 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.avgAccuracy != null ? `${activeSeries.avgAccuracy}%` : '—'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Avg. Accuracy</p>
                  </div>
                </div>

                {/* Description Section */}
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-[#1E293B]/40">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Description
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(!isEditingDescription)}
                      className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> {isEditingDescription ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={drawerDescriptionText}
                        onChange={(e) => setDrawerDescriptionText(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          className="px-3 py-1.5 rounded-lg bg-[#026BFC] text-white text-xs font-bold cursor-pointer"
                        >
                          Save Description
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activeSeries.description || 'No description provided.'}
                    </p>
                  )}
                </div>

                {/* Included tests summary (managed in the Tests tab) */}
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Included Tests ({activeSeries.testCount ?? 0})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Target exam:{' '}
                      {activeSeries.examId
                        ? activeSeries.examTitle || activeSeries.examId
                        : NO_EXAM_LABEL}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('tests')}
                    className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Manage included tests <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: INCLUDED TESTS (kept mounted so staged edits survive tab switches) */}
            <div className={cn('p-4', drawerTab !== 'tests' && 'hidden')}>
              <IncludedTestsPanel
                key={activeSeries.id}
                series={activeSeries}
                tests={testsWithExamLinks}
                exams={examOptions}
                memberships={memberships}
                testsError={testsLoadError}
                addRequested={addTestsRequested}
                onAddRequestHandled={handleAddRequestHandled}
                onDirtyChange={setIncludedTestsDirty}
                onSaved={handleIncludedTestsSaved}
              />
            </div>

            {/* TAB 3: SETTINGS */}
            {drawerTab === 'settings' && (
              <form onSubmit={handleSaveDrawerSettings} className="p-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Test Series Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={drawerSettingsForm.title}
                    onChange={(e) =>
                      setDrawerSettingsForm({ ...drawerSettingsForm, title: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtitle (Tagline)
                  </label>
                  <input
                    type="text"
                    value={drawerSettingsForm.subtitle}
                    onChange={(e) =>
                      setDrawerSettingsForm({ ...drawerSettingsForm, subtitle: e.target.value })
                    }
                    placeholder="e.g. Complete Preparation Series"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Exam
                    </label>
                    <select
                      value={drawerSettingsForm.examId}
                      onChange={(e) =>
                        setDrawerSettingsForm({ ...drawerSettingsForm, examId: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold cursor-pointer"
                    >
                      <option value="">{NO_EXAM_LABEL}</option>
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Publish Status
                    </label>
                    <select
                      value={drawerSettingsForm.status}
                      onChange={(e) =>
                        setDrawerSettingsForm({
                          ...drawerSettingsForm,
                          status: e.target.value as TestSeriesStatus,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold cursor-pointer"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="under_review">Under Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={drawerSettingsForm.orderIndex}
                      onChange={(e) =>
                        setDrawerSettingsForm({
                          ...drawerSettingsForm,
                          orderIndex: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Access
                    </label>
                    <select
                      aria-label="Access"
                      value={drawerSettingsForm.isPremium ? 'paid' : 'free'}
                      onChange={(e) =>
                        setDrawerSettingsForm({
                          ...drawerSettingsForm,
                          isPremium: e.target.value === 'paid',
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold cursor-pointer"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Description
                  </label>
                  <textarea
                    rows={3}
                    value={drawerSettingsForm.description}
                    onChange={(e) =>
                      setDrawerSettingsForm({
                        ...drawerSettingsForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Series Emblem
                    </label>
                    <label className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {isUploadingIcon ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingIcon}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIconFileUpload(file, true);
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={drawerSettingsForm.iconUrl}
                    onChange={(e) =>
                      setDrawerSettingsForm({ ...drawerSettingsForm, iconUrl: e.target.value })
                    }
                    placeholder="/images/exams/logo_wbp.png"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-mono text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const matched = popularCards.find((c) => c.testSeriesId === activeSeries.id);
                      setEditingPopularCard(
                        matched || {
                          id: `popular-series-${Date.now()}`,
                          testSeriesId: activeSeries.id,
                          title: activeSeries.title,
                          subtitle: activeSeries.subtitle || 'Complete Test Series',
                          cardGradientStart: '#0084FF',
                          cardGradientEnd: '#0048C6',
                          cardArrowColor: '#026BFC',
                          cardBgImage: '/images/series_wbp_bg.png',
                          cardLogoUrl:
                            activeSeries.iconUrl || '/images/exams/emblem_series_wbp.png',
                          orderIndex: popularCards.length + 1,
                          route: `/test-series/${activeSeries.slug || activeSeries.id}`,
                          isActive: true,
                          fullMockCount: activeSeries.fullMockCount ?? 0,
                          topicTestCount: activeSeries.topicTestCount ?? 0,
                          pyqTestCount: activeSeries.pyqTestCount ?? 0,
                        }
                      );
                      setIsPopularModalOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    👑 Homepage Showcase Card
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: ANALYTICS */}
            {drawerTab === 'analytics' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Included Tests</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {activeSeries.testCount ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Unique Students</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {(activeSeries.enrollmentCount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Average Accuracy</p>
                    <p className="text-lg font-black text-blue-600 mt-0.5">
                      {activeSeries.avgAccuracy != null
                        ? `${Number(activeSeries.avgAccuracy).toFixed(1)}%`
                        : '—'}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Completion Rate</p>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">
                      {activeSeries.avgCompletion ? `${activeSeries.avgCompletion}%` : '—'}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Per-test attempt analytics are not available for series yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CREATE / EDIT TEST SERIES MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#026BFC]" />
                {editingSeries ? 'Edit Test Series' : 'Create New Test Series'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSeriesForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Series Name *
                </label>
                <input
                  type="text"
                  required
                  aria-label="Test Series Name"
                  placeholder="e.g. WBP Constable"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle (Tagline)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Preparation Series"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Exam (optional)
                  </label>
                  <select
                    aria-label="Target Exam"
                    value={formExamId}
                    onChange={(e) => setFormExamId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold cursor-pointer"
                  >
                    <option value="">{NO_EXAM_LABEL}</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TestSeriesStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Icon / Emblem Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Icon / Circular Emblem
                  </label>
                  <label className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    {isUploadingIcon ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingIcon}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconFileUpload(file, false);
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {[
                    '/images/exams/logo_wbp.png',
                    '/images/exams/logo_ssc.png',
                    '/images/exams/logo_railway.png',
                    '/images/exams/logo_wbpsc.png',
                    '/images/exams/logo_wbtet.png',
                    '/images/exams/icon_kolkata_police.png',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setFormIconUrl(preset)}
                      className={cn(
                        'w-9 h-9 rounded-xl border p-1 flex items-center justify-center transition-all cursor-pointer',
                        formIconUrl === preset
                          ? 'border-[#026BFC] bg-blue-50 ring-2 ring-[#026BFC]/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-contain" />
                    </button>
                  ))}
                  {formIconUrl && !formIconUrl.startsWith('/images/exams/') && (
                    <div className="w-9 h-9 rounded-xl border border-[#026BFC] bg-blue-50 ring-2 ring-[#026BFC]/30 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={formIconUrl}
                        alt="custom"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom image URL"
                  value={formIconUrl}
                  onChange={(e) => setFormIconUrl(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formOrderIndex}
                    onChange={(e) => setFormOrderIndex(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Access
                  </label>
                  <select
                    aria-label="Access"
                    value={formIsPremium ? 'paid' : 'free'}
                    onChange={(e) => setFormIsPremium(e.target.value === 'paid')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold cursor-pointer"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this series (Bengali or English)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                {!editingSeries && (
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    onClick={() => (addTestsAfterCreateRef.current = true)}
                    className="px-4 py-2 rounded-xl border border-[#026BFC] text-[#026BFC] font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Save &amp; add tests
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  onClick={() => (addTestsAfterCreateRef.current = false)}
                  className="px-6 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer"
                >
                  {isSubmittingForm
                    ? 'Saving...'
                    : editingSeries
                      ? 'Update Series'
                      : 'Create Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TEST SERIES ORDER MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-[#026BFC]" />
                  Test Series Order
                </h3>
                <p className="text-xs text-slate-500">
                  Control the exact sequence displayed in the mobile app and website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {seriesList.map((series, idx) => (
                <div
                  key={series.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#1E293B]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 text-center font-extrabold text-slate-400">
                      #{idx + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border p-0.5 shrink-0 overflow-hidden">
                      <img
                        src={series.iconUrl || '/images/exams/logo_wbp.png'}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate">
                      {series.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold disabled:opacity-30 text-[11px] cursor-pointer"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      disabled={idx === seriesList.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold disabled:opacity-30 text-[11px] cursor-pointer"
                    >
                      ▼ Down
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setActionNotice({ message: 'Test Series order saved!', type: 'success' });
                }}
                className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION DIALOG */}
      {isDeleteModalOpen && seriesToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Delete &quot;{seriesToDelete.title}&quot;?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                If students have enrolled or completed attempts in this series, deleting will affect
                their rank records. You can archive it instead to keep student records safe.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleArchiveSeries(seriesToDelete);
                  setIsDeleteModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
              >
                Archive Series Instead (Recommended)
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Permanently Delete Series
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. HOMEPAGE POPULAR SHOWCASE MODAL */}
      {isPopularModalOpen && editingPopularCard && (
        <PopularTestSeriesEditModal
          card={editingPopularCard}
          isOpen={isPopularModalOpen}
          existingSeries={seriesList}
          onClose={() => setIsPopularModalOpen(false)}
          onSave={async (savedCard) => {
            const exists = popularCards.some((c) => c.id === savedCard.id);
            const updated = exists
              ? popularCards.map((c) => (c.id === savedCard.id ? savedCard : c))
              : [...popularCards, savedCard];
            await api.savePopularTestSeries(updated);
            setPopularCards(updated);
            setIsPopularModalOpen(false);
            setActionNotice({
              message: 'Homepage Showcase Card saved successfully!',
              type: 'success',
            });
          }}
        />
      )}
    </div>,
    { label: 'Loading test series…', variant: 'table' }
  );
};
