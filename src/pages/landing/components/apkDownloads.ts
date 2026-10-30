/**
 * Android APKs served from the site root (uploaded next to index.html, not built).
 * Most phones run the 64-bit ARM build, a third of the size of the universal one;
 * older 32-bit phones cannot install it, so the universal build stays linked as a fallback.
 */
export const APK_ARM64 = {
  href: '/PracticeKoro-arm64.apk',
  file: 'PracticeKoro.apk',
  size: '25 MB',
};
export const APK_UNIVERSAL = { href: '/PracticeKoro.apk', file: 'PracticeKoro.apk', size: '64 MB' };
