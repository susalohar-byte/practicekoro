import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import type { Subject, Chapter } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import { ITEMS_PER_PAGE } from './topicManageUtils';

// All state, data loading and handlers for the admin Topic Management page.
export function useAdminTopicManage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramSubjectId = searchParams.get('subjectId');

  /* ── Data ─────────── */
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  // Question counts only (total + per topic); the question rows themselves are never needed here.
  const [questionCounts, setQuestionCounts] = useState<{
    total: number;
    byTopic: Record<string, number>;
  }>({ total: 0, byTopic: {} });
  const [isLoading, setIsLoading] = useState(true);

  /* ── Filters ──────── */
  const [search, setSearch] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>(paramSubjectId || 'all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Dropdowns ────── */
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Subject Modal ── */
  const [isManageSubjectsModalOpen, setIsManageSubjectsModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [subOrderIndex, setSubOrderIndex] = useState(1);
  const [subIsActive, setSubIsActive] = useState(true);
  const [subError, setSubError] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  /* ── Topic Modal ──── */
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Chapter | null>(null);
  const [topicSubjectId, setTopicSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicOrderIndex, setTopicOrderIndex] = useState(1);
  const [topicIsActive, setTopicIsActive] = useState(true);
  const [topicError, setTopicError] = useState('');
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  /* ── View Modal ───── */
  const [viewingTopic, setViewingTopic] = useState<Chapter | null>(null);

  /* ── Add Topic Dropdown (Header) ── */
  const [isAddTopicDropdownOpen, setIsAddTopicDropdownOpen] = useState(false);
  const addTopicDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Sync URL param if changed ── */
  useEffect(() => {
    if (paramSubjectId) {
      setFilterSubjectId(paramSubjectId);
    }
  }, [paramSubjectId]);

  /* ── Load initial data ── */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subs, chaps, counts] = await Promise.all([
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
        api.getAdminQuestionTopicCounts(),
      ]);
      setSubjects(subs);
      setChapters(chaps);
      setQuestionCounts(counts);
    } catch (err) {
      console.error('Failed to load topic manage data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (addTopicDropdownRef.current && !addTopicDropdownRef.current.contains(e.target as Node)) {
        setIsAddTopicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Maps for fast lookup ─────────────────────────── */
  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  const subjectOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    subjects.forEach((s, idx) => {
      map[s.id] = idx;
    });
    return map;
  }, [subjects]);

  const questionCountsByTopic = questionCounts.byTopic;

  /* ── Filtered & Paginated Topics ─────────────────── */
  const filteredTopics = useMemo(() => {
    return chapters.filter((c) => {
      if (filterSubjectId !== 'all' && c.subjectId !== filterSubjectId) return false;
      if (filterStatus === 'active' && !c.isActive) return false;
      if (filterStatus === 'inactive' && c.isActive) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(query);
        const matchSubject = (subjectMap[c.subjectId]?.name || '').toLowerCase().includes(query);
        const matchSlug = c.slug.toLowerCase().includes(query);
        if (!matchName && !matchSubject && !matchSlug) return false;
      }
      return true;
    });
  }, [chapters, filterSubjectId, filterStatus, search, subjectMap]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTopics = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredTopics.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTopics, safePage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSubjectId, filterStatus]);

  /* ── Stats ────────────────────────────────────────── */
  const stats = useMemo(
    () => ({
      totalSubjects: subjects.length,
      totalTopics: chapters.length,
      totalQuestions: questionCounts.total,
      activeTopics: chapters.filter((c) => c.isActive).length,
    }),
    [subjects, chapters, questionCounts]
  );

  /* ── Subject CRUD ─────────────────────────────────── */
  const openCreateSubjectModal = () => {
    setEditingSubject(null);
    setSubName('');
    setSubSlug('');
    setSubDescription('');
    setSubOrderIndex(subjects.length + 1);
    setSubIsActive(true);
    setSubError('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (sub: Subject) => {
    setEditingSubject(sub);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubDescription(sub.description || '');
    setSubOrderIndex(sub.orderIndex);
    setSubIsActive(sub.isActive);
    setSubError('');
    setIsSubjectModalOpen(true);
  };

  const handleSubNameChange = (val: string) => {
    setSubName(val);
    if (!editingSubject) {
      setSubSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return setSubError('Subject name is required.');
    try {
      setIsSavingSubject(true);
      setSubError('');
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          name: subName.trim(),
          slug: subSlug.trim(),
          // '' (not undefined) so clearing the field clears the stored description.
          description: subDescription.trim(),
          orderIndex: Number(subOrderIndex),
          isActive: subIsActive,
        });
      } else {
        await api.createSubject({
          name: subName.trim(),
          slug: subSlug.trim(),
          description: subDescription.trim() || undefined,
          iconName: 'BookOpen',
          orderIndex: Number(subOrderIndex),
          isActive: subIsActive,
        });
      }
      setIsSubjectModalOpen(false);
      await loadData();
    } catch (err) {
      setSubError(getErrorMessage(err, 'Failed to save subject'));
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if (
      !window.confirm(
        `Delete subject "${sub.name}"?\n\nTopics belonging to this subject may also be affected.`
      )
    )
      return;
    try {
      setIsLoading(true);
      await api.deleteSubject(sub.id);
      if (filterSubjectId === sub.id) setFilterSubjectId('all');
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete subject'));
      setIsLoading(false);
    }
  };

  /* ── Topic CRUD ──────────────────────────────────── */
  const openCreateTopicModal = (parentSubjectId?: string) => {
    setEditingTopic(null);
    const sid =
      parentSubjectId || (filterSubjectId !== 'all' ? filterSubjectId : subjects[0]?.id || '');
    setTopicSubjectId(sid);
    setTopicName('');
    setTopicSlug('');
    setTopicDescription('');
    setTopicOrderIndex(chapters.filter((c) => c.subjectId === sid).length + 1);
    setTopicIsActive(true);
    setTopicError('');
    setIsAddTopicDropdownOpen(false);
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: Chapter) => {
    setEditingTopic(topic);
    setTopicSubjectId(topic.subjectId);
    setTopicName(topic.name);
    setTopicSlug(topic.slug);
    setTopicDescription(topic.description || '');
    setTopicOrderIndex(topic.orderIndex);
    setTopicIsActive(topic.isActive);
    setTopicError('');
    setIsTopicModalOpen(true);
  };

  const handleTopicNameChange = (val: string) => {
    setTopicName(val);
    if (!editingTopic) {
      setTopicSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return setTopicError('Topic name is required.');
    if (!topicSubjectId) return setTopicError('Parent subject must be selected.');
    try {
      setIsSavingTopic(true);
      setTopicError('');
      if (editingTopic) {
        await api.updateChapter(editingTopic.id, {
          subjectId: topicSubjectId,
          name: topicName.trim(),
          slug: topicSlug.trim(),
          // '' (not undefined) so clearing the field clears the stored description.
          description: topicDescription.trim(),
          orderIndex: Number(topicOrderIndex),
          isActive: topicIsActive,
        });
      } else {
        await api.createChapter({
          subjectId: topicSubjectId,
          name: topicName.trim(),
          slug:
            topicSlug.trim() ||
            topicName
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
          description: topicDescription.trim() || undefined,
          orderIndex: Number(topicOrderIndex),
          isActive: topicIsActive,
        });
      }
      setIsTopicModalOpen(false);
      await loadData();
    } catch (err) {
      setTopicError(getErrorMessage(err, 'Failed to save topic'));
    } finally {
      setIsSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topic: Chapter) => {
    if (
      !window.confirm(
        `Delete topic "${topic.name}"?\n\nAssociated question references may be affected.`
      )
    )
      return;
    try {
      setIsLoading(true);
      await api.deleteChapter(topic.id);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete topic'));
      setIsLoading(false);
    }
  };

  const navigateToTopicQuestions = (subjectId: string, topicId: string) =>
    navigate(`/admin/question-bank?source=topic&subjectId=${subjectId}&topicId=${topicId}`);

  /* ── Page numbers ────────────────────────────────── */
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++)
        pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return {
    navigate,
    paramSubjectId,
    subjects,
    setSubjects,
    chapters,
    setChapters,
    isLoading,
    setIsLoading,
    search,
    setSearch,
    filterSubjectId,
    setFilterSubjectId,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    isSubjectDropdownOpen,
    setIsSubjectDropdownOpen,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    subjectDropdownRef,
    statusDropdownRef,
    isManageSubjectsModalOpen,
    setIsManageSubjectsModalOpen,
    isSubjectModalOpen,
    setIsSubjectModalOpen,
    editingSubject,
    setEditingSubject,
    subName,
    setSubName,
    subSlug,
    setSubSlug,
    subDescription,
    setSubDescription,
    subOrderIndex,
    setSubOrderIndex,
    subIsActive,
    setSubIsActive,
    subError,
    setSubError,
    isSavingSubject,
    setIsSavingSubject,
    isTopicModalOpen,
    setIsTopicModalOpen,
    editingTopic,
    setEditingTopic,
    topicSubjectId,
    setTopicSubjectId,
    topicName,
    setTopicName,
    topicSlug,
    setTopicSlug,
    topicDescription,
    setTopicDescription,
    topicOrderIndex,
    setTopicOrderIndex,
    topicIsActive,
    setTopicIsActive,
    topicError,
    setTopicError,
    isSavingTopic,
    setIsSavingTopic,
    viewingTopic,
    setViewingTopic,
    isAddTopicDropdownOpen,
    setIsAddTopicDropdownOpen,
    addTopicDropdownRef,
    loadData,
    subjectMap,
    subjectOrderMap,
    questionCountsByTopic,
    filteredTopics,
    totalPages,
    safePage,
    pagedTopics,
    stats,
    openCreateSubjectModal,
    openEditSubjectModal,
    handleSubNameChange,
    handleSubjectSubmit,
    handleDeleteSubject,
    openCreateTopicModal,
    openEditTopicModal,
    handleTopicNameChange,
    handleTopicSubmit,
    handleDeleteTopic,
    navigateToTopicQuestions,
    getPageNumbers,
  };
}

export type AdminTopicManageState = ReturnType<typeof useAdminTopicManage>;
