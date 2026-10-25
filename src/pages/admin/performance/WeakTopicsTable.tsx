import { AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopicMetricItem } from './performanceUtils';

export interface WeakTopicsTableProps {
  data: TopicMetricItem[];
}

export function WeakTopicsTable({ data }: WeakTopicsTableProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[200px]">
              Topic / Chapter
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[130px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[110px]">
              Questions Answered
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[150px]">
              Average Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right min-w-[120px]">
              Priority Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No weak topic metrics recorded yet.
              </td>
            </tr>
          ) : (
            data.map((t) => {
              const isCritical = t.avgScore < 40;
              const isModerate = t.avgScore >= 40 && t.avgScore < 60;
              return (
                <tr key={t.rank} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold',
                        t.rank <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {t.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.topic}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                        t.subjectBadgeColor
                      )}
                    >
                      {t.subject}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                    {t.attempts.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-md',
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : isModerate
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {t.avgScore}%
                      </span>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isCritical
                              ? 'bg-rose-500'
                              : isModerate
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(100, t.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isModerate
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                      )}
                    >
                      {isCritical
                        ? 'Critical Attention'
                        : isModerate
                          ? 'Needs Practice'
                          : 'Moderate'}
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
