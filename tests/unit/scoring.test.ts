import { describe, expect, it } from "vitest";
import {
  BUSINESS_WEIGHTS,
  CREATOR_WEIGHTS,
  assertReportCanBeCompleted,
  calculateAnalysisResult,
  getWeights,
  resolveFinalAnalysisStatus,
} from "../../src/domain/methodology-8d";
import { businessCompleteFixture } from "../fixtures/business_complete";
import { creatorCompleteFixture } from "../fixtures/creator_complete";
import { creatorLowEvidenceFixture } from "../fixtures/creator_low_evidence";

describe("Strategic diagnosis scoring", () => {
  it("uses business weights", () => {
    expect(getWeights("business")).toEqual(BUSINESS_WEIGHTS);
  });

  it("uses creator weights", () => {
    expect(getWeights("creator")).toEqual(CREATOR_WEIGHTS);
  });

  it("calculates a complete business score with full evidence", () => {
    const result = calculateAnalysisResult(businessCompleteFixture);

    expect(result.scoreKind).toBe("complete");
    expect(result.score).toBe(58);
    expect(result.classification).toBe("development");
    expect(result.confidence).toBe("high");
    expect(result.requiresReview).toBe(false);
    expect(result.weightsSnapshot).toEqual(BUSINESS_WEIGHTS);
    expect(result.excludedDimensions).toEqual([]);
  });

  it("calculates a complete creator score with creator weights", () => {
    const result = calculateAnalysisResult(creatorCompleteFixture);

    expect(result.scoreKind).toBe("complete");
    expect(result.score).toBe(69);
    expect(result.classification).toBe("consistent");
    expect(result.confidence).toBe("high");
    expect(result.requiresReview).toBe(false);
    expect(result.weightsSnapshot).toEqual(CREATOR_WEIGHTS);
  });

  it("calculates a partial score with renormalized weights", () => {
    const result = calculateAnalysisResult(creatorLowEvidenceFixture);

    expect(result.scoreKind).toBe("partial");
    expect(result.score).toBe(45);
    expect(result.confidence).toBe("low");
    expect(result.includedDimensions).toEqual([
      "positioning",
      "first_impression",
      "content",
      "identity",
    ]);
    expect(result.excludedDimensions).toEqual([
      "authority",
      "conversion",
      "relationship",
      "opportunities",
    ]);
    expect(result.weightsSnapshot).toMatchObject({
      positioning: 24.1379,
      first_impression: 20.6897,
      authority: 0,
      content: 27.5862,
      identity: 27.5862,
      conversion: 0,
      relationship: 0,
      opportunities: 0,
    });
  });

  it("does not assign scores to insufficient evidence dimensions", () => {
    const result = calculateAnalysisResult(creatorLowEvidenceFixture);
    const authority = result.dimensionScores.find(
      (dimension) => dimension.dimension === "authority",
    );

    expect(authority?.status).toBe("insufficient_evidence");
    expect(authority).not.toHaveProperty("score");
    expect(authority?.effectiveWeight).toBe(0);
  });

  it("blocks completed delivery when review is required", () => {
    const result = calculateAnalysisResult(creatorLowEvidenceFixture);

    expect(result.requiresReview).toBe(true);
    expect(result.reviewReasons).toContain("fewer_than_5_evaluable_dimensions");
    expect(resolveFinalAnalysisStatus(result)).toBe(
      "waiting_for_more_information",
    );
    expect(() => assertReportCanBeCompleted(result)).toThrow(
      /requires_review is true/,
    );
  });

  it("allows completed status only when review is not required", () => {
    const result = calculateAnalysisResult(creatorCompleteFixture);

    expect(resolveFinalAnalysisStatus(result)).toBe("completed");
    expect(() => assertReportCanBeCompleted(result)).not.toThrow();
  });

  it("does not block delivery for informational-only review signals (the product is a directional guide, not a guarantee)", () => {
    const result = calculateAnalysisResult({
      ...businessCompleteFixture,
      reviewSignals: ["no_relationship_evidence", "unclear_bio_link"],
    });

    expect(result.requiresReview).toBe(false);
    expect(result.reviewReasons).toEqual([
      "no_relationship_evidence",
      "unclear_bio_link",
    ]);
    expect(resolveFinalAnalysisStatus(result)).toBe("completed");
    expect(() => assertReportCanBeCompleted(result)).not.toThrow();
  });

  it("still blocks delivery when a critical review signal is present, even with a complete evidence base", () => {
    const result = calculateAnalysisResult({
      ...businessCompleteFixture,
      reviewSignals: ["no_relationship_evidence", "sensitive_content"],
    });

    expect(result.requiresReview).toBe(true);
    expect(result.reviewReasons).toEqual([
      "no_relationship_evidence",
      "sensitive_content",
    ]);
    expect(resolveFinalAnalysisStatus(result)).toBe("requires_review");
    expect(() => assertReportCanBeCompleted(result)).toThrow(
      /requires_review is true/,
    );
  });
});
