import { describe, expect, it } from 'vitest';
import {
  buildPaymentSignaturePayload,
  hmacSha256Hex,
  paiseToRupees,
  rupeesToPaise,
  timingSafeEqualHex,
  verifyHmacSha256,
} from './razorpay-signature';
describe('Razorpay signature helpers', () => {
  it('builds payment payload', () =>
    expect(buildPaymentSignaturePayload('order_1', 'pay_1')).toBe('order_1|pay_1'));
  it('creates stable HMAC', async () =>
    expect(await hmacSha256Hex('payload', 'secret')).toMatch(/^[a-f0-9]{64}$/));
  it('accepts valid signatures', async () => {
    const s = await hmacSha256Hex('payload', 'secret');
    await expect(verifyHmacSha256('payload', s, 'secret')).resolves.toBe(true);
  });
  it('rejects tampering', async () => {
    const s = await hmacSha256Hex('payload', 'secret');
    await expect(verifyHmacSha256('tampered', s, 'secret')).resolves.toBe(false);
  });
  it('rejects malformed input', async () =>
    await expect(verifyHmacSha256('payload', 'not-hex', 'secret')).resolves.toBe(false));
  it('compares safely', () => {
    expect(timingSafeEqualHex('aabb', 'aabb')).toBe(true);
    expect(timingSafeEqualHex('aabb', 'aabc')).toBe(false);
  });
  it('converts paise', () => expect(paiseToRupees(29900)).toBe(299));
  it('rejects invalid amounts', () => expect(() => paiseToRupees(0)).toThrow());
  it('converts rupees to integer paise', () => {
    expect(rupeesToPaise(299)).toBe(29900);
    expect(rupeesToPaise(19.99)).toBe(1999);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });
  it('rejects invalid rupee amounts', () => {
    expect(() => rupeesToPaise(0)).toThrow();
    expect(() => rupeesToPaise(-5)).toThrow();
    expect(() => rupeesToPaise(Number.NaN)).toThrow();
    expect(() => rupeesToPaise(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => rupeesToPaise(0.001)).toThrow();
  });
});
