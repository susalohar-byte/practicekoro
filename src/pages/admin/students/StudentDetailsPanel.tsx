import { X, Users, Edit2, Trash2, Send, KeyRound } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';
import { cn } from '@/lib/utils';
import type { AdminStudentsState } from './useAdminStudents';
import { StudentOverviewTab } from './details/StudentOverviewTab';
import { StudentTestHistoryTab } from './details/StudentTestHistoryTab';
import { StudentSubscriptionsTab } from './details/StudentSubscriptionsTab';
import { StudentNotesTab } from './details/StudentNotesTab';

export interface StudentDetailsPanelProps {
  studentsState: AdminStudentsState;
}

export function StudentDetailsPanel({ studentsState }: StudentDetailsPanelProps) {
  const {
    isPanelOpen,
    setIsPanelOpen,
    setSelectedStudentId,
    selectedStudent,
    setIsEditModalOpen,
    setActiveTab,
    activeTab,
    studentNotes,
    setIsNotificationModalOpen,
    setIsResetPasswordModalOpen,
    setIsDeleteModalOpen,
  } = studentsState;
  return (
    <>
      {/* RIGHT: STUDENT DETAILS PANEL                                    */}
      {/* =============================================================== */}
      {isPanelOpen && (
        <div className="w-full lg:w-[410px] shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Student Details</h3>
            <button
              onClick={() => {
                setIsPanelOpen(false);
                setSelectedStudentId(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!selectedStudent ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No student selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Select a student from the list to view their full details.
              </p>
            </div>
          ) : (
            <>
              {/* Profile Card Header */}
              <div className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-xl mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <StudentAvatar
                    avatarUrl={selectedStudent.avatarUrl}
                    fullName={selectedStudent.fullName}
                    initials={selectedStudent.initials}
                    initialsBg={selectedStudent.initialsBg}
                    initialsColor={selectedStudent.initialsColor}
                    className="w-11 h-11 border-2 border-white dark:border-slate-800 shadow-2xs"
                    textClassName="text-sm"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {selectedStudent.fullName}
                      </h4>
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                          selectedStudent.status === 'Active'
                            ? 'bg-[#E6F8EE] text-[#15803D]'
                            : 'bg-[#FEE2E2] text-[#DC2626]'
                        )}
                      >
                        {selectedStudent.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      Student ID: {selectedStudent.studentIdFormatted}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>
              </div>

              {/* 4 Tabs: Overview | Test History | Subscriptions | Notes */}
              <div className="flex items-center gap-5 border-b border-slate-100 mb-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('Overview')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Overview'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('Test History')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Test History'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Test History
                </button>
                <button
                  onClick={() => setActiveTab('Subscriptions')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Subscriptions'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Subscriptions
                </button>
                <button
                  onClick={() => setActiveTab('Notes')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Notes'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Notes ({studentNotes.length})
                </button>
              </div>

              {/* OVERVIEW CONTENT */}
              <StudentOverviewTab studentsState={studentsState} selectedStudent={selectedStudent} />

              {/* TEST HISTORY TAB */}
              <StudentTestHistoryTab studentsState={studentsState} />

              {/* SUBSCRIPTIONS TAB */}
              <StudentSubscriptionsTab
                studentsState={studentsState}
                selectedStudent={selectedStudent}
              />

              {/* NOTES TAB */}
              <StudentNotesTab studentsState={studentsState} />

              {/* Bottom Actions Row (Exact 3 Buttons) */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                {/* Send Notification Button */}
                <button
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#026BFC] border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-[#026BFC]" />
                  <span>Send Notification</span>
                </button>

                {/* Reset Password Button */}
                <button
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Password</span>
                </button>

                {/* Delete Student Button */}
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-rose-50/60 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Student</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
