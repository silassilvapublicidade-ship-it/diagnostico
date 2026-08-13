import { beforeEach, describe, expect, it, vi } from "vitest";

import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import { resetFakeStore } from "../mocks/persistence-harness";
import type { FetchedPayment } from "@/modules/billing/payments-client";

const harness = vi.hoisted(() => ({
  store: {} as FakeStore,
  fetchedPayment: null as FetchedPayment | null,
}));

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

vi.mock("@/modules/billing/payments-client", () => ({
  fetchMercadoPagoPayment: async () => harness.fetchedPayment,
}));

function seedOrder(overrides: Partial<{
  amountCents: number;
  currency: string;
  status: string;
  provider: string;
}> = {}) {
  return seedRow(harness.store, "orders", {
    user_id: "user-1",
    status: overrides.status ?? "pending",
    amount_cents: overrides.amountCents ?? 999,
    currency: overrides.currency ?? "BRL",
    provider: overrides.provider ?? "mercado_pago",
  });
}

function seedWaitingRequest(orderId: string) {
  return seedRow(harness.store, "analysis_requests", {
    user_id: "user-1",
    status: "waiting_payment",
    order_id: orderId,
  });
}

function fetchedPaymentFor(
  order: { id: unknown },
  overrides: Partial<FetchedPayment> = {},
): FetchedPayment {
  return {
    id: 555,
    status: "approved",
    externalReference: order.id as string,
    transactionAmount: 9.99,
    currencyId: "BRL",
    ...overrides,
  };
}

