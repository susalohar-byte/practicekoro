import React from 'react';
import { Navbar } from '@/pages/landing/sections/Navbar';
import { Hero } from '@/pages/landing/sections/Hero';
import { PopularExams } from '@/pages/landing/sections/PopularExams';
import { InsideTheApp } from '@/pages/landing/sections/InsideTheApp';
import { ProPass } from '@/pages/landing/sections/ProPass';
import { Testimonials } from '@/pages/landing/sections/Testimonials';
import { AppInstall } from '@/pages/landing/sections/AppInstall';
import { FaqSection } from '@/pages/landing/sections/FaqSection';
import { Footer } from '@/pages/landing/sections/Footer';

export { SUPPORTED_EXAM_CATEGORIES } from '@/pages/landing/data';

/**
 * RootRoute:
 * - Always displays the public Landing Page at https://practicekoro.online/
 * - Signed-in administrators can open the admin panel from the landing page.
 */
export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <Hero />
      <PopularExams />
      <InsideTheApp />
      <ProPass />
      <Testimonials />
      <AppInstall />
      <FaqSection />
      <Footer />
    </div>
  );
};
