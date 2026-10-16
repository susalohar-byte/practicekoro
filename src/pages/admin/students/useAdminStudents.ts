import { useAuth } from '@/context/AuthContext';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  EnrichedStudent,
  SubscriptionTier,
  StudentStatus,
  LEGACY_STORAGE_KEY,
  StudentActivity,
} from './studentTypes';
import { api } from '@/services/api';
import { mapDbRowToStudent } from './studentMapping';
import { AdminStudentDetails, TestAttempt } from '@/types';
import { csvCell } from '@/utils/csvExport';
import { parseStudentCsv } from '@/utils/parseStudentCsv';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export function useAdminStudents() {
  const { user: currentAdmin } = useAuth();
  // State: pure database state, no fake preset records
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Test History' | 'Subscriptions' | 'Notes'
  >('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Checkbox Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [planFilter, setPlanFilter] = useState('All Subscription Plans');
  const [examFilter, setExamFilter] = useState('All Exams');

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'All Status',
    plan: 'All Subscription Plans',
    exam: 'All Exams',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subscriptionPlan: 'Free' as SubscriptionTier,
    targetExam: 'WBP Constable',
    location: 'West Bengal, India',
    status: 'Active' as StudentStatus,
  });

  const [editStudentForm, setEditStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subscriptionPlan: '6 Months' as SubscriptionTier,
    targetExam: 'WBP Constable',
    location: 'West Bengal, India',
    status: 'Active' as StudentStatus,
  });

  const [notificationText, setNotificationText] = useState({
    title: '',
    message: '',
  });

  const [newNoteText, setNewNoteText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Student records are kept in memory only; never persist personal data to browser storage.
  const saveStudents = (newStudentsList: EnrichedStudent[]) => {
    setStudents(newStudentsList);
  };

  // Purge student data cached in browser storage by earlier versions.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode); nothing to purge.
    }
  }, []);

  // Fetch directly from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAllAdminStudents();
        if (data && data.length > 0) {
          const mapped = data.map((row, i) => mapDbRowToStudent(row, i));
          setStudents(mapped);
          setSelectedStudentId((prev) => (prev && mapped.some((s) => s.id === prev) ? prev : null));
        } else {
          setStudents([]);
          setSelectedStudentId(null);
        }
      } catch (err) {
        setToastMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Students could not be loaded.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Currently Selected student
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Real backend student details & notes
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<AdminStudentDetails | null>(
    null
  );
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [studentNotes, setStudentNotes] = useState<
    { id: string; author: string; text: string; createdAt: string }[]
  >([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudentDetails(null);
      setStudentNotes([]);
      return;
    }
    let isMounted = true;
    setIsLoadingDetails(true);
    setIsLoadingNotes(true);

    api
      .getAdminStudentDetails(selectedStudentId)
      .then((details) => {
        if (isMounted) setSelectedStudentDetails(details);
      })
      .catch((err) => console.warn('Could not load student details:', err))
      .finally(() => {
        if (isMounted) setIsLoadingDetails(false);
      });

    api
      .getStudentNotes(selectedStudentId)
      .then((notes) => {
        if (isMounted) setStudentNotes(notes);
      })
      .catch((err) => {
        if (isMounted)
          setToastMessage({
            type: 'error',
            text: err instanceof Error ? err.message : 'Student notes could not be loaded.',
          });
      })
      .finally(() => {
        if (isMounted) setIsLoadingNotes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStudentId]);

  // Compute metrics from actual completed attempts
  const studentMetrics = useMemo(() => {
    if (!selectedStudentDetails || !selectedStudentDetails.recentAttempts) {
      return {
        testsAttempted: selectedStudent?.testsAttempted || 0,
        avgScore: selectedStudent?.avgScore ?? null,
        bestScore: null,
        daysActive: null,
        completedAttempts: [] as TestAttempt[],
        derivedActivities: [] as StudentActivity[],
      };
    }

    const attempts = selectedStudentDetails.recentAttempts;
    const completed = attempts.filter(
      (a) => a.status === 'completed' || (a.score != null && a.score > 0)
    );

    let avgScore: number | null = null;
    let bestScore: number | null = null;
    let daysActive: number | null = null;

    if (completed.length > 0) {
      const percentageScores = completed.map((a) => {
        if (a.totalMarks && a.totalMarks > 0) {
          return Math.min(100, Math.max(0, (a.score / a.totalMarks) * 100));
        }
        return Math.min(100, Math.max(0, a.score));
      });
      const sum = percentageScores.reduce((acc, score) => acc + score, 0);
      avgScore = Math.round(sum / percentageScores.length);
      bestScore = Math.round(Math.max(...percentageScores));

      const datesSet = new Set(
        attempts
          .map((a) => {
            try {
              return new Date(a.createdAt).toISOString().split('T')[0];
            } catch {
              return '';
            }
          })
          .filter(Boolean)
      );
      daysActive = datesSet.size;
    }

    const derivedActivities: StudentActivity[] = [];
    completed.slice(0, 5).forEach((att, idx) => {
      const pct = att.totalMarks > 0 ? Math.round((att.score / att.totalMarks) * 100) : att.score;
      derivedActivities.push({
        id: `att-act-${att.id || idx}`,
        type: 'completed',
        title: `Completed: ${att.testTitle || 'Mock Test'}`,
        subtitle: `Score: ${pct}% (${att.score}/${att.totalMarks || 100})`,
        time: att.createdAt
          ? new Date(att.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          : 'Recently',
      });
    });

    if (selectedStudentDetails.subscriptionHistory) {
      selectedStudentDetails.subscriptionHistory.forEach((sub, idx) => {
        derivedActivities.push({
          id: `sub-act-${sub.id || idx}`,
          type: 'purchase',
          title: `Subscription: ${sub.planTitle || 'Pro Plan'} (${sub.status})`,
          time: sub.createdAt
            ? new Date(sub.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              })
            : 'Recently',
        });
      });
    }

    if (selectedStudentDetails.createdAt) {
      derivedActivities.push({
        id: `reg-act-${selectedStudentDetails.id}`,
        type: 'registration',
        title: 'Registered on PracticeKoro',
        time: new Date(selectedStudentDetails.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      });
    }

    return {
      testsAttempted: completed.length,
      avgScore,
      bestScore,
      daysActive,
      completedAttempts: attempts,
      derivedActivities,
    };
  }, [selectedStudentDetails, selectedStudent]);

  // Keep Edit Form updated when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      setEditStudentForm({
        fullName: selectedStudent.fullName,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        subscriptionPlan: selectedStudent.subscriptionPlan,
        targetExam: selectedStudent.targetExam || 'WBP Constable',
        location: selectedStudent.location,
        status: selectedStudent.status,
      });
    }
  }, [selectedStudent]);

  // Apply Filter button
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      status: statusFilter,
      plan: planFilter,
      exam: examFilter,
    });
    setCurrentPage(1);
    setSelectedRowIds([]);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All Status');
    setPlanFilter('All Subscription Plans');
    setExamFilter('All Exams');
    setAppliedFilters({
      search: '',
      status: 'All Status',
      plan: 'All Subscription Plans',
      exam: 'All Exams',
    });
    setCurrentPage(1);
    setSelectedRowIds([]);
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      if (appliedFilters.search.trim()) {
        const q = appliedFilters.search.toLowerCase();
        const mName = s.fullName.toLowerCase().includes(q);
        const mEmail = s.email.toLowerCase().includes(q);
        const mPhone = s.phone.includes(q);
        const mId = s.studentIdFormatted.toLowerCase().includes(q);
        const mLoc = s.location.toLowerCase().includes(q);
        const mExam = (s.targetExam || '').toLowerCase().includes(q);
        if (!mName && !mEmail && !mPhone && !mId && !mLoc && !mExam) return false;
      }
      // Status
      if (appliedFilters.status !== 'All Status' && s.status !== appliedFilters.status) {
        return false;
      }
      // Plan
      if (
        appliedFilters.plan !== 'All Subscription Plans' &&
        s.subscriptionPlan !== appliedFilters.plan
      ) {
        return false;
      }
      // Exam
      if (appliedFilters.exam !== 'All Exams' && s.targetExam !== appliedFilters.exam) {
        return false;
      }
      return true;
    });
  }, [students, appliedFilters]);

  // Pagination calculation
  const currentFilteredCount = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(currentFilteredCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Checkbox selection handlers
  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = visibleStudents.map((s) => s.id);
      setSelectedRowIds(Array.from(new Set([...selectedRowIds, ...visibleIds])));
    } else {
      const visibleIds = new Set(visibleStudents.map((s) => s.id));
      setSelectedRowIds(selectedRowIds.filter((id) => !visibleIds.has(id)));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export CSV
  const handleExportCSV = (onlySelected = false) => {
    const listToExport = onlySelected
      ? students.filter((s) => selectedRowIds.includes(s.id))
      : filteredStudents;

    if (listToExport.length === 0) {
      showToast('error', 'No students selected for export.');
      return;
    }

    const headers = [
      '#',
      'Student ID',
      'Full Name',
      'Email',
      'Phone',
      'Subscription',
      'Tests Attempted',
      'Avg Score (%)',
      'Last Active',
      'Status',
      'Joined Date',
      'Location',
      'Target Exam',
    ];
    const rows = listToExport.map((s) => [
      s.order,
      s.studentIdFormatted,
      s.fullName,
      s.email,
      s.phone,
      s.subscriptionPlan,
      s.testsAttempted,
      s.avgScore != null ? `${s.avgScore}%` : 'Unavailable',
      s.lastActive,
      s.status,
      s.joinedDate,
      s.location,
      s.targetExam || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');

    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_students_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Exported ${listToExport.length} student records to CSV!`);
  };

  // Download Sample CSV template
  const handleDownloadSampleCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Subscription Plan', 'Target Exam', 'Location'];
    const sampleRows = [
      [
        'Rohan Mondal',
        'rohan.mondal@example.com',
        '+91 98300 12345',
        'Free',
        'WBP Constable',
        'Kolkata, WB',
      ],
      [
        'Priyanka Sen',
        'priyanka.sen@example.com',
        '+91 98311 23456',
        'Free',
        'KP Constable',
        'Howrah, WB',
      ],
      [
        'Bikram Roy',
        'bikram.roy@example.com',
        '+91 98322 34567',
        'Free',
        'WBTET Primary',
        'Siliguri, WB',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((e) => e.map(csvCell).join(','))].join('\n');

    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sample_students_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reloadStudents = async () => {
    const data = await api.getAllAdminStudents();
    const mapped = data.map(mapDbRowToStudent);
    saveStudents(mapped);
    setSelectedStudentId((current) =>
      mapped.some((s) => s.id === current) ? current : mapped[0]?.id || ''
    );
    return mapped;
  };

  const handleCSVImport = (file: File) => {
    if (isWorking) return;
    setIsWorking(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      let created = 0;
      const failures: string[] = [];
      try {
        const rows = parseStudentCsv(String(event.target?.result || '')).slice(1);
        if (!rows.length || rows.length > 100)
          throw new Error('Import requires 1–100 student rows.');
        for (const [index, cols] of rows.entries()) {
          if (cols[3] && cols[3].toLowerCase() !== 'free') {
            failures.push(
              `Row ${index + 2}: paid access must be granted separately in Subscriptions.`
            );
            continue;
          }
          const result = await api.createStudentAccount({
            fullName: cols[0] || '',
            email: cols[1] || '',
            phone: cols[2],
            targetExam: cols[4],
            district: cols[5],
          });
          if (result.success && result.userId) created++;
          else failures.push(`Row ${index + 2}: ${result.error || 'Creation not confirmed.'}`);
        }
        await reloadStudents();
        if (created) setIsImportModalOpen(false);
        showToast(
          failures.length ? 'error' : 'success',
          `${created} account(s) created and invited. ${failures.length} failed.${failures.length ? ` ${failures[0]}` : ''}`
        );
      } catch (err) {
        showToast(
          'error',
          `${created} account(s) confirmed before the error. ${err instanceof Error ? err.message : 'Import failed.'}`
        );
      } finally {
        setIsWorking(false);
      }
    };
    reader.onerror = () => {
      setIsWorking(false);
      showToast('error', 'CSV file could not be read.');
    };
    reader.readAsText(file);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorking) return;
    if (newStudentForm.subscriptionPlan !== 'Free' || newStudentForm.status !== 'Active') {
      showToast(
        'error',
        'Create a free active account first. Paid access and deactivation must use their dedicated backend actions.'
      );
      return;
    }
    setIsWorking(true);
    try {
      const result = await api.createStudentAccount({
        fullName: newStudentForm.fullName.trim(),
        email: newStudentForm.email.trim(),
        phone: newStudentForm.phone.trim(),
        targetExam: newStudentForm.targetExam,
        district: newStudentForm.location,
      });
      if (!result.success || !result.userId) {
        showToast('error', result.error || 'Account creation was not confirmed.');
        return;
      }
      await reloadStudents();
      setSelectedStudentId(result.userId);
      setIsAddModalOpen(false);
      showToast('success', 'Student account created. A secure account invitation was sent.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Student creation failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || isWorking) return;
    if (editStudentForm.subscriptionPlan !== selectedStudent.subscriptionPlan) {
      showToast('error', 'Use the Subscriptions screen to change paid access.');
      return;
    }
    const targetId = selectedStudent.id;
    setIsWorking(true);
    try {
      const result = await api.updateStudentProfile(targetId, {
        fullName: editStudentForm.fullName.trim(),
        email: editStudentForm.email.trim(),
        phone: editStudentForm.phone.trim(),
        targetExam: editStudentForm.targetExam,
        district: editStudentForm.location,
        // Only send status when the admin actually changed it to a known value.
        ...(editStudentForm.status !== selectedStudent.status &&
        editStudentForm.status !== 'Unavailable'
          ? { status: editStudentForm.status }
          : {}),
      });
      if (!result.success) {
        showToast('error', result.error || 'Student update was not confirmed.');
        return;
      }
      await reloadStudents();
      setIsEditModalOpen(false);
      showToast('success', 'Student details saved in the backend.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Student update failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleStatus = async (student: EnrichedStudent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isWorking || student.status === 'Unavailable') return;
    const status = student.status === 'Active' ? 'Inactive' : 'Active';
    setIsWorking(true);
    try {
      const result = await api.updateStudentProfile(student.id, { status });
      if (!result.success) {
        showToast('error', result.error || 'Account status update failed.');
        return;
      }
      saveStudents(students.map((s) => (s.id === student.id ? { ...s, status } : s)));
      setActiveMenuId(null);
      showToast('success', `Account status changed to ${status}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent || isWorking) return;
    const target = selectedStudent;
    setIsWorking(true);
    try {
      const result = await api.deleteStudentProfile(target.id);
      if (!result.deletedIds?.includes(target.id)) {
        showToast('error', result.error || 'Deletion was not confirmed.');
        return;
      }
      const remaining = students.filter((s) => s.id !== target.id);
      saveStudents(remaining);
      setSelectedStudentId(remaining[0]?.id || '');
      setSelectedRowIds((ids) => ids.filter((id) => id !== target.id));
      setIsDeleteModalOpen(false);
      showToast('success', `Student account ${target.fullName} deleted in the backend.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Deletion failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !selectedRowIds.length ||
      isWorking ||
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} student accounts and their linked history? This cannot be undone.`
      )
    )
      return;
    const requested = [...selectedRowIds];
    setIsWorking(true);
    try {
      const result = await api.bulkDeleteStudentProfiles(requested);
      const deleted = new Set((result.deletedIds || []).filter((id) => requested.includes(id)));
      const remaining = students.filter((s) => !deleted.has(s.id));
      saveStudents(remaining);
      setSelectedRowIds(requested.filter((id) => !deleted.has(id)));
      setSelectedStudentId((current) => (current && deleted.has(current) ? null : current));
      showToast(
        result.success ? 'success' : 'error',
        `${deleted.size} account(s) deleted. ${requested.length - deleted.size} not confirmed.${result.error ? ` ${result.error}` : ''}`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Bulk deletion failed.');
    } finally {
      setIsWorking(false);
    }
  };

  // Reset Password using Supabase Auth recovery flow
  const handleResetPassword = async () => {
    if (!selectedStudent || isWorking) return;
    setIsWorking(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(selectedStudent.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      setIsResetPasswordModalOpen(false);
      showToast('success', `Password recovery email initiated for ${selectedStudent.email}`);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Failed to send password recovery email.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  // Send Notification persisted to database for intended student
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || isWorking) return;
    if (!notificationText.title.trim()) {
      showToast('error', 'Notification title is required.');
      return;
    }
    if (!notificationText.message.trim()) {
      showToast('error', 'Notification message is required.');
      return;
    }

    setIsWorking(true);
    try {
      const res = await api.createTargetedNotification({
        title: notificationText.title.trim(),
        message: notificationText.message.trim(),
        channel: 'in_app',
        userIds: [selectedStudent.id],
      });

      if (!res.success) {
        showToast('error', res.error || 'Failed to deliver notification.');
        return;
      }

      setIsNotificationModalOpen(false);
      showToast('success', `In-app notification sent to ${selectedStudent.fullName}!`);
      setNotificationText({ title: '', message: '' });
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Notification failed to deliver.');
    } finally {
      setIsWorking(false);
    }
  };

  // Save Internal Note to backend database
  const handleSaveNote = async () => {
    if (!selectedStudent || isWorking) return;
    if (!newNoteText.trim()) return;

    setIsWorking(true);
    try {
      const authorName = currentAdmin?.fullName?.trim() || currentAdmin?.email?.trim();
      if (!authorName) {
        showToast('error', 'Your staff profile could not be identified; note was not saved.');
        return;
      }
      const res = await api.createStudentNote(selectedStudent.id, newNoteText.trim(), authorName);
      if (!res.success || !res.note) {
        showToast('error', res.error || 'Failed to persist note.');
        return;
      }

      setStudentNotes((prev) => [res.note, ...prev]);
      setNewNoteText('');
      showToast('success', `Note saved for ${selectedStudent.fullName}!`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Note creation failed.');
    } finally {
      setIsWorking(false);
    }
  };

  // Delete Note for Student
  const handleDeleteNote = async (noteId: string) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const res = await api.deleteStudentNote(noteId);
      if (!res.success) {
        showToast('error', res.error || 'Failed to delete note.');
        return;
      }
      setStudentNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast('success', 'Internal note removed.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete note.');
    } finally {
      setIsWorking(false);
    }
  };

  // Grant / Upgrade Subscription directly from Subscriptions tab via real backend API
  const handleQuickGrantPlan = async (tier: SubscriptionTier) => {
    if (!selectedStudent || isWorking) return;
    setIsWorking(true);
    try {
      const plans = await api.getSubscriptionPlans(true);
      const targetDays = tier === '1 Year' ? 365 : tier === '6 Months' ? 180 : 30;
      const matchedPlan =
        plans.find((p) => p.durationDays === targetDays) ||
        plans.find((p) => p.id !== 'plan_free') ||
        plans[0];
      if (!matchedPlan) {
        showToast('error', 'No active subscription plans configured.');
        return;
      }

      const res = await api.createAdminSubscription({
        studentEmail: selectedStudent.email,
        planId: matchedPlan.id,
        studentName: selectedStudent.fullName,
        planTitle: matchedPlan.title,
      });
      if (!res.success) {
        showToast('error', res.error || 'Failed to grant plan.');
        return;
      }

      showToast('success', `${matchedPlan.title} access granted to ${selectedStudent.fullName}!`);
      // Reload details and students list
      const details = await api.getAdminStudentDetails(selectedStudent.id);
      if (details) setSelectedStudentDetails(details);
      const data = await api.getAllAdminStudents();
      if (data) setStudents(data.map((row, i) => mapDbRowToStudent(row, i)));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to grant plan.');
    } finally {
      setIsWorking(false);
    }
  };

  // Close row menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Dynamic student metric counts calculated from real database state
  const totalStudentsCount = students.length;
  const activeStudentsCount = students.filter((s) => s.status === 'Active').length;
  const paidStudentsCount = students.filter((s) => s.subscriptionPlan !== 'Free').length;
  const newStudentsCount = students.length;
  const scoredStudents = students.filter((s) => s.avgScore != null && s.avgScore > 0);
  const avgTestScoreFormatted =
    scoredStudents.length > 0
      ? `${Math.round(scoredStudents.reduce((sum, s) => sum + (s.avgScore || 0), 0) / scoredStudents.length)}%`
      : 'Unavailable';

  return {
    selectedStudentId,
    setSelectedStudentId,
    isPanelOpen,
    setIsPanelOpen,
    activeTab,
    setActiveTab,
    isLoading,
    isWorking,
    toastMessage,
    setToastMessage,
    selectedRowIds,
    setSelectedRowIds,
    activeMenuId,
    setActiveMenuId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    examFilter,
    setExamFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    isAddModalOpen,
    setIsAddModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    isResetPasswordModalOpen,
    setIsResetPasswordModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    newStudentForm,
    setNewStudentForm,
    editStudentForm,
    setEditStudentForm,
    notificationText,
    setNotificationText,
    newNoteText,
    setNewNoteText,
    fileInputRef,
    selectedStudent,
    selectedStudentDetails,
    isLoadingDetails,
    studentNotes,
    isLoadingNotes,
    studentMetrics,
    handleApplyFilters,
    handleResetFilters,
    currentFilteredCount,
    totalPages,
    startIndex,
    visibleStudents,
    handleSelectAllVisible,
    handleToggleRow,
    handleExportCSV,
    handleDownloadSampleCSV,
    handleCSVImport,
    handleAddStudentSubmit,
    handleEditStudentSubmit,
    handleToggleStatus,
    handleDeleteStudent,
    handleBulkDelete,
    handleResetPassword,
    handleSendNotification,
    handleSaveNote,
    handleDeleteNote,
    handleQuickGrantPlan,
    totalStudentsCount,
    activeStudentsCount,
    paidStudentsCount,
    newStudentsCount,
    avgTestScoreFormatted,
  };
}

export type AdminStudentsState = ReturnType<typeof useAdminStudents>;
