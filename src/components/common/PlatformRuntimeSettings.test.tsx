import { cleanup, render, waitFor } from '@testing-library/react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  settings: [] as { id: string; value: unknown }[],
  apply: vi.fn(),
  loaded: true,
}));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({
    appSettings: m.settings,
    hasLoadedSettings: m.loaded,
    appName: 'Fixture Platform',
  }),
}));
vi.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ setPlatformDefault: m.apply }) }));
import { PlatformRuntimeSettings } from './PlatformRuntimeSettings';
beforeEach(() => {
  m.settings = [];
  m.loaded = true;
  m.apply.mockReset();
});
afterEach(cleanup);
it('renders saved defaults, verification token, theme and an allowlisted font', async () => {
  m.settings = [
    { id: 'seo_meta_title', value: 'Saved Title' },
    { id: 'seo_meta_description', value: 'Saved description' },
    { id: 'seo_google_tag', value: 'safe_token_fixture' },
    { id: 'theme_mode', value: 'dark' },
    { id: 'font_family', value: 'System UI' },
  ];
  const old = document.createElement('meta');
  old.name = 'description';
  old.content = 'Stale static description';
  document.head.appendChild(old);
  const r = render(
    <HelmetProvider>
      <PlatformRuntimeSettings />
    </HelmetProvider>
  );
  await waitFor(() => expect(document.title).toBe('Saved Title'));
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
    'content',
    'Saved description'
  );
  expect(document.head.querySelector('meta[name="google-site-verification"]')).toHaveAttribute(
    'content',
    'safe_token_fixture'
  );
  expect(m.apply).toHaveBeenCalledWith('dark');
  expect(document.documentElement.style.getPropertyValue('--font-sans')).toContain('system-ui');
  r.unmount();
  expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe('');
  old.remove();
});
it('removes cleared verification settings', async () => {
  m.settings = [
    { id: 'seo_meta_title', value: 'Default Title' },
    { id: 'seo_google_tag', value: 'safe_token_fixture' },
  ];
  const r = render(
    <HelmetProvider>
      <PlatformRuntimeSettings />
    </HelmetProvider>
  );
  await waitFor(() => expect(document.title).toBe('Default Title'));
  m.settings = [];
  r.rerender(
    <HelmetProvider>
      <PlatformRuntimeSettings />
    </HelmetProvider>
  );
  await waitFor(() =>
    expect(document.querySelector('meta[name="google-site-verification"]')).toBeNull()
  );
});
it('never treats raw HTML or arbitrary CSS font values as executable settings', async () => {
  m.settings = [
    { id: 'seo_google_tag', value: '<script>alert(1)</script>' },
    { id: 'font_family', value: 'url(https://evil.invalid/x)' },
  ];
  render(
    <HelmetProvider>
      <PlatformRuntimeSettings />
    </HelmetProvider>
  );
  await waitFor(() => expect(document.title).toContain('Fixture Platform'));
  expect(document.querySelector('meta[name="google-site-verification"]')).toBeNull();
  expect(document.documentElement.style.getPropertyValue('--font-sans')).not.toContain('evil');
});
it('keeps a page title and description when the platform defaults load after the page', async () => {
  m.settings = [
    { id: 'seo_meta_title', value: 'Platform Default' },
    { id: 'seo_meta_description', value: 'Platform description' },
  ];
  // Settings arrive from the network after the page has already mounted
  m.loaded = false;
  const page = () => (
    <HelmetProvider>
      <PlatformRuntimeSettings />
      <Helmet>
        <title>Article Title</title>
        <meta name="description" content="Article description" />
      </Helmet>
    </HelmetProvider>
  );
  const r = render(page());
  m.loaded = true;
  r.rerender(page());
  // Wait until the platform defaults are in the head, then check the page still wins
  await waitFor(() =>
    expect(document.head.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Fixture Platform'
    )
  );
  expect(document.title).toBe('Article Title');
  expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
    'content',
    'Article description'
  );
});
