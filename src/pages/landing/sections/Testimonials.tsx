import React from 'react';
import { testimonials } from '../data';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Star, Quote } from 'lucide-react';

export const Testimonials: React.FC = () => {
  return (
    <section className="relative py-14 sm:py-20 lg:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/80 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[380px] h-[380px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
      />
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What Our Users Say"
          title={
            <>
              Trusted by Aspirants{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Across
              </span>{' '}
              West Bengal
            </>
          }
          description="Real feedback from students preparing with PracticeKoro every day."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, index) => (
            <Reveal key={t.name} delay={index * 110} className="h-full">
              <figure className="group relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <Quote
                  className="w-7 h-7 text-blue-200 dark:text-blue-900/50 group-hover:text-blue-300 dark:group-hover:text-blue-400 transition-colors"
                  aria-hidden="true"
                />
                <blockquote className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div
                  className="flex items-center gap-0.5 text-amber-400 mt-4"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>

                <figcaption className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <span className="p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shrink-0">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800"
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
