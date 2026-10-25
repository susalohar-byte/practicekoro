import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminBannerItem } from './bannersUtils';

// ============================================================================
// HIGH-FIDELITY BANNER GRAPHIC COMPONENT (PROPER BACKGROUND PLACEMENT)
// ============================================================================

export interface BannerVisualProps {
  banner: AdminBannerItem;
  className?: string;
  isHero?: boolean;
}

export const BannerVisual: React.FC<BannerVisualProps> = ({
  banner,
  className = '',
  isHero = false,
}) => {
  // Check if image is an uploaded base64 data URL or custom URL
  const isCustomUploaded =
    banner.imageUrl &&
    (banner.imageUrl.startsWith('data:') ||
      banner.imageUrl.startsWith('blob:') ||
      banner.imageUrl.startsWith('http'));

  if (isCustomUploaded) {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none bg-slate-900', className)}
      >
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  const normTitle = (banner.title || '').toLowerCase();

  // 1. WBP Mock Test Banner (Exact background image placement with Victoria Memorial & deep navy blue)
  if (normTitle.includes('wbp') || banner.id === 'banner-1') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 19, 45, 0.96) 0%, rgba(10, 32, 85, 0.88) 46%, rgba(6, 19, 45, 0.55) 100%), url('/images/exam_wbp_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#071630',
        }}
      >
        {/* Subtle background tech grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10">
          {/* Left Content */}
          <div className="flex flex-col justify-center max-w-[62%]">
            <div className="leading-tight">
              <span
                className={cn(
                  'font-black tracking-wider text-white block uppercase',
                  isHero ? 'text-2xl sm:text-3xl' : 'text-xs'
                )}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
              >
                WBP
              </span>
              <span
                className={cn(
                  'font-black tracking-wider text-white block uppercase',
                  isHero ? 'text-2xl sm:text-3xl' : 'text-xs'
                )}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
              >
                MOCK TEST
              </span>
            </div>

            <p
              className={cn(
                'text-[#FDE047] font-medium leading-none mt-1',
                isHero ? 'text-xs sm:text-sm' : 'text-[8.5px]'
              )}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              সম্পূর্ণ প্রস্তুতি এখন এক প্ল্যাটফর্মে
            </p>

            <div className="mt-2">
              <span
                className={cn(
                  'inline-flex items-center font-bold text-slate-900 bg-[#FACC15] rounded-full shadow-md',
                  isHero ? 'text-xs px-3.5 py-1' : 'text-[7.5px] px-2 py-0.5'
                )}
              >
                {banner.ctaText || 'এখনই শুরু করুন →'}
              </span>
            </div>
          </div>

          {/* Right Shield Badge */}
          <div className="relative flex items-center justify-center shrink-0 pr-1">
            <div
              className={cn(
                'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-slate-950 font-black rounded-lg border-2 border-yellow-200 shadow-xl flex items-center justify-center',
                isHero ? 'px-3 py-1.5 text-sm gap-1' : 'px-1.5 py-0.5 text-[7px] gap-0.5'
              )}
            >
              <span>★</span>
              <span>100+</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Special Offer Banner (Vibrant Coral/Orange)
  if (normTitle.includes('special offer') || banner.id === 'banner-2') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(217, 72, 15, 0.95) 0%, rgba(234, 88, 12, 0.85) 55%, rgba(225, 29, 72, 0.6) 100%), url('/images/promo_student.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#EA580C',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black block uppercase tracking-wide',
                isHero ? 'text-2xl sm:text-3xl' : 'text-xs'
              )}
            >
              এখনই শুরু
            </span>
            <span
              className={cn('font-black text-[#FEF08A] block', isHero ? 'text-3xl' : 'text-sm')}
            >
              99 টাকায়
            </span>
            <p className={cn('text-orange-100', isHero ? 'text-xs mt-1' : 'text-[8px]')}>
              অফার সীমিত সময়ের জন্য
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. General Science Banner (Emerald Green)
  if (normTitle.includes('science') || banner.id === 'banner-3') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 78, 59, 0.95) 0%, rgba(5, 150, 105, 0.85) 55%, rgba(4, 120, 87, 0.6) 100%), url('/images/exam_hero_banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#059669',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span className={cn('font-black tracking-wide block', isHero ? 'text-2xl' : 'text-xs')}>
              General Science
            </span>
            <span
              className={cn('font-bold text-[#A7F3D0] block', isHero ? 'text-sm' : 'text-[9px]')}
            >
              সম্পূর্ণ Topic Test
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Full Mock Series Banner (Indigo / Violet)
  if (normTitle.includes('full mock') || banner.id === 'banner-4') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.85) 55%, rgba(67, 56, 202, 0.6) 100%), url('/images/hero_student_illustration.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#312E81',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black tracking-wider block uppercase',
                isHero ? 'text-2xl' : 'text-xs'
              )}
            >
              FULL MOCK TEST
            </span>
            <span
              className={cn(
                'font-semibold text-indigo-200 block',
                isHero ? 'text-sm' : 'text-[9px]'
              )}
            >
              FULL MOCK TEST
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Brand Banner (Amber / Gold)
  if (normTitle.includes('brand') || banner.id === 'banner-5') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(120, 53, 15, 0.95) 0%, rgba(180, 83, 9, 0.85) 55%, rgba(217, 119, 6, 0.6) 100%), url('/images/student.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#B45309',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span className={cn('font-black block', isHero ? 'text-2xl' : 'text-xs')}>
              সাফল্যের গল্প
            </span>
            <span
              className={cn('font-bold text-[#FDE68A] block', isHero ? 'text-sm' : 'text-[9px]')}
            >
              PracticeKoro
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 6. PYQ Banner (Crimson / Red)
  if (normTitle.includes('pyq') || banner.id === 'banner-6') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(136, 19, 55, 0.95) 0%, rgba(190, 18, 60, 0.85) 55%, rgba(225, 29, 72, 0.6) 100%), url('/images/card_pyq.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#BE123C',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black block uppercase tracking-wide',
                isHero ? 'text-2xl' : 'text-xs'
              )}
            >
              PYQ
            </span>
            <span
              className={cn('font-semibold text-rose-100 block', isHero ? 'text-sm' : 'text-[9px]')}
            >
              Previous Year Questions
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for custom or other banners
  if (banner.imageUrl) {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none bg-slate-900', className)}
      >
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden select-none bg-gradient-to-r from-blue-900 to-indigo-800 text-white flex items-center justify-between px-3.5 py-2',
        className
      )}
    >
      <div className="z-10">
        <h4 className={cn('font-bold', isHero ? 'text-xl' : 'text-xs')}>{banner.title}</h4>
        <p className={cn('text-blue-200', isHero ? 'text-xs' : 'text-[8px]')}>{banner.subtitle}</p>
      </div>
      <div className="shrink-0">
        <ImageIcon className={cn('text-blue-300 opacity-60', isHero ? 'w-12 h-12' : 'w-5 h-5')} />
      </div>
    </div>
  );
};
