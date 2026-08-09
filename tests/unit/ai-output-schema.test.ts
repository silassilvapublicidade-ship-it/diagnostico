import { describe, expect, it } from "vitest";

import { aiDiagnosisOutputSchema } from "../../src/modules/ai/output-schema";
import { aiOutputBusinessComplete } from "../fixtures/ai-output-business-complete";
import { aiOutputCreatorComplete } from "../fixtures/ai-output-creator-complete";
import { aiOutputCreatorLowEvidence } from "../fixtures/ai-output-creator-low-evidence";

describe("AI diagnosis output schema", () => {
  it("accepts the approved golden fixtures", () => {
    expect(() =>
      aiDiagnosisOutputSchema.parse(aiOutputBusinessComplete),
    ).not.toThrow();
    expect(() =>
      aiDiagnosisOutputSchema.parse(aiOutputCreatorComplete),
    ).not.toThrow();
    expect(() =>
      aiDiagnosisOutputSchema.parse(aiOutputCreatorLowEvidence),
    ).not.toThrow();
  });

  it("rejects a non-null proposed_score on an insufficient_evidence dimension", () => {
    const broken = structuredClone(aiOutputCreatorLowEvidence) as Record<
      string,
      unknown
    >;
    const dimensions = broken.dimensions as Array<Record<string, unknown>>;
    const authority = dimensions.find((d) => d.dimension === "authority")!;
    authority.proposed_score = 40;

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("rejects a null proposed_score on an evaluated dimension", () => {
    const broken = structuredClone(aiOutputBusinessComplete) as Record<
      string,
      unknown
    >;
    const dimensions = broken.dimensions as Array<Record<string, unknown>>;
    const positioning = dimensions.find((d) => d.dimension === "positioning")!;
    positioning.proposed_score = null;

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("rejects a score outside the 0-100 range", () => {
    const broken = structuredClone(aiOutputBusinessComplete) as Record<
      string,
      unknown
    >;
    const dimensions = broken.dimensions as Array<Record<string, unknown>>;
    const positioning = dimensions.find((d) => d.dimension === "positioning")!;
    positioning.proposed_score = 140;

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("rejects a review_signal outside the domain ReviewReason enum", () => {
    const broken = structuredClone(aiOutputCreatorLowEvidence) as Record<
      string,
      unknown
    >;
    broken.review_signals = ["not_a_real_reason"];

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("requires exactly 8 dimensions", () => {
    const broken = structuredClone(aiOutputBusinessComplete) as Record<
      string,
      unknown
    >;
    (broken.dimensions as unknown[]).pop();

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("requires exactly one recommendation per dimension", () => {
    const broken = structuredClone(aiOutputBusinessComplete) as Record<
      string,
      unknown
    >;
    const dimensions = broken.dimensions as Array<Record<string, unknown>>;
    dimensions[0]!.recommendations = [];

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("requires a strategic diagnosis contract for each dimension", () => {
    const broken = structuredClone(aiOutputBusinessComplete) as Record<
      string,
      unknown
    >;
    const dimensions = broken.dimensions as Array<Record<string, unknown>>;
    delete dimensions[0]!.strategic_diagnosis;

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });

  it("rejects a too-short practical example", () => {
    const broken = structuredClone(aiOutputBusinessComplete) as Record<
      string,
      unknown
    >;
    const dimensions = broken.dimensions as Array<Record<string, unknown>>;
    const strategicDiagnosis = dimensions[0]!.strategic_diagnosis as Record<
      string,
      unknown
    >;
    strategicDiagnosis.practical_example = "Melhorar CTA";

    expect(() => aiDiagnosisOutputSchema.parse(broken)).toThrow();
  });
});
