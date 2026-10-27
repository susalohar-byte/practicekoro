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

/** A logo the admin uploaded, linked or picked as a preset in the exam's icon field. */
function customLogo(iconName: string): string | null {
  if (/^(data:|https?:\/\/|blob:|\/)/.test(iconName)) return iconName;
  // A bare preset file name such as "images/exams/logo_wbp.png" is a path on the main site.
  if (/\.(png|svg|webp)$/i.test(iconName)) return `/${iconName}`;
  return null;
}

/**
 * Same choice as the admin console's getOfficialExamLogoUrl (ExamEmblemBadge), so students see
 * the logo the admin sees: the uploaded or preset logo if there is one, else the board's official
 * emblem picked from the title and icon key. WBSSC is matched before SSC and WBP, and WBPSC
 * (Food SI, ICDS, Clerkship) before WBP.
 */
export function examLogoSrc(title: string | null | undefined, iconName?: string | null): string {
  const icon = (iconName ?? '').trim();
  const custom = icon ? customLogo(icon) : null;
  if (custom) return custom;
  const n = `${title ?? ''} ${icon}`.toLowerCase();
  const has = (...k: string[]) => k.some((x) => n.includes(x));
  if (has('kolkata', 'kp')) return asset('exam-art/logo_kp.png');
  if (has('wbssc', 'school service') || icon === 'School') return asset('exam-art/emblem_wbssc.png');
  if (has('tet', 'primary', 'slst', 'ctet', 'teacher')) return asset('exam-art/logo_wbtet.png');
  if (has('railway', 'rrb', 'ntpc', 'group d', 'alp') || icon === 'Train') return asset('exam-art/logo_railway.png');
  if (has('ssc', 'cgl', 'chsl', 'mts', 'gd')) return asset('exam-art/logo_ssc.png');
  if (has('wbpsc', 'clerkship', 'wbcs', 'food', 'icds', 'civil', 'psc')) return asset('exam-art/logo_wbpsc.png');
  if (has('wbp', 'police', 'constable', 'sub-inspector', 'sergeant') || icon === 'Shield') return asset('exam-art/logo_wbp.png');
  return asset('exam-art/logo_wbpsc.png');
}

export function ExamLogo({ title, iconUrl, size = 48, className }: { title: string; iconUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = examLogoSrc(title, iconUrl);
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
