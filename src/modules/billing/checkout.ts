import "server-only";

import { Preference } from "mercadopago";

import { SITE_URL } from "@/app/site-config";

import { formatPriceReais, INITIAL_PRODUCT_NAME } from "./index";
import { createMercadoPagoClient } from "./mercado-pago-client";

export type CreatedCheckoutPreference = {
  preferenceId: string;
  initPoint: string;
};

/**
 * Creates a Checkout Pro preference for an already-persisted, already-priced
 * order. Never receives anything the browser could influence: amount and
 * currency come from the order row (itself frozen from product_prices at
 * order-creation time), never recomputed here.
 *
 * external_reference is set to orders.id -- our own primary key -- so the
 * (not-yet-implemented) webhook can look up the order with a direct,
 * indexed PK match instead of a secondary lookup column.
 */
export async function createCheckoutPreference(params: {
  orderId: string;
  requestId: string;
  amountCents: number;
  currency: string;
}): Promise<CreatedCheckoutPreference> {
  const client = createMercadoPagoClient();
  const preference = new Preference(client);
  const returnUrl = `${SITE_URL}/app/diagnosticos/${params.requestId}`;

  const response = await preference.create({
    body: {
      items: [
        {
          id: params.orderId,
          title: INITIAL_PRODUCT_NAME,
          quantity: 1,
          currency_id: params.currency,
          unit_price: formatPriceReais(params.amountCents),
        },
      ],
      external_reference: params.orderId,
      back_urls: {
        success: returnUrl,
        failure: returnUrl,
        pending: returnUrl,
      },
      // Only auto-returns the buyer for approved card payments; Pix/boleto
      // stay on Mercado Pago's own confirmation screen until the buyer
      // clicks back manually -- expected, not a bug to "fix" here.
      auto_return: "approved",
      notification_url: `${SITE_URL}/api/webhooks/mercado-pago`,
    },
  });

  if (!response.id || !response.init_point) {
    throw new Error("Mercado Pago não retornou id/init_point da preference.");
  }

  return { preferenceId: response.id, initPoint: response.init_point };
}
