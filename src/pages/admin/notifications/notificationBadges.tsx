import {
  Send,
  FileText,
  Tag,
  TrendingUp,
  Megaphone,
  Crown,
  Layers,
  Settings,
  Heart,
} from 'lucide-react';
import type { NotificationCategory, NotificationStatus } from './notificationTypes';

// Badge styling helper matching exact pill colors in reference screenshot
export const getTypeBadge = (type: NotificationCategory) => {
  switch (type) {
    case 'Test':
      return {
        icon: <FileText className="w-3 h-3 text-blue-600" />,
        className: 'bg-blue-50 text-blue-600 border border-blue-200/60',
        label: 'Test',
      };
    case 'Promotion':
      return {
        icon: <Tag className="w-3 h-3 text-rose-600" />,
        className: 'bg-rose-50 text-rose-600 border border-rose-200/60',
        label: 'Promotion',
      };
    case 'Result':
      return {
        icon: <TrendingUp className="w-3 h-3 text-emerald-600" />,
        className: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
        label: 'Result',
      };
    case 'Update':
      return {
        icon: <Megaphone className="w-3 h-3 text-purple-600" />,
        className: 'bg-purple-50 text-purple-600 border border-purple-200/60',
        label: 'Update',
      };
    case 'Subscription':
      return {
        icon: <Crown className="w-3 h-3 text-amber-600" />,
        className: 'bg-amber-50 text-amber-600 border border-amber-200/60',
        label: 'Subscription',
      };
    case 'Content':
      return {
        icon: <Layers className="w-3 h-3 text-blue-600" />,
        className: 'bg-blue-50 text-blue-600 border border-blue-200/60',
        label: 'Content',
      };
    case 'System':
      return {
        icon: <Settings className="w-3 h-3 text-sky-600" />,
        className: 'bg-sky-50 text-sky-600 border border-sky-200/60',
        label: 'System',
      };
    case 'Welcome':
      return {
        icon: <Heart className="w-3 h-3 text-rose-600" />,
        className: 'bg-rose-50 text-rose-600 border border-rose-200/60',
        label: 'Welcome',
      };
    default:
      return {
        icon: <Send className="w-3 h-3 text-blue-600" />,
        className: 'bg-blue-50 text-blue-600 border border-blue-200/60',
        label: 'General',
      };
  }
};

export const getStatusBadge = (status: NotificationStatus) => {
  switch (status) {
    case 'Sent':
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/70';
    case 'Scheduled':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/70';
    case 'Draft':
      return 'bg-slate-100 text-slate-600 border border-slate-200/70';
    case 'Archived':
      return 'bg-slate-100 text-slate-400 border border-slate-200/70';
  }
};
