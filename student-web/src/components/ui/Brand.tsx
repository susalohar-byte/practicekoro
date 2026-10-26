import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

/** The official PracticeKoro wordmark (logo-transparent.png from the app). */
export function Wordmark({ className }: { className?: string }) {
  return <img src={asset('brand/logo-transparent.png')} alt="PracticeKoro" className={cn('h-8 w-auto object-contain', className)} />;
}

export function LogoIcon({ className }: { className?: string }) {
  return <img src={asset('brand/logo-icon.png')} alt="" aria-hidden className={cn('h-9 w-9 rounded-xl object-cover', className)} />;
}

/** ExamAssets.getRoundIconAsset — keyword match on the exam title (WBPSC before WBP). */
export function examLogoPath(title: string | null | undefined): string {
  const n = (title ?? '').toLowerCase().trim();
  const has = (...k: string[]) => k.some((x) => n.includes(x));
  if (has('wbpsc', 'psc', 'civil service', 'wbcs')) return 'exam-art/logo_wbpsc.png';
  if (has('wbp', 'police', 'constable')) return 'exam-art/logo_wbp.png';
  if (has('kp', 'kolkata police')) return 'exam-art/logo_kp.png';
  if (has('wbssc', 'group c', 'group d', 'clerk')) return 'exam-art/emblem_wbssc.png';
  if (has('railway', 'rrb', 'ntpc', 'alp')) return 'exam-art/logo_railway.png';
  if (has('ssc', 'cgl', 'chsl', 'mts', 'gd')) return 'exam-art/logo_ssc.png';
  if (has('tet', 'primary', 'teacher')) return 'exam-art/logo_wbtet.png';
  if (has('food', 'icds')) return 'exam-art/header_icon_wb.png';
  if (has('bank', 'ibps', 'sbi')) return 'exam-art/header_icon_central.png';
  return 'exam-art/logo_wbp.png';
}

export function ExamLogo({ title, iconUrl, size = 48, className }: { title: string; iconUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = iconUrl && /^https?:\/\//.test(iconUrl) ? iconUrl : asset(examLogoPath(title));
  if (failed) {
    return (
      <span
        className={cn('flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary', className)}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Landmark style={{ width: size * 0.52, height: size * 0.52 }} />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** UserAvatar: profile photo, else the initial on a soft blue circle. */
export function Avatar({ url, name, size = 36, className }: { url?: string | null; name?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const show = url && !failed;
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] font-bold text-primary', className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {show ? (
        <img src={url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden>{initials(name || 'Student').slice(0, 1)}</span>
      )}
    </span>
  );
}
