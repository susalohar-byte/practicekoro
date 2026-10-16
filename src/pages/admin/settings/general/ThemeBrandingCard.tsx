import { Palette, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_FONTS } from '@/utils/platformPresentation';
import type { AdminSettingsState } from '../useAdminSettings';

export interface ThemeBrandingCardProps {
  settings: AdminSettingsState;
}

export function ThemeBrandingCard({ settings }: ThemeBrandingCardProps) {
  const {
    canManageSettings,
    isSaving,
    handleSaveBranding,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    accentColor,
    setAccentColor,
    setThemeMode,
    themeMode,
    fontFamily,
    setFontFamily,
  } = settings;
  return (
    <>
      {/* Card 3: Theme & Branding */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Theme & Branding
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Saved defaults apply to the website; explicit user theme preferences win. Save these
              separately from General settings.
            </p>
          </div>
        </div>

        {/* Card Body: Controls (Left) & Preview (Right) */}
        <button
          type="button"
          disabled={!canManageSettings || isSaving}
          onClick={() => void handleSaveBranding()}
          className="my-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Save Theme Defaults
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-5">
          {/* Controls (6 cols) */}
          <div className="sm:col-span-6 space-y-3.5">
            {/* Primary Color */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Primary Color
              </label>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <input
                    disabled={!canManageSettings || isSaving}
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                    {primaryColor.toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <input
                    disabled={!canManageSettings || isSaving}
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                    {secondaryColor.toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Accent Color
              </label>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <input
                    disabled={!canManageSettings || isSaving}
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                    {accentColor.toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Theme Mode */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Platform Default Theme
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  disabled={!canManageSettings || isSaving}
                  onClick={() => setThemeMode('light')}
                  aria-pressed={themeMode === 'light'}
                  title="Default for users without an explicit theme preference"
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    themeMode === 'light'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  disabled={!canManageSettings || isSaving}
                  onClick={() => setThemeMode('dark')}
                  aria-pressed={themeMode === 'dark'}
                  title="Default for users without an explicit theme preference"
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    themeMode === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  disabled={!canManageSettings || isSaving}
                  onClick={() => setThemeMode('system')}
                  aria-pressed={themeMode === 'system'}
                  title="Default for users without an explicit theme preference"
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    themeMode === 'system'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Font Family
              </label>
              <div className="relative">
                <select
                  aria-label="Platform Font Family"
                  value={fontFamily}
                  disabled={!canManageSettings || isSaving}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                >
                  {Object.keys(PLATFORM_FONTS).map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Preview (6 cols) */}
          <div className="sm:col-span-6 flex flex-col">
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Preview
            </p>
            <div className="flex-1 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-2xs">
              {/* Mock Website Navbar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4.5 h-4.5 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="font-black text-[9px]">P</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight">
                    PracticeKoro
                  </span>
                </div>
                <div className="text-slate-400">
                  <span className="text-sm">☰</span>
                </div>
              </div>

              {/* Mock Hero Section */}
              <div className="py-4 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7 space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    Practice Today
                    <br />
                    Achieve Tomorrow
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                    Your success begins with practice
                  </p>
                  <div className="pt-2">
                    <button
                      disabled={!canManageSettings || isSaving}
                      type="button"
                      className="px-2.5 py-1 rounded text-[9px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>

                {/* SVG Illustration of Student with Books & Plant */}
                <div className="col-span-5 flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 90"
                    className="w-full h-auto max-h-20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Plant in background */}
                    <path d="M85 70 C85 45 92 35 92 35 C92 35 78 48 83 70 Z" fill="#10B981" />
                    <path d="M80 72 C80 55 70 42 70 42 C70 42 76 60 82 72 Z" fill="#34D399" />
                    <path d="M88 72 C88 60 96 52 96 52 C96 52 89 65 86 72 Z" fill="#059669" />
                    {/* Table surface */}
                    <rect x="10" y="70" width="80" height="3" rx="1.5" fill="#E2E8F0" />
                    {/* Books on table */}
                    <rect x="18" y="65" width="16" height="5" rx="1" fill="#3B82F6" />
                    <rect x="20" y="61" width="14" height="4" rx="1" fill="#10B981" />
                    <rect x="22" y="58" width="11" height="3" rx="1" fill="#F59E0B" />
                    {/* Student reading at desk */}
                    {/* Body */}
                    <path
                      d="M48 48 C42 48 38 56 38 68 L64 68 C64 56 60 48 54 48 Z"
                      fill={primaryColor}
                    />
                    {/* Head */}
                    <circle cx="51" cy="38" r="8" fill="#FCD34D" />
                    {/* Hair */}
                    <path d="M44 36 C44 30 58 28 59 34 C55 33 48 34 44 36 Z" fill="#1E293B" />
                    {/* Arms holding book */}
                    <path
                      d="M40 56 L48 64 L54 64 L62 56"
                      stroke="#FCD34D"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Open book */}
                    <path
                      d="M43 62 L49 65 L55 62 L61 65"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div
                  className="w-2.5 h-1.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
