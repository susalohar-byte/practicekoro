import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { RevealGroup, popIn, hoverLift } from './Reveal';
import { ArrowRight, Check } from 'lucide-react';
import { api } from '@/services/api';
import type { SubscriptionPlan } from '@/types';
import { SectionHeading } from './SectionHeading';

const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

function durationLabel(days: number): string {
  if (days >= 360 && days <= 370) return '1 Year';
  if (days % 365 === 0) return `${days / 365} Years`;
  if (days >= 28 && days <= 31) return '1 Month';
  if (days % 30 === 0) return `${days / 30} Months`;
  return `${days} Days`;
}

const discountPercent = (plan: SubscriptionPlan) =>
  plan.originalPrice && plan.originalPrice > plan.price
    ? Math.floor(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

/** The longest paid plan (the best value pass) is the one the section highlights. */
function pickHighlighted(plans: SubscriptionPlan[]): string | null {
  const paid = plans.filter((p) => p.price > 0);
  if (!paid.length) return null;
  return paid.reduce((best, p) =>
    p.durationDays > best.durationDays ||
    (p.durationDays === best.durationDays && discountPercent(p) > discountPercent(best))
      ? p
      : best
  ).id;
}

const PlanCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl border border-[#EDF0F8] p-6 sm:p-7 animate-pulse" aria-hidden>
    <div className="h-5 w-24 rounded bg-slate-100" />
    <div className="mt-3 h-4 w-40 rounded bg-slate-100" />
    <div className="mt-6 h-9 w-32 rounded bg-slate-100" />
    <div className="mt-6 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-4 rounded bg-slate-100" />
      ))}
    </div>
    <div className="mt-8 h-12 rounded-2xl bg-slate-100" />
  </div>
);

export const PricingSection: React.FC = () => {
  // Active plans as the admin panel set them up; visitors read them without signing in
  const { data: plans, isPending, isError } = useQuery({
    queryKey: ['landing', 'subscription-plans'],
    queryFn: () => api.getSubscriptionPlans(false),
    staleTime: 5 * 60 * 1000,
  });

  // Nothing to sell yet, so leave the section out rather than show an empty block
  if (!isPending && !isError && (!plans || plans.length === 0)) return null;

  const highlightedId = plans ? pickHighlighted(plans) : null;

  return (
    <section id="pricing" className="scroll-mt-24 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon="/images/landing/icons/crown.png"
          title="Choose Your Plan"
          subtitle="আপনার প্রস্তুতির জন্য সঠিক প্ল্যান বেছে নিন।"
        />

        {isError ? (
          <p className="mt-8 text-center text-sm text-[#5B6478] font-['Hind_Siliguri',sans-serif]">
            প্ল্যানগুলো এই মুহূর্তে লোড করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।
          </p>
        ) : (
          <RevealGroup key={isPending ? 'loading' : 'plans'} stagger={0.12} className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-5 sm:gap-6">
            {isPending
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm">
                    <PlanCardSkeleton />
                  </div>
                ))
              : plans.map((plan) => {
                  const highlighted = plan.id === highlightedId;
                  const isFree = plan.price === 0;
                  const discount = discountPercent(plan);
                  return (
                    <motion.article
                      key={plan.id}
                      variants={popIn}
                      {...hoverLift}
                      className={`relative flex flex-col w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm rounded-3xl p-6 sm:p-7 ${
                        highlighted
                          ? 'bg-gradient-to-b from-[#0B1B4F] to-[#13308A] text-white shadow-[0_18px_40px_rgba(20,60,200,0.25)] ring-2 ring-[#2F7BFF]'
                          : 'bg-white text-[#0B1B4F] border border-[#EDF0F8] shadow-[0_6px_24px_rgba(30,50,120,0.07)]'
                      }`}
                    >
                      {highlighted && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-[#5B95FF]"
                          animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.025, 1] }}
                          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      {highlighted && (
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ x: '-50%' }}
                          className="absolute -top-3.5 left-1/2 whitespace-nowrap rounded-full bg-[#FFD43B] px-4 py-1 text-xs font-bold text-[#0B1B4F] shadow-md">
                          Best Value
                        </motion.span>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-bold">{plan.title}</h3>
                        {discount > 0 && (
                          <span
                            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              highlighted ? 'bg-white/15 text-[#FFD43B]' : 'bg-[#E6F8EC] text-[#15803D]'
                            }`}
                          >
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p
                          className={`mt-2 text-sm leading-relaxed line-clamp-2 font-['Hind_Siliguri',sans-serif] ${
                            highlighted ? 'text-white/75' : 'text-[#5B6478]'
                          }`}
                        >
                          {plan.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-end gap-2">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {isFree ? 'Free' : formatPrice(plan.price)}
                        </span>
                        {!isFree && discount > 0 && (
                          <span className={`mb-1 text-base line-through ${highlighted ? 'text-white/50' : 'text-slate-400'}`}>
                            {formatPrice(plan.originalPrice!)}
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-sm ${highlighted ? 'text-white/70' : 'text-[#6B7489]'}`}>
                        {isFree ? 'Always free' : `${durationLabel(plan.durationDays)} access`}
                      </p>

                      {plan.features.length > 0 && (
                        <ul className="mt-6 space-y-3 flex-1">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5 text-sm font-['Hind_Siliguri',sans-serif]">
                              <span
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                                  highlighted ? 'bg-[#2F7BFF] text-white' : 'bg-[#EAF1FF] text-[#1A5CFF]'
                                }`}
                              >
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                              <span className={highlighted ? 'text-white/90' : 'text-[#3A4462]'}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Link
                        to="/login"
                        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all active:scale-95 ${
                          highlighted
                            ? 'bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] text-white shadow-lg shadow-blue-600/40 hover:brightness-110'
                            : 'bg-[#EAF1FF] text-[#1A5CFF] hover:bg-[#1A5CFF] hover:text-white'
                        }`}
                      >
                        {isFree ? 'Start for Free' : `Get ${plan.title}`}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.article>
                  );
                })}
          </RevealGroup>
        )}
      </div>
    </section>
  );
};
