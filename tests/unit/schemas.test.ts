import { describe, expect, it } from "vitest";
import {
  analysisCalculationInputSchema,
  analysisCalculationResultSchema,
  calculateAnalysisResult,
} from "../../src/domain/methodology-8d";
import { creatorLowEvidenceFixture } from "../fixtures/creator_low_evidence";

describe("Strategic diagnosis Zod schemas", () => {
  it("validates approved golden fixture input", () => {
    expect(() =>
      analysisCalculationInputSchema.parse(creatorLowEvidenceFixture),
    ).not.toThrow();
  });

  it("validates deterministic calculation output", () => {
    const result = calculateAnalysisResult(creatorLowEvidenceFixture);

    expect(() => analysisCalculationResultSchema.parse(result)).not.toThrow();
  });
});
