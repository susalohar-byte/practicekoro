import { Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSettingsState } from '../useAdminSettings';

export interface PlatformInfoCardProps {
  settings: AdminSettingsState;
}

export function PlatformInfoCard({ settings }: PlatformInfoCardProps) {
  const {
    canManageSettings,
    isSaving,
    platformName,
    setPlatformName,
    websiteUrl,
    setWebsiteUrl,
    adminEmail,
    setAdminEmail,
    supportEmail,
    setSupportEmail,
    contactPhone,
    setContactPhone,
    supportWhatsapp,
    setSupportWhatsapp,
    supportHours,
    setSupportHours,
    address,
    setAddress,
    timezone,
    language,
    platformLogo,
    logoInputRef,
    removeAsset,
    favicon,
    faviconInputRef,
    platformDescription,
    setPlatformDescription,
    maintenanceMode,
    setMaintenanceMode,
    handleSaveGeneral,
  } = settings;
  return (
    <>
      {/* Card 1: General Settings */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              General Settings
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Basic platform information and configuration. Timezone and UI language are
              deployment-managed.
            </p>
          </div>
        </div>

        {/* Card Body (Two sub-columns inside) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
          {/* Sub-column 1: Text Fields (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Name <span className="text-rose-500">*</span>
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Platform Name"
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Website URL <span className="text-rose-500">*</span>
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Website URL"
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Email (Optional)
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Admin Email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Support Email
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Support Email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Contact Phone"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="supportWhatsapp"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Support WhatsApp (Optional)
              </label>
              <input
                id="supportWhatsapp"
                aria-label="Support WhatsApp"
                disabled={!canManageSettings || isSaving}
                type="text"
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="supportHours"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Support Hours (Optional)
              </label>
              <input
                id="supportHours"
                aria-label="Support Hours"
                disabled={!canManageSettings || isSaving}
                type="text"
                value={supportHours}
                onChange={(e) => setSupportHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Address (Optional)
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Address (Optional)"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <select
                    value={timezone}
                    disabled
                    title="Not wired to runtime settings"
                    className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                  >
                    <option value="Asia/Kolkata (GMT +5:30)">Asia/Kolkata (GMT +5:30)</option>
                    <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                    <option value="Asia/Dubai (GMT +4:00)">Asia/Dubai (GMT +4:00)</option>
                    <option value="America/New_York (GMT -5:00)">
                      America/New_York (GMT -5:00)
                    </option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    disabled
                    title="Not wired to runtime settings"
                    className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                  >
                    <option value="English">English</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-column 2: Assets, Description, Maintenance & Save (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Platform Logo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Platform Logo
              </label>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-[#026BFC] flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                  {platformLogo ? (
                    <img src={platformLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full border-2 border-white/80 flex items-center justify-center">
                      <span className="font-black text-sm tracking-tighter">PK</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Recommended size: 512 × 512 px
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    PNG or JPG (Max 2MB)
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      disabled={!canManageSettings || isSaving}
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                    >
                      Change Logo
                    </button>
                    <button
                      disabled={!canManageSettings || isSaving}
                      type="button"
                      aria-label="Remove platform logo"
                      onClick={() => void removeAsset('logo')}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Favicon
              </label>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                  {favicon ? (
                    <img src={favicon} alt="Favicon" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded border border-white/80 flex items-center justify-center">
                      <span className="font-black text-[9px]">P</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Recommended size: 32 × 32 px
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    PNG, ICO (Max 1MB)
                  </p>
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <button
                      disabled={!canManageSettings || isSaving}
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                    >
                      Change Favicon
                    </button>
                    <button
                      disabled={!canManageSettings || isSaving}
                      type="button"
                      aria-label="Remove favicon"
                      onClick={() => void removeAsset('favicon')}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Description */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Description
              </label>
              <textarea
                disabled={!canManageSettings || isSaving}
                aria-label="Platform Description"
                rows={3}
                maxLength={300}
                value={platformDescription}
                onChange={(e) => setPlatformDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-slate-400 font-mono">
                  {platformDescription.length}/300
                </span>
              </div>
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Maintenance Mode
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  When enabled, the site will be inaccessible to students.
                </p>
              </div>
              <button
                disabled={!canManageSettings || isSaving}
                type="button"
                role="switch"
                aria-label="Toggle maintenance mode"
                aria-checked={maintenanceMode}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0',
                  maintenanceMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full bg-white transition-transform absolute top-1',
                    maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Save Changes button */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveGeneral()}
                disabled={!canManageSettings || isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
