export const INITIAL_PRODUCT_CODE = "strategic_diagnosis_complete" as const;
export const INITIAL_PRODUCT_NAME = "Diagnóstico Estratégico 8D" as const;
export const INITIAL_PRICE_CURRENCY = "BRL" as const;
// R$ 9,99 (launch price) -- amount_cents is the single source of truth;
// every other price representation (landing display, JSON-LD, Mercado
// Pago's decimal unit_price) is derived from this, never duplicated.
export const INITIAL_PRICE_AMOUNT_CENTS = 999;
export const PAYMENT_PROVIDER = "mercado_pago" as const;

export function formatPriceReais(amountCents: number): number {
  return amountCents / 100;
}

// PT-BR display format, e.g. 999 -> "9,99" (pairs with a literal "R$" in
// markup, matching the existing .pricing-currency/.pricing-number split).
export function formatPriceDisplay(amountCents: number): string {
  return formatPriceReais(amountCents).toFixed(2).replace(".", ",");
}

// schema.org Offer.price / Mercado Pago unit_price both expect a
// machine-readable decimal string, dot-separated -- never the PT-BR comma.
export function formatPriceMachine(amountCents: number): string {
  return formatPriceReais(amountCents).toFixed(2);
}
