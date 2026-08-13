import { createHmac } from "node:crypto";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type WebhookOutcome = {
  kind: "applied" | "ignored";
  orderId?: string;
  mappedStatus?: string;
  requestReleased?: boolean;
  reason?: string;
};

const harness = vi.hoisted(() => ({
  applyPaymentNotification: vi.fn<(paymentId: string) => Promise<WebhookOutcome>>(
    async () => ({
      kind: "applied",
      orderId: "order-1",
      mappedStatus: "approved",
      requestReleased: true,
    }),
  ),
}));

vi.mock("@/modules/billing/webhook", () => ({
  applyPaymentNotification: harness.applyPaymentNotification,
}));

const SECRET = "test-webhook-secret";
const ORIGIN = "https://diagnostico.silassilva.click";

function buildSignature(
  dataId: string,
  requestId: string,
  ts: string,
  secret = SECRET,
) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${hash}`;
}

function requestFor(
  params: {
    dataId?: string;
    requestId?: string;
    signature?: string | null;
  } = {},
) {
  const dataId = params.dataId ?? "555";
  const requestId = params.requestId ?? "req-abc";
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature =
    params.signature === undefined
      ? buildSignature(dataId, requestId, ts)
      : params.signature;

  const headers = new Headers();
  if (signature !== null) headers.set("x-signature", signature);
  headers.set("x-request-id", requestId);

  return new NextRequest(
    `${ORIGIN}/api/webhooks/mercado-pago?data.id=${dataId}&type=payment`,
    { method: "POST", headers },
  );
}

describe("POST /api/webhooks/mercado-pago", () => {
  beforeEach(() => {
    harness.applyPaymentNotification.mockReset();
    harness.applyPaymentNotification.mockResolvedValue({
      kind: "applied",
      orderId: "order-1",
      mappedStatus: "approved",
      requestReleased: true,
    });
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("processes a validly-signed notification and returns 200", async () => {
    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(requestFor());

    expect(response.status).toBe(200);
    expect(harness.applyPaymentNotification).toHaveBeenCalledWith("555");
  });

  it("rejects an invalid signature with 401 and never processes the payment", async () => {
    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(requestFor({ signature: "ts=123,v1=deadbeef" }));

    expect(response.status).toBe(401);
    expect(harness.applyPaymentNotification).not.toHaveBeenCalled();
  });

  it("rejects a missing signature header with 401 and never processes the payment", async () => {
    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(requestFor({ signature: null }));

    expect(response.status).toBe(401);
    expect(harness.applyPaymentNotification).not.toHaveBeenCalled();
  });

  it("rejects a signature computed with the wrong secret", async () => {
    const dataId = "555";
    const requestId = "req-abc";
    const ts = Math.floor(Date.now() / 1000).toString();
    const wrongSignature = buildSignature(dataId, requestId, ts, "wrong-secret");

    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(
      requestFor({ dataId, requestId, signature: wrongSignature }),
    );

    expect(response.status).toBe(401);
    expect(harness.applyPaymentNotification).not.toHaveBeenCalled();
  });

  it("acknowledges but does not process when data.id is absent, even with a validly-signed request", async () => {
    const requestId = "req-abc";
    const ts = Math.floor(Date.now() / 1000).toString();
    const manifest = `request-id:${requestId};ts:${ts};`;
    const hash = createHmac("sha256", SECRET).update(manifest).digest("hex");
    const headers = new Headers();
    headers.set("x-signature", `ts=${ts},v1=${hash}`);
    headers.set("x-request-id", requestId);
    const request = new NextRequest(`${ORIGIN}/api/webhooks/mercado-pago`, {
      method: "POST",
      headers,
    });

    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(harness.applyPaymentNotification).not.toHaveBeenCalled();
  });

  it("never exposes the webhook secret in the response body", async () => {
    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(requestFor({ signature: "ts=123,v1=deadbeef" }));
    const body = await response.text();

    expect(body).not.toContain(SECRET);
    expect(body.toLowerCase()).not.toContain("access_token");
  });

  it("returns 500 (retryable) when applying the notification throws unexpectedly", async () => {
    harness.applyPaymentNotification.mockRejectedValueOnce(new Error("network blip"));
    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");
    const response = await POST(requestFor());

    expect(response.status).toBe(500);
  });

  it("returns 500 when the webhook secret itself is not configured, never silently accepting unsigned requests", async () => {
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    const { POST } = await import("@/app/api/webhooks/mercado-pago/route");

    await expect(POST(requestFor())).rejects.toThrow();
  });
});

describe("webhook code paths never reach Anthropic", () => {
  it("route.ts and webhook.ts never import or reference generateAiDiagnosis", async () => {
    const { readFileSync } = await import("node:fs");
    const routeSource = readFileSync(
      new URL("../../src/app/api/webhooks/mercado-pago/route.ts", import.meta.url),
      "utf8",
    );
    const webhookSource = readFileSync(
      new URL("../../src/modules/billing/webhook.ts", import.meta.url),
      "utf8",
    );

    for (const source of [routeSource, webhookSource]) {
      expect(source).not.toContain("generateAiDiagnosis");
      expect(source).not.toContain("@/modules/ai/run-analysis");
    }
  });
});
