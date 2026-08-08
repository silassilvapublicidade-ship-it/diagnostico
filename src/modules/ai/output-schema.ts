import { z } from "zod";

import {
  confidenceLevelSchema,
  dimensionKeySchema,
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

const aiDimensionBaseSchema = z.object({
  dimension: dimensionKeySchema,
  confidence: confidenceLevelSchema,
  evidences: z.array(aiEvidenceSchema),
  evidence_gaps: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  diagnosis: z.string().min(1),
  recommendations: z.array(aiRecommendationSchema).min(1),
  limitations: z.array(z.string()),
});

export const aiEvaluatedDimensionSchema = aiDimensionBaseSchema.extend({
  status: z.literal("evaluated"),
  proposed_score: z.number().int().min(0).max(100),
});

export const aiInsufficientEvidenceDimensionSchema =
  aiDimensionBaseSchema.extend({
    status: z.literal("insufficient_evidence"),
    proposed_score: z.null(),
  });

export const aiDimensionAssessmentSchema = z.discriminatedUnion("status", [
  aiEvaluatedDimensionSchema,
  aiInsufficientEvidenceDimensionSchema,
]);

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
