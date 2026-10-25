import React, { useState, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { studentPanelUrl } from '@/lib/studentPanel';

const CTA_CLASS =
  'inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-blue-600/30 ring-1 ring-white/20 transition-all';

/** The Practice Koro logo (checklist sheets on blue), drawn as a full circle. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" className={`${className} flex-shrink-0 rounded-full shadow-md shadow-blue-600/30`} role="img" aria-label="Practice Koro">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00A8FF" />
          <stop offset="0.45" stopColor="#0A6CFF" />
          <stop offset="1" stopColor="#0050FF" />
        </linearGradient>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#9DBEFF" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0033AA" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-bg)`} />
      {/* Sheet behind, tilted */}
      <rect x="22" y="27" width="40" height="50" rx="4.5" fill={`url(#${id}-back)`} transform="rotate(-11 42 52)" filter={`url(#${id}-shadow)`} />
      {/* Front sheet with a folded corner */}
      <path d="M38 30.5 H64.5 L76 42 V73.5 Q76 79 70.5 79 H38 Q32.5 79 32.5 73.5 V36 Q32.5 30.5 38 30.5 Z" fill="#FFFFFF" filter={`url(#${id}-shadow)`} />
      <path d="M64.5 30.5 V38.5 Q64.5 42 68 42 H76 Z" fill="#B9D0FF" />
      <circle cx="42.5" cy="45" r="4.4" fill="none" stroke="#26324A" strokeWidth="2" />
      <circle cx="42.5" cy="56.5" r="5" fill="#0B5BFF" />
      <path d="M40.2 56.6 L42 58.4 L45 54.8" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="42.5" cy="68" r="4.4" fill="none" stroke="#26324A" strokeWidth="2" />
      <path d="M52 45 H67.5" stroke="#8798B3" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M52 56.5 H67.5" stroke="#0B5BFF" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M52 68 H67.5" stroke="#8798B3" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
};

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const signedIn = !loading && !!user;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Exams', href: '#exams' },
    { name: 'Features', href: '#why-pk' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Over the hero scene the bar is transparent with white text, once scrolled it turns white
  const solid = isScrolled || mobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        solid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-2.5' : 'bg-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <BrandMark className="w-10 h-10 sm:w-[46px] sm:h-[46px] transition-transform group-hover:scale-105" />
          <span className={`text-lg sm:text-xl font-bold tracking-tight ${solid ? 'text-[#0B1B4F]' : 'text-white drop-shadow'}`}>
            Practice Koro
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`text-sm font-semibold transition-colors cursor-pointer ${
                solid ? 'text-slate-700 hover:text-blue-600' : 'text-white/95 hover:text-white drop-shadow'
              }`}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn && !isAdmin ? (
            // The student panel is a separate app, so this is a full page load
            <a href={studentPanelUrl('home')} className={CTA_CLASS}>
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <Link to={signedIn ? '/admin' : '/login'} className={CTA_CLASS}>
              <span>{signedIn ? 'Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              solid ? 'bg-slate-100 text-slate-700' : 'bg-white/15 text-white backdrop-blur'
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white px-4 pt-3 pb-5 border-b border-slate-200 animate-fadeIn">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
