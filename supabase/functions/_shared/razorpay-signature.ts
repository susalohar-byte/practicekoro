const encoder = new TextEncoder();
export async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}
export function timingSafeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length)
    return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
export async function verifyHmacSha256(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!payload || !signature || !secret) return false;
  try {
    return timingSafeEqualHex(await hmacSha256Hex(payload, secret), signature);
  } catch {
    return false;
  }
}
export const buildPaymentSignaturePayload = (orderId: string, paymentId: string) =>
  `${orderId}|${paymentId}`;
export function paiseToRupees(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error('Payment amount must be a positive integer in paise');
  return amount / 100;
}
export function rupeesToPaise(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error('Payment amount must be a positive number in rupees');
  const paise = Math.round(amount * 100);
  if (!Number.isSafeInteger(paise) || paise <= 0)
    throw new Error('Payment amount must convert to a positive integer in paise');
  return paise;
}
