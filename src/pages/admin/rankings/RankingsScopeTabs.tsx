import { Bookmark, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsScopeTabsProps {
  rk: AdminRankingsState;
}

export function RankingsScopeTabs({ rk }: RankingsScopeTabsProps) {
  const { scopeTab, handleScopeChange } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. RANKING SCOPE SEGMENTED TABS */}
      {/* ==================================================================== */}
      <div className="inline-flex p-1 bg-white border border-[#E2E8F0] rounded-xl gap-1 shadow-2xs">
        <button
          onClick={() => handleScopeChange('Overall')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
            scopeTab === 'Overall'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              scopeTab === 'Overall' ? 'bg-white' : 'bg-transparent'
            )}
          />
          <span>Overall</span>
        </button>

        <button
          onClick={() => handleScopeChange('By Exam')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            scopeTab === 'By Exam'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          By Exam
        </button>

        <button
          onClick={() => handleScopeChange('By Subject')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            scopeTab === 'By Subject'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          By Subject
        </button>

        <button
          onClick={() => handleScopeChange('By Topic')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer',
            scopeTab === 'By Topic'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          <Bookmark className="w-3 h-3 text-slate-400" />
          <span>By Topic</span>
        </button>

        <button
          onClick={() => handleScopeChange('By Test Series')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            scopeTab === 'By Test Series'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          By Test Series
        </button>

        <button
          onClick={() => handleScopeChange('Live Tests')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
            scopeTab === 'Live Tests'
              ? 'bg-rose-600 text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          <Radio
            className={cn(
              'w-3.5 h-3.5',
              scopeTab === 'Live Tests' ? 'text-white animate-pulse' : 'text-rose-500'
            )}
          />
          <span>Live Tests</span>
        </button>
      </div>
    </>
  );
}
