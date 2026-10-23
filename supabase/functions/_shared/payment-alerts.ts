// Records a server-side payment failure for the Admin Dashboard's Payment health card.
// One open alert per (source, reason); repeats bump its counter. Never throws: alerting
// must not change the outcome of the request that failed.
type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: unknown }>;
};

export async function reportPaymentAlert(
  client: RpcClient,
  source: string,
  reason: string,
  message: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await client.rpc('record_payment_alert', {
      p_kind: 'function_error',
      p_ref: `${source}:${reason}`,
      p_source: source,
      p_message: message,
      p_detail: detail,
    });
    if (error) console.error('Payment alert could not be recorded:', error);
  } catch (err) {
    console.error('Payment alert could not be recorded:', err);
  }
}
