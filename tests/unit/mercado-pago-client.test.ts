import { describe, expect, it, vi } from "vitest";

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: class {
    constructor(public config: unknown) {}
  },
}));

describe("createMercadoPagoClient", () => {
  it("throws a clear error when MERCADO_PAGO_ACCESS_TOKEN is not configured", async () => {
    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      getServerEnv: () => ({ MERCADO_PAGO_ACCESS_TOKEN: undefined }),
    }));

    const { createMercadoPagoClient } = await import(
      "@/modules/billing/mercado-pago-client"
    );

    expect(() => createMercadoPagoClient()).toThrow(/MERCADO_PAGO_ACCESS_TOKEN/);

    vi.doUnmock("@/lib/env");
  });

  it("builds a client when the token is present", async () => {
    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      getServerEnv: () => ({ MERCADO_PAGO_ACCESS_TOKEN: "TEST-token" }),
    }));

    const { createMercadoPagoClient } = await import(
      "@/modules/billing/mercado-pago-client"
    );

    expect(() => createMercadoPagoClient()).not.toThrow();

    vi.doUnmock("@/lib/env");
  });
});
