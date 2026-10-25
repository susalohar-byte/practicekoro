import { Award, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopicMetricItem } from './performanceUtils';

export interface TopTopicsTableProps {
  data: TopicMetricItem[];
}

export function TopTopicsTable({ data }: TopTopicsTableProps) {
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
              Mastery Level
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                <Award className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No top performing topics recorded yet.
              </td>
            </tr>
          ) : (
            data.map((t) => {
              const isMastered = t.avgScore >= 80;
              const isProficient = t.avgScore >= 65 && t.avgScore < 80;
              return (
                <tr key={t.rank} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold shadow-2xs',
                        t.rank === 1 && 'bg-amber-400 text-amber-950 font-black',
                        t.rank === 2 && 'bg-slate-300 text-slate-800 font-bold',
                        t.rank === 3 && 'bg-amber-700/80 text-white font-bold',
                        t.rank > 3 && 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {t.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-md">
                        {t.avgScore}%
                      </span>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, t.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isMastered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isProficient
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      )}
                    >
                      {isMastered
                        ? 'Mastered'
                        : isProficient
                          ? 'High Proficiency'
                          : 'Good Competency'}
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
