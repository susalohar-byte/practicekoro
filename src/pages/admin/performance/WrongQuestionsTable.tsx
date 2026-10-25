import { AlertTriangle, BookOpen, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WrongQuestionItem } from './performanceUtils';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface WrongQuestionsTableProps {
  data: WrongQuestionItem[];
  perf: AdminPerformanceState;
}

export function WrongQuestionsTable({ data, perf }: WrongQuestionsTableProps) {
  const { setSelectedQuestion } = perf;
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[280px]">
              Question Details
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[120px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
              Attempts
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[140px]">
              Failure Rate
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
              Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right w-20">
              Inspect
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-slate-400">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No frequently failed questions recorded in this range.
              </td>
            </tr>
          ) : (
            data.map((q) => (
              <tr
                key={q.id}
                className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                onClick={() => setSelectedQuestion(q)}
              >
                <td className="py-3 px-3.5 text-center">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-[11px] shadow-2xs',
                      Number(q.id) === 1 && 'bg-rose-600 text-white',
                      Number(q.id) === 2 && 'bg-rose-500 text-white',
                      Number(q.id) === 3 && 'bg-amber-500 text-white',
                      Number(q.id) > 3 && 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {q.id}
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <p className="font-bold text-[#0F172A] text-xs leading-snug group-hover:text-blue-600 transition-colors">
                    {q.questionText}
                  </p>
                  {q.questionTextBn && (
                    <p className="text-[11px] text-[#64748B] font-normal mt-0.5 line-clamp-1">
                      {q.questionTextBn}
                    </p>
                  )}
                  {q.chapter && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded mt-1">
                      <BookOpen className="w-2.5 h-2.5" />
                      {q.chapter}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                      q.subjectColor
                    )}
                  >
                    {q.subject}
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                  {q.totalAttempts.toLocaleString()}
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-rose-100 text-rose-700 text-[11px] font-black px-2 py-0.5 rounded-md">
                        {q.wrongPercentage}% wrong
                      </span>
                    </div>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, q.wrongPercentage)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-xs font-black text-emerald-600">
                    {q.accuracyRate ?? Math.max(0, 100 - q.wrongPercentage)}%
                  </span>
                </td>
                <td className="py-3 px-3.5 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuestion(q);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View question details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
