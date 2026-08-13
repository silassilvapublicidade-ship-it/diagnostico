import { describe, expect, it } from "vitest";

import {
  mapMercadoPagoPaymentStatus,
  orderStatusForPayment,
} from "@/modules/billing/payment-status";

describe("mapMercadoPagoPaymentStatus", () => {
  it("maps approved to approved", () => {
    expect(mapMercadoPagoPaymentStatus("approved")).toBe("approved");
  });

  it("maps pending/in_process/authorized to pending (never final)", () => {
    expect(mapMercadoPagoPaymentStatus("pending")).toBe("pending");
    expect(mapMercadoPagoPaymentStatus("in_process")).toBe("pending");
    expect(mapMercadoPagoPaymentStatus("authorized")).toBe("pending");
  });

  it("maps rejected and cancelled to rejected", () => {
    expect(mapMercadoPagoPaymentStatus("rejected")).toBe("rejected");
    expect(mapMercadoPagoPaymentStatus("cancelled")).toBe("rejected");
  });

  it("maps refunded and charged_back to their own values", () => {
    expect(mapMercadoPagoPaymentStatus("refunded")).toBe("refunded");
    expect(mapMercadoPagoPaymentStatus("charged_back")).toBe("charged_back");
  });

  it("never maps an unrecognized status to approved", () => {
    expect(mapMercadoPagoPaymentStatus("some_future_status")).not.toBe("approved");
    expect(mapMercadoPagoPaymentStatus(undefined)).not.toBe("approved");
  });
});

describe("orderStatusForPayment", () => {
  it("resolves approved to paid", () => {
    expect(orderStatusForPayment("approved")).toBe("paid");
  });

  it("resolves rejected to failed", () => {
    expect(orderStatusForPayment("rejected")).toBe("failed");
  });

  it("resolves refunded and charged_back to refunded", () => {
    expect(orderStatusForPayment("refunded")).toBe("refunded");
    expect(orderStatusForPayment("charged_back")).toBe("refunded");
  });

  it("requires no order status change for pending", () => {
    expect(orderStatusForPayment("pending")).toBeNull();
  });
});
