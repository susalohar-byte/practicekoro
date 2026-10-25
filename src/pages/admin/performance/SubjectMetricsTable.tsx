import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubjectMetricItem } from './performanceUtils';

export interface SubjectMetricsTableProps {
  data: SubjectMetricItem[];
}

export function SubjectMetricsTable({ data }: SubjectMetricsTableProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[200px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[120px]">
              Questions Attempted
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[160px]">
              Average Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right min-w-[130px]">
              Performance Level
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No subject metrics recorded yet.
              </td>
            </tr>
          ) : (
            data.map((s) => {
              const isStrong = s.avgScore >= 70;
              const isModerate = s.avgScore >= 50 && s.avgScore < 70;
              return (
                <tr key={s.rank} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                    <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-700">
                      {s.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('w-2.5 h-2.5 rounded-full', s.subjectColor.split(' ')[0])}
                      />
                      <span className="text-xs">{s.subject}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                    {s.attempts.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-md',
                          isStrong
                            ? 'bg-emerald-100 text-emerald-700'
                            : isModerate
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-rose-100 text-rose-700'
                        )}
                      >
                        {s.avgScore}%
                      </span>
                      <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isStrong ? 'bg-emerald-500' : isModerate ? 'bg-blue-500' : 'bg-rose-500'
                          )}
                          style={{ width: `${Math.min(100, s.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isStrong
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isModerate
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                      )}
                    >
                      {isStrong ? 'Above Benchmark' : isModerate ? 'Standard' : 'Below Benchmark'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
