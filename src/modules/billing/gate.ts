import "server-only";

import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Thrown whenever a diagnosis is not yet clear to process -- never expose
 * the internal reason to the customer (mirrors how AiAnalysisError messages
 * are handled in run-analysis.ts: logged in detail, generic message shown).
 */
export class PaymentRequiredError extends Error {}

/**
 * Narrow, explicit test-account carve-out. Deliberately NOT used inside
 * assertDiagnosisCanBeProcessed itself, which stays a pure, unconditional
 * check for every real customer -- callers that want to let a specific,
 * already-authenticated test account skip payment must check this
 * themselves at the call site (see persistence.ts and analysis/actions.ts)
 * and decide what to do. Matches only the verified Supabase Auth session
 * email (never anything the browser could send/forge). Empty allowlist by
 * default -- PAYMENT_BYPASS_TEST_EMAILS must be explicitly set.
 *
 * Fails closed: if the environment can't even be read, this returns false
 * (payment still required) rather than throwing -- a config problem must
 * never crash the request or, worse, be handled in a way that ends up
 * skipping payment for someone it shouldn't.
 */
export function isPaymentBypassTestAccount(
  email: string | null | undefined,
): boolean {
  if (!email) {
    return false;
  }

  try {
    return getServerEnv().PAYMENT_BYPASS_TEST_EMAILS.includes(
      email.toLowerCase(),
    );
  } catch {
    return false;
  }
}

/**
 * The single, centralized authorization check for running a real analysis.
 * Everything is reconstructed server-side from the database -- an
 * order_id, payment_id, amount, currency, or status arriving from the
 * browser is never treated as proof of payment; this function never
 * receives or looks at any of that, only requestId/userId.
 *
 * Call this at the very start of every code path that can reach
 * generateAiDiagnosis. As of this phase, runDiagnosisAnalysisAction is the
 * only one (verified by grep across src/ -- see the payment-monetization
 * audit); any future trigger (e.g. the post-payment auto-run planned for
 * the webhook phase) must call this too.
 */
export async function assertDiagnosisCanBeProcessed(
  requestId: string,
  userId: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { data: request, error: requestError } = await admin
    .from("analysis_requests")
    .select("id, user_id, order_id")
    .eq("id", requestId)
    .single();

  if (requestError || !request || request.user_id !== userId) {
    throw new PaymentRequiredError(
      "Diagnostico nao encontrado para este usuario.",
    );
  }

  if (!request.order_id) {
    throw new PaymentRequiredError(
      "Nenhum pedido associado a este diagnostico.",
    );
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, user_id, status, amount_cents, currency")
    .eq("id", request.order_id as string)
    .single();

  if (orderError || !order || order.user_id !== userId) {
    throw new PaymentRequiredError("Pedido invalido para este usuario.");
  }

  // Defense in depth: even if analysis_requests.order_id and orders.id
  // both check out individually, explicitly confirm the order really is
  // the one linked to *this* request -- never trust a payment approved for
  // a different diagnosis, even one owned by the same user.
  if (order.id !== request.order_id) {
    throw new PaymentRequiredError(
      "O pedido nao corresponde a este diagnostico.",
    );
  }

  if (order.status !== "paid") {
    throw new PaymentRequiredError("Pagamento ainda nao confirmado.");
  }

  const { data: payments, error: paymentsError } = await admin
    .from("payments")
    .select("id, status, amount_cents, currency")
    .eq("order_id", order.id as string)
    .eq("status", "approved");

  if (paymentsError) {
    throw paymentsError;
  }

  const hasConsistentApprovedPayment = (payments ?? []).some(
    (payment) =>
      payment.amount_cents === order.amount_cents &&
      payment.currency === order.currency,
  );

  if (!hasConsistentApprovedPayment) {
    throw new PaymentRequiredError(
      "Nenhum pagamento aprovado e consistente encontrado para este pedido.",
    );
  }
}
