import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/pages/landing/components/Navbar';
import { Footer } from '@/pages/landing/components/Footer';
import { LANDING_FONT } from '@/pages/landing/components/SectionHeading';
import { LEGAL_DOCUMENTS, LEGAL_LAST_UPDATED, SUPPORT_EMAIL, type LegalDocument } from './legalContent';

const DELETION_URL = 'practicekoro.online/account-deletion';
const LINK_PATTERN = new RegExp(`(${SUPPORT_EMAIL.replace(/\./g, '\\.')}|${DELETION_URL.replace(/\./g, '\\.')})`);

/** Turns the support address and the account-deletion address inside policy text into links. */
function withLinks(text: string): React.ReactNode {
  return text.split(LINK_PATTERN).map((part, i) => {
    if (part === SUPPORT_EMAIL || part === DELETION_URL) {
      return (
        <a
          key={i}
          href={part === SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : '/account-deletion/'}
          className="font-medium text-[#1A5CFF] hover:underline"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const LegalPage: React.FC<{ document: LegalDocument }> = ({ document: doc }) => {
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [doc.slug]);

  return (
    <div className={`min-h-screen bg-[#F7F8FD] text-slate-900 ${LANDING_FONT} flex flex-col`}>
      <Helmet>
        <title>{`${doc.title} | Practice Koro`}</title>
        <meta name="description" content={doc.summary} />
        <link rel="canonical" href={`https://practicekoro.online/${doc.slug}`} />
      </Helmet>

      <header className="bg-white border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark className="w-9 h-9" />
            <span className="text-lg font-bold tracking-tight text-[#0B1B4F]">Practice Koro</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#1A5CFF]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav aria-label="Policies" className="flex gap-2 overflow-x-auto py-5 -mx-1 px-1">
            {LEGAL_DOCUMENTS.map((d) => (
              <NavLink
                key={d.slug}
                to={`/${d.slug}`}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#0B1B4F] text-white' : 'bg-white text-slate-600 hover:text-[#1A5CFF] ring-1 ring-slate-200'
                  }`
                }
              >
                {d.title}
              </NavLink>
            ))}
          </nav>

          <article className="rounded-3xl bg-white px-6 py-8 sm:px-10 sm:py-10 ring-1 ring-slate-200/70">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1B4F]">{doc.title}</h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">{doc.summary}</p>
            <p className="mt-2 text-sm text-slate-400">Last updated: {LEGAL_LAST_UPDATED}</p>

            <div className="mt-8 space-y-8">
              {doc.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#0B1B4F]">{section.heading}</h2>
                  {section.paragraphs?.map((p) => (
                    <p key={p} className="mt-3 text-[15px] sm:text-base leading-relaxed text-slate-600">
                      {withLinks(p)}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-[#1A5CFF]">
                      {section.bullets.map((b) => (
                        <li key={b} className="text-[15px] sm:text-base leading-relaxed text-slate-600">
                          {withLinks(b)}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};
