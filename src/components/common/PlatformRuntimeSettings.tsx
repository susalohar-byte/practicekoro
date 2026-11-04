import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useTheme } from '@/context/ThemeContext';
import { PLATFORM_FONTS, presentationSettings } from '@/utils/platformPresentation';
/** Defaults only: route-specific SEO and explicit user theme preferences retain precedence. */
export function PlatformRuntimeSettings() {
  const { appSettings, hasLoadedSettings, appName } = useMaintenance();
  const { setPlatformDefault } = useTheme();
  const values = presentationSettings(appSettings);
  useEffect(() => {
    if (!hasLoadedSettings) return;
    setPlatformDefault(values.theme);
  }, [hasLoadedSettings, values.theme, setPlatformDefault]);
  useEffect(() => {
    if (!hasLoadedSettings) return;
    const root = document.documentElement;
    const old = root.style.getPropertyValue('--font-sans');
    root.style.setProperty('--font-sans', PLATFORM_FONTS[values.font]);
    return () => {
      if (old) root.style.setProperty('--font-sans', old);
      else root.style.removeProperty('--font-sans');
    };
  }, [hasLoadedSettings, values.font]);
  useEffect(() => {
    if (!hasLoadedSettings) return;
    // Initial HTML metadata is not Helmet-owned. Remove duplicates once runtime tags take over.
    const originals = Array.from(
      document.head.querySelectorAll(
        'meta:not([data-rh])[name="description"],meta:not([data-rh])[name="google-site-verification"],meta:not([data-rh])[name="twitter:title"],meta:not([data-rh])[name="twitter:description"],meta:not([data-rh])[property="og:title"],meta:not([data-rh])[property="og:description"],meta:not([data-rh])[property="og:site_name"]'
      )
    );
    originals.forEach((node) => node.remove());
    return () => {
      originals.forEach((node) => document.head.appendChild(node));
    };
  }, [hasLoadedSettings]);
  // Mount an (empty) Helmet from the first render so it registers before any page's Helmet.
  // react-helmet-async lets the last-registered instance win, so page titles and descriptions
  // (landing, blog articles, policies) then override these defaults instead of the reverse.
  if (!hasLoadedSettings) return <Helmet />;
  const title =
    values.title ||
    `${appName} | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ & Solutions`;
  const description =
    values.description ||
    'পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।';
  const siteName = values.title ? appName : appName === 'PracticeKoro' ? 'Practice Koro' : appName;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {/^[A-Za-z0-9_-]{10,200}$/.test(values.verification) && (
        <meta name="google-site-verification" content={values.verification} />
      )}
    </Helmet>
  );
}
