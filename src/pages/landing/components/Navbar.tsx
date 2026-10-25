import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <div
    className={`${className} rounded-xl bg-gradient-to-br from-[#2F7BFF] to-[#1450F0] shadow-md shadow-blue-600/30 flex items-center justify-center p-2 text-white flex-shrink-0`}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" fill="currentColor" />
      <path d="M8.5 11h1M12 11h3.5M8.5 15h1M12 15h3.5" />
    </svg>
  </div>
);

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-blue-600/30 ring-1 ring-white/20 transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
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
