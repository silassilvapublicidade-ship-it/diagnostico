import { beforeEach, describe, expect, it, vi } from "vitest";

import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import { resetFakeStore } from "../mocks/persistence-harness";

const harness = vi.hoisted(() => ({ store: {} as FakeStore }));

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

function seedRequestWithOrder(overrides: {
  requestUserId?: string;
  orderUserId?: string;
  orderStatus?: string;
  orderAmountCents?: number;
  orderCurrency?: string;
  paymentStatus?: string | null;
  paymentAmountCents?: number;
  paymentCurrency?: string;
  linkOrder?: boolean;
} = {}) {
  const requestUserId = overrides.requestUserId ?? "user-1";
  const orderUserId = overrides.orderUserId ?? requestUserId;
  const orderAmountCents = overrides.orderAmountCents ?? 999;
  const orderCurrency = overrides.orderCurrency ?? "BRL";

  const order = seedRow(harness.store, "orders", {
    user_id: orderUserId,
    status: overrides.orderStatus ?? "paid",
    amount_cents: orderAmountCents,
    currency: orderCurrency,
  });

  if (overrides.paymentStatus !== null) {
    seedRow(harness.store, "payments", {
      order_id: order.id,
      status: overrides.paymentStatus ?? "approved",
      amount_cents: overrides.paymentAmountCents ?? orderAmountCents,
      currency: overrides.paymentCurrency ?? orderCurrency,
    });
  }

  const request = seedRow(harness.store, "analysis_requests", {
    user_id: requestUserId,
    status: "waiting_payment",
    order_id: overrides.linkOrder === false ? null : order.id,
  });

  return { request, order };
}

describe("assertDiagnosisCanBeProcessed", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("blocks when the request has no order at all", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "waiting_payment",
      order_id: null,
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("blocks when the order exists but is not paid", async () => {
    const { request } = seedRequestWithOrder({
      orderStatus: "pending",
      paymentStatus: "pending",
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("blocks when the payment is rejected even if the order says paid", async () => {
    const { request } = seedRequestWithOrder({
      orderStatus: "paid",
      paymentStatus: "rejected",
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("allows processing when the order is paid and the payment is approved and consistent", async () => {
    const { request } = seedRequestWithOrder({
      orderStatus: "paid",
      paymentStatus: "approved",
    });

    const { assertDiagnosisCanBeProcessed } = await import("@/modules/billing/gate");

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).resolves.toBeUndefined();
  });

  it("blocks when the order belongs to a different user than the caller", async () => {
    const { request } = seedRequestWithOrder({
      requestUserId: "user-1",
      orderUserId: "user-2",
      orderStatus: "paid",
      paymentStatus: "approved",
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("does not let a paid order for a different diagnosis unlock this one", async () => {
    // Diagnosis B is fully paid.
    seedRequestWithOrder({ requestUserId: "user-1", orderStatus: "paid", paymentStatus: "approved" });
    // Diagnosis A has no order of its own.
    const requestA = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "waiting_payment",
      order_id: null,
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(requestA.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("blocks when the approved payment amount does not match the order", async () => {
    const { request } = seedRequestWithOrder({
      orderStatus: "paid",
      orderAmountCents: 999,
      paymentStatus: "approved",
      paymentAmountCents: 500,
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("blocks when the approved payment currency does not match the order", async () => {
    const { request } = seedRequestWithOrder({
      orderStatus: "paid",
      orderCurrency: "BRL",
      paymentStatus: "approved",
      paymentCurrency: "USD",
    });

    const { assertDiagnosisCanBeProcessed, PaymentRequiredError } = await import(
      "@/modules/billing/gate"
    );

    await expect(
      assertDiagnosisCanBeProcessed(request.id as string, "user-1"),
    ).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it("never trusts values that only exist client-side -- there is no parameter for them", async () => {
    // assertDiagnosisCanBeProcessed's signature only accepts (requestId,
    // userId): there is no amount/status/payment_id parameter a caller
    // could pass in, by construction -- this test documents that intent
    // rather than exercising new behavior.
    const { assertDiagnosisCanBeProcessed } = await import("@/modules/billing/gate");
    expect(assertDiagnosisCanBeProcessed.length).toBe(2);
  });
});
