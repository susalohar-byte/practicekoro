import { ChevronDown, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemAdminRole } from './staffUtils';
import type { AdminStaffState } from './useAdminStaff';

export interface StaffCreateAdminPanelProps {
  st: AdminStaffState;
}

export function StaffCreateAdminPanel({ st }: StaffCreateAdminPanelProps) {
  const {
    setIsSidePanelOpen,
    panelTab,
    setPanelTab,
    handleCreateAdminSubmit,
    formName,
    setFormName,
    formEmail,
    setFormEmail,
    formPhone,
    setFormPhone,
    formPassword,
    setFormPassword,
    showPassword,
    setShowPassword,
    formRole,
    setFormRole,
    formStatus,
    setFormStatus,
    formWelcomeEmail,
    isWorking,
  } = st;
  return (
    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Assign Staff to a Registered Account</h2>
        <button
          onClick={() => setIsSidePanelOpen(false)}
          className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Tabs */}
      <div className="flex items-center border-b border-slate-100 text-xs">
        {(['Basic Info', 'Role & Permissions', 'Access Control'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setPanelTab(tab)}
            className={cn(
              'py-2 px-3 font-semibold transition-all relative cursor-pointer',
              panelTab === tab ? 'text-[#2563EB]' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {tab}
            {panelTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Form Fields: Basic Info */}
      <form onSubmit={handleCreateAdminSubmit} className="space-y-3.5 text-xs">
        {/* Name */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter full name"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
            Phone (Optional)
          </label>
          <input
            type="text"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
            Password (unchanged for existing accounts)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              disabled
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Existing account credentials are not changed"
              className="w-full border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
            Role <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as SystemAdminRole)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Content Manager">Content Manager</option>
              <option value="Support Manager">Support Manager</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Analyst">Analyst</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Radio Buttons */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">Status</label>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="adminStatus"
                checked={formStatus === 'Active'}
                onChange={() => setFormStatus('Active')}
                className="text-blue-600 focus:ring-0"
              />
              <span>Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="adminStatus"
                checked={formStatus === 'Inactive'}
                onChange={() => setFormStatus('Inactive')}
                className="text-blue-600 focus:ring-0"
              />
              <span>Inactive</span>
            </label>
          </div>
        </div>

        {/* Send Welcome Email Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-slate-800 block">Send Welcome Email</span>
            <span className="text-[11px] text-slate-400 block">
              Existing account credentials remain unchanged
            </span>
          </div>

          <button
            type="button"
            disabled
            title="Welcome email is not available for existing-account role assignment"
            className={cn(
              'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer',
              formWelcomeEmail ? 'bg-[#2563EB]' : 'bg-slate-200'
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full bg-white shadow-xs block transition-transform absolute top-0.5',
                formWelcomeEmail ? 'left-5' : 'left-1'
              )}
            />
          </button>
        </div>

        {/* Bottom Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setFormName('');
              setFormEmail('');
              setFormPhone('');
              setFormPassword('');
            }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isWorking}
            className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs cursor-pointer"
          >
            Create Admin
          </button>
        </div>
      </form>
    </div>
  );
}
