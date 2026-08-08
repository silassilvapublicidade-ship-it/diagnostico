import type {
  AnalysisCalculationResult,
  AnalysisStatus,
  ConfidenceLevel,
  DimensionAssessment,
  ReviewReason,
} from "./types";

export function detectRequiresReview(
  dimensions: DimensionAssessment[],
  confidence: ConfidenceLevel,
  reviewSignals: ReviewReason[] = [],
): { requiresReview: boolean; reviewReasons: ReviewReason[] } {
  const reviewReasons = new Set<ReviewReason>(reviewSignals);
  const evaluatedCount = dimensions.filter(
    (dimension) => dimension.status === "evaluated",
  ).length;

  if (evaluatedCount < 5) {
    reviewReasons.add("fewer_than_5_evaluable_dimensions");
  }

  if (confidence === "low" && evaluatedCount < dimensions.length) {
    reviewReasons.add("low_global_confidence_on_critical_analysis");
  }

  return {
    requiresReview: reviewReasons.size > 0,
    reviewReasons: Array.from(reviewReasons),
  };
}

export function resolveFinalAnalysisStatus(
  result: Pick<
    AnalysisCalculationResult,
    "requiresReview" | "excludedDimensions" | "reviewReasons"
  >,
): AnalysisStatus {
  if (!result.requiresReview) {
    return "completed";
  }

  if (
    result.excludedDimensions.length > 0 ||
    result.reviewReasons.includes("fewer_than_5_evaluable_dimensions")
  ) {
    return "waiting_for_more_information";
  }

  return "requires_review";
}

export function assertReportCanBeCompleted(
  result: Pick<AnalysisCalculationResult, "requiresReview" | "reviewReasons">,
): void {
  if (result.requiresReview) {
    throw new Error(
      `Premium report delivery is blocked while requires_review is true: ${result.reviewReasons.join(", ")}`,
    );
  }
}
