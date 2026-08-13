import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { PAYMENT_PROVIDER } from "./index";
import {
  mapMercadoPagoPaymentStatus,
  orderStatusForPayment,
  type MappedPaymentStatus,
} from "./payment-status";
import { fetchMercadoPagoPayment } from "./payments-client";

export type WebhookOutcome =
  | {
      kind: "applied";
      orderId: string;
      mappedStatus: MappedPaymentStatus;
      requestReleased: boolean;
    }
  | { kind: "ignored"; reason: string };

type OrderRow = {
  id: string;
  provider: string;
  amount_cents: number;
  currency: string;
};

async function upsertPayment(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  params: {
    orderId: string;
    providerPaymentId: string;
    status: MappedPaymentStatus;
    amountCents: number;
    currency: string;
  },
): Promise<void> {
  const { data: existing, error: existingError } = await admin
    .from("payments")
    .select("id, paid_at")
    .eq("provider", PAYMENT_PROVIDER)
    .eq("provider_payment_id", params.providerPaymentId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  // Set once, on the first transition into "approved" -- never overwritten
  // by a later duplicate delivery of the same status, and never cleared by
  // a later refund/chargeback (that remains a true historical fact).
  const paidAt =
    params.status === "approved"
      ? ((existing?.paid_at as string | null | undefined) ?? new Date().toISOString())
      : ((existing?.paid_at as string | null | undefined) ?? null);

  if (existing) {
    const { error } = await admin
      .from("payments")
      .update({
        status: params.status,
        amount_cents: params.amountCents,
        currency: params.currency,
        paid_at: paidAt,
      })
      .eq("id", existing.id as string);

    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await admin.from("payments").insert({
    order_id: params.orderId,
    provider: PAYMENT_PROVIDER,
    provider_payment_id: params.providerPaymentId,
    status: params.status,
    amount_cents: params.amountCents,
    currency: params.currency,
    paid_at: paidAt,
  });

  if (error) {
    throw error;
  }
}

/**
 * The single entry point for a Mercado Pago payment notification, called
 * only after the HTTP layer (route.ts) has already validated the webhook
 * signature. Never trusts the notification payload for anything beyond the
 * payment id -- status, amount, currency, and external_reference are all
 * re-read from fetchMercadoPagoPayment's own authoritative response.
 *
 * Idempotent and order-independent by construction: every call re-derives
 * the order/request transition from the *current* fetched state, so
 * duplicate or out-of-order deliveries for the same payment converge to the
 * same result rather than replaying history.
 */
export async function applyPaymentNotification(
  paymentId: string,
): Promise<WebhookOutcome> {
  const payment = await fetchMercadoPagoPayment(paymentId);

  if (!payment.externalReference) {
    return { kind: "ignored", reason: "missing_external_reference" };
  }

  const admin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, provider, amount_cents, currency")
    .eq("id", payment.externalReference)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  if (!order) {
    return { kind: "ignored", reason: "order_not_found" };
  }

  const typedOrder = order as OrderRow;

  if (typedOrder.provider !== PAYMENT_PROVIDER) {
    return { kind: "ignored", reason: "provider_mismatch" };
  }

  if (payment.transactionAmount == null || payment.currencyId == null) {
    // Cannot verify amount/currency at all -- never write a payment row we
    // cannot validate; amount_cents/currency are NOT NULL columns anyway.
    return { kind: "ignored", reason: "missing_amount_or_currency" };
  }

  const paymentAmountCents = Math.round(payment.transactionAmount * 100);
  const amountConsistent = paymentAmountCents === typedOrder.amount_cents;
  const currencyConsistent = payment.currencyId === typedOrder.currency;
  const mappedStatus = mapMercadoPagoPaymentStatus(payment.status);

  // The payment row always reflects what Mercado Pago actually reported --
  // an amount/currency mismatch is a reason to withhold the order/request
  // transition below, not a reason to hide the payment record itself.
  await upsertPayment(admin, {
    orderId: typedOrder.id,
    providerPaymentId: String(payment.id),
    status: mappedStatus,
    amountCents: paymentAmountCents,
    currency: payment.currencyId,
  });

  if (!amountConsistent || !currencyConsistent) {
    return { kind: "ignored", reason: "amount_or_currency_mismatch" };
  }

  const nextOrderStatus = orderStatusForPayment(mappedStatus);

  if (nextOrderStatus) {
    const { error } = await admin
      .from("orders")
      .update({ status: nextOrderStatus })
      .eq("id", typedOrder.id);

    if (error) {
      throw error;
    }
  }

  let requestReleased = false;

  if (mappedStatus === "approved") {
    // Conditional update: only ever moves a request forward from
    // waiting_payment to ready. A request already past that point
    // (processing/completed/failed) is never regressed by a duplicate or
    // late-arriving "approved" delivery for the same order.
    const { data: released, error: releaseError } = await admin
      .from("analysis_requests")
      .update({ status: "ready" })
      .eq("order_id", typedOrder.id)
      .eq("status", "waiting_payment")
      .select("id")
      .maybeSingle();

    if (releaseError) {
      throw releaseError;
    }

    requestReleased = Boolean(released);
  }

  return { kind: "applied", orderId: typedOrder.id, mappedStatus, requestReleased };
}
