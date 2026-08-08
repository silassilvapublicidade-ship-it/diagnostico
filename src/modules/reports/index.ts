import {
  assertReportCanBeCompleted,
  resolveFinalAnalysisStatus,
} from "@/domain/methodology-8d";
import type { AnalysisCalculationResult } from "@/domain/methodology-8d";

export function getReportDeliveryGate(result: AnalysisCalculationResult) {
  const status = resolveFinalAnalysisStatus(result);

  return {
    status,
    canDeliverPremiumReport: status === "completed",
    assertCanDeliver: () => assertReportCanBeCompleted(result),
  };
}
