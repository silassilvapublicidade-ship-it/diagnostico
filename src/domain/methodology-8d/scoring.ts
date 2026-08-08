import {
  DEFAULT_MODEL_NAME,
  DEFAULT_MODEL_PROVIDER,
  DIMENSIONS,
  METHODOLOGY_VERSION,
  PROMPT_VERSION,
  RESULT_VERSION,
  SCORING_VERSION,
} from "./constants";
import { deriveOverallConfidence } from "./confidence";
import { assertCompleteDimensionSet, getWeights } from "./dimensions";
import { detectRequiresReview } from "./review";
import type {
  AnalysisCalculationInput,
  AnalysisCalculationResult,
  DimensionAssessment,
  DimensionKey,
  DimensionScoreOutput,
  ScoreClassification,
  ScoreKind,
  WeightsSnapshot,
} from "./types";

function roundScore(value: number): number {
  return Math.round(value);
}

function roundWeight(value: number): number {
  return Number(value.toFixed(4));
}

export function classifyScore(score: number): ScoreClassification {
  if (score < 20) {
    return "critical";
  }

  if (score < 40) {
    return "attention";
  }

  if (score < 60) {
    return "development";
  }

  if (score < 80) {
    return "consistent";
  }

  return "reference";
}

export function renormalizeWeights(
  originalWeights: WeightsSnapshot,
  evaluatedDimensions: DimensionKey[],
): WeightsSnapshot {
  const activeWeight = evaluatedDimensions.reduce(
    (total, dimension) => total + originalWeights[dimension],
    0,
  );

  if (activeWeight <= 0) {
    throw new Error(
      "At least one dimension must be evaluable to calculate score.",
    );
  }

  return DIMENSIONS.reduce((snapshot, dimension) => {
    snapshot[dimension] = evaluatedDimensions.includes(dimension)
      ? roundWeight((originalWeights[dimension] / activeWeight) * 100)
      : 0;

    return snapshot;
  }, {} as WeightsSnapshot);
}

function toDimensionScoreOutput(
  dimension: DimensionAssessment,
  originalWeight: number,
  effectiveWeight: number,
): DimensionScoreOutput {
  const base = {
    dimension: dimension.dimension,
    status: dimension.status,
    confidence: dimension.confidence,
    originalWeight,
    effectiveWeight,
    evidenceAvailable: dimension.evidenceAvailable,
    evidenceMissing: dimension.evidenceMissing,
    limitations: dimension.limitations,
    safeRecommendation: dimension.safeRecommendation,
  };

  if (dimension.status === "insufficient_evidence") {
    return base;
  }

  return {
    ...base,
    score: dimension.score,
    classification: classifyScore(dimension.score),
  };
}

export function calculateAnalysisResult(
  input: AnalysisCalculationInput,
): AnalysisCalculationResult {
  assertCompleteDimensionSet(
    input.dimensions.map((dimension) => dimension.dimension),
  );

  const originalWeights = getWeights(input.profileType);
  const evaluatedDimensions = input.dimensions
    .filter((dimension) => dimension.status === "evaluated")
    .map((dimension) => dimension.dimension);
  const excludedDimensions = input.dimensions
    .filter((dimension) => dimension.status === "insufficient_evidence")
    .map((dimension) => dimension.dimension);

  const scoreKind: ScoreKind =
    excludedDimensions.length === 0 ? "complete" : "partial";
  const weightsSnapshot =
    scoreKind === "complete"
      ? originalWeights
      : renormalizeWeights(originalWeights, evaluatedDimensions);

  const score = roundScore(
    input.dimensions.reduce((total, dimension) => {
      if (dimension.status === "insufficient_evidence") {
        return total;
      }

      return (
        total + dimension.score * (weightsSnapshot[dimension.dimension] / 100)
      );
    }, 0),
  );
  const confidence = deriveOverallConfidence(input.dimensions, scoreKind);
  const review = detectRequiresReview(
    input.dimensions,
    confidence,
    input.reviewSignals,
  );

  return {
    profileType: input.profileType,
    scoreKind,
    score,
    classification: classifyScore(score),
    confidence,
    requiresReview: review.requiresReview,
    reviewReasons: review.reviewReasons,
    includedDimensions: evaluatedDimensions,
    excludedDimensions,
    weightsSnapshot,
    dimensionScores: input.dimensions.map((dimension) =>
      toDimensionScoreOutput(
        dimension,
        originalWeights[dimension.dimension],
        weightsSnapshot[dimension.dimension],
      ),
    ),
    methodologyVersion: input.methodologyVersion ?? METHODOLOGY_VERSION,
    promptVersion: input.promptVersion ?? PROMPT_VERSION,
    scoringVersion: input.scoringVersion ?? SCORING_VERSION,
    resultVersion: input.resultVersion ?? RESULT_VERSION,
    modelProvider: input.modelProvider ?? DEFAULT_MODEL_PROVIDER,
    modelName: input.modelName ?? DEFAULT_MODEL_NAME,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}
