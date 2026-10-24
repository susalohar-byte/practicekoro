import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { cn } from '@/lib/utils';
import type { AdminStudentsState } from '../useAdminStudents';

export interface StudentTestHistoryTabProps {
  studentsState: AdminStudentsState;
}

export function StudentTestHistoryTab({ studentsState }: StudentTestHistoryTabProps) {
  const { activeTab, studentMetrics, isLoadingDetails } = studentsState;
  return (
    <>
      {activeTab === 'Test History' && (
        <div className="space-y-3 text-xs py-1">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-800 block text-xs">
              Completed Tests ({studentMetrics.testsAttempted})
            </span>
            <span className="text-[11px] text-slate-500">
              {studentMetrics.avgScore != null
                ? `Average score across completed attempts: ${studentMetrics.avgScore}% • Best: ${studentMetrics.bestScore}%`
                : 'No completed test attempts recorded yet.'}
            </span>
          </div>
          <div className="space-y-2">
            {isLoadingDetails ? (
              <AdminSectionSkeleton label="Loading attempts…" />
            ) : studentMetrics.completedAttempts.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-white border border-slate-100 rounded-lg text-xs">
                No test attempts found for this student.
              </div>
            ) : (
              studentMetrics.completedAttempts.map((att) => {
                const pct =
                  att.totalMarks > 0 ? Math.round((att.score / att.totalMarks) * 100) : null;
                const isPassed = pct !== null && pct >= 40;
                return (
                  <div
                    key={att.id}
                    className="p-2.5 border border-slate-200 rounded-lg bg-white flex justify-between items-center shadow-2xs"
                  >
                    <div>
                      <span className="font-semibold block text-slate-900">
                        {att.testTitle || 'Mock Test'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {att.score}/{att.totalMarks || '—'} Marks{pct !== null ? ` (${pct}%)` : ''}
                        {att.accuracy != null ? ` • Accuracy: ${Math.round(att.accuracy)}%` : ''}
                        {att.rank ? ` • Rank #${att.rank}` : ''}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-bold',
                        isPassed ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                      )}
                    >
                      {att.status === 'completed'
                        ? isPassed
                          ? 'Passed'
                          : 'Completed'
                        : att.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
