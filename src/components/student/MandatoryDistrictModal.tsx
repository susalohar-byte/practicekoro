import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WEST_BENGAL_DISTRICTS } from '@/data/districts';
import { MapPin, ChevronDown, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const MandatoryDistrictModal: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for logged in students who DO NOT have a district assigned yet
  const needsDistrict = Boolean(user && user.role === 'student' && !user.district);

  if (!needsDistrict) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict) {
      setError('Please choose your district in West Bengal to proceed.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateProfile({ district: selectedDistrict });
      if (res.error) {
        setError(res.error.message || 'Failed to save district. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save district.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Icon Header */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
          <MapPin className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-black items-center justify-center text-white">
              !
            </span>
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0158FC] dark:text-blue-300 text-[11px] font-bold border border-blue-200/60 dark:border-blue-800/60 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>New Feature: District-wise Rank</span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Select Your District
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
          Please select your West Bengal district to unlock District-wise Rank and compare with
          fellow aspirants in your area.
        </p>

        {error && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 text-left">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              District (West Bengal) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <MapPin className="w-4 h-4" />
              </div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                required
                aria-label="Select your district in West Bengal"
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-10 pr-9 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-[#0158FC] focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer shadow-xs"
              >
                <option value="" disabled>
                  -- Select Your District (Mandatory) --
                </option>
                {WEST_BENGAL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>District selection is mandatory for leaderboard integrity.</span>
          </div>

          <button
            type="submit"
            disabled={!selectedDistrict || isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{isSubmitting ? 'Saving District...' : 'Save & Continue'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
