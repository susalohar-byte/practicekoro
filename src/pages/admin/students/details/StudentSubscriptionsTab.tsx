import type { EnrichedStudent } from '../studentTypes';
import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import type { AdminStudentsState } from '../useAdminStudents';

export interface StudentSubscriptionsTabProps {
  studentsState: AdminStudentsState;
  selectedStudent: EnrichedStudent;
}

export function StudentSubscriptionsTab({
  studentsState,
  selectedStudent,
}: StudentSubscriptionsTabProps) {
  const { activeTab, isLoadingDetails, selectedStudentDetails, handleQuickGrantPlan, isWorking } =
    studentsState;
  return (
    <>
      {activeTab === 'Subscriptions' && (
        <div className="space-y-3.5 text-xs py-1">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="font-bold text-emerald-900 block text-xs">
              Current Plan: {selectedStudent.subscriptionPlan} Plan
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              Status: Active • Valid till {selectedStudent.subscriptionValidTill || 'Unavailable'}{' '}
              {selectedStudent.subscriptionMonthsLeft &&
              selectedStudent.subscriptionMonthsLeft !== 'Unavailable' ? (
                <>({selectedStudent.subscriptionMonthsLeft})</>
              ) : null}
            </span>
          </div>

          <div className="space-y-2">
            {isLoadingDetails ? (
              <AdminSectionSkeleton label="Loading orders…" />
            ) : selectedStudentDetails?.paymentHistory &&
              selectedStudentDetails.paymentHistory.length > 0 ? (
              selectedStudentDetails.paymentHistory.map((pmt) => (
                <div
                  key={pmt.id}
                  className="p-3 border border-slate-200 rounded-xl bg-white space-y-1.5 shadow-2xs"
                >
                  <span className="font-bold text-slate-900 block text-xs">
                    Order Details ({pmt.status})
                  </span>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-slate-800">
                      {pmt.transactionId || pmt.orderId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-slate-900">₹{pmt.amount}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Payment Gateway:</span>
                    <span>{pmt.gateway || 'Online'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 text-[11px] text-slate-500">
                No direct payment transactions recorded for this student.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-800 block text-xs mb-2">
              Admin Plan Override:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickGrantPlan('6 Months')}
                disabled={isWorking}
                className="p-2 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold text-center disabled:opacity-50"
              >
                Grant 6 Months
              </button>
              <button
                onClick={() => handleQuickGrantPlan('1 Year')}
                disabled={isWorking}
                className="p-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold text-center disabled:opacity-50"
              >
                Grant 1 Year Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
