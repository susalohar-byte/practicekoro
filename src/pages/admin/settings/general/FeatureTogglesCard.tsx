import {
  Sliders,
  Users,
  FileText,
  Layers,
  Trophy,
  BookOpen,
  CreditCard,
  Tag,
  Bell,
  Share2,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSettingsState } from '../useAdminSettings';

export interface FeatureTogglesCardProps {
  settings: AdminSettingsState;
}

export function FeatureTogglesCard({ settings }: FeatureTogglesCardProps) {
  const { toggleFeature, featureToggles } = settings;
  return (
    <>
      {/* Card 2: Feature Toggles (Unavailable) */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Feature Toggles (Unavailable)
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Enable or disable features across the platform.
            </p>
          </div>
        </div>

        {/* Toggles Grid (2 Columns, Switch on Left -> Icon -> Text) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 pt-5">
          {/* Left Column Toggles */}
          <div className="space-y-4">
            {/* Student Registration */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.studentRegistration}
                aria-label="Student Registration"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('studentRegistration')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.studentRegistration
                    ? 'bg-blue-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.studentRegistration ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Student Registration
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Allow new student signups
                </p>
              </div>
            </div>

            {/* Mock Tests */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.mockTests}
                aria-label="Mock Tests"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('mockTests')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.mockTests ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.mockTests ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Mock Tests
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable mock test access
                </p>
              </div>
            </div>

            {/* Topic Tests */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.topicTests}
                aria-label="Topic Tests"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('topicTests')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.topicTests ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.topicTests ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Topic Tests
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable topic-wise tests
                </p>
              </div>
            </div>

            {/* Leaderboards */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.leaderboards}
                aria-label="Leaderboards"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('leaderboards')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.leaderboards ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.leaderboards ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Leaderboards
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Show rankings and leaderboard
                </p>
              </div>
            </div>

            {/* Blog / Study Notes */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.blogStudyNotes}
                aria-label="Blog / Study Notes"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('blogStudyNotes')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.blogStudyNotes ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.blogStudyNotes ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Blog / Study Notes
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable blog section
                </p>
              </div>
            </div>
          </div>

          {/* Right Column Toggles */}
          <div className="space-y-4">
            {/* Paid Subscriptions */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.paidSubscriptions}
                aria-label="Paid Subscriptions"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('paidSubscriptions')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.paidSubscriptions
                    ? 'bg-blue-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.paidSubscriptions ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Paid Subscriptions
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable subscription plans
                </p>
              </div>
            </div>

            {/* Coupons & Offers */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.couponsOffers}
                aria-label="Coupons & Offers"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('couponsOffers')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.couponsOffers ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.couponsOffers ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Coupons & Offers
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable discount coupons
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.notifications}
                aria-label="Notifications"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('notifications')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.notifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.notifications ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Notifications
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable in-app notifications
                </p>
              </div>
            </div>

            {/* Referral Program */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.referralProgram}
                aria-label="Referral Program"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('referralProgram')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.referralProgram ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.referralProgram ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Referral Program
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Enable referral system
                </p>
              </div>
            </div>

            {/* App Download Links */}
            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={featureToggles.appDownloadLinks}
                aria-label="App Download Links"
                type="button"
                disabled
                title="Feature enforcement is not implemented"
                onClick={() => toggleFeature('appDownloadLinks')}
                className={cn(
                  'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                  featureToggles.appDownloadLinks ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                    featureToggles.appDownloadLinks ? 'translate-x-5.5' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  App Download Links
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  Show mobile app download links
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
