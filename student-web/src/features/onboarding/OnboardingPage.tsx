import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/ui/Brand';

const KEY = 'onboarding_done';

export function onboardingDone(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return true;
  }
}

// The three onboarding pages from the app (Prepare Better / Practice Smarter / Track Your Progress).
const PAGES = [
  { a: 'Prepare', b: 'Better', underline: '#FFB800', img: 'mascot/nimo_ready.png', text: 'Real exam-pattern mock tests for WBP, WBPSC, SSC, Railway and more.' },
  { a: 'Practice', b: 'Smarter', underline: '#00D084', img: 'mascot/nimo_pointing.png', text: 'Subject and chapter tests with detailed Bengali explanations.' },
  { a: 'Track', b: 'Your Progress', underline: '#FFB800', img: 'mascot/nimo_thumbs_up.png', text: 'Scores, accuracy and your rank across West Bengal and your district.' },
];

export default function OnboardingPage() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const finish = () => {
    try {
      localStorage.setItem(KEY, 'true');
    } catch {
      /* ignore */
    }
    navigate(`/login${params.toString() ? `?${params}` : ''}`, { replace: true });
  };
  const page = PAGES[i];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Wordmark className="h-8" />
        <button type="button" onClick={finish} className="rounded-lg px-3 py-2 text-[14px] font-semibold text-[#334155] hover:bg-surface">
          Skip
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-6 md:flex-row md:gap-16">
        <div className="flex h-64 w-64 items-center justify-center md:h-96 md:w-96">
          <img key={page.img} src={`${import.meta.env.BASE_URL}${page.img}`} alt="" aria-hidden className="h-56 w-auto object-contain md:h-80" />
        </div>
        <div className="max-w-md text-center md:text-left" aria-live="polite">
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-[#0F172A] md:text-5xl">
            {page.a}
            <br />
            <span className="relative text-brand">
              {page.b}
              <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full" style={{ background: page.underline }} aria-hidden />
            </span>
          </h1>
          <p className="mt-6 text-[15px] text-muted md:text-lg">{page.text}</p>
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8">
        <div className="flex gap-2" aria-label={`Page ${i + 1} of ${PAGES.length}`}>
          {PAGES.map((_, n) => (
            <span key={n} className={cn('h-2 rounded transition-all', n === i ? 'w-6 bg-brand' : 'w-2 bg-[#CBD5E1]')} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (i < PAGES.length - 1 ? setI(i + 1) : finish())}
          aria-label={i < PAGES.length - 1 ? 'Next' : 'Get Started'}
          className="flex h-[58px] items-center gap-2 rounded-full bg-brand px-5 text-white shadow-[0_8px_18px_rgba(1,88,252,0.38)] hover:bg-primary-dark"
        >
          {i === PAGES.length - 1 && <span className="pl-1 font-semibold">Get Started</span>}
          <ArrowRight className="h-6 w-6" />
        </button>
      </footer>
    </div>
  );
}
