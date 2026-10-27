import React, { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChartNoAxesColumn,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  FileText,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { Reveal, fadeUp } from './Reveal';
import { useTheme } from '@/context/ThemeContext';

/*
 * The app at a glance, under the "Why Practice Koro?" cards. Tablets and desktops get the
 * approved design built on a fixed 1680x937 canvas in the design's own pixels, scaled to fit, so
 * every piece sits exactly where the design puts it. On phones that would make the text too
 * small, so the mock test phone and the feature chips are stacked instead.
 */

const BENGALI = "font-['Poppins','Anek_Bangla',sans-serif]";

/* ------------------------------ feature chips ------------------------------ */

interface ChipProps {
  icon: LucideIcon;
  label: string;
  /** Chip background, icon tile and arrow colours */
  tone: { chip: string; tile: string; arrow: string };
  delay: number;
}

const TONES = {
  blue: { chip: 'bg-[#EAF2FF]', tile: 'from-[#3B82F6] to-[#1D4ED8]', arrow: 'text-[#1D4ED8]' },
  red: { chip: 'bg-[#FFEDEF]', tile: 'from-[#FB7185] to-[#E11D48]', arrow: 'text-[#E11D48]' },
  amber: { chip: 'bg-[#FFF6E0]', tile: 'from-[#FCD34D] to-[#F59E0B]', arrow: 'text-[#F59E0B]' },
  purple: { chip: 'bg-[#F3ECFF]', tile: 'from-[#A78BFA] to-[#7C3AED]', arrow: 'text-[#7C3AED]' },
  green: { chip: 'bg-[#E6F9EE]', tile: 'from-[#4ADE80] to-[#16A34A]', arrow: 'text-[#16A34A]' },
};

const FeatureChip: React.FC<ChipProps> = ({ icon: Icon, label, tone, delay }) => (
  <motion.div
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
    className={`flex items-center gap-3 rounded-[26px] ${tone.chip} px-3 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.28)] ring-1 ring-white/70`}
  >
    <span
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.tile} text-white shadow-md`}
    >
      <Icon className="h-6 w-6" strokeWidth={2.2} />
    </span>
    <span className="flex-1 text-[15px] font-bold leading-tight text-[#0B1B4F]">{label}</span>
    <ChevronRight className={`h-5 w-5 flex-shrink-0 ${tone.arrow}`} strokeWidth={2.6} />
  </motion.div>
);

/* --------------------------------- phones --------------------------------- */

const StatusBar: React.FC = () => (
  <div className="flex items-center justify-between px-7 pt-4 text-[13px] font-semibold text-slate-900">
    <span>9:41</span>
    <span className="h-7 w-28 rounded-full bg-black" aria-hidden />
    <span className="flex items-center gap-1" aria-hidden>
      <span className="flex items-end gap-px">
        {[4, 6, 8, 10].map((h) => (
          <span key={h} className="w-[3px] rounded-sm bg-slate-900" style={{ height: h }} />
        ))}
      </span>
      <span className="ml-1 h-3 w-6 rounded-[3px] border border-slate-900 p-px">
        <span className="block h-full w-3/4 rounded-[1px] bg-slate-900" />
      </span>
    </span>
  </div>
);

/** Counts up from 28:17 so the test timer looks live. */
function useTicker(startSeconds: number) {
  const [seconds, setSeconds] = useState(startSeconds);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `00:${mm}:${ss}`;
}

const PhoneFrame: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div
    className={`rounded-[52px] bg-gradient-to-b from-[#3A3F4B] to-[#15181F] p-[9px] shadow-[0_40px_80px_rgba(0,0,0,0.55)] ${className}`}
  >
    <div className={`overflow-hidden rounded-[44px] bg-white ${BENGALI}`}>{children}</div>
  </div>
);

type OptionColors = { backgroundColor: string; borderColor: string };

/** The correct option's highlight is animated inline, so dark mode needs its own colours. */
const DARK_OPTION: { idle: OptionColors; picked: OptionColors } = {
  idle: { backgroundColor: '#0F172A', borderColor: '#334155' },
  picked: { backgroundColor: '#14532D', borderColor: '#22C55E' },
};

const MockTestPhone: React.FC<{ className?: string }> = ({
  className = 'w-[300px] sm:w-[330px]',
}) => {
  const time = useTicker(28 * 60 + 17);
  const dark = useTheme().resolvedTheme === 'dark';
  return (
    <PhoneFrame className={className}>
      <StatusBar />
      <div className="mt-4 flex items-center justify-between px-6">
        <span className="flex items-center gap-2.5 text-[17px] font-bold text-[#0B1B4F]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          Mock Test
        </span>
        <span className="flex items-center gap-1 text-[14px] font-semibold tabular-nums text-[#0B1B4F]">
          <Timer className="h-4 w-4 text-[#1D4ED8]" />
          {time}
        </span>
      </div>
      <div className="mx-6 mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[24%] rounded-full bg-[#1D4ED8]" />
      </div>

      <div className="px-6 pt-4 pb-6">
        <p className="text-[14px] font-semibold text-[#1D4ED8]">Question 12 of 50</p>
        <p className="mt-1.5 text-[17px] font-semibold leading-snug text-[#0B1B4F]">
          ভারতের প্রথম গভর্নর জেনারেল কে ছিলেন?
        </p>
        <div className="mt-4 space-y-3">
          {['লর্ড কর্নওয়ালিস', 'লর্ড ওয়েলেসলি', 'লর্ড ডালহৌসি', 'লর্ড ক্যানিং'].map(
            (label, i) => {
              const correct = i === 2;
              return (
                <motion.div
                  key={label}
                  initial={
                    correct
                      ? dark
                        ? DARK_OPTION.idle
                        : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                      : false
                  }
                  whileInView={
                    correct
                      ? dark
                        ? DARK_OPTION.picked
                        : { backgroundColor: '#E3F7EA', borderColor: '#4ADE80' }
                      : undefined
                  }
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.4 }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3"
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      correct ? 'bg-[#16A34A] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {'ABCD'[i]}
                  </span>
                  <span className="flex-1 text-[15.5px] font-medium text-[#0B1B4F]">{label}</span>
                  {correct && (
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 1.3 }}
                    >
                      <Check className="h-5 w-5 text-[#16A34A]" strokeWidth={3} />
                    </motion.span>
                  )}
                </motion.div>
              );
            }
          )}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Bookmark className="h-6 w-6 flex-shrink-0 text-[#0B1B4F]" />
          <span className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-[14px] font-semibold text-[#0B1B4F]">
            Previous
          </span>
          <span className="flex-1 rounded-xl bg-[#1A5CFF] py-3 text-center text-[14px] font-semibold text-white">
            Next
          </span>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* -------------------------------- section --------------------------------- */

const Background: React.FC<{ tint?: string }> = ({
  tint = 'from-[#1B1340]/55 via-[#140F33]/45 to-[#0D0A22]/70',
}) => (
  <>
    {/* Friends studying at night, blurred and dimmed behind everything */}
    <picture aria-hidden>
      <source media="(max-width: 767px)" srcSet="/images/landing/cta_group_study_sm.webp" />
      <img
        src="/images/landing/cta_group_study.webp"
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-[6px]"
      />
    </picture>
    <div aria-hidden className={`absolute inset-0 bg-gradient-to-b ${tint}`} />
  </>
);

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 70 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/* ------------------------- desktop: the design canvas ------------------------- */

const DESIGN_W = 1680;
const DESIGN_H = 937;
const NAVY = 'text-[#0B1B4F]';

/** How far the 1680px design has to shrink to fit the box it is drawn in. */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / DESIGN_W));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, scale] as const;
}

