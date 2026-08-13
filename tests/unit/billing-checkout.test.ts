import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  create: vi.fn<(args: unknown) => Promise<{ id?: string; init_point?: string }>>(
    async () => ({
      id: "pref-123",
      init_point: "https://mp.example/checkout/pref-123",
    }),
  ),
}));

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: class {
    constructor(public config: unknown) {}
  },
  Preference: class {
    constructor(public config: unknown) {}
    create(args: unknown) {
      return harness.create(args);
    }
  },
}));

type PreferenceCreateCall = {
  body: {
    items: Array<{ unit_price: number; currency_id: string }>;
    external_reference: string;
    back_urls: { success: string; failure: string; pending: string };
    notification_url: string;
  };
};

function lastCall(): PreferenceCreateCall {
  return harness.create.mock.calls.at(-1)?.[0] as PreferenceCreateCall;
}

describe("createCheckoutPreference", () => {
  beforeEach(() => {
    harness.create.mockReset();
    harness.create.mockResolvedValue({
      id: "pref-123",
      init_point: "https://mp.example/checkout/pref-123",
    });
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "TEST-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("converts amount_cents to a decimal reais unit_price, never cents", async () => {
    const { createCheckoutPreference } = await import("@/modules/billing/checkout");

    await createCheckoutPreference({
      orderId: "order-1",
      requestId: "req-1",
      amountCents: 999,
      currency: "BRL",
    });

    expect(lastCall().body.items[0]!.unit_price).toBe(9.99);
    expect(lastCall().body.items[0]!.currency_id).toBe("BRL");
  });

  it("sets external_reference to the order id, not anything client-supplied", async () => {
    const { createCheckoutPreference } = await import("@/modules/billing/checkout");

    await createCheckoutPreference({
      orderId: "order-1",
      requestId: "req-1",
      amountCents: 999,
      currency: "BRL",
    });

    expect(lastCall().body.external_reference).toBe("order-1");
  });

  it("points back_urls and notification_url at the real production domain", async () => {
    const { createCheckoutPreference } = await import("@/modules/billing/checkout");

    await createCheckoutPreference({
      orderId: "order-1",
      requestId: "req-1",
      amountCents: 999,
      currency: "BRL",
    });

    const { back_urls, notification_url } = lastCall().body;
    expect(back_urls.success).toContain("diagnostico.silassilva.click/app/diagnosticos/req-1");
    expect(notification_url).toBe(
      "https://diagnostico.silassilva.click/api/webhooks/mercado-pago",
    );
  });

  it("returns the preference id and init_point from the SDK response", async () => {
    const { createCheckoutPreference } = await import("@/modules/billing/checkout");

    const result = await createCheckoutPreference({
      orderId: "order-1",
      requestId: "req-1",
      amountCents: 999,
      currency: "BRL",
    });

    expect(result).toEqual({
      preferenceId: "pref-123",
      initPoint: "https://mp.example/checkout/pref-123",
    });
  });

  it("throws if Mercado Pago does not return an id/init_point", async () => {
    harness.create.mockResolvedValueOnce({});
    const { createCheckoutPreference } = await import("@/modules/billing/checkout");

    await expect(
      createCheckoutPreference({
        orderId: "order-1",
        requestId: "req-1",
        amountCents: 999,
        currency: "BRL",
      }),
    ).rejects.toThrow();
  });
});
