import { BLOCKING_REVIEW_REASONS } from "./constants";
import type {
  AnalysisCalculationResult,
  AnalysisStatus,
  ConfidenceLevel,
  DimensionAssessment,
  ReviewReason,
} from "./types";

const BLOCKING_REASON_SET = new Set<ReviewReason>(BLOCKING_REVIEW_REASONS);

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

  // The product is a lightweight directional guide, not a guarantee of a
  // fully-confident result: only a reason serious enough to be worth
  // holding for human review (see BLOCKING_REVIEW_REASONS) blocks
  // delivery. Every other proposed signal is still reported in
  // reviewReasons — surfaced to the customer as a limitation on the
  // delivered report — but never blocks it on its own.
  const requiresReview = Array.from(reviewReasons).some((reason) =>
    BLOCKING_REASON_SET.has(reason),
  );

  return {
    requiresReview,
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
