import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const scripts = () =>
  Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="checkout.razorpay.com"]'));

beforeEach(() => {
  vi.resetModules();
  delete window.Razorpay;
  for (const s of scripts()) s.remove();
});
afterEach(() => {
  delete window.Razorpay;
});

describe('loadRazorpay', () => {
  it('resolves at once when Checkout is already loaded', async () => {
    const { loadRazorpay } = await import('./razorpay');
    window.Razorpay = vi.fn() as never;
    await expect(loadRazorpay()).resolves.toBeUndefined();
    expect(scripts()).toHaveLength(0);
  });

  it('injects checkout.js once and shares the pending load', async () => {
    const { loadRazorpay } = await import('./razorpay');
    const a = loadRazorpay();
    const b = loadRazorpay();
    expect(a).toBe(b);
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].src).toBe('https://checkout.razorpay.com/v1/checkout.js');
    scripts()[0].onload?.(new Event('load'));
    await expect(a).resolves.toBeUndefined();
  });

  it('rejects with a readable error and allows a retry after a failed load', async () => {
    const { loadRazorpay } = await import('./razorpay');
    const first = loadRazorpay();
    scripts()[0].onerror?.(new Event('error'));
    await expect(first).rejects.toThrow(
      'Could not load the payment window. Check your connection and try again.'
    );
    const second = loadRazorpay();
    expect(second).not.toBe(first);
    expect(scripts()).toHaveLength(2);
    scripts()[1].onload?.(new Event('load'));
    await expect(second).resolves.toBeUndefined();
  });
});
