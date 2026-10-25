import React from 'react';
import { GooglePlayBadge, AppStoreBadge } from './AppStoreBadges';

interface AppDownloadBannerProps {
  onIosClick: () => void;
}

export const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({ onIosClick }) => {
  return (
    <section className="pt-4 pb-10 sm:pb-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl shadow-[0_10px_30px_rgba(30,80,200,0.12)] bg-[#DCEBFB] bg-[url('/images/landing/cta_banner_bg.jpg')] bg-cover bg-[72%_center] md:bg-center md:aspect-[800/190] min-h-[300px] md:min-h-0">
          {/* On narrow screens the boy sits behind the text, so lighten that side */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-r from-white/85 via-white/70 to-transparent" aria-hidden />

          <div className="relative h-full flex flex-col justify-center items-start md:items-center md:w-[71%] pl-5 pr-[36%] sm:px-10 py-8 md:py-0 text-left md:text-center">
            <h2 className="text-[22px] sm:text-[34px] lg:text-[42px] font-extrabold leading-[1.1] tracking-tight text-[#0B1B4F]">
              <span className="text-[#1A5CFF]">Start</span> Your Preparation
              <br />
              Today
            </h2>
            <p className="mt-3 text-sm sm:text-base lg:text-lg text-[#2A3452] font-medium max-w-[22rem]">
              Practice Koro-এর সাথে প্রস্তুতি হোক আরও সহজ, আরও স্মার্ট!
            </p>
            <div className="mt-5 lg:mt-6 flex flex-wrap items-center gap-3 lg:gap-4">
              <GooglePlayBadge size="md" />
              <AppStoreBadge size="md" onIosClick={onIosClick} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
