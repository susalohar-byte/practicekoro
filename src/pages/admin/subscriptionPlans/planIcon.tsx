import { Crown, GraduationCap, Gem, Sprout } from 'lucide-react';

// Helper render for Plan Header Icon
export const renderPlanIcon = (type: string, isHero = false) => {
  if (isHero) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#026BFC] to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 ring-2 ring-white/20">
        <Crown className="w-6 h-6 drop-shadow-xs" />
      </div>
    );
  }
  switch (type) {
    case 'free':
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20">
          <Sprout className="w-6 h-6" />
        </div>
      );
    case 'basic':
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
      );
    case 'pro':
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
          <Crown className="w-6 h-6" />
        </div>
      );
    case 'ultimate':
      return (
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 ring-1 ring-purple-500/20">
          <Gem className="w-6 h-6" />
        </div>
      );
    default:
      return (
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#026BFC] dark:text-blue-400 flex items-center justify-center shrink-0 ring-1 ring-blue-500/20">
          <Crown className="w-6 h-6" />
        </div>
      );
  }
};
