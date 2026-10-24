import { describe, expect, it } from 'vitest';
import {
  DEMO_SUPABASE_ANON_KEY,
  DEMO_SUPABASE_URL,
  isDemoModeAllowedHost,
  isSupabaseEnvValid,
  resolveSupabaseConfig,
} from './envGate';

const real = {
  VITE_SUPABASE_URL: 'https://abc.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'some-key',
};

describe('resolveSupabaseConfig', () => {
  it('uses a real Supabase configuration', () => {
    expect(resolveSupabaseConfig(real, false)).toEqual({
      url: 'https://abc.supabase.co',
      anonKey: 'some-key',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(
      resolveSupabaseConfig(
        { VITE_SUPABASE_URL: ' https://abc.supabase.co ', VITE_SUPABASE_ANON_KEY: ' k ' },
        false
      )
    ).toEqual({ url: 'https://abc.supabase.co', anonKey: 'k' });
  });

  it('never falls back to a production project when settings are missing', () => {
    expect(resolveSupabaseConfig({}, false)).toBeNull();
    expect(
      resolveSupabaseConfig({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }, false)
    ).toBeNull();
    expect(resolveSupabaseConfig({ VITE_SUPABASE_URL: real.VITE_SUPABASE_URL }, false)).toBeNull();
  });

  it('rejects placeholders and non-http URLs', () => {
    expect(
      resolveSupabaseConfig(
        { VITE_SUPABASE_URL: 'https://your-project-ref.supabase.co', VITE_SUPABASE_ANON_KEY: 'x' },
        false
      )
    ).toBeNull();
    expect(
      resolveSupabaseConfig({ VITE_SUPABASE_URL: 'not-a-url', VITE_SUPABASE_ANON_KEY: 'x' }, false)
    ).toBeNull();
  });

  it('gives demo mode an inert local placeholder when settings are missing', () => {
    const config = resolveSupabaseConfig({}, true);
    expect(config).toEqual({ url: DEMO_SUPABASE_URL, anonKey: DEMO_SUPABASE_ANON_KEY });
    expect(config?.url).not.toContain('supabase.co');
  });

  it('keeps real settings in demo mode when they are provided', () => {
    expect(resolveSupabaseConfig(real, true)?.url).toBe('https://abc.supabase.co');
  });
});

describe('isSupabaseEnvValid', () => {
  it('reflects whether a configuration could be resolved', () => {
    expect(isSupabaseEnvValid(real, false)).toBe(true);
    expect(isSupabaseEnvValid({}, false)).toBe(false);
    expect(isSupabaseEnvValid({}, true)).toBe(true);
  });
});

describe('isDemoModeAllowedHost', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', 'app.localhost', 'LOCALHOST'])(
    'allows demo data on loopback host %s',
    (host) => expect(isDemoModeAllowedHost(host)).toBe(true)
  );
  it.each([
    'practicekoro.com',
    'www.practicekoro.com',
    'practicekoro.vercel.app',
    '192.168.1.5',
    'localhost.evil.com',
  ])('refuses demo data on public host %s', (host) =>
    expect(isDemoModeAllowedHost(host)).toBe(false)
  );
});
