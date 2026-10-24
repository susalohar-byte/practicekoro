import { Search } from 'lucide-react';
import type { AdminSettingsState } from './useAdminSettings';

export interface SeoSettingsTabProps {
  settings: AdminSettingsState;
}

export function SeoSettingsTab({ settings }: SeoSettingsTabProps) {
  const {
    activeTab,
    metaTitle,
    setMetaTitle,
    canManageSettings,
    isSaving,
    searchConsoleToken,
    setSearchConsoleToken,
    metaDescription,
    setMetaDescription,
    handleSaveSEO,
  } = settings;
  return (
    <>
      {activeTab === 'seo' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SEO & Meta Configuration
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Saved defaults apply to browser metadata. Page-specific titles/descriptions remain
                authoritative. Search Console requires verification with Google;
                server-rendered/prerendered SEO needs a separate rebuild.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Title
              </label>
              <input
                aria-label="Default Meta Title"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                disabled={!canManageSettings || isSaving}
                placeholder="Website default metadata"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Search Console Verification Tag
              </label>
              <input
                aria-label="Google Search Console Verification Tag"
                type="text"
                value={searchConsoleToken}
                onChange={(e) => setSearchConsoleToken(e.target.value)}
                disabled={!canManageSettings || isSaving}
                placeholder="Verification token only, not HTML"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Description
              </label>
              <textarea
                aria-label="Default Meta Description"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                disabled={!canManageSettings || isSaving}
                placeholder="Website default metadata"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={!canManageSettings || isSaving}
              onClick={() => void handleSaveSEO()}
              title="Save website defaults without replacing page-specific SEO"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save SEO Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}
