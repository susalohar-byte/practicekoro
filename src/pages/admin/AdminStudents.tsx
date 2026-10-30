import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStudents } from './students/useAdminStudents';
import { AddStudentModal } from './students/AddStudentModal';
import { ImportStudentsModal } from './students/ImportStudentsModal';
import { EditStudentModal } from './students/EditStudentModal';
import { SendStudentNotificationModal } from './students/SendStudentNotificationModal';
import { ResetPasswordModal } from './students/ResetPasswordModal';
import { DeleteStudentModal } from './students/DeleteStudentModal';
import { StudentDetailsPanel } from './students/StudentDetailsPanel';
import { StudentsTableCard } from './students/StudentsTableCard';
import { StudentBulkActionBar } from './students/StudentBulkActionBar';
import { StudentFilterToolbar } from './students/StudentFilterToolbar';
import { StudentKpiCards } from './students/StudentKpiCards';
import { StudentsPageHeader } from './students/StudentsPageHeader';
export type {
  SubscriptionTier,
  StudentStatus,
  StudentActivity,
  StudentNote,
  EnrichedStudent,
} from './students/studentTypes';

// ============================================================================
// MAIN COMPONENT: ADMIN STUDENTS
// ============================================================================

export const AdminStudents: React.FC = () => {
  const studentsState = useAdminStudents();
  const { isLoading, toastMessage, setToastMessage, fileInputRef, handleCSVImport } = studentsState;
  return withAdminSkeleton(
    isLoading,
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastMessage.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5',
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        aria-label="Import students from CSV"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCSVImport(file);
        }}
      />

      {/* PAGE CONTAINER */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">
        {/* ================================================================= */}
        <StudentsPageHeader studentsState={studentsState} />

        {/* ================================================================= */}
        <StudentKpiCards studentsState={studentsState} />

        {/* ================================================================= */}
        <StudentFilterToolbar studentsState={studentsState} />

        <StudentBulkActionBar studentsState={studentsState} />

        {/* ================================================================= */}
        {/* 4. MAIN CONTENT AREA: TABLE (LEFT) + STUDENT DETAILS (RIGHT)      */}
        {/* ================================================================= */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* =============================================================== */}
          <StudentsTableCard studentsState={studentsState} />

          {/* =============================================================== */}
          <StudentDetailsPanel studentsState={studentsState} />
        </div>
      </div>

      {/* =================================================================== */}
      <AddStudentModal studentsState={studentsState} />

      {/* =================================================================== */}
      <ImportStudentsModal studentsState={studentsState} />

      {/* =================================================================== */}
      <EditStudentModal studentsState={studentsState} />

      {/* =================================================================== */}
      <SendStudentNotificationModal studentsState={studentsState} />

      {/* =================================================================== */}
      <ResetPasswordModal studentsState={studentsState} />

      {/* =================================================================== */}
      <DeleteStudentModal studentsState={studentsState} />
    </div>,
    { label: 'Loading students…', variant: 'table' }
  );
};

export default AdminStudents;
