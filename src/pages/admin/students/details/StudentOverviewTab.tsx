import type { EnrichedStudent } from '../studentTypes';
import { Mail, Calendar, Phone, MapPin, Crown, FileCheck, Tag, UserCheck } from 'lucide-react';
import type { AdminStudentsState } from '../useAdminStudents';

export interface StudentOverviewTabProps {
  studentsState: AdminStudentsState;
  selectedStudent: EnrichedStudent;
}

export function StudentOverviewTab({ studentsState, selectedStudent }: StudentOverviewTabProps) {
  const { activeTab, studentMetrics, setActiveTab } = studentsState;
  return (
    <>
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {/* Quick Info Grid */}
          <div>
            <h5 className="font-bold text-slate-900 text-xs mb-2">Quick Info</h5>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedStudent.email}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Joined {selectedStudent.joinedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedStudent.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedStudent.location}</span>
              </div>
            </div>
          </div>

          {/* 4 Metrics Mini Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Tests Attempted */}
            <div className="bg-[#F0F7FF] rounded-lg p-2.5 text-center">
              <span className="text-base font-bold text-[#026BFC] block leading-tight">
                {studentMetrics.testsAttempted}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                Tests Attempted
              </span>
            </div>

            {/* Avg. Score */}
            <div className="bg-[#F0FDF4] rounded-lg p-2.5 text-center">
              <span className="text-xs sm:text-base font-bold text-[#16A34A] block leading-tight">
                {studentMetrics.avgScore != null ? `${studentMetrics.avgScore}%` : 'Unavailable'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                Avg. Score
              </span>
            </div>

            {/* Best Score */}
            <div className="bg-[#FAF5FF] rounded-lg p-2.5 text-center">
              <span className="text-xs sm:text-base font-bold text-[#9333EA] block leading-tight">
                {studentMetrics.bestScore != null ? `${studentMetrics.bestScore}%` : 'Unavailable'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                Best Score
              </span>
            </div>

            {/* Days Active */}
            <div className="bg-[#FFFBEB] rounded-lg p-2.5 text-center">
              <span className="text-xs sm:text-base font-bold text-[#D97706] block leading-tight">
                {studentMetrics.daysActive != null ? studentMetrics.daysActive : 'Unavailable'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                Days Active
              </span>
            </div>
          </div>

          {/* Subscription Information */}
          <div>
            <h5 className="font-bold text-slate-900 text-xs mb-2">Subscription Information</h5>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 text-xs block leading-tight">
                    {selectedStudent.subscriptionPlan} Plan
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">
                    Valid Till: {selectedStudent.subscriptionValidTill || 'Unavailable'}{' '}
                    {selectedStudent.subscriptionMonthsLeft &&
                    selectedStudent.subscriptionMonthsLeft !== 'Unavailable' ? (
                      <>
                        (
                        <span className="text-[#D97706] font-medium">
                          {selectedStudent.subscriptionMonthsLeft}
                        </span>
                        )
                      </>
                    ) : null}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('Subscriptions')}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#026BFC] bg-white border border-blue-200 hover:bg-blue-50/60 rounded-md transition-colors shrink-0"
              >
                View Subscription
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs">Recent Activity</h5>
              <button
                onClick={() => setActiveTab('Test History')}
                className="text-[11px] font-medium text-[#026BFC] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {studentMetrics.derivedActivities.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2">
                  No recent activity recorded for this student.
                </p>
              ) : (
                studentMetrics.derivedActivities.map((act) => {
                  return (
                    <div key={act.id} className="flex items-start justify-between gap-2.5 text-xs">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {act.type === 'completed' ? (
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-[#026BFC] flex items-center justify-center shrink-0 mt-0.5">
                            <FileCheck className="w-3.5 h-3.5 text-[#026BFC]" />
                          </div>
                        ) : act.type === 'attempted' ? (
                          <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                            <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                        ) : act.type === 'purchase' ? (
                          <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Tag className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 text-[11px] block leading-tight">
                            {act.title}
                          </span>
                          {act.subtitle && (
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              {act.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {act.time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
