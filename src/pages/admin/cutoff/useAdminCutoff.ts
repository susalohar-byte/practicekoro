import type { Exam, RecruitmentStage, StudentCategoryCode } from '@/types';
import { requireSuccess } from '@/services/domains/admin.mutations';
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  CutoffItem,
  CutoffRecordStatus,
  toDisplayCategory,
  toDbCategoryGender,
  getCategoryBadgeClass,
} from './cutoffUtils';
import { INITIAL_CUTOFFS, YEAR_WISE_COMPARISON } from './demoCutoffs';

export function useAdminCutoff() {
  const [pageLoading, setPageLoading] = useState(true);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    api
      .getAllAdminExams()
      .then(setAvailableExams)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Exams could not be loaded'));
  }, []);
  // Local storage persisted cutoffs list
  const [cutoffsList, setCutoffsList] = useState<CutoffItem[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_cutoffs_v2');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_CUTOFFS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_cutoffs_v2', JSON.stringify(cutoffsList));
    } catch {
      // ignore
    }
  }, [cutoffsList]);

  // Load live cutoff records from database on mount
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    api
      .getCutoffRecords()
      .then((records) => {
        if (!isMounted) return;
        if (!records || records.length === 0) {
          if (isSupabaseConfigured) {
            setCutoffsList([]);
            setSelectedRowId('');
          }
          return;
        }
        const mapped: CutoffItem[] = records.map((r) => {
          const category = toDisplayCategory(String(r.category), r.gender);

          return {
            id: r.id,
            exam: r.examTitle || 'WBP Constable',
            year: r.year,
            stage: r.stage,
            category,
            categoryBadgeClass: getCategoryBadgeClass(category),
            cutoffMarks: r.cutoffMarks,
            totalPosts: r.totalPosts || '',
            status: r.status,
            addedOn: r.verifiedDate
              ? new Date(r.verifiedDate).toLocaleDateString('en-GB')
              : r.createdAt
                ? new Date(r.createdAt).toLocaleDateString('en-GB')
                : '',
            addedBy: r.verifiedBy || 'Admin',
            source: r.source,
            notes: r.notes,
          };
        });
        setCutoffsList(mapped);
        setSelectedRowId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Cutoffs could not be loaded.');
        if (isSupabaseConfigured) {
          setCutoffsList([]);
          setSelectedRowId('');
        }
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter states
  const [filterExam, setFilterExam] = useState<string>('WBP Constable');
  const [filterYear, setFilterYear] = useState<string>('2024');
  const [filterCategory, setFilterCategory] = useState<string>('All Categories');
  const [filterStage, setFilterStage] = useState<string>('Final Merit');
  const [appliedFilters, setAppliedFilters] = useState({
    exam: 'WBP Constable',
    year: '2024',
    category: 'All Categories',
    stage: 'Final Merit',
  });

  // Selected Row state (Neutral initial state - nothing selected by default)
  const [selectedRowId, setSelectedRowId] = useState<number | string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Row Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  // Widget 3 category filter tab
  const [comparisonCategory, setComparisonCategory] = useState<string>('General');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CutoffItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<CutoffItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<CutoffItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // "View All" Modal states
  const [viewAllTrendOpen, setViewAllTrendOpen] = useState(false);
  const [viewAllRecentOpen, setViewAllRecentOpen] = useState(false);
  const [viewAllComparisonOpen, setViewAllComparisonOpen] = useState(false);

  // Add / Edit Form State
  const [formExam, setFormExam] = useState('WBP Constable');
  const [formYear, setFormYear] = useState('2024');
  const [formStage, setFormStage] = useState('Final Merit');
  const [formCategory, setFormCategory] = useState('General');
  const [formCutoffMarks, setFormCutoffMarks] = useState('85.25');
  const [formTotalPosts, setFormTotalPosts] = useState('');
  // Students only see 'active' cutoffs (RLS), so new records default to Active.
  const [formStatus, setFormStatus] = useState<CutoffRecordStatus>('active');
  const [formSource, setFormSource] = useState(
    'WBPRB Official Notification Memo No. PRB/RECT/2024-89'
  );
  const [formNotes, setFormNotes] = useState(
    'Official normalized threshold score for merit placement.'
  );

  // Helper Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Close actions menu on external click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Filter application
  const handleApplyFilter = () => {
    setAppliedFilters({
      exam: filterExam,
      year: filterYear,
      category: filterCategory,
      stage: filterStage,
    });
    setCurrentPage(1);
    showToast(`Filters applied: ${filterExam} • ${filterYear} • ${filterStage}`);
  };

  const handleResetFilter = () => {
    setFilterExam('WBP Constable');
    setFilterYear('2024');
    setFilterCategory('All Categories');
    setFilterStage('Final Merit');
    setAppliedFilters({
      exam: 'WBP Constable',
      year: '2024',
      category: 'All Categories',
      stage: 'Final Merit',
    });
    setCurrentPage(1);
    showToast('Filters reset to default view.');
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return cutoffsList.filter((row) => {
      if (appliedFilters.exam !== 'All Exams' && row.exam !== appliedFilters.exam) return false;
      if (appliedFilters.year !== 'All Years' && String(row.year) !== appliedFilters.year)
        return false;
      if (appliedFilters.stage !== 'All Stages' && row.stage !== appliedFilters.stage) return false;
      if (appliedFilters.category !== 'All Categories' && row.category !== appliedFilters.category)
        return false;
      return true;
    });
  }, [cutoffsList, appliedFilters]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormExam(appliedFilters.exam !== 'All Exams' ? appliedFilters.exam : 'WBP Constable');
    setFormYear('2024');
    setFormStage('Final Merit');
    setFormCategory('General');
    setFormCutoffMarks('');
    setFormTotalPosts('');
    setFormStatus('active');
    setFormSource('WBPRB Official Notification Memo No. PRB/RECT/2024-89');
    setFormNotes('Official cutoff benchmark for recruitment selection.');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: CutoffItem) => {
    setEditingItem(item);
    setFormExam(item.exam);
    setFormYear(String(item.year));
    setFormStage(item.stage);
    setFormCategory(item.category);
    setFormCutoffMarks(item.cutoffMarks.toFixed(2));
    setFormTotalPosts(item.totalPosts);
    setFormStatus(item.status || 'draft');
    setFormSource(item.source || 'WBPRB Official Notification Memo No. PRB/RECT/2024-89');
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  // Save Modal (Create or Edit)
  const handleSaveCutoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const exam = availableExams.find((x) => x.title === formExam);
      if (!exam) throw new Error('Select an existing backend exam.');
      const existing = editingItem
        ? (await api.getCutoffRecords()).find((x) => x.id === String(editingItem.id))
        : undefined;
      if (editingItem && !existing) throw new Error('The cutoff no longer exists.');
      const { category: dbCategory, gender: dbGender } = toDbCategoryGender(
        formCategory,
        existing?.gender
      );
      const saved = await api.saveCutoffRecord({
        ...existing,
        id: existing?.id,
        examId: exam.id,
        examTitle: exam.title,
        year: Number(formYear),
        stage: formStage as RecruitmentStage,
        cutoffType: existing?.cutoffType || 'OFFICIAL',
        category: dbCategory as StudentCategoryCode,
        gender: dbGender,
        district: existing?.district || 'ALL',
        scoreType: existing?.scoreType || 'raw_marks',
        maxMarks: existing?.maxMarks || 100,
        cutoffMarks: Number(formCutoffMarks),
        percentage: undefined,
        sourceType: existing?.sourceType || 'Official Notification',
        source: formSource,
        verificationStatus: existing?.verificationStatus || 'Pending Verification',
        notes: formNotes,
        status: formStatus,
        totalPosts: formTotalPosts,
      });
      if (!saved.id) throw new Error('Saved ID missing');
      const savedCategory = toDisplayCategory(String(saved.category), saved.gender);
      const item: CutoffItem = {
        id: saved.id,
        exam: saved.examTitle,
        year: saved.year,
        stage: saved.stage,
        category: savedCategory,
        categoryBadgeClass: getCategoryBadgeClass(savedCategory),
        cutoffMarks: saved.cutoffMarks,
        totalPosts: saved.totalPosts || '',
        status: saved.status,
        addedOn: new Date(saved.createdAt || Date.now()).toLocaleDateString('en-GB'),
        addedBy: saved.verifiedBy || 'Admin',
        source: saved.source,
        notes: saved.notes,
      };
      setCutoffsList((prev) =>
        editingItem ? prev.map((x) => (String(x.id) === saved.id ? item : x)) : [item, ...prev]
      );
      setIsAddModalOpen(false);
      showToast('Cutoff saved in the database.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Cutoff
  const handleDeleteCutoff = async () => {
    if (!deleteConfirmItem) return;
    try {
      const id = deleteConfirmItem.id;
      requireSuccess(await api.deleteCutoffRecord(String(id)));
      setCutoffsList((prev) => prev.filter((x) => x.id !== id));
      if (selectedRowId === id) setSelectedRowId('');
      setDeleteConfirmItem(null);
      showToast('Cutoff deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Duplicate Cutoff
  const handleDuplicate = (item: CutoffItem) => {
    setEditingItem(null);
    setFormExam(item.exam);
    setFormYear(String(item.year));
    setFormStage(item.stage);
    setFormCategory(item.category);
    setFormCutoffMarks(String(item.cutoffMarks));
    setFormTotalPosts(item.totalPosts);
    setFormStatus('active');
    setFormSource(item.source || '');
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
    showToast('Review the copy and Save to persist a new record.');
  };

  // Comparison comparison data for Widget 3
  const activeComparisonData =
    YEAR_WISE_COMPARISON[comparisonCategory] || YEAR_WISE_COMPARISON['General'];

  return {
    pageLoading,
    setPageLoading,
    availableExams,
    setAvailableExams,
    isSaving,
    setIsSaving,
    cutoffsList,
    setCutoffsList,
    filterExam,
    setFilterExam,
    filterYear,
    setFilterYear,
    filterCategory,
    setFilterCategory,
    filterStage,
    setFilterStage,
    appliedFilters,
    setAppliedFilters,
    selectedRowId,
    setSelectedRowId,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    comparisonCategory,
    setComparisonCategory,
    isAddModalOpen,
    setIsAddModalOpen,
    editingItem,
    setEditingItem,
    detailsItem,
    setDetailsItem,
    deleteConfirmItem,
    setDeleteConfirmItem,
    toastMessage,
    setToastMessage,
    viewAllTrendOpen,
    setViewAllTrendOpen,
    viewAllRecentOpen,
    setViewAllRecentOpen,
    viewAllComparisonOpen,
    setViewAllComparisonOpen,
    formExam,
    setFormExam,
    formYear,
    setFormYear,
    formStage,
    setFormStage,
    formCategory,
    setFormCategory,
    formCutoffMarks,
    setFormCutoffMarks,
    formTotalPosts,
    setFormTotalPosts,
    formStatus,
    setFormStatus,
    formSource,
    setFormSource,
    formNotes,
    setFormNotes,
    showToast,
    handleApplyFilter,
    handleResetFilter,
    filteredRows,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveCutoff,
    handleDeleteCutoff,
    handleDuplicate,
    activeComparisonData,
  };
}

export type AdminCutoffState = ReturnType<typeof useAdminCutoff>;
