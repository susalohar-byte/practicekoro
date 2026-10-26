import { afterEach, describe, expect, it, vi } from 'vitest';

async function load(url: string) {
  vi.resetModules();
  vi.stubEnv('VITE_SHARED_LOGIN_URL', url);
  return import('./sharedLogin');
}

describe('shared login', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it('is used when a shared login page is configured', async () => {
    const { shouldUseSharedLogin } = await load('/login');
    expect(shouldUseSharedLogin()).toBe(true);
  });

  it('is not used when it is switched off', async () => {
    const { shouldUseSharedLogin } = await load('');
    expect(shouldUseSharedLogin()).toBe(false);
  });

  it('is not used again right after sending the visitor there, so it cannot loop', async () => {
    const { goToSharedLogin, shouldUseSharedLogin } = await load('/login');
    const replace = vi.fn();
    vi.stubGlobal('location', { ...window.location, replace });
    goToSharedLogin();
    vi.unstubAllGlobals();
    expect(replace).toHaveBeenCalledWith('/login');
    expect(shouldUseSharedLogin()).toBe(false);
  });
});
