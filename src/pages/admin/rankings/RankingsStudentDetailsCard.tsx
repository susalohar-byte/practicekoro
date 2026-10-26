import { BookOpen, CheckCircle2, FileText, MapPin, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsStudentDetailsCardProps {
  rk: AdminRankingsState;
}

export function RankingsStudentDetailsCard({ rk }: RankingsStudentDetailsCardProps) {
  const {
    isDetailsOpen,
    setIsDetailsOpen,
    setIsPerformanceModalOpen,
    setIsRecentAttemptsModalOpen,
    setIsProfileModalOpen,
    activeStudent,
  } = rk;
  return (
    <>
      {/* 2. STUDENT DETAILS CARD */}
      {isDetailsOpen && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-4 animate-in fade-in duration-150">
          {activeStudent ? (
            <>
              {/* Header: Title & Close */}
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm font-bold text-[#0F172A]">Student Details</h2>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition-colors"
                  title="Close student details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Profile Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {activeStudent.avatar ? (
                    <img
                      src={activeStudent.avatar}
                      alt={activeStudent.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-full text-xs font-bold flex items-center justify-center shadow-xs',
                        activeStudent.initialsBg || 'bg-blue-600 text-white'
                      )}
                    >
                      {activeStudent.initials || 'ST'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#0F172A] leading-tight">
                        {activeStudent.name}
                      </h3>
                      <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                        Rank #{activeStudent.rank}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{activeStudent.location}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              </div>

              {/* 4 Mini Metric Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Tests Attempted */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.testsAttempted}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none">Tests Attempted</p>
                  </div>
                </div>

                {/* Questions Answered */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.questionsAnswered.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none truncate">
                      Questions Answered
                    </p>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.accuracy}%
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none">Accuracy</p>
                  </div>
                </div>

                {/* Avg. Score */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.avgScore}%
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none">Avg. Score</p>
                  </div>
                </div>
              </div>

              {/* Student-wise Performance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#0F172A]">Student-wise Performance</h4>
                  <button
                    onClick={() => setIsPerformanceModalOpen(true)}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {activeStudent.subjectPerformance.map((subj) => (
                    <div key={subj.subject} className="flex items-center gap-2">
                      <span className="w-28 text-[11px] text-[#475569] font-medium truncate">
                        {subj.subject}
                      </span>
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', subj.barColor)}
                          style={{ width: `${subj.scorePercent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] font-bold text-[#0F172A]">
                        {subj.scorePercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Test Attempts */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#0F172A]">Recent Test Attempts</h4>
                  <button
                    onClick={() => setIsRecentAttemptsModalOpen(true)}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {activeStudent.recentAttempts.map((attempt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px]',
                            attempt.iconBg
                          )}
                        >
                          <FileText className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#1E293B] truncate">
                          {attempt.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {attempt.scorePercent}%
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">{attempt.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">No student selected.</div>
          )}
        </div>
      )}
    </>
  );
}
