import type { AdminSettingsState } from './useAdminSettings';
import { AdminProfileCard } from './general/AdminProfileCard';
import { PlatformInfoCard } from './general/PlatformInfoCard';
import { FeatureTogglesCard } from './general/FeatureTogglesCard';
import { ThemeBrandingCard } from './general/ThemeBrandingCard';
import { SmtpSettingsCard } from './general/SmtpSettingsCard';
import { DangerZoneCard } from './general/DangerZoneCard';

export interface GeneralSettingsTabProps {
  settings: AdminSettingsState;
}

export function GeneralSettingsTab({ settings }: GeneralSettingsTabProps) {
  const { activeTab } = settings;
  return (
    <>
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================ */}
          {/* LEFT COLUMN: General Settings & Feature Toggles (Unavailable)                  */}
          {/* ================================================================ */}
          <div className="lg:col-span-7 space-y-6">
            <AdminProfileCard settings={settings} />

            <PlatformInfoCard settings={settings} />

            <FeatureTogglesCard settings={settings} />
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN: Theme & Branding, Email SMTP, Danger Zone           */}
          {/* ================================================================ */}
          <div className="lg:col-span-5 space-y-6">
            <ThemeBrandingCard settings={settings} />

            <SmtpSettingsCard settings={settings} />

            <DangerZoneCard settings={settings} />
          </div>
        </div>
      )}
    </>
  );
}
