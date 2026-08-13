import "server-only";

import { MercadoPagoConfig } from "mercadopago";

import { getServerEnv } from "@/lib/env";

export function createMercadoPagoClient(): MercadoPagoConfig {
  const env = getServerEnv();

  if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  return new MercadoPagoConfig({
    accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
    options: { timeout: 8000 },
  });
}
