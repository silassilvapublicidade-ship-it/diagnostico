import { z } from "zod";

import {
  confidenceLevelSchema,
  dimensionKeySchema,
  dimensionStatusSchema,
  evidenceTypeSchema,
  reviewReasonSchema,
} from "@/domain/methodology-8d";

export const aiEvidenceSchema = z.object({
  evidence_type: evidenceTypeSchema,
  source_reference: z.string().min(1),
  observed_area: z.string().min(1),
  confidence: confidenceLevelSchema,
  limitations: z.array(z.string()),
});

export const aiRecommendationSchema = z.object({
  what_was_identified: z.string().min(1),
  why_it_matters: z.string().min(1),
  how_to_execute: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  effort: z.enum(["low", "medium", "high"]),
  expected_impact: z.string().min(1),
  supporting_evidence: z.string().min(1),
});

// A flat object rather than a discriminatedUnion on `status`: the union
// roughly doubled the compiled grammar size for structured output (each of
// the two branches repeated the full evidences/recommendations shape),
// which Anthropic rejected with a 400 ("compiled grammar is too large") on
// claude-haiku-4-5. The evaluated/insufficient_evidence score invariant is
// still enforced below via refine — that check, like min/max/int, is
// stripped from the JSON Schema sent to the API but still verified
// client-side by the SDK, so parsed_output is still null on a violation.
export const aiDimensionAssessmentSchema = z
  .object({
    dimension: dimensionKeySchema,
    status: dimensionStatusSchema,
    proposed_score: z.number().int().min(0).max(100).nullable(),
    confidence: confidenceLevelSchema,
    evidences: z.array(aiEvidenceSchema),
    evidence_gaps: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    diagnosis: z.string().min(1),
    recommendations: z.array(aiRecommendationSchema).min(1),
    limitations: z.array(z.string()),
  })
  .refine(
    (value) =>
      value.status === "evaluated"
        ? value.proposed_score !== null
        : value.proposed_score === null,
    {
      message:
        "proposed_score must be set for evaluated dimensions and null for insufficient_evidence dimensions.",
      path: ["proposed_score"],
    },
  );

export const aiDiagnosisOutputSchema = z.object({
  dimensions: z.array(aiDimensionAssessmentSchema).length(8),
  executive_summary: z.string().min(1),
  priorities: z.array(z.string()),
  opportunities: z.array(z.string()),
  action_plan_24h: z.array(z.string()),
  action_plan_7d: z.array(z.string()),
  action_plan_30d: z.array(z.string()),
  content_suggestions: z.array(z.string()),
  global_limitations: z.array(z.string()),
  review_signals: z.array(reviewReasonSchema),
});

export type AiEvidence = z.infer<typeof aiEvidenceSchema>;
export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type AiDimensionAssessment = z.infer<typeof aiDimensionAssessmentSchema>;
export type AiDiagnosisOutput = z.infer<typeof aiDiagnosisOutputSchema>;