/** Three little strokes fanning out from a corner, like the design's sparkles. */
const Spark: React.FC<{ color: string; className: string }> = ({ color, className }) => (
  <svg
    viewBox="0 0 60 60"
    className={`absolute ${className}`}
    fill="none"
    stroke={color}
    strokeWidth={6}
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M10 50 L4 34" />
    <path d="M22 44 L34 24" />
    <path d="M30 54 L50 46" />
  </svg>
);

/** A curved arrow with a head at each end, drawn between two feature chips. */
const CurvedArrow: React.FC<{ color: string; d: string; className: string; viewBox: string }> = ({
  color,
  d,
  className,
  viewBox,
}) => {
  const id = useId();
  return (
    <svg
      viewBox={viewBox}
      className={`absolute overflow-visible ${className}`}
      fill="none"
      aria-hidden
    >
      <defs>
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path
            d="M1 1 L8 5 L1 9"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        markerStart={`url(#${id})`}
        markerEnd={`url(#${id})`}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
};

interface DesignChipProps extends ChipProps {
  /** Left, top, width and height in design pixels */
  box: [number, number, number, number];
  big?: boolean;
}

const DesignChip: React.FC<DesignChipProps> = ({
  icon: Icon,
  label,
  tone,
  delay,
  box: [left, top, width, height],
  big = true,
}) => (
  <div className="absolute" style={{ left, top, width, height }}>
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`flex h-full items-center rounded-[38px] ${tone.chip} ${big ? 'pl-[27px] pr-[24px]' : 'pl-[20px] pr-[14px]'} shadow-[0_0_34px_rgba(255,255,255,0.38),0_18px_40px_rgba(0,0,0,0.3)] ring-[3px] ring-white/80`}
    >
      <span
        className={`flex flex-shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br ${tone.tile} text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] ${
          big ? 'h-[86px] w-[86px]' : 'h-[78px] w-[78px]'
        }`}
      >
        <Icon className={big ? 'h-[44px] w-[44px]' : 'h-[40px] w-[40px]'} strokeWidth={2.1} />
      </span>
      <span
        className={`flex-1 font-bold leading-[1.24] ${NAVY} ${big ? 'ml-[27px] text-[26px]' : 'ml-[18px] text-[22.5px]'}`}
      >
        {label}
      </span>
      <ChevronRight
        className={`flex-shrink-0 ${tone.arrow} ${big ? 'h-[30px] w-[30px]' : 'h-[26px] w-[26px]'}`}
        strokeWidth={2.6}
      />
    </motion.div>
  </div>
);

