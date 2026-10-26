import { Link } from 'react-router-dom';
import { ArrowRight, Award, ListChecks, Lock, Timer } from 'lucide-react';
import { fmtNum } from '@/lib/format';
import type { MockTest } from '@/types/models';

export const CATEGORY_THEME: Record<string, { fg: string; bg: string }> = {
  PYQ: { fg: '#D97706', bg: '#FEF3C7' },
  'Topic Test': { fg: '#7C3AED', bg: '#F3E8FF' },
  'Full Test': { fg: '#2563EB', bg: '#EFF6FF' },
};

/** Test row from exam_tests_screen.dart: number box, category tag, title, meta, Start / PRO. */
export function TestCard({ test, index, locked, onLocked }: { test: MockTest; index: number; locked: boolean; onLocked: () => void }) {
  const theme = CATEGORY_THEME[test.category] ?? CATEGORY_THEME['Full Test'];
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[17px] font-black" style={{ background: theme.bg, color: theme.fg }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="min-w-0 flex-1">
        <span className="inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: theme.bg, color: theme.fg }}>
          {test.category}
        </span>
        <span className="mt-1 line-clamp-2 block text-[15px] font-extrabold leading-snug text-[#0F172A]">{test.title}</span>
        <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11.5px] font-semibold text-[#64748B]">
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5 text-[#94A3B8]" /> {test.totalQuestions} Qs
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5 text-[#94A3B8]" /> {test.durationMinutes}m
          </span>
          <span className="inline-flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-[#94A3B8]" /> {fmtNum(test.totalMarks, 0)} Marks
          </span>
        </span>
      </span>
      {locked ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-black text-[#92400E]">
          <Lock className="h-3 w-3 text-[#D97706]" /> PRO
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2563EB] px-3.5 py-1.5 text-[12.5px] font-extrabold text-white shadow-[0_3px_8px_rgba(37,99,235,0.25)]">
          Start <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );
  const cls =
    'flex w-full items-center gap-3 rounded-card border border-line bg-white p-3.5 text-left shadow-card transition hover:-translate-y-px hover:border-primary/30';
  return locked ? (
    <button type="button" className={cls} onClick={onLocked} aria-label={`${test.title} — PRO, locked`}>
      {body}
    </button>
  ) : (
    <Link to={`/test/${encodeURIComponent(test.id)}/details`} className={cls}>
      {body}
    </Link>
  );
}
