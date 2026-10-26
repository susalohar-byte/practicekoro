import { cn } from '@/lib/cn';
import { fmtNum } from '@/lib/format';
import { Avatar } from '@/components/ui/Brand';
import type { RankRow as Row } from '@/types/models';

const MEDALS: Record<number, [string, string]> = { 1: ['🥇', '#FEF3C7'], 2: ['🥈', '#F1F5F9'], 3: ['🥉', '#FFEDD5'] };

export function RankBadge({ rank, me }: { rank: number; me?: boolean }) {
  const medal = MEDALS[rank];
  if (medal) {
    return (
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[16px]" style={{ background: medal[1] }} aria-label={`Rank ${rank}`}>
        {medal[0]}
      </span>
    );
  }
  return (
    <span className={cn('flex h-6 min-w-[30px] shrink-0 items-center justify-center rounded-md px-1 text-[11.5px] font-extrabold', me ? 'bg-[#DBEAFE] text-brand' : 'bg-[#F1F5F9] text-[#475569]')}>
      #{rank}
    </span>
  );
}

export function RankListRow({ row, subtitle }: { row: Row; subtitle?: string | null }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl px-2.5 py-2', row.isCurrentUser ? 'border border-[#BFDBFE] bg-[#EFF6FF]' : 'border border-[#F1F5F9] bg-white')}>
      <RankBadge rank={row.rank} me={row.isCurrentUser} />
      <Avatar url={row.avatarUrl} name={row.name} size={32} />
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[14px]', row.isCurrentUser ? 'font-extrabold text-brand' : 'font-bold text-[#0F172A]')}>
          {row.name}
          {row.isCurrentUser && ' (You)'}
        </span>
        {(subtitle ?? row.district) && <span className="block truncate text-[11.5px] text-[#64748B]">{subtitle ?? row.district}</span>}
      </span>
      <span className="text-right">
        <span className="block text-[13.5px] font-extrabold text-ink">
          {fmtNum(row.score)} / {fmtNum(row.totalMarks)}
        </span>
        <span className={cn('block text-[11px] font-semibold', row.isCurrentUser ? 'text-brand' : 'text-[#64748B]')}>{Math.round(row.percentage)}%</span>
      </span>
    </div>
  );
}
