import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Reveal } from './Reveal';
import { ArrowRight, BadgeCheck } from 'lucide-react';

export const BottomCta: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const primaryDestination = user && isAdmin ? '/admin' : '/questions';

  return (
    <section className="relative py-14 sm:py-20 bg-white overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative rounded-[1.75rem] bg-gradient-to-br from-pk-primary via-pk-primary-interactive to-pk-navy p-8 sm:p-12 shadow-2xl shadow-pk-primary/25 overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-10">
            {/* Decorative rings + dots */}
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 w-72 h-72 rounded-full border-[22px] border-white/10 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[14px] border-white/10 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_60%_80%_at_80%_50%,black,transparent)] pointer-events-none"
            />

            {/* Target mark */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="rgba(255,255,255,0.16)"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="4"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="#ffffff"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="3"
                />
                <circle cx="100" cy="100" r="50" fill="#0158FC" />
                <circle cx="100" cy="100" r="30" fill="#ffffff" />
                <circle cx="100" cy="100" r="14" fill="#063585" />
                <path d="M 100 100 L 160 40 L 170 50 L 110 110 Z" fill="#0B1F44" />
                <polygon points="160,40 180,20 170,50" fill="#fbbf24" />
                <circle cx="100" cy="100" r="4" fill="#ffffff" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative space-y-3 text-center md:text-left flex-1">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-pk-blue-light">
                <BadgeCheck className="w-4 h-4" />
                Your dream is closer
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Start Practicing Today
              </h2>
              <p className="text-sm text-pk-blue-light/90 leading-relaxed font-normal max-w-xl">
                Join thousands of aspirants and take a step closer to your goal. Free to start —
                upgrade only when you&apos;re ready.
              </p>
            </div>

            {/* CTA */}
            <div className="relative flex flex-col items-center gap-2.5 shrink-0 w-full md:w-auto">
              <Button
                size="lg"
                onClick={() => navigate(primaryDestination)}
                className="bg-white hover:bg-pk-blue-light text-pk-primary font-bold px-8 py-3.5 rounded-xl shadow-xl text-sm gap-2 transition-all hover:-translate-y-0.5 w-full md:w-auto"
              >
                <span>{user && isAdmin ? 'Admin Dashboard' : 'Browse Questions'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-[11px] font-medium text-pk-blue-light/90">
                {user && isAdmin ? 'Manage PracticeKoro' : 'Browse the public question library'}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
