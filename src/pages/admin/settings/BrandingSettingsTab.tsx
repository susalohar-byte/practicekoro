import { Palette } from 'lucide-react';
import { PLATFORM_FONTS } from '@/utils/platformPresentation';
import type { AdminSettingsState } from './useAdminSettings';

export interface BrandingSettingsTabProps {
  settings: AdminSettingsState;
}

export function BrandingSettingsTab({ settings }: BrandingSettingsTabProps) {
  const {
    activeTab,
    canManageSettings,
    isSaving,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    accentColor,
    setAccentColor,
    themeMode,
    setThemeMode,
    fontFamily,
    setFontFamily,
    platformLogo,
    logoInputRef,
    removeAsset,
    favicon,
    faviconInputRef,
    handleSaveBranding,
  } = settings;
  return (
    <>
      {activeTab === 'branding' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Branding & Visual Identity
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Manage logos, color palettes, typography and visual assets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Platform Colors
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Primary Brand Color picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Primary Brand Color"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Secondary Brand Color picker"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Secondary Brand Color"
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Accent Brand Color picker"
                    disabled={!canManageSettings || isSaving}
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    aria-label="Accent Brand Color"
                    disabled={!canManageSettings || isSaving}
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Typography
              </h3>
              <div>
                <label
                  htmlFor="platform-theme"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Platform Default Theme
                </label>
                <select
                  id="platform-theme"
                  aria-label="Platform Default Theme"
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'system')}
                  disabled={!canManageSettings || isSaving}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Font Family
                </label>
                <select
                  aria-label="Primary Font Family"
                  value={fontFamily}
                  disabled={!canManageSettings || isSaving}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {Object.keys(PLATFORM_FONTS).map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Platform Logo & Favicon
              </h3>

              {/* Platform Logo */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Platform Logo
                </label>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#026BFC] flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                    {platformLogo ? (
                      <img src={platformLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center">
                        <span className="font-black text-xs tracking-tighter">PK</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Recommended: 512 × 512 px PNG or JPG (Max 2MB)
                    </p>
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <button
                        disabled={!canManageSettings || isSaving}
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        Change Logo
                      </button>
                      {platformLogo && (
                        <button
                          disabled={!canManageSettings || isSaving}
                          type="button"
                          aria-label="Remove platform logo from branding"
                          onClick={() => void removeAsset('logo')}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      32 × 32 px PNG (Max 1MB)
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
                      {favicon && (
                        <button
                          disabled={!canManageSettings || isSaving}
                          type="button"
                          aria-label="Remove favicon from branding"
                          onClick={() => void removeAsset('favicon')}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => void handleSaveBranding()}
              disabled={!canManageSettings || isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save Branding Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}