/** Graphite bezel with the notch, 9:41 and the signal icons, in design pixels. */
const DesignPhone: React.FC<{ children: React.ReactNode; small?: boolean }> = ({
  children,
  small = false,
}) => (
  <div
    className={`h-full rounded-[72px] bg-gradient-to-br from-[#4A4F5A] via-[#1B1E25] to-[#2C3038] p-[13px] shadow-[0_50px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/25`}
  >
    <div className={`relative h-full overflow-hidden rounded-[60px] bg-white ${BENGALI}`}>
      <span
        aria-hidden
        className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[28px] bg-[#0B0C10] ${small ? 'h-[40px] w-[190px]' : 'h-[46px] w-[240px]'}`}
      />
      <div
        className={`flex items-center justify-between font-semibold text-slate-900 ${small ? 'px-[44px] pt-[22px] text-[17px]' : 'px-[56px] pt-[26px] text-[20px]'}`}
      >
        <span>9:41</span>
        <span className="flex items-center gap-[6px]" aria-hidden>
          <span className="flex items-end gap-[2px]">
            {[6, 9, 12, 15].map((h) => (
              <span key={h} className="w-[4px] rounded-sm bg-slate-900" style={{ height: h }} />
            ))}
          </span>
          <svg viewBox="0 0 20 14" className="h-[15px] w-[21px]" fill="#0f172a">
            <path d="M10 13.5 L6.6 9.6a4.8 4.8 0 0 1 6.8 0Z M3.6 6.9a9 9 0 0 1 12.8 0l-1.5 1.6a6.8 6.8 0 0 0-9.8 0Z M.5 3.9a13.4 13.4 0 0 1 19 0L18 5.5a11.2 11.2 0 0 0-16 0Z" />
          </svg>
          <span className="h-[14px] w-[28px] rounded-[4px] border-2 border-slate-900 p-[1.5px]">
            <span className="block h-full w-[80%] rounded-[1.5px] bg-slate-900" />
          </span>
        </span>
      </div>
      {children}
    </div>
  </div>
);

const MOCK_OPTIONS = ['লর্ড কর্নওয়ালিস', 'লর্ড ওয়েলেসলি', 'লর্ড ডালহৌসি', 'লর্ড ক্যানিং'];

const DesignMockTestPhone: React.FC = () => {
  const time = useTicker(28 * 60 + 17);
  const dark = useTheme().resolvedTheme === 'dark';
  return (
    <DesignPhone>
      <div className="mt-[24px] flex items-center justify-between px-[46px]">
        <span className={`flex items-center gap-[14px] text-[26px] font-bold ${NAVY}`}>
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white">
            <ClipboardCheck className="h-[28px] w-[28px]" />
          </span>
          Mock Test
        </span>
        <span className={`flex items-center gap-[8px] text-[21px] font-bold tabular-nums ${NAVY}`}>
          <Timer className="h-[27px] w-[27px] text-[#1D4ED8]" strokeWidth={2.4} />
          {time}
        </span>
      </div>
      <div className="mx-[46px] mt-[24px] h-[7px] overflow-hidden rounded-full bg-[#E6EAF2]">
        <div className="h-full w-[25%] rounded-full bg-[#1D63F0]" />
      </div>

      <p className="mt-[20px] px-[46px] text-[20px] font-semibold text-[#1D63F0]">
        Question 12 of 50
      </p>
      <p
        className={`mt-[10px] px-[42px] text-[22.5px] font-semibold leading-snug tracking-[-0.01em] ${NAVY}`}
      >
        ভারতের প্রথম গভর্নর জেনারেল কে ছিলেন?
      </p>

      <div className="mt-[18px] space-y-[12px] px-[38px]">
        {MOCK_OPTIONS.map((label, i) => {
          const correct = i === 2;
          return (
            <motion.div
              key={label}
              initial={
                correct
                  ? dark
                    ? DARK_OPTION.idle
                    : { backgroundColor: '#FFFFFF', borderColor: '#E3E8F0' }
                  : false
              }
              whileInView={
                correct
                  ? dark
                    ? DARK_OPTION.picked
                    : { backgroundColor: '#DDF6E2', borderColor: '#8FE3A6' }
                  : undefined
              }
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.4 }}
              className="flex h-[72px] items-center gap-[20px] rounded-[16px] border-2 border-[#E3E8F0] bg-white px-[16px] shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
            >
              <span
                className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full text-[20px] font-bold ${
                  correct ? 'bg-[#16A34A] text-white' : `bg-[#EEF1F7] ${NAVY}`
                }`}
              >
                {'ABCD'[i]}
              </span>
              <span className={`flex-1 text-[24px] font-medium ${NAVY}`}>{label}</span>
              {correct && (
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 1.3 }}
                >
                  <Check className="h-[30px] w-[30px] text-[#16A34A]" strokeWidth={3} />
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-[16px] flex h-full items-start gap-[18px] border-t border-[#EEF1F6] bg-[#F7F9FC] px-[38px] pt-[22px]">
        <Bookmark
          className={`mt-[20px] h-[34px] w-[34px] flex-shrink-0 ${NAVY}`}
          strokeWidth={2.2}
        />
        <span
          className={`flex h-[70px] flex-1 items-center justify-center rounded-[16px] border-2 border-[#E3E8F0] bg-white text-[22px] font-bold ${NAVY}`}
        >
          Previous
        </span>
        <span className="flex h-[70px] w-[142px] items-center justify-center rounded-[16px] bg-[#0B63F3] text-[22px] font-bold text-white shadow-[0_10px_22px_rgba(11,99,243,0.35)]">
          Next
        </span>
      </div>
    </DesignPhone>
  );
};

const SOLUTION_POINTS = [
  'লর্ড ডালহৌসি (1848–1856) ভারতের গভর্নর জেনারেল ছিলেন।',
  "তিনি 'ডকট্রিন অব ল্যাপস' (Doctrine of Lapse) চালু করেন।",
  'তাঁর শাসনামলে রেল, টেলিগ্রাফ ইত্যাদি অনেক গুরুত্বপূর্ণ পরিবর্তন স্থাপিত হয়।',
];

const DesignSolutionPhone: React.FC = () => (
  <DesignPhone>
    {/* Narrower text column: the mock test phone covers its left edge and the chips its right */}
    <div className="pl-[24px] pr-[60px]">
      <div className="mt-[30px] flex items-center gap-[22px] px-[30px]">
        <ArrowLeft className="h-[30px] w-[30px] text-[#1D63F0]" strokeWidth={2.6} />
        <span className={`text-[24px] font-bold ${NAVY}`}>Solution</span>
      </div>
      <div className="mt-[6px] flex justify-end px-[30px]">
        <span className="flex h-[30px] w-[26px] items-center justify-center rounded-[7px] bg-[#1D63F0] text-white">
          <Bookmark className="h-[16px] w-[16px]" strokeWidth={2.6} />
        </span>
      </div>

      <div className="mx-[18px] mt-[8px] flex items-center gap-[10px] rounded-[12px] bg-[#D8F5DE] px-[12px] py-[14px]">
        <CheckCircle2
          className="h-[34px] w-[34px] flex-shrink-0 fill-[#16A34A] text-white"
          strokeWidth={2.4}
        />
        <span className="whitespace-nowrap text-[20px] font-semibold text-[#15803D]">
          সঠিক উত্তর: লর্ড ডালহৌসি
        </span>
      </div>

      <div className="mx-[20px] mt-[14px] rounded-[12px] bg-[#E6EFFB] px-[16px] py-[14px]">
        <span
          className={`border-b-2 border-[#1D63F0]/50 pb-[2px] text-[20px] font-semibold ${NAVY}`}
        >
          সংক্ষিপ্ত আলোচনা
        </span>
      </div>

      <ul
        className={`mt-[12px] space-y-[6px] pl-[26px] pr-[30px] text-[19px] leading-[1.55] ${NAVY}`}
      >
        {SOLUTION_POINTS.map((point) => (
          <li key={point} className="flex gap-[12px]">
            <span className="mt-[13px] h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[#0B1B4F]" />
            {point}
          </li>
        ))}
      </ul>
      <p className={`mt-[14px] pl-[26px] pr-[40px] text-[19px] leading-[1.55] ${NAVY}`}>
        তিনি ভারতের প্রশাসনিক কাঠামো আরও কেন্দ্রীভূত করেন।
      </p>
    </div>
  </DesignPhone>
);

const DesignCanvas: React.FC = () => {
  const [ref, scale] = useFitScale();
  return (
    <div
      ref={ref}
      className="relative aspect-[1680/937] overflow-hidden rounded-[32px] bg-[#120F2A]"
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
      >
        <Background tint="from-[#2B1A5E]/30 via-[#1E1446]/25 to-[#140C30]/40" />
        {/* Warm desk edge along the bottom, out of focus like the design */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-b from-transparent via-[#5A3A2A]/45 to-[#8A5A3C]/80 blur-[10px]"
        />

        {/* Solution phone, tilted right and tucked behind the mock test */}
        <div className="absolute left-[985px] top-[250px] h-[1000px] w-[480px] origin-top-left rotate-[6deg]">
          <motion.div className="h-full" {...rise(0.25)}>
            <DesignSolutionPhone />
          </motion.div>
        </div>

        {/* Mock test phone, tilted left, running off the bottom edge */}
        <div className="absolute left-[448px] top-[165px] h-[1000px] w-[500px] origin-top-left -rotate-[4deg]">
          <motion.div className="h-full" {...rise()}>
            <DesignMockTestPhone />
          </motion.div>
        </div>

        <DesignChip
          icon={BookOpen}
          label="Topic-wise Practice"
          tone={TONES.blue}
          delay={0}
          box={[55, 260, 370, 120]}
        />
        <DesignChip
          icon={ClipboardCheck}
          label="Full Mock Tests"
          tone={TONES.red}
          delay={0.6}
          box={[53, 402, 377, 121]}
        />
        <DesignChip
          icon={FileText}
          label="Previous Year Questions"
          tone={TONES.amber}
          delay={1.2}
          box={[50, 545, 385, 125]}
        />
        <DesignChip
          icon={FilePenLine}
          label="Detailed Solutions"
          tone={TONES.purple}
          delay={0.3}
          box={[1358, 335, 287, 115]}
          big={false}
        />
        <DesignChip
          icon={ChartNoAxesColumn}
          label="Track Your Progress"
          tone={TONES.green}
          delay={0.9}
          box={[1358, 545, 287, 120]}
          big={false}
        />

        <Spark color="#38BDF8" className="left-[42px] top-[205px] h-[44px] w-[44px] -scale-x-100" />
        <Spark
          color="#FACC15"
          className="left-[372px] top-[191px] h-[58px] w-[58px] rotate-[-80deg]"
        />
        <Spark
          color="#A855F7"
          className="left-[1590px] top-[284px] h-[56px] w-[56px] rotate-[-80deg]"
        />

        <CurvedArrow
          color="#FBBF24"
          viewBox="0 0 130 70"
          d="M8 8 Q 40 78 122 42"
          className="left-[326px] top-[685px] h-[70px] w-[130px]"
        />
        <CurvedArrow
          color="#F59E0B"
          viewBox="0 0 70 50"
          d="M6 44 Q 50 44 62 6"
          className="left-[1400px] top-[460px] h-[50px] w-[70px]"
        />
        <CurvedArrow
          color="#2F80FF"
          viewBox="0 0 100 80"
          d="M6 72 Q 80 64 92 6"
          className="left-[1330px] top-[680px] h-[80px] w-[100px]"
        />

        {/* Faint dot grid beside the progress chip */}
        <div
          aria-hidden
          className="absolute left-[1345px] top-[785px] h-[60px] w-[60px] opacity-40 [background-image:radial-gradient(#93C5FD_2px,transparent_2.5px)] [background-size:15px_15px]"
        />
      </div>
    </div>
  );
};

export const AppShowcase: React.FC = () => (
  <>
    {/* Tablet and desktop: the design, built to its own measurements */}
    <Reveal variants={fadeUp} className="relative mt-10 hidden md:block">
      <DesignCanvas />
    </Reveal>

    {/* Phones: the canvas's text would be too small, so the same pieces are stacked */}
    <Reveal
      variants={fadeUp}
      className="relative mt-10 overflow-hidden rounded-[32px] bg-[#120F2A] md:hidden"
    >
      <Background />
      <div className="relative px-5 pt-8">
        <div className="relative flex h-[500px] justify-center overflow-hidden">
          <div className="[transform:perspective(1400px)_rotateY(10deg)_rotate(-3deg)]">
            <motion.div {...rise()}>
              <MockTestPhone />
            </motion.div>
          </div>
        </div>
        <div className="relative grid gap-3 pt-6 pb-8">
          <FeatureChip icon={BookOpen} label="Topic-wise Practice" tone={TONES.blue} delay={0} />
          <FeatureChip icon={ClipboardCheck} label="Full Mock Tests" tone={TONES.red} delay={0.6} />
          <FeatureChip
            icon={FileText}
            label="Previous Year Questions"
            tone={TONES.amber}
            delay={1.2}
          />
          <FeatureChip
            icon={FilePenLine}
            label="Detailed Solutions"
            tone={TONES.purple}
            delay={0.3}
          />
          <FeatureChip
            icon={ChartNoAxesColumn}
            label="Track Your Progress"
            tone={TONES.green}
            delay={0.9}
          />
        </div>
      </div>
    </Reveal>
  </>
);
