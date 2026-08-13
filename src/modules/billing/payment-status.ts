// Mercado Pago's real payment.status values (approved, pending, in_process,
// authorized, rejected, cancelled, refunded, charged_back, and possibly
// others) are documented as plain strings by the SDK, not a closed union --
// our own payment_status enum (migration 0001) only has 5 values. This maps
// the wider MP set onto ours; only "approved" ever authorizes anything, so
// the mapping only needs to be conservative, not exhaustive.
export type MappedPaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded"
  | "charged_back";

export function mapMercadoPagoPaymentStatus(
  mpStatus: string | undefined,
): MappedPaymentStatus {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    case "rejected":
      return "rejected";
    // order_status/payment_status have no dedicated "cancelled" value --
    // "rejected" is the closest existing representation (a cancelled
    // payment never authorizes analysis, same as an outright rejection).
    case "cancelled":
      return "rejected";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    default:
      // An unrecognized status is never treated as approved -- conservative
      // by construction, matches "pending" (does not release anything, but
      // also does not mark the order permanently failed).
      return "pending";
  }
}

const RELEASE_BLOCKING_ORDER_STATUS: Record<MappedPaymentStatus, string | null> = {
  approved: "paid",
  pending: null, // no order status change needed -- already pending
  rejected: "failed",
  refunded: "refunded",
  charged_back: "refunded", // orders has no dedicated charged_back value
};

export function orderStatusForPayment(
  status: MappedPaymentStatus,
): string | null {
  return RELEASE_BLOCKING_ORDER_STATUS[status];
}
