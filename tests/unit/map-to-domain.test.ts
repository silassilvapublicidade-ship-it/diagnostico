import { describe, expect, it } from "vitest";

import {
  analysisCalculationInputSchema,
  calculateAnalysisResult,
} from "../../src/domain/methodology-8d";
import {
  extractWebPayload,
  mapAiOutputToDomainInput,
} from "../../src/modules/ai/map-to-domain";
import { AI_PROMPT_VERSION } from "../../src/modules/ai/prompt";
import { aiOutputBusinessComplete } from "../fixtures/ai-output-business-complete";
import { aiOutputCreatorComplete } from "../fixtures/ai-output-creator-complete";
import { aiOutputCreatorLowEvidence } from "../fixtures/ai-output-creator-low-evidence";

const DOMAIN_DEFAULT_MODEL_PROVIDER = "not_integrated";
const DOMAIN_DEFAULT_MODEL_NAME = "deterministic-fixture";
const DOMAIN_DEFAULT_PROMPT_VERSION = "prompt-not-integrated@0.2.0";

describe("mapAiOutputToDomainInput", () => {
  it("produces a domain input that satisfies the engine's own Zod schema", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputBusinessComplete,
      profileType: "business",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });

    expect(() => analysisCalculationInputSchema.parse(input)).not.toThrow();
  });

  it("never leaves modelProvider/modelName/promptVersion at the domain's fixture defaults", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputBusinessComplete,
      profileType: "business",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });

    expect(input.modelProvider).toBe("anthropic");
    expect(input.modelProvider).not.toBe(DOMAIN_DEFAULT_MODEL_PROVIDER);
    expect(input.modelName).toBe("claude-sonnet-5");
    expect(input.modelName).not.toBe(DOMAIN_DEFAULT_MODEL_NAME);
    expect(input.promptVersion).toBe(AI_PROMPT_VERSION);
    expect(input.promptVersion).not.toBe(DOMAIN_DEFAULT_PROMPT_VERSION);
  });

  it("maps a complete business read into a plausible, high-confidence result that never requires review", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputBusinessComplete,
      profileType: "business",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });
    const result = calculateAnalysisResult(input);

    expect(result.scoreKind).toBe("complete");
    expect(result.excludedDimensions).toEqual([]);
    expect(result.includedDimensions).toHaveLength(8);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBe("high");
    expect(result.requiresReview).toBe(false);
  });

  it("maps a complete creator read distinctly from the business read (Business != Creator)", () => {
    const businessInput = mapAiOutputToDomainInput({
      output: aiOutputBusinessComplete,
      profileType: "business",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });
    const creatorInput = mapAiOutputToDomainInput({
      output: aiOutputCreatorComplete,
      profileType: "creator",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });

    const businessResult = calculateAnalysisResult(businessInput);
    const creatorResult = calculateAnalysisResult(creatorInput);

    expect(businessResult.profileType).toBe("business");
    expect(creatorResult.profileType).toBe("creator");
    expect(businessResult.weightsSnapshot).not.toEqual(
      creatorResult.weightsSnapshot,
    );
    expect(businessResult.score).not.toBe(creatorResult.score);
  });

  it("maps insufficient_evidence dimensions correctly and renormalizes weights", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputCreatorLowEvidence,
      profileType: "creator",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });
    const result = calculateAnalysisResult(input);

    expect(result.scoreKind).toBe("partial");
    expect(result.excludedDimensions.sort()).toEqual(
      ["authority", "conversion", "relationship", "opportunities"].sort(),
    );
    expect(result.includedDimensions.sort()).toEqual(
      ["positioning", "first_impression", "content", "identity"].sort(),
    );

    const authorityScore = result.dimensionScores.find(
      (dimension) => dimension.dimension === "authority",
    );
    expect(authorityScore?.status).toBe("insufficient_evidence");
    expect(authorityScore).not.toHaveProperty("score");
    expect(authorityScore?.effectiveWeight).toBe(0);
  });

  it("triggers requires_review on a weak scenario with fewer than 5 evaluable dimensions", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputCreatorLowEvidence,
      profileType: "creator",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });
    const result = calculateAnalysisResult(input);

    expect(result.requiresReview).toBe(true);
    expect(result.reviewReasons).toContain("fewer_than_5_evaluable_dimensions");
    // AI-proposed qualitative signals must flow through, not be decided by the AI itself.
    expect(result.reviewReasons).toContain("incomplete_briefing");
    expect(result.reviewReasons).toContain("no_relationship_evidence");
  });

  it("maps evidences into evidenceReferences using only the domain's existing fields", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputBusinessComplete,
      profileType: "business",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });
    const positioning = input.dimensions.find(
      (dimension) => dimension.dimension === "positioning",
    );

    expect(positioning?.evidenceReferences).toHaveLength(1);
    const reference = positioning?.evidenceReferences?.[0];
    expect(reference?.evidenceType).toBe("declared");
    expect(reference?.sourceReference).toContain("bio");
    expect(reference?.confidence).toBe("high");
  });

  it("maps strategic execution into the safe recommendation surfaced by the deterministic result", () => {
    const input = mapAiOutputToDomainInput({
      output: aiOutputBusinessComplete,
      profileType: "business",
      modelProvider: "anthropic",
      modelName: "claude-sonnet-5",
    });
    const positioning = input.dimensions.find(
      (dimension) => dimension.dimension === "positioning",
    );

    expect(positioning?.safeRecommendation).toContain("Exemplo aplicado:");
    expect(positioning?.safeRecommendation).toContain("Primeiro passo:");
  });

  it("preserves the strategic diagnosis in the web payload", () => {
    const payload = extractWebPayload(aiOutputCreatorComplete);
    const positioning = payload.dimensions.find(
      (dimension) => dimension.dimension === "positioning",
    );

    expect(positioning?.strategicDiagnosis.problem).toBe(
      aiOutputCreatorComplete.dimensions[0]!.strategic_diagnosis.problem,
    );
    expect(positioning?.strategicDiagnosis.practical_example).toBe(
      aiOutputCreatorComplete.dimensions[0]!.strategic_diagnosis
        .practical_example,
    );
  });
});
