import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  INITIAL_PRICE_AMOUNT_CENTS,
  INITIAL_PRICE_CURRENCY,
  INITIAL_PRODUCT_CODE,
  INITIAL_PRODUCT_NAME,
  PAYMENT_PROVIDER,
} from "./index";

export type ResolvedProductPrice = {
  productId: string;
  priceId: string;
  amountCents: number;
  currency: string;
};

/**
 * Idempotent bootstrap, not a seed script: safe to call on every checkout
 * attempt. Reads first; only inserts the product/price rows the first time
 * they're needed, matching the "no migration, no direct remote write"
 * constraint for this phase -- nothing is written until a real checkout
 * actually calls this in a later, deployed phase.
 */
export async function ensureInitialProduct(): Promise<ResolvedProductPrice> {
  const admin = createSupabaseAdminClient();

  const { data: existingProduct, error: productReadError } = await admin
    .from("products")
    .select("id")
    .eq("code", INITIAL_PRODUCT_CODE)
    .maybeSingle();

  if (productReadError) {
    throw productReadError;
  }

  let productId = existingProduct?.id as string | undefined;

  if (!productId) {
    const { data: insertedProduct, error: productInsertError } = await admin
      .from("products")
      .insert({
        code: INITIAL_PRODUCT_CODE,
        name: INITIAL_PRODUCT_NAME,
        active: true,
      })
      .select("id")
      .single();

    if (productInsertError || !insertedProduct) {
      throw productInsertError ?? new Error("Product was not created.");
    }

    productId = insertedProduct.id as string;
  }

  const { data: existingPrice, error: priceReadError } = await admin
    .from("product_prices")
    .select("id, amount_cents, currency")
    .eq("product_id", productId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (priceReadError) {
    throw priceReadError;
  }

  if (
    existingPrice &&
    existingPrice.amount_cents === INITIAL_PRICE_AMOUNT_CENTS &&
    existingPrice.currency === INITIAL_PRICE_CURRENCY
  ) {
    return {
      productId,
      priceId: existingPrice.id as string,
      amountCents: existingPrice.amount_cents as number,
      currency: existingPrice.currency as string,
    };
  }

  // No active price yet, or the active price no longer matches the code's
  // current constant (e.g. price changed): deactivate the stale one (if
  // any) and create a new price row. product_prices is append-only by
  // design -- never mutate amount_cents on an existing row, since past
  // orders reference it for their own historical snapshot.
  if (existingPrice) {
    const { error: deactivateError } = await admin
      .from("product_prices")
      .update({ active: false })
      .eq("id", existingPrice.id as string);

    if (deactivateError) {
      throw deactivateError;
    }
  }

  const { data: insertedPrice, error: priceInsertError } = await admin
    .from("product_prices")
    .insert({
      product_id: productId,
      amount_cents: INITIAL_PRICE_AMOUNT_CENTS,
      currency: INITIAL_PRICE_CURRENCY,
      active: true,
    })
    .select("id")
    .single();

  if (priceInsertError || !insertedPrice) {
    throw priceInsertError ?? new Error("Product price was not created.");
  }

  return {
    productId,
    priceId: insertedPrice.id as string,
    amountCents: INITIAL_PRICE_AMOUNT_CENTS,
    currency: INITIAL_PRICE_CURRENCY,
  };
}

export type ResolvedOrder = {
  orderId: string;
  amountCents: number;
  currency: string;
};

const REUSABLE_ORDER_STATUSES = ["draft", "pending"] as const;

/**
 * Creates or reuses the order tied to a diagnosis. Never trusts anything
 * from the browser: price comes from ensureInitialProduct(), ownership is
 * re-checked against the database, and analysis_requests.order_id is only
 * ever set server-side.
 *
 * Race mitigation (double click / concurrent tab): the final link from the
 * request to a freshly-created order is a conditional update
 * (`WHERE order_id IS NULL`). If a concurrent call already won that race,
 * this re-reads and returns *that* order instead of the one just inserted
 * -- the request never ends up pointing at two orders, though a losing
 * call can leave one harmless orphaned `draft` order behind (never billed,
 * never reachable by the gate). Full prevention would need a DB-level
 * advisory lock or unique constraint, out of scope for this phase (no new
 * migration).
 */
export async function ensureOrderForDiagnosis(params: {
  requestId: string;
  userId: string;
  userEmail: string;
}): Promise<ResolvedOrder> {
  const admin = createSupabaseAdminClient();

  const { data: request, error: requestError } = await admin
    .from("analysis_requests")
    .select("id, user_id, order_id")
    .eq("id", params.requestId)
    .single();

  if (requestError || !request || request.user_id !== params.userId) {
    throw new Error("Diagnostico nao encontrado para este usuario.");
  }

  if (request.order_id) {
    const { data: existingOrder, error: existingOrderError } = await admin
      .from("orders")
      .select("id, user_id, status, amount_cents, currency")
      .eq("id", request.order_id as string)
      .single();

    if (
      !existingOrderError &&
      existingOrder &&
      existingOrder.user_id === params.userId &&
      (REUSABLE_ORDER_STATUSES as readonly string[]).includes(
        existingOrder.status as string,
      )
    ) {
      return {
        orderId: existingOrder.id as string,
        amountCents: existingOrder.amount_cents as number,
        currency: existingOrder.currency as string,
      };
    }
  }

  const price = await ensureInitialProduct();

  const { data: newOrder, error: insertError } = await admin
    .from("orders")
    .insert({
      user_id: params.userId,
      product_id: price.productId,
      price_id: price.priceId,
      status: "draft",
      amount_cents: price.amountCents,
      currency: price.currency,
      customer_email: params.userEmail,
      provider: PAYMENT_PROVIDER,
    })
    .select("id")
    .single();

  if (insertError || !newOrder) {
    throw insertError ?? new Error("Order was not created.");
  }

  const { data: linked, error: linkError } = await admin
    .from("analysis_requests")
    .update({ order_id: newOrder.id as string })
    .eq("id", request.id as string)
    .is("order_id", null)
    .select("order_id")
    .maybeSingle();

  if (linkError) {
    throw linkError;
  }

  if (!linked) {
    // A concurrent call already linked an order first -- defer to it.
    const { data: raceWinner, error: raceWinnerError } = await admin
      .from("analysis_requests")
      .select("order_id")
      .eq("id", request.id as string)
      .single();

    if (raceWinnerError || !raceWinner?.order_id) {
      throw raceWinnerError ?? new Error("Order link was not resolved.");
    }

    const { data: winningOrder, error: winningOrderError } = await admin
      .from("orders")
      .select("id, amount_cents, currency")
      .eq("id", raceWinner.order_id as string)
      .single();

    if (winningOrderError || !winningOrder) {
      throw winningOrderError ?? new Error("Winning order was not found.");
    }

    return {
      orderId: winningOrder.id as string,
      amountCents: winningOrder.amount_cents as number,
      currency: winningOrder.currency as string,
    };
  }

  return {
    orderId: newOrder.id as string,
    amountCents: price.amountCents,
    currency: price.currency,
  };
}

export async function recordCheckoutPreference(params: {
  orderId: string;
  preferenceId: string;
  initPoint: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("orders")
    .update({
      status: "pending",
      provider_reference: params.preferenceId,
      metadata: { init_point: params.initPoint },
    })
    .eq("id", params.orderId);

  if (error) {
    throw error;
  }
}