describe("applyPaymentNotification", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    harness.fetchedPayment = null;
  });

  it("approves: order becomes paid and a waiting_payment request is released to ready", async () => {
    const order = seedOrder();
    const request = seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "approved" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    const outcome = await applyPaymentNotification("555");

    expect(outcome).toMatchObject({ kind: "applied", mappedStatus: "approved", requestReleased: true });
    expect((harness.store.orders ?? [])[0]!.status).toBe("paid");
    expect((harness.store.analysis_requests ?? [])[0]!.status).toBe("ready");
    expect((harness.store.payments ?? [])[0]!.status).toBe("approved");
    void request;
  });

  it("pending: never releases the request and leaves the order as-is", async () => {
    const order = seedOrder({ status: "pending" });
    seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "pending" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    await applyPaymentNotification("555");

    expect((harness.store.orders ?? [])[0]!.status).toBe("pending");
    expect((harness.store.analysis_requests ?? [])[0]!.status).toBe("waiting_payment");
  });

  it("rejected: marks the order failed and never releases the request", async () => {
    const order = seedOrder();
    seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "rejected" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    await applyPaymentNotification("555");

    expect((harness.store.orders ?? [])[0]!.status).toBe("failed");
    expect((harness.store.analysis_requests ?? [])[0]!.status).toBe("waiting_payment");
  });

  it("refunded: marks the order refunded, never releases, and never touches an existing analysis_result", async () => {
    const order = seedOrder({ status: "paid" });
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "completed",
      order_id: order.id,
    });
    const existingResult = seedRow(harness.store, "analysis_results", {
      analysis_request_id: request.id,
      result_sequence: 1,
      score: 71,
    });
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "refunded" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    await applyPaymentNotification("555");

    expect((harness.store.orders ?? [])[0]!.status).toBe("refunded");
    // completed status is untouched -- refund never regresses/alters the
    // already-delivered request or its result.
    expect((harness.store.analysis_requests ?? [])[0]!.status).toBe("completed");
    expect((harness.store.analysis_results ?? [])[0]).toEqual(existingResult);
  });

  it("charged_back: marks the order refunded (closest existing representation) and never releases", async () => {
    const order = seedOrder({ status: "paid" });
    seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "charged_back" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    await applyPaymentNotification("555");

    expect((harness.store.orders ?? [])[0]!.status).toBe("refunded");
  });

  it("amount mismatch: records the payment but never authorizes the order or releases the request", async () => {
    const order = seedOrder({ amountCents: 999 });
    seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, {
      status: "approved",
      transactionAmount: 5.0, // 500 cents, does not match the order's 999
    });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    const outcome = await applyPaymentNotification("555");

    expect(outcome).toMatchObject({ kind: "ignored", reason: "amount_or_currency_mismatch" });
    expect((harness.store.orders ?? [])[0]!.status).not.toBe("paid");
    expect((harness.store.analysis_requests ?? [])[0]!.status).toBe("waiting_payment");
    // The payment itself is still recorded -- what Mercado Pago actually
    // reported, for later reconciliation.
    expect((harness.store.payments ?? [])[0]!.amount_cents).toBe(500);
  });

  it("currency mismatch: never authorizes the order or releases the request", async () => {
    const order = seedOrder({ currency: "BRL" });
    seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, {
      status: "approved",
      currencyId: "USD",
    });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    const outcome = await applyPaymentNotification("555");

    expect(outcome).toMatchObject({ kind: "ignored", reason: "amount_or_currency_mismatch" });
    expect((harness.store.orders ?? [])[0]!.status).not.toBe("paid");
  });

  it("invalid external_reference / order not found: writes nothing at all", async () => {
    harness.fetchedPayment = {
      id: 555,
      status: "approved",
      externalReference: "00000000-0000-0000-0000-000000000000",
      transactionAmount: 9.99,
      currencyId: "BRL",
    };

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    const outcome = await applyPaymentNotification("555");

    expect(outcome).toMatchObject({ kind: "ignored", reason: "order_not_found" });
    expect(harness.store.payments ?? []).toHaveLength(0);
  });

  it("does not touch an unrelated second order or its request", async () => {
    const targetOrder = seedOrder();
    const otherOrder = seedOrder();
    const otherRequest = seedWaitingRequest(otherOrder.id as string);
    seedWaitingRequest(targetOrder.id as string);
    harness.fetchedPayment = fetchedPaymentFor(targetOrder, { status: "approved" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    await applyPaymentNotification("555");

    const otherOrderRow = (harness.store.orders ?? []).find((o) => o.id === otherOrder.id)!;
    const otherRequestRow = (harness.store.analysis_requests ?? []).find(
      (r) => r.id === otherRequest.id,
    )!;
    expect(otherOrderRow.status).toBe("pending");
    expect(otherRequestRow.status).toBe("waiting_payment");
  });

  it("duplicate delivery of the same payment_id is idempotent -- no duplicate rows", async () => {
    const order = seedOrder();
    seedWaitingRequest(order.id as string);
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "approved" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    await applyPaymentNotification("555");
    await applyPaymentNotification("555");

    expect(harness.store.payments ?? []).toHaveLength(1);
  });

  it("converges to the current fetched state regardless of call order (never a stale regression)", async () => {
    const order = seedOrder();
    seedWaitingRequest(order.id as string);

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");

    // First delivery reports "pending" (payment not finished yet).
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "pending" });
    await applyPaymentNotification("555");
    expect((harness.store.orders ?? [])[0]!.status).toBe("pending");

    // A later delivery -- possibly the same notification retried, possibly
    // a second one -- re-fetches and now finds "approved". It must apply,
    // never be blocked by the earlier pending write.
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "approved" });
    await applyPaymentNotification("555");
    expect((harness.store.orders ?? [])[0]!.status).toBe("paid");
    expect((harness.store.analysis_requests ?? [])[0]!.status).toBe("ready");
  });

  it("never regresses a request already past waiting_payment", async () => {
    const order = seedOrder({ status: "paid" });
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "processing",
      order_id: order.id,
    });
    harness.fetchedPayment = fetchedPaymentFor(order, { status: "approved" });

    const { applyPaymentNotification } = await import("@/modules/billing/webhook");
    const outcome = await applyPaymentNotification("555");

    expect(outcome).toMatchObject({ requestReleased: false });
    const updated = (harness.store.analysis_requests ?? []).find((r) => r.id === request.id)!;
    expect(updated.status).toBe("processing");
  });
});
