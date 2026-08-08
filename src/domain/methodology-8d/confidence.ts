import type { ConfidenceLevel, DimensionAssessment, ScoreKind } from "./types";

const CONFIDENCE_VALUE: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function deriveOverallConfidence(
  dimensions: DimensionAssessment[],
  scoreKind: ScoreKind,
): ConfidenceLevel {
  const evaluatedDimensions = dimensions.filter(
    (dimension) => dimension.status === "evaluated",
  );

  if (evaluatedDimensions.length < 5) {
    return "low";
  }

  const average =
    evaluatedDimensions.reduce(
      (total, dimension) => total + CONFIDENCE_VALUE[dimension.confidence],
      0,
    ) / evaluatedDimensions.length;

  if (average < 1.75) {
    return "low";
  }

  if (scoreKind === "partial") {
    return average >= 2.35 ? "medium" : "low";
  }

  if (average >= 2.5) {
    return "high";
  }

  return "medium";
}
