import "server-only";

import { Payment } from "mercadopago";

import { createMercadoPagoClient } from "./mercado-pago-client";

export type FetchedPayment = {
  id: number;
  status: string | undefined;
  externalReference: string | undefined;
  transactionAmount: number | undefined;
  currencyId: string | undefined;
};

/**
 * The only correct way to learn a payment's real state: fetch it directly
 * from Mercado Pago's own API using our own access token. A webhook
 * notification only ever supplies the id used here -- everything else
 * (status, amount, currency, external_reference) comes from this response,
 * never from the notification payload itself.
 */
export async function fetchMercadoPagoPayment(
  paymentId: string,
): Promise<FetchedPayment> {
  const client = createMercadoPagoClient();
  const payment = new Payment(client);
  const response = await payment.get({ id: paymentId });

  if (response.id == null) {
    throw new Error("Mercado Pago payment response has no id.");
  }

  return {
    id: response.id,
    status: response.status,
    externalReference: response.external_reference,
    transactionAmount: response.transaction_amount,
    currencyId: response.currency_id,
  };
}
