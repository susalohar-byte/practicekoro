import React, { useState, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  // Keep the page from scrolling behind the full-screen mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Exams', href: '#exams' },
    { name: 'Features', href: '#why-pk' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Plans', href: '#pricing' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const cta = (className: string, onClick?: () => void) =>
    signedIn && !isAdmin ? (
      // The student panel is a separate app, so this is a full page load
      <a href={studentPanelUrl('home')} onClick={onClick} className={className}>
        <span>Dashboard</span>
        <ArrowRight className="w-4 h-4" />
      </a>
    ) : (
      <Link to={signedIn ? '/admin' : '/login'} onClick={onClick} className={className}>
        <span>{signedIn ? 'Dashboard' : 'Get Started'}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    );

  return (
    <>
      {/* Floating pill bar, it tightens up a little once the page scrolls */}
      <header className={`fixed inset-x-0 top-0 z-40 flex justify-center px-3 sm:px-4 transition-all duration-300 ${isScrolled ? 'pt-2.5' : 'pt-4 sm:pt-5'}`}>
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`flex w-full max-w-5xl items-center justify-between rounded-full bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5 pl-2 pr-2 sm:pr-2.5 transition-all duration-300 ${
            isScrolled ? 'py-1.5 shadow-xl shadow-slate-900/10' : 'py-2 shadow-lg shadow-slate-900/20'
          }`}
        >
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <motion.span
              className="block"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.3 }}
            >
              <BrandMark className="w-9 h-9 sm:w-10 sm:h-10" />
            </motion.span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#0B1B4F]">Practice Koro</span>
          </a>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                whileHover={{ scale: 1.05 }}
                className="px-3 lg:px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {link.name}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <motion.div
              className="hidden sm:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              {cta(CTA_CLASS)}
            </motion.div>
            <motion.button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              whileTap={{ scale: 0.9 }}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
      </header>

      {/* Full-screen mobile menu sliding in from the right */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-white px-6 pt-6 md:hidden"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <BrandMark className="w-9 h-9" />
                <span className="text-lg font-bold tracking-tight text-[#0B1B4F]">Practice Koro</span>
              </span>
              <motion.button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            <div className="mt-10 flex flex-col space-y-6">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.08 + 0.1 }}
                  className="text-lg font-semibold text-[#0B1B4F]"
                >
                  {link.name}
                </motion.a>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.5 }}
                className="pt-6"
              >
                {cta(`${CTA_CLASS} w-full justify-center !py-3.5 !text-base`, () => setMobileMenuOpen(false))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
