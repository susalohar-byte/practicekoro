import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { GooglePlayBadge, AppStoreBadge } from './AppStoreBadges';

interface AppDownloadBannerProps {
  onIosClick: () => void;
}

export const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({ onIosClick }) => {
  return (
    <section className="py-10 sm:py-14 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sky-blue Banner Container matching reference image */}
        <div className="relative bg-gradient-to-r from-[#D8EDFC] via-[#E4F2FD] to-[#CDE8FB] rounded-3xl sm:rounded-[36px] p-6 sm:p-10 md:p-12 border border-blue-200/80 shadow-lg shadow-blue-500/5 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          
          {/* Subtle Background Landmark Doodles / Silhouettes (Howrah Bridge, Victoria Memorial) */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-end">
            <svg
              className="w-full h-28 text-blue-600"
              viewBox="0 0 1200 120"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              {/* Stylized Howrah Bridge & Skyline Silhouette */}
              <path d="M0,120 L0,100 L50,100 L100,50 L110,50 L160,100 L300,100 L350,40 L365,40 L415,100 L550,100 L600,60 L620,60 L670,100 L800,100 L850,30 L865,30 L915,100 L1100,100 L1150,70 L1200,100 L1200,120 Z" />
            </svg>
          </div>

          {/* Left / Middle Text & Action Buttons */}
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-headline">
              Start Your Preparation Today
            </h2>

            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-700 font-medium font-headline leading-relaxed">
              Practice Koro-এর সাথে প্রস্তুতি হোক আরও সহজ, আরও স্মার্ট!
            </p>

            {/* Action Buttons: Start Practicing + Store Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {/* Start Practicing Button linking directly to /login */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/30 hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Start Practicing</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Google Play Store Badge */}
              <GooglePlayBadge size="sm" />

              {/* Apple App Store Badge */}
              <AppStoreBadge size="sm" onIosClick={onIosClick} />
            </div>

            {/* App release specs */}
            <div className="mt-3 text-[11px] text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Android APK v2.0 Live (70 MB) • iOS App in Private Beta</span>
            </div>
          </div>

          {/* Right Waving Student Mascot with Crown Doodle matching reference */}
          <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
            {/* Mascot Image */}
            <div className="relative w-44 sm:w-56 md:w-64">
              <img
                src="/images/mascot_waving_hd.png"
                alt="Practice Koro Friendly Mascot"
                className="w-full h-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
