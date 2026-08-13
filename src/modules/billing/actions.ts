"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/modules/auth/session";

import { createCheckoutPreference } from "./checkout";
import { ensureOrderForDiagnosis, recordCheckoutPreference } from "./persistence";

/**
 * Starts (or resumes) the Mercado Pago checkout for a diagnosis. Never runs
 * a real charge itself -- it only creates/reuses an order and a Checkout
 * Pro preference, then redirects the buyer to Mercado Pago's own hosted
 * page. The order stays "pending" until the (not yet implemented) webhook
 * confirms an approved payment; nothing here marks anything as paid.
 */
export async function startCheckoutAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    redirect("/app/diagnosticos");
  }

  const user = await requireUser();

  let initPoint: string;

  try {
    const order = await ensureOrderForDiagnosis({
      requestId,
      userId: user.id,
      userEmail: user.email ?? "",
    });

    const preference = await createCheckoutPreference({
      orderId: order.orderId,
      requestId,
      amountCents: order.amountCents,
      currency: order.currency,
    });

    await recordCheckoutPreference({
      orderId: order.orderId,
      preferenceId: preference.preferenceId,
      initPoint: preference.initPoint,
    });

    initPoint = preference.initPoint;
  } catch (error) {
    console.error("[billing] failed to start checkout", error);
    redirect(
      `/app/diagnosticos/${requestId}?erro=${encodeURIComponent(
        "Nao foi possivel iniciar o pagamento agora. Tente novamente.",
      )}`,
    );
  }

  redirect(initPoint);
}
