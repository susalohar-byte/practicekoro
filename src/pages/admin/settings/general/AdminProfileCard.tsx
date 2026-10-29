import { User, Upload } from 'lucide-react';
import type { AdminSettingsState } from '../useAdminSettings';

export interface AdminProfileCardProps {
  settings: AdminSettingsState;
}

export function AdminProfileCard({ settings }: AdminProfileCardProps) {
  const {
    currentAdmin,
    adminRole,
    canManageSettings,
    isSaving,
    isUploadingAvatar,
    avatarInputRef,
    handleRemoveAvatar,
  } = settings;
  return (
    <>
      {/* Card 0: Super Admin Profile & Picture */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Super Admin Profile Picture
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Your avatar photo displays in the admin panel top navigation header and sidebar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#026BFC] text-white font-bold flex items-center justify-center text-xl shadow-md ring-4 ring-blue-500/10 overflow-hidden">
                {currentAdmin?.avatarUrl ? (
                  <img
                    src={currentAdmin.avatarUrl}
                    alt={currentAdmin?.fullName || 'Super Admin'}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{currentAdmin?.fullName?.charAt(0) || 'S'}</span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentAdmin?.fullName || 'Super Admin'}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
                  {adminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {currentAdmin?.email || 'admin@practicekoro.online'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                PNG or JPG • Max 2MB • Square recommended
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              disabled={!canManageSettings || isSaving || isUploadingAvatar}
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {isUploadingAvatar
                  ? 'Uploading...'
                  : currentAdmin?.avatarUrl
                    ? 'Change Picture'
                    : 'Upload Picture'}
              </span>
            </button>
            {currentAdmin?.avatarUrl && (
              <button
                disabled={!canManageSettings || isSaving || isUploadingAvatar}
                type="button"
                aria-label="Remove profile picture"
                onClick={() => void handleRemoveAvatar()}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
