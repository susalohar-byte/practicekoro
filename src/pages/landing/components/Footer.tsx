import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Crown, Heart, Send } from 'lucide-react';
import { GooglePlayBadge, AppStoreBadge } from './AppStoreBadges';

interface FooterProps {
  onIosClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onIosClick }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#07132B] text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand & Bengali Description (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center p-2 text-white shadow-md shadow-blue-500/25">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-full h-full text-white"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>
              <span className="text-xl font-black text-white tracking-tight font-headline">
                Practice <span className="text-blue-400">Koro</span>
              </span>
            </div>

            {/* Bengali Tagline matching reference */}
            <p className="text-xs sm:text-sm text-slate-300 font-medium font-headline leading-relaxed">
              স্বপ্নের সরকারি চাকরির প্রস্তুতি এখন আরও সহজ, আরও স্মার্ট!
            </p>

            <p className="text-[11px] text-slate-400 leading-relaxed font-headline">
              পশ্চিমবঙ্গের ডব্লুবিপি, ক্লার্কশিপ, স্কুল সার্ভিস, রেল ও এসএসসি পরীক্ষার জন্য উচ্চমানের মক টেস্ট ও প্র্যাকটিস প্ল্যাটফর্ম।
            </p>

            {/* Social Media Circular Badges matching reference */}
            <div className="flex items-center gap-2.5 pt-2">
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-[#E50914] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Telegram */}
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="w-9 h-9 rounded-full bg-[#229ED9] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (2.5 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white font-headline tracking-wide uppercase">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" className="hover:text-blue-400 transition-colors">Home</a>
              </li>
              <li>
                <a href="#exams" className="hover:text-blue-400 transition-colors">Exams</a>
              </li>
              <li>
                <a href="#why-pk" className="hover:text-blue-400 transition-colors">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-blue-400 transition-colors">Reviews</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
              </li>
              <li className="pt-1">
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  Login / Sign In →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal (2.5 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white font-headline tracking-wide uppercase">
              Support
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="hover:text-blue-400 cursor-pointer">Help Center</span>
              </li>
              <li>
                <span className="hover:text-blue-400 cursor-pointer">Contact Us</span>
              </li>
              <li>
                <span className="hover:text-blue-400 cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-blue-400 cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-blue-400 cursor-pointer">Refund Policy</span>
              </li>
              <li className="pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  <span>Admin & Student Sign In</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Get The App & Mascot (3 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-bold text-white font-headline tracking-wide uppercase">
              Get The App
            </h3>
            
            <div className="flex flex-col gap-2.5">
              <GooglePlayBadge size="sm" />
              <AppStoreBadge size="sm" onIosClick={onIosClick} />
            </div>

            {/* Mascot in Footer matching reference image */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 p-1 flex-shrink-0 border border-slate-700/60 overflow-hidden">
                <img
                  src="/images/footer_mascot_hd.png"
                  alt="Mascot with Backpack"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-sky-400 font-headline block">
                  Same Study, Bigger Dreams!
                </span>
                <span className="text-[10px] text-slate-400">
                  Join 10,000+ West Bengal Aspirants today.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-Footer Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          {/* Brand Philosophy */}
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">Practice Koro</span>
            <span className="text-slate-500">•</span>
            <span>Learn • Practice • Improve • Grow</span>
          </div>

          {/* Copyright & Made with Love */}
          <div className="text-center sm:text-right space-y-1">
            <p>© 2026 Practice Koro. All rights reserved.</p>
            <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-end gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-current inline" />
              <span>for every aspirant in West Bengal.</span>
            </p>
          </div>

          {/* Back to top button */}
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-700/60"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

        </div>

      </div>
    </footer>
  );
};
