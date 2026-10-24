import { useAuth } from '@/context/AuthContext';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { SettingsTab } from './settingsTabs';
import { api } from '@/services/api';
import {
  PLATFORM_FONTS,
  validatePresentation,
  validateSeoSettings,
} from '@/utils/platformPresentation';
import {
  validateGeneralSettings,
  validateSmtpReference,
  validateBrandColors,
  validateSettingsImage,
} from '@/services/domains/admin.settingsForm';
import { clearOfflineCache } from '@/utils/clearOfflineCache';
import { uploadQuestionImage } from '@/services/domains/admin.questions';

export function useAdminSettings() {
  const { user: currentAdmin, adminRole, updateProfile } = useAuth();
  const canManageSettings =
    adminRole === 'super_admin' && (currentAdmin?.role === 'admin' || !currentAdmin?.role);
  const operationRef = useRef(false);
  const loadVersion = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [toastKind, setToastKind] = useState<'success' | 'error' | 'info'>('info');
  const { checkMaintenanceMode } = useMaintenance();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsLoadError, setSettingsLoadError] = useState('');

  // --------------------------------------------------------------------------
  // General Platform Information
  // --------------------------------------------------------------------------
  const [platformName, setPlatformName] = useState('PracticeKoro');
  const [websiteUrl, setWebsiteUrl] = useState('https://practicekoro.online');
  const [adminEmail, setAdminEmail] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [supportHours, setSupportHours] = useState('');
  const [address, setAddress] = useState('');
  const [timezone] = useState('Asia/Kolkata (GMT +5:30)');
  const [language] = useState('English');
  const [platformDescription, setPlatformDescription] = useState(
    'PracticeKoro is a mock test platform for West Bengal and other Government exams. Practice smart, prepare better and achieve your goal.'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // Feature Toggles (Unavailable) State (Exact match to reference image)
  // --------------------------------------------------------------------------
  const featureToggles = {
    studentRegistration: false,
    mockTests: false,
    topicTests: false,
    leaderboards: false,
    blogStudyNotes: false,
    paidSubscriptions: false,
    couponsOffers: false,
    notifications: false,
    referralProgram: false,
    appDownloadLinks: false,
  };
  const toggleFeature = (_key: keyof typeof featureToggles) => {
    showToast('Feature switches are unavailable: runtime enforcement is not implemented.', 'info');
  };
  // --------------------------------------------------------------------------
  // Theme & Branding State
  // --------------------------------------------------------------------------
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [fontFamily, setFontFamily] = useState('Inter (Default)');
  const [metaTitle, setMetaTitle] = useState('PracticeKoro | Mock Test & Practice Platform');
  const [metaDescription, setMetaDescription] = useState(
    'Practice mock tests and track your exam preparation.'
  );
  const [searchConsoleToken, setSearchConsoleToken] = useState('');

  // --------------------------------------------------------------------------
  // Email SMTP Configuration
  // --------------------------------------------------------------------------
  const [smtpProvider, setSmtpProvider] = useState('Custom SMTP');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpEncryption, setSmtpEncryption] = useState('TLS');
  const isSendingTestEmail = false;
  const [appVersion, setAppVersion] = useState('Not configured');

  // --------------------------------------------------------------------------
  // Payments State (Razorpay Gateway)
  // --------------------------------------------------------------------------
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpIsActive, setRzpIsActive] = useState(true);
  const [currency] = useState('INR');
  const taxPercent = '';
  const invoicePrefix = '';

  // --------------------------------------------------------------------------
  // Clear Cache Dialog Modal
  // --------------------------------------------------------------------------
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // --------------------------------------------------------------------------
  // SMS & Push Notification Gateways (Fast2SMS & Firebase Cloud Messaging)
  // --------------------------------------------------------------------------
  const [fast2smsEnabled, setFast2smsEnabled] = useState(false);
  const [fast2smsRoute, setFast2smsRoute] = useState<'q' | 'dlt' | 'otp'>('q');
  const [fast2smsSenderId, setFast2smsSenderId] = useState('FSTSMS');

  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [fcmProjectId, setFcmProjectId] = useState('practicekoro-app');
  const [fcmVapidKey, setFcmVapidKey] = useState('');

  // Helper toast notification
  const showToast = (msg: string, kind: 'success' | 'error' | 'info' = 'error') => {
    clearTimeout(toastTimerRef.current);
    setToastKind(kind);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 5000);
  };
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);
  const beginOperation = () => {
    if (operationRef.current) return false;
    if (!canManageSettings) {
      showToast('Only an active Super Admin can change settings.');
      return false;
    }
    operationRef.current = true;
    setIsSaving(true);
    return true;
  };
  const endOperation = () => {
    operationRef.current = false;
    setIsSaving(false);
  };

  // --------------------------------------------------------------------------
  // Initial Data Fetching from app_settings
  // --------------------------------------------------------------------------
  const loadSettings = useCallback(async () => {
    const version = ++loadVersion.current;
    setIsLoadingSettings(true);
    setSettingsLoadError('');
    try {
      const [data, gatewayConfig] = await Promise.all([
        api.getAppSettings(),
        api.getPaymentGatewayConfig('razorpay'),
      ]);

      if (version !== loadVersion.current) return;
      if (!Array.isArray(data)) throw new Error('Settings response was not confirmed.');
      if (Array.isArray(data)) {
        data.forEach((s) => {
          const val = s.value;
          if (s.key === 'app_name' || s.id === 'general_app_name') setPlatformName(String(val));
          if (s.key === 'website_url' || s.id === 'general_website_url') setWebsiteUrl(String(val));
          if (s.key === 'support_email' || s.id === 'general_support_email')
            setSupportEmail(String(val));
          if (s.key === 'admin_email' || s.id === 'general_admin_email') setAdminEmail(String(val));
          if (s.key === 'support_phone' || s.id === 'general_support_phone')
            setContactPhone(String(val));
          if (s.key === 'support_whatsapp' || s.id === 'general_support_whatsapp')
            setSupportWhatsapp(String(val ?? ''));
          if (s.key === 'support_hours' || s.id === 'general_support_hours')
            setSupportHours(String(val ?? ''));
          if (s.key === 'support_address' || s.id === 'general_support_address')
            setAddress(String(val));
          if (s.key === 'maintenance_mode' || s.id === 'sys_maintenance_mode') {
            setMaintenanceMode(val === true || val === 'true');
          }
          if (s.id === 'platform_description' || s.key === 'platform_description')
            setPlatformDescription(String(val ?? ''));
          if (s.id === 'general_platform_logo' || s.key === 'general_platform_logo')
            setPlatformLogo(val ? String(val) : null);
          if (s.id === 'general_favicon' || s.key === 'general_favicon')
            setFavicon(val ? String(val) : null);
          if (s.id === 'smtp_provider') setSmtpProvider(String(val ?? 'Custom SMTP'));
          if (s.id === 'smtp_host') setSmtpHost(String(val ?? ''));
          if (s.id === 'smtp_port') setSmtpPort(String(val ?? '587'));
          if (s.id === 'smtp_encryption') setSmtpEncryption(String(val ?? 'TLS'));
          if (s.id === 'sys_app_version' || s.key === 'app_version')
            setAppVersion(String(val ?? 'Not configured'));
          if (s.id === 'primary_color' || s.key === 'primary_color') setPrimaryColor(String(val));
          if (s.id === 'secondary_color' || s.key === 'secondary_color')
            setSecondaryColor(String(val));
          if (s.id === 'accent_color' || s.key === 'accent_color') setAccentColor(String(val));
          if (s.id === 'theme_mode' && ['light', 'dark', 'system'].includes(String(val)))
            setThemeMode(val as 'light' | 'dark' | 'system');
          if (
            s.id === 'font_family' &&
            Object.prototype.hasOwnProperty.call(PLATFORM_FONTS, String(val))
          )
            setFontFamily(String(val));
          if (s.id === 'seo_meta_title') setMetaTitle(String(val ?? ''));
          if (s.id === 'seo_meta_description') setMetaDescription(String(val ?? ''));
          if (s.id === 'seo_google_tag') setSearchConsoleToken(String(val ?? ''));
          if (s.id === 'gateway_fast2sms_enabled')
            setFast2smsEnabled(val === true || val === 'true');
          if (s.id === 'gateway_fast2sms_route')
            setFast2smsRoute(val === 'dlt' || val === 'otp' ? val : 'q');
          if (s.id === 'gateway_fast2sms_sender_id') setFast2smsSenderId(String(val || 'FSTSMS'));
          if (s.id === 'gateway_fcm_enabled') setFcmEnabled(val === true || val === 'true');
          if (s.id === 'gateway_fcm_project_id') setFcmProjectId(String(val || 'practicekoro-app'));
          if (s.id === 'gateway_fcm_vapid_key') setFcmVapidKey(String(val ?? ''));
        });
      }

      if (gatewayConfig) {
        setRzpKeyId(gatewayConfig.keyId || '');
        setRzpIsActive(gatewayConfig.isActive);
      }
    } catch (err) {
      if (version === loadVersion.current)
        setSettingsLoadError(err instanceof Error ? err.message : 'Settings could not be loaded.');
    } finally {
      if (version === loadVersion.current) setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    return () => {
      // Request generation, not a DOM ref: deliberately invalidate the latest request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadVersion.current++;
    };
  }, [loadSettings]);

  // --------------------------------------------------------------------------
  // Save General Changes
  // --------------------------------------------------------------------------
  const handleSaveGeneral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!beginOperation()) return;
    try {
      validateGeneralSettings({
        name: platformName,
        website: websiteUrl,
        adminEmail,
        supportEmail,
      });
      if (platformDescription.length > 300)
        throw new Error('Platform description may not exceed 300 characters.');
      const res = await api.updateAppSettings([
        { id: 'general_app_name', value: platformName.trim() },
        { id: 'general_website_url', value: websiteUrl.trim() },
        { id: 'general_support_email', value: supportEmail.trim() },
        { id: 'general_admin_email', value: adminEmail.trim() },
        { id: 'general_support_phone', value: contactPhone.trim() },
        { id: 'general_support_whatsapp', value: supportWhatsapp.trim() },
        { id: 'general_support_hours', value: supportHours.trim() },
        { id: 'general_support_address', value: address.trim() },
        { id: 'sys_maintenance_mode', value: maintenanceMode },
        { id: 'platform_description', value: platformDescription.trim() },
      ]);

      if (!res.success) {
        showToast(res.error || 'Failed to save settings. Please try again.');
        return;
      }

      try {
        await checkMaintenanceMode();
      } catch {
        showToast(
          'Settings were saved, but the live settings refresh failed. Refresh the page.',
          'info'
        );
        return;
      }

      if (currentAdmin) {
        try {
          await api.logAdminActivity({
            action: 'SETTINGS_UPDATE',
            entityType: 'settings',
            entityId: 'general_settings',
            entityName: 'General Platform Settings',
            details: { platformName, websiteUrl, maintenanceMode },
            adminUser: currentAdmin,
          });
        } catch {
          /* Persistence already succeeded; audit delivery must not report a false save failure. */
        }
      }
      showToast('Settings saved successfully! Configuration saved in the database.', 'success');
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      endOperation();
    }
  };

  // --------------------------------------------------------------------------
  // Save SMTP Settings
  // --------------------------------------------------------------------------
  const handleSaveSMTP = async () => {
    if (!beginOperation()) return;
    try {
      validateSmtpReference(smtpHost, smtpPort);
      const res = await api.updateAppSettings([
        { id: 'smtp_provider', value: smtpProvider },
        { id: 'smtp_host', value: smtpHost },
        { id: 'smtp_port', value: smtpPort },
        { id: 'smtp_encryption', value: smtpEncryption },
      ]);

      if (!res.success) {
        showToast(res.error || 'Failed to save SMTP configuration.');
        return;
      }

      showToast(
        'SMTP reference settings saved. Email delivery is not enabled by this form.',
        'success'
      );
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to save SMTP configuration.');
    } finally {
      endOperation();
    }
  };

  const handleSaveBranding = async () => {
    if (!beginOperation()) return;
    try {
      validatePresentation(themeMode, fontFamily);
      validateBrandColors([primaryColor, secondaryColor, accentColor]);
      const result = await api.updateAppSettings([
        { id: 'primary_color', value: primaryColor },
        { id: 'secondary_color', value: secondaryColor },
        { id: 'accent_color', value: accentColor },
        { id: 'theme_mode', value: themeMode },
        { id: 'font_family', value: fontFamily },
      ]);
      if (!result.success) throw new Error(result.error || 'Brand colors were not saved.');
      try {
        await checkMaintenanceMode();
      } catch {
        showToast('Branding saved, but runtime refresh failed. Refresh the page.', 'info');
        return;
      }
      showToast(
        'Default theme and font saved. Existing user theme choices are preserved; colors remain palette previews.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Branding save failed.');
    } finally {
      endOperation();
    }
  };
  const handleSaveSEO = async () => {
    if (!beginOperation()) return;
    try {
      validateSeoSettings(metaTitle, metaDescription, searchConsoleToken);
      const result = await api.updateAppSettings([
        { id: 'seo_meta_title', value: metaTitle.trim() },
        { id: 'seo_meta_description', value: metaDescription.trim() },
        { id: 'seo_google_tag', value: searchConsoleToken.trim() },
      ]);
      if (!result.success) throw new Error(result.error || 'SEO settings were not saved.');
      try {
        await checkMaintenanceMode();
      } catch {
        showToast('SEO saved, but live refresh failed. Refresh the page.', 'info');
        return;
      }
      showToast(
        'SEO defaults saved. Page-specific metadata is preserved; Search Console ownership is not automatically verified.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'SEO save failed.');
    } finally {
      endOperation();
    }
  };
  const handleSavePayment = async () => {
    if (!beginOperation()) return;
    try {
      const result = await api.updatePaymentGatewayConfig({
        gateway: 'razorpay',
        keyId: rzpKeyId,
        isActive: rzpIsActive,
      });
      if (!result.success) throw new Error(result.error || 'Payment configuration was not saved.');
      showToast('Payment gateway settings saved and confirmed by the backend.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Payment save failed.');
    } finally {
      endOperation();
    }
  };

  const handleSaveIntegrations = async () => {
    if (!beginOperation()) return;
    try {
      const result = await api.updateAppSettings([
        { id: 'gateway_fast2sms_enabled', value: fast2smsEnabled },
        { id: 'gateway_fast2sms_route', value: fast2smsRoute },
        { id: 'gateway_fast2sms_sender_id', value: fast2smsSenderId.trim() || 'FSTSMS' },
        { id: 'gateway_fcm_enabled', value: fcmEnabled },
        { id: 'gateway_fcm_project_id', value: fcmProjectId.trim() },
        { id: 'gateway_fcm_vapid_key', value: fcmVapidKey.trim() },
      ]);
      if (!result.success) throw new Error(result.error || 'Gateway configuration was not saved.');
      try {
        await checkMaintenanceMode();
      } catch {
        // non-blocking
      }
      showToast('SMS & Push Gateway settings saved successfully in the database!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gateway save failed.');
    } finally {
      endOperation();
    }
  };

  const handleSendTestEmail = () =>
    showToast('Email delivery is not configured through this page. No message was sent.', 'info');
  const handleConfirmClearCache = async () => {
    if (!beginOperation()) return;
    setIsClearingCache(true);
    try {
      await clearOfflineCache();
      setShowClearCacheModal(false);
      showToast(
        'Local offline cache cleared. Sign-in sessions and server caches were not changed.',
        'success'
      );
    } catch {
      showToast('Browser storage could not be cleared. No success was confirmed.');
    } finally {
      setIsClearingCache(false);
      endOperation();
    }
  };
  const persistAsset = async (kind: 'logo' | 'favicon', value: string | null) => {
    const result = await api.updateAppSettings([
      { id: kind === 'logo' ? 'general_platform_logo' : 'general_favicon', value },
    ]);
    if (!result.success) throw new Error(result.error || 'Asset setting was not saved.');
    if (kind === 'logo') setPlatformLogo(value);
    else setFavicon(value);
    try {
      await checkMaintenanceMode();
    } catch {
      throw new Error('Asset setting saved, but live refresh failed. Refresh the page.');
    }
  };
  const uploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'favicon') => {
    const input = e.currentTarget,
      file = input.files?.[0];
    if (!file || !beginOperation()) return;
    try {
      validateSettingsImage(file, kind);
      const url = await uploadQuestionImage(file);
      if (!url.startsWith('https://'))
        throw new Error('Upload did not return a durable HTTPS storage URL.');
      await persistAsset(kind, url);
      showToast(
        'Asset uploaded and saved. Platform navigation and favicon use the saved assets.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Asset upload failed.');
    } finally {
      input.value = '';
      endOperation();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => uploadAsset(e, 'logo');
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => uploadAsset(e, 'favicon');
  const removeAsset = async (kind: 'logo' | 'favicon') => {
    if (!beginOperation()) return;
    try {
      await persistAsset(kind, null);
      showToast(
        'Asset setting removed from the database. Stored files were not deleted.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Asset removal failed.');
    } finally {
      endOperation();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !beginOperation()) return;
    setIsUploadingAvatar(true);
    try {
      validateSettingsImage(file, 'avatar');
      const url = await uploadQuestionImage(file);
      if (!url.startsWith('https://'))
        throw new Error('Upload did not return a durable HTTPS storage URL.');
      if (updateProfile) {
        const res = await updateProfile({ avatarUrl: url });
        if (res?.error) throw res.error;
      }
      showToast('Super Admin profile picture updated successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Avatar upload failed.');
    } finally {
      input.value = '';
      setIsUploadingAvatar(false);
      endOperation();
    }
  };

  const handleRemoveAvatar = async () => {
    if (!beginOperation()) return;
    setIsUploadingAvatar(true);
    try {
      if (updateProfile) {
        const res = await updateProfile({ avatarUrl: '' });
        if (res?.error) throw res.error;
      }
      showToast('Profile picture removed.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove avatar.');
    } finally {
      setIsUploadingAvatar(false);
      endOperation();
    }
  };

  // Do not expose editable defaults when the authoritative load failed or is pending.

  return {
    currentAdmin,
    adminRole,
    canManageSettings,
    toastKind,
    activeTab,
    setActiveTab,
    toastMessage,
    isSaving,
    isLoadingSettings,
    settingsLoadError,
    platformName,
    setPlatformName,
    websiteUrl,
    setWebsiteUrl,
    adminEmail,
    setAdminEmail,
    supportEmail,
    setSupportEmail,
    contactPhone,
    setContactPhone,
    supportWhatsapp,
    setSupportWhatsapp,
    supportHours,
    setSupportHours,
    address,
    setAddress,
    timezone,
    language,
    platformDescription,
    setPlatformDescription,
    maintenanceMode,
    setMaintenanceMode,
    platformLogo,
    favicon,
    isUploadingAvatar,
    avatarInputRef,
    logoInputRef,
    faviconInputRef,
    featureToggles,
    toggleFeature,
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
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    searchConsoleToken,
    setSearchConsoleToken,
    smtpProvider,
    setSmtpProvider,
    smtpHost,
    setSmtpHost,
    smtpPort,
    setSmtpPort,
    smtpEncryption,
    setSmtpEncryption,
    isSendingTestEmail,
    appVersion,
    rzpKeyId,
    setRzpKeyId,
    rzpIsActive,
    setRzpIsActive,
    currency,
    taxPercent,
    invoicePrefix,
    showClearCacheModal,
    setShowClearCacheModal,
    isClearingCache,
    fast2smsEnabled,
    setFast2smsEnabled,
    fast2smsRoute,
    setFast2smsRoute,
    fast2smsSenderId,
    setFast2smsSenderId,
    fcmEnabled,
    setFcmEnabled,
    fcmProjectId,
    setFcmProjectId,
    fcmVapidKey,
    setFcmVapidKey,
    loadSettings,
    handleSaveGeneral,
    handleSaveSMTP,
    handleSaveBranding,
    handleSaveSEO,
    handleSavePayment,
    handleSaveIntegrations,
    handleSendTestEmail,
    handleConfirmClearCache,
    handleLogoUpload,
    handleFaviconUpload,
    removeAsset,
    handleAvatarUpload,
    handleRemoveAvatar,
  };
}

export type AdminSettingsState = ReturnType<typeof useAdminSettings>;
