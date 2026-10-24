import type React from 'react';
import {
  Settings,
  Palette,
  Search,
  Mail,
  CreditCard,
  Link as LinkIcon,
  Shield,
  Server,
} from 'lucide-react';

export type SettingsTab =
  'general' | 'branding' | 'seo' | 'email' | 'payments' | 'integrations' | 'security' | 'system';

export interface TabConfig {
  id: SettingsTab;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

export const SETTINGS_TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    sublabel: 'Platform information',
    icon: Settings,
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-600',
  },
  {
    id: 'branding',
    label: 'Branding',
    sublabel: 'Logo, colors, theme',
    icon: Palette,
    iconBg: 'bg-purple-100/70',
    iconColor: 'text-purple-600',
  },
  {
    id: 'seo',
    label: 'SEO & Meta',
    sublabel: 'Search engine settings',
    icon: Search,
    iconBg: 'bg-indigo-100/70',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'email',
    label: 'Email & Notifications',
    sublabel: 'Templates & SMTP',
    icon: Mail,
    iconBg: 'bg-sky-100/70',
    iconColor: 'text-sky-600',
  },
  {
    id: 'payments',
    label: 'Payments',
    sublabel: 'Payment gateways',
    icon: CreditCard,
    iconBg: 'bg-emerald-100/70',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    sublabel: 'Third-party services',
    icon: LinkIcon,
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-500',
  },
  {
    id: 'security',
    label: 'Security',
    sublabel: 'Access & protection',
    icon: Shield,
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-600',
  },
  {
    id: 'system',
    label: 'System',
    sublabel: 'Advanced settings',
    icon: Server,
    iconBg: 'bg-purple-100/70',
    iconColor: 'text-purple-600',
  },
];
