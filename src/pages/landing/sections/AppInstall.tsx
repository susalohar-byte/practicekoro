import React, { useState, useEffect } from 'react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import {
  Smartphone,
  Download,
  Zap,
  Bell,
  WifiOff,
  CheckCircle2,
  Share2,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const AppInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if app is already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install error:', err);
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <section
      id="app-install"
      className="relative py-14 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 scroll-mt-24 overflow-hidden"
    >
      {/* Background Glows */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 -left-32 w-[420px] h-[420px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 -right-32 w-[420px] h-[420px] bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Download & Install"
          title={
            <>
              Study on the Go with the{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PracticeKoro App
              </span>
            </>
          }
          description="Install PracticeKoro directly on your mobile device for lightning-fast mock tests, instant test alerts, and seamless practice without storage hassle."
        />

        <div className="space-y-5 sm:space-y-8 max-w-4xl mx-auto">
          {/* 4 Feature Highlights in 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Reveal delay={100}>
              <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Instant 1-Tap Install
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Zero storage lag. No 100MB Play Store download required — opens instantly.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Mock Test Alerts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Instant notifications for live Sunday mock tests, new PYQs & exam dates.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Low Data & Smooth
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Optimized for 3G/4G rural mobile connections across all districts.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={250}>
              <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Real Exam Interface
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Simulates real CBT exam hall screens with timed test interfaces and instant
                    ranking.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Centered Install Action Card */}
          <Reveal delay={300}>
            <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
              {/* Background Pattern */}
              <div
                aria-hidden="true"
                className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"
              />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>OFFICIAL MOBILE WEB APP</span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-black text-white">
                    Install On Your Phone Today
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/90 max-w-md mx-auto sm:mx-0">
                    Compatible with Android (Chrome, Edge) and iPhone (Safari). 100% Free to
                    install.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-center sm:items-end gap-2.5">
                  {installedSuccess || isInstalled ? (
                    <div className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-md">
                      <Check className="w-4 h-4" />
                      <span>Installed on Device</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-blue-700 font-extrabold text-base shadow-lg shadow-black/10 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Download className="w-5 h-5 stroke-[2.5]" />
                      <span>Install App Now</span>
                    </button>
                  )}
                  <span className="text-[11px] text-blue-200 text-center font-medium">
                    One-tap install • No storage required
                  </span>
                </div>
              </div>

              {/* Instructions accordion / modal helper */}
              {showGuide && (
                <div className="mt-6 pt-6 border-t border-white/20 text-xs text-blue-50 space-y-3">
                  <p className="font-bold text-white text-sm">How to install manually:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs">
                      <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-200" /> Android (Chrome)
                      </p>
                      <p className="text-blue-100 leading-relaxed text-[11px]">
                        1. Tap the three dots (⋮) in the top-right corner.
                        <br />
                        2. Tap <strong>&quot;Install app&quot;</strong> or{' '}
                        <strong>&quot;Add to Home screen&quot;</strong>.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs">
                      <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-200" /> iPhone (Safari)
                      </p>
                      <p className="text-blue-100 leading-relaxed text-[11px]">
                        1. Tap the <strong>Share</strong> button at bottom (square with arrow).
                        <br />
                        2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Centered Platform Trust Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Verified &amp; Secure
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <Smartphone className="w-4 h-4 text-blue-500" />
              Works on Android &amp; iOS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <Zap className="w-4 h-4 text-amber-500" />
              Instant Updates
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
