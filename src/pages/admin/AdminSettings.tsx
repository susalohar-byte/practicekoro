import { SETTINGS_TABS } from './settings/settingsTabs';
import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAdminSettings } from './settings/useAdminSettings';
import { GeneralSettingsTab } from './settings/GeneralSettingsTab';
import { BrandingSettingsTab } from './settings/BrandingSettingsTab';
import { SeoSettingsTab } from './settings/SeoSettingsTab';
import { EmailSettingsTab } from './settings/EmailSettingsTab';
import { PaymentSettingsTab } from './settings/PaymentSettingsTab';
import { IntegrationSettingsTab } from './settings/IntegrationSettingsTab';
import { SecuritySettingsTab } from './settings/SecuritySettingsTab';
import { SystemSettingsTab } from './settings/SystemSettingsTab';
import { ClearCacheModal } from './settings/ClearCacheModal';

export const AdminSettings: React.FC = () => {
  const settings = useAdminSettings();
  const {
    canManageSettings,
    toastKind,
    activeTab,
    setActiveTab,
    toastMessage,
    isSaving,
    isLoadingSettings,
    settingsLoadError,
    avatarInputRef,
    logoInputRef,
    faviconInputRef,
    loadSettings,
    handleLogoUpload,
    handleFaviconUpload,
    handleAvatarUpload,
  } = settings;
  if (isLoadingSettings)
    return <AdminPageSkeleton label="Loading saved settings…" variant="form" />;
  if (settingsLoadError)
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          Settings could not be loaded: {settingsLoadError}. Editing is unavailable until reload
          succeeds.
        </div>
        <button
          type="button"
          onClick={() => void loadSettings()}
          className="rounded-lg border px-4 py-2"
        >
          Retry settings load
        </button>
      </div>
    );

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role={toastKind === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toastKind === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {!canManageSettings && (
        <p role="status">
          Read-only: an active Super Admin is required to change platform settings.
        </p>
      )}
      <p className="text-xs text-slate-500">
        Only confirmed backend saves are reported as successful. Unimplemented controls are disabled
        and labeled.
      </p>
      {/* Hidden file inputs */}
      <input
        disabled={!canManageSettings || isSaving}
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleAvatarUpload}
        aria-label="Upload profile picture"
      />
      <input
        disabled={!canManageSettings || isSaving}
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleLogoUpload}
        aria-label="Upload platform logo"
      />
      <input
        disabled={!canManageSettings || isSaving}
        ref={faviconInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={handleFaviconUpload}
        aria-label="Upload platform favicon"
      />

      {/* ==================================================================== */}
      {/* PAGE HEADER                                                          */}
      {/* ==================================================================== */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
          Configure platform settings, manage integrations, and customize your PracticeKoro
          experience.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* TOP NAVIGATION TABS (8 CARDS)                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer relative',
                isActive
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-600 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-white dark:bg-[#0B132B] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mb-3',
                  tab.iconBg,
                  tab.iconColor
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p
                className={cn(
                  'text-xs font-bold leading-tight',
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                )}
              >
                {tab.label}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">
                {tab.sublabel}
              </p>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: GENERAL SETTINGS (Exact layout of reference image)            */}
      {/* ==================================================================== */}
      <GeneralSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 2: BRANDING                                                      */}
      {/* ==================================================================== */}
      <BrandingSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 3: SEO & META                                                    */}
      {/* ==================================================================== */}
      <SeoSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 4: EMAIL & NOTIFICATIONS                                         */}
      {/* ==================================================================== */}
      <EmailSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 5: PAYMENTS                                                      */}
      {/* ==================================================================== */}
      <PaymentSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 6: INTEGRATIONS                                                  */}
      {/* ==================================================================== */}
      <IntegrationSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 7: SECURITY                                                      */}
      {/* ==================================================================== */}
      <SecuritySettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* TAB 8: SYSTEM                                                        */}
      {/* ==================================================================== */}
      <SystemSettingsTab settings={settings} />

      {/* ==================================================================== */}
      {/* CLEAR CACHE CONFIRMATION MODAL                                       */}
      {/* ==================================================================== */}
      <ClearCacheModal settings={settings} />
    </div>
  );
};
