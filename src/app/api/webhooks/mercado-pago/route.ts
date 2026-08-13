import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { NextResponse, type NextRequest } from "next/server";

import { getServerEnv } from "@/lib/env";
import { applyPaymentNotification } from "@/modules/billing/webhook";

// Public by nature (Mercado Pago calls this, never a logged-in browser) --
// authenticity comes entirely from the signature check below, never from a
// Supabase session. This route must never read cookies/auth state.
export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const url = new URL(request.url);
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!env.MERCADO_PAGO_WEBHOOK_SECRET) {
    console.error("[webhook] MERCADO_PAGO_WEBHOOK_SECRET nao configurado.");
    // 500 so Mercado Pago retries once the secret is actually configured --
    // this is a transient deployment issue, not a permanently invalid
    // request.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId,
      secret: env.MERCADO_PAGO_WEBHOOK_SECRET,
      toleranceSeconds: 300,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      // Never log the header values themselves (they carry no secret, but
      // there is no reason to retain them either) -- only the failure
      // reason and the request id, which Mercado Pago's own notifications
      // dashboard can correlate against.
      console.error(
        `[webhook] rejected: invalid signature (${error.reason}), request-id=${error.requestId ?? "unknown"}`,
      );
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    throw error;
  }

  if (!dataId) {
    console.error("[webhook] valid signature but no data.id in the request.");
    // Not retryable -- an identical retry would still have no data.id.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const outcome = await applyPaymentNotification(dataId);

    if (outcome.kind === "ignored") {
      console.error(`[webhook] ignored payment ${dataId}: ${outcome.reason}`);
    }
  } catch (error) {
    console.error("[webhook] failed to apply payment notification:", error);
    // 500 so Mercado Pago retries -- this branch is reached only for
    // genuinely unexpected failures (network to Mercado Pago's own API,
    // a database write failing), never for "this payment doesn't apply",
    // which applyPaymentNotification already resolves as `{ kind: "ignored" }`
    // without throwing.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
