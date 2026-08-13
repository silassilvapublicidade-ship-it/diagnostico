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

describe("ensureInitialProduct", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("creates the product and price on first call", async () => {
    const { ensureInitialProduct } = await import("@/modules/billing/persistence");
    const resolved = await ensureInitialProduct();

    expect(resolved.amountCents).toBe(999);
    expect(resolved.currency).toBe("BRL");
    expect(harness.store.products).toHaveLength(1);
    expect(harness.store.product_prices).toHaveLength(1);
  });

  it("is idempotent -- a second call reuses the same rows instead of duplicating them", async () => {
    const { ensureInitialProduct } = await import("@/modules/billing/persistence");
    const first = await ensureInitialProduct();
    const second = await ensureInitialProduct();

    expect(second.productId).toBe(first.productId);
    expect(second.priceId).toBe(first.priceId);
    expect(harness.store.products).toHaveLength(1);
    expect(harness.store.product_prices).toHaveLength(1);
  });
});

describe("ensureOrderForDiagnosis", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("creates a new order and links it to the request", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "waiting_payment",
      order_id: null,
    });

    const { ensureOrderForDiagnosis } = await import("@/modules/billing/persistence");
    const order = await ensureOrderForDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
      userEmail: "cliente@example.com",
    });

    expect(order.amountCents).toBe(999);
    expect(order.currency).toBe("BRL");

    const updatedRequest = (harness.store.analysis_requests ?? [])[0]!;
    expect(updatedRequest.order_id).toBe(order.orderId);

    const storedOrder = (harness.store.orders ?? [])[0]!;
    expect(storedOrder.customer_email).toBe("cliente@example.com");
    expect(storedOrder.status).toBe("draft");
    expect(storedOrder.amount_cents).toBe(999);
  });

  it("reuses the existing order on refresh instead of creating a duplicate", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "waiting_payment",
      order_id: null,
    });

    const { ensureOrderForDiagnosis } = await import("@/modules/billing/persistence");
    const first = await ensureOrderForDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
      userEmail: "cliente@example.com",
    });
    const second = await ensureOrderForDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
      userEmail: "cliente@example.com",
    });

    expect(second.orderId).toBe(first.orderId);
    expect(harness.store.orders).toHaveLength(1);
  });

  it("does not reuse an order that already belongs to a different diagnosis's owner", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "waiting_payment",
      order_id: null,
    });

    const { ensureOrderForDiagnosis } = await import("@/modules/billing/persistence");

    await expect(
      ensureOrderForDiagnosis({
        requestId: request.id as string,
        userId: "someone-else",
        userEmail: "atacante@example.com",
      }),
    ).rejects.toThrow();
  });

  it("uses the price from product_prices, never a value the caller could supply", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "waiting_payment",
      order_id: null,
    });

    const { ensureOrderForDiagnosis } = await import("@/modules/billing/persistence");
    // The function signature does not accept an amount/currency at all --
    // this documents that intent rather than exercising new behavior.
    const order = await ensureOrderForDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
      userEmail: "cliente@example.com",
    });

    expect(order.amountCents).toBe(999);
  });
});
