import React from 'react';
import { ArrowUp, Heart } from 'lucide-react';
import { GooglePlayBadge, AppStoreBadge } from './AppStoreBadges';
import { BrandMark } from './Navbar';

interface FooterProps {
  onIosClick: () => void;
}

const SOCIALS = [
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    bg: 'bg-[#FF0000]',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z',
    rounded: 'rounded-lg',
  },
  {
    name: 'Telegram',
    href: 'https://t.me',
    bg: 'bg-[#29A9EB]',
    path: 'M9.8 15.3l-.4 4.2c.5 0 .8-.2 1-.5l2.5-2.4 5.1 3.8c.9.5 1.6.2 1.8-.9l3.3-15.5c.3-1.3-.5-1.9-1.4-1.5L2.4 9.4c-1.3.5-1.3 1.3-.2 1.6l5 1.6L18.8 6c.5-.3 1-.2.6.2L9.8 15.3z',
    rounded: 'rounded-full',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    bg: 'bg-[#1877F2]',
    path: 'M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.2-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z',
    rounded: 'rounded-full',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    bg: 'bg-[radial-gradient(circle_at_30%_110%,#FDD256_0%,#F9423F_45%,#C434B6_70%,#5B4FE8_100%)]',
    path: 'M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17 5.8a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1C8.9 3.6 9.3 3.6 12 3.6z',
    rounded: 'rounded-full',
  },
];

const QUICK_LINKS = [
  { name: 'Home', href: '#hero' },
  { name: 'Exams', href: '#exams' },
  { name: 'Features', href: '#why-pk' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Reviews', href: '#reviews' },
  { name: 'FAQ', href: '#faq' },
];

const SUPPORT_LINKS = ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service', 'Refund Policy'];

export const Footer: React.FC<FooterProps> = ({ onIosClick }) => {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#hero') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#08154A] via-[#0A1D63] to-[#0B2C8C] text-[#C9D3F0]">
      {/* Soft glowing curves in the background */}
      <div className="pointer-events-none absolute -left-40 -bottom-48 w-[520px] h-[520px] rounded-full border-[60px] border-[#1A3FA8]/30 blur-sm" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-40 w-[480px] h-[480px] rounded-full bg-[#1C4BD6]/25 blur-3xl" aria-hidden />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.1fr] gap-8 lg:gap-6 pb-8">
          <div className="col-span-2 lg:col-span-1 lg:pr-8 lg:border-r lg:border-white/10">
            <div className="flex items-center gap-3">
              <BrandMark className="w-12 h-12" />
              <span className="text-xl font-bold text-white">Practice Koro</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-white/90 font-['Hind_Siliguri',sans-serif]">
              স্বপ্নের সরকারি চাকরির প্রস্তুতি
              <br />
              এখন আরও সহজ, আরও স্মার্ট।
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className={`w-9 h-9 ${social.rounded} ${social.bg} flex items-center justify-center text-white hover:scale-110 transition-transform`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-semibold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.name}>
                  <a href={link.href} onClick={(e) => scrollTo(e, link.href)} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[15px] font-semibold text-white">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {SUPPORT_LINKS.map((label) => (
                <li key={label}>
                  <span className="hover:text-white cursor-pointer transition-colors">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1 relative">
            <h3 className="text-[15px] font-semibold text-white">Get the App</h3>
            <div className="mt-4 flex flex-row lg:flex-col flex-wrap items-start gap-3">
              <GooglePlayBadge size="md" className="min-w-[160px]" />
              <AppStoreBadge size="md" onIosClick={onIosClick} className="min-w-[160px]" />
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Back to top"
              className="hidden lg:flex absolute right-0 -bottom-2 w-11 h-11 rounded-full bg-[#0D2A7A] border border-white/25 text-white items-center justify-center hover:bg-[#1A5CFF] transition-colors cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-white/75">
          <p>© 2026 Practice Koro. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-[#FF3B4E] fill-current" /> for every aspirant in West Bengal.
          </p>
        </div>
      </div>
    </footer>
  );
};
