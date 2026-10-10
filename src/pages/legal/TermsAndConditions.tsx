import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Shield,
  BookOpen,
  CreditCard,
  Lock,
  AlertTriangle,
  FileCheck,
  Mail,
  Gavel,
} from 'lucide-react';
import { Navbar } from '@/pages/landing/sections/Navbar';
import { Footer } from '@/pages/landing/sections/Footer';

export const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-pk-primary selection:text-white">
      {/* Global Navbar */}
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-pk-primary/10 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-pk-primary dark:text-blue-300 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Official User Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms and Conditions
          </h1>

          <p className="text-base sm:text-lg font-semibold text-pk-primary dark:text-blue-400">
            General Terms &amp; Conditions of Use
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before accessing or using the PracticeKoro examination
            preparation platform and test engine.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Last Updated:{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-300">
                September 19, 2026
              </strong>
            </span>
            <span>•</span>
            <span>
              Governing Jurisdiction:{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-300">
                West Bengal, India
              </strong>
            </span>
            <span>•</span>
            <span>
              Platform:{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-300">
                practicekoro.online
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Important Statutory Disclaimer Banner */}
        <div className="p-5 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-amber-900 dark:text-amber-200">
              Important Educational Notice
            </h3>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              PracticeKoro is an independent, non-governmental EdTech platform providing mock tests,
              previous year questions, and performance analysis. We are not associated with or
              endorsed by WBPRB, WBPSC, SSC, RRB, or any state/central government authority.
            </p>
          </div>
        </div>

        {/* Detailed Article Body */}
        <article className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pk-primary" />
              <span>1. Introduction & Acceptance of Terms</span>
            </h2>
            <p>
              Welcome to <strong>PracticeKoro</strong> (&quot;PracticeKoro&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;), operating via{' '}
              <a
                href="https://practicekoro.online"
                className="text-pk-primary hover:underline font-semibold"
              >
                https://practicekoro.online
              </a>{' '}
              and associated web applications. By creating an account, browsing our website, or
              purchasing a Pro Pass, you agree to be bound by these Terms and Conditions
              (&quot;Terms&quot;) and our{' '}
              <Link to="/privacy" className="text-pk-primary hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              If you do not agree to these Terms, please immediately discontinue using our services.
              PracticeKoro provides structured test simulations and analytics for competitive
              examinations including WBP Constable, Kolkata Police SI, WBCS, WBPSC Clerkship,
              Railways, and Central SSC.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-pk-primary" />
              <span>2. Account Registration & Security</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Eligibility:</strong> You must be at least 16 years of age or preparing for
                eligible competitive recruitment examinations.
              </li>
              <li>
                <strong>Single-User License:</strong> Each account is granted on a strictly
                personal, non-exclusive, non-transferable basis. Account sharing, credential
                pooling, or multiple concurrent sessions by distinct individuals are strictly
                prohibited.
              </li>
              <li>
                <strong>Credential Confidentiality:</strong> You are solely responsible for
                safeguarding your password and account credentials.
              </li>
            </ul>
          </section>

          {/* Section 3: Subscriptions & Razorpay */}
          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-pk-primary" />
              <span>3. Subscriptions, Payments & Access Rights</span>
            </h2>
            <p>
              While PracticeKoro provides select free diagnostic tests, full mock series and
              in-depth question analytics require a paid subscription (&quot;Pro Pass&quot;).
            </p>
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                All monetary transactions on PracticeKoro are securely processed via{' '}
                <strong>Razorpay</strong>, an authorized payment aggregator compliant with Reserve
                Bank of India (RBI) regulations. By purchasing a Pro Pass, you authorize Razorpay to
                process your chosen payment method (UPI, Debit Card, Credit Card, Net Banking).
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All listed fees are denominated in Indian Rupees (INR) and are inclusive of
                applicable taxes unless stated otherwise.
              </p>
            </div>
            <p>
              Subscription cancellations and refunds are strictly governed by our published{' '}
              <Link to="/refund-policy" className="text-pk-primary hover:underline font-semibold">
                Refund &amp; Cancellation Policy
              </Link>
              .
            </p>
          </section>

          {/* Section 4: IP Rights */}
          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-pk-primary" />
              <span>4. Intellectual Property Rights</span>
            </h2>
            <p>
              All software architecture, question curation, answer explanations, short notes, score
              algorithms, and design tokens are the exclusive intellectual property of PracticeKoro.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>
                You may not download, scrape, reverse engineer, or compile test questions via
                automated bots or crawlers.
              </li>
              <li>
                Redistributing, publishing, or selling our questions, PDFs, or solution keys on
                Telegram channels, WhatsApp groups, or third-party websites without written consent
                will result in immediate termination of access and civil/criminal legal action under
                the Indian Copyright Act, 1957.
              </li>
            </ul>
          </section>

          {/* Section 5: Non-Affiliation Disclaimer */}
          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-pk-primary" />
              <span>5. Non-Affiliation Disclaimer</span>
            </h2>
            <p>
              PracticeKoro is an independent edtech learning tool. We are NOT associated with,
              affiliated with, or endorsed by the West Bengal Police Recruitment Board (WBPRB), West
              Bengal Public Service Commission (WBPSC), Staff Selection Commission (SSC), Railway
              Recruitment Boards (RRB), or any other recruitment agency.
            </p>
            <p>
              Exam names, official logos (if referenced), and syllabi are used strictly for
              nominative identification and educational context under fair use.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-pk-primary" />
              <span>6. Code of Conduct & Fair Use</span>
            </h2>
            <p>When using PracticeKoro, you agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Attempt to manipulate timer mechanisms or bypass test submission rules.</li>
              <li>Post abusive, defamatory, or objectionable comments in student support desks.</li>
              <li>Circumvent security protections or inspect unauthorized backend endpoints.</li>
            </ul>
          </section>

          {/* Section 7: Governing Law */}
          <section className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gavel className="w-5 h-5 text-pk-primary" />
              <span>7. Governing Law & Jurisdiction</span>
            </h2>
            <p>
              These Terms shall be governed by, interpreted, and construed in accordance with the
              laws of the Republic of India.
            </p>
            <p>
              Any legal dispute, suit, or proceeding arising out of or related to these Terms or
              services provided by PracticeKoro shall be subject to the exclusive jurisdiction of
              the competent courts located in <strong>West Bengal, India</strong> (specifically the
              District Courts of Paschim Medinipur / High Court at Calcutta).
            </p>
          </section>

          {/* Section 8: Contact */}
          <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pk-primary" />
                  <span>Questions regarding our Terms?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Direct your inquiries to{' '}
                  <a
                    href="mailto:support@practicekoro.online"
                    className="text-pk-primary font-semibold hover:underline"
                  >
                    support@practicekoro.online
                  </a>{' '}
                  or visit our Contact desk.
                </p>
              </div>
              <Link
                to="/contact-us"
                className="px-4 py-2 bg-pk-primary hover:bg-pk-primary-interactive text-white rounded-xl text-xs font-semibold shadow-xs shrink-0"
              >
                Contact Support Desk
              </Link>
            </div>
          </section>
        </article>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
