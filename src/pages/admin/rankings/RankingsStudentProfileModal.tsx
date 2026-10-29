import { ArrowRight, Crown, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';
import { StudentAvatar } from '@/pages/admin/students/StudentAvatar';

export interface RankingsStudentProfileModalProps {
  rk: AdminRankingsState;
}

export function RankingsStudentProfileModal({ rk }: RankingsStudentProfileModalProps) {
  const { navigate, isProfileModalOpen, setIsProfileModalOpen, activeStudent } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 7. STUDENT PROFILE MODAL */}
      {/* ==================================================================== */}
      {isProfileModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Student Profile & Rank Card</h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {activeStudent.avatar ? (
                <StudentAvatar
                  avatarUrl={activeStudent.avatar}
                  fullName={activeStudent.name}
                  initials={activeStudent.initials}
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                />
              ) : (
                <div
                  className={cn(
                    'w-16 h-16 rounded-full text-base font-bold flex items-center justify-center shadow-md',
                    activeStudent.initialsBg || 'bg-blue-600 text-white'
                  )}
                >
                  {activeStudent.initials}
                </div>
              )}
              <div>
                <h4 className="text-base font-black text-slate-900">{activeStudent.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {activeStudent.studentId}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    State Rank #{activeStudent.rank}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    📍 {activeStudent.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Tests Attempted</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeStudent.testsAttempted}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Questions Answered</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeStudent.questionsAnswered.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Accuracy Rate</span>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeStudent.accuracy}%
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Average Score</span>
                <p className="text-sm font-black text-blue-600 mt-0.5">{activeStudent.avgScore}%</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    navigate('/admin/students');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <span>Open in Students</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
