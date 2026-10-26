import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Radio, Timer, Users, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { compactCount, fmtSchedule } from '@/lib/format';
import { isLiveNow } from '@/services/catalog';
import type { LiveTest } from '@/types/models';

const PALETTES = [
  { keys: ['wbp', 'police', 'kp'], border: '#93C5FD', accent: '#2563EB', thumb: '#EFF6FF', time: '#2563EB', icon: 'exams/live_icon_wbp.png' },
  { keys: ['tet', 'wbssc', 'teach'], border: '#FCA5A5', accent: '#F43F5E', thumb: '#FFF1F2', time: '#E11D48', icon: 'exams/live_icon_wbssc.png' },
  { keys: ['railway', 'ntpc', 'rrb', 'ssc'], border: '#6EE7B7', accent: '#0D9488', thumb: '#ECFDF5', time: '#0D9488', icon: 'exams/live_icon_railway.png' },
];

export function livePalette(t: LiveTest, index: number) {
  const hay = `${t.title} ${t.examTitle ?? ''}`.toLowerCase();
  return PALETTES.find((p) => p.keys.some((k) => hay.includes(k))) ?? PALETTES[index % PALETTES.length];
}

export function LiveTestCard({ test, index, now }: { test: LiveTest; index: number; now: Date }) {
  const p = livePalette(test, index);
  const live = isLiveNow(test, now);
  const [imgOk, setImgOk] = useState(true);
  const participants = test.enrolledCount > 0 ? compactCount(test.enrolledCount) : null;
  return (
    <Link
      to={`/test/${encodeURIComponent(test.testId)}/details`}
      className="flex h-full gap-3 rounded-2xl border-[1.2px] bg-white p-3 transition hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      style={{ borderColor: p.border, boxShadow: `0 3px 10px ${p.accent}10` }}
    >
      <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: p.thumb }}>
        {imgOk ? (
          <img src={`${import.meta.env.BASE_URL}${p.icon}`} alt="" aria-hidden className="h-11 w-11 object-contain" onError={() => setImgOk(false)} />
        ) : (
          <ClipboardList className="h-6 w-6" style={{ color: p.accent }} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {live ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-[10px] bg-[#EF4444] px-2 py-0.5 text-[10.5px] font-extrabold tracking-wide text-white">
            <Radio className="h-3 w-3" /> LIVE
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 rounded-[10px] bg-[#FEF3C7] px-2 py-0.5 text-[10.5px] font-extrabold tracking-wide text-[#D97706]">
            <Clock className="h-3 w-3" /> UPCOMING
          </span>
        )}
        <span className="mt-1 truncate text-[14px] font-extrabold text-ink">{test.title}</span>
        <span className="text-[11.5px] font-bold" style={{ color: p.time }}>
          {test.startAt ? fmtSchedule(test.startAt) : live ? 'Live Now' : 'Schedule Announced Soon'}
        </span>
        <span className="mt-auto flex items-center gap-1 pt-1 text-[11px] font-semibold text-[#64748B]">
          <Timer className="h-3 w-3" /> {test.durationMinutes} Mins
          {participants && (
            <>
              <span aria-hidden> • </span>
              <Users className="h-3 w-3" /> {participants}
            </>
          )}
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: p.accent }} aria-hidden>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </span>
    </Link>
  );
}
