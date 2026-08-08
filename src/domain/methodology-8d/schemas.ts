import { z } from "zod";
import {
  ANALYSIS_STATUSES,
  CONFIDENCE_LEVELS,
  DIMENSIONS,
  DIMENSION_STATUSES,
  EVIDENCE_TYPES,
  PROFILE_TYPES,
  REVIEW_REASONS,
  SCORE_CLASSIFICATIONS,
} from "./constants";

export const profileTypeSchema = z.enum(PROFILE_TYPES);
export const dimensionKeySchema = z.enum(DIMENSIONS);
export const dimensionStatusSchema = z.enum(DIMENSION_STATUSES);
export const confidenceLevelSchema = z.enum(CONFIDENCE_LEVELS);
export const evidenceTypeSchema = z.enum(EVIDENCE_TYPES);
export const reviewReasonSchema = z.enum(REVIEW_REASONS);
export const analysisStatusSchema = z.enum(ANALYSIS_STATUSES);
export const scoreClassificationSchema = z.enum(SCORE_CLASSIFICATIONS);

export const evidenceReferenceSchema = z.object({
  evidenceType: evidenceTypeSchema,
  sourceReference: z.string().min(1),
  confidence: confidenceLevelSchema,
  limitations: z.array(z.string()),
});

const dimensionBaseSchema = z.object({
  dimension: dimensionKeySchema,
  confidence: confidenceLevelSchema,
  evidenceAvailable: z.array(z.string()),
  evidenceMissing: z.array(z.string()),
  limitations: z.array(z.string()),
  safeRecommendation: z.string().min(1),
  evidenceReferences: z.array(evidenceReferenceSchema).optional(),
});

export const evaluatedDimensionSchema = dimensionBaseSchema.extend({
  status: z.literal("evaluated"),
  score: z.number().int().min(0).max(100),
});

export const insufficientEvidenceDimensionSchema = dimensionBaseSchema.extend({
  status: z.literal("insufficient_evidence"),
  score: z.never().optional(),
});

export const dimensionAssessmentSchema = z.discriminatedUnion("status", [
  evaluatedDimensionSchema,
  insufficientEvidenceDimensionSchema,
]);

export const weightsSnapshotSchema = z.record(
  dimensionKeySchema,
  z.number().min(0).max(100),
);

export const analysisCalculationInputSchema = z.object({
  profileType: profileTypeSchema,
  dimensions: z.array(dimensionAssessmentSchema).length(8),
  reviewSignals: z.array(reviewReasonSchema).optional(),
  methodologyVersion: z.string().optional(),
  promptVersion: z.string().optional(),
  scoringVersion: z.string().optional(),
  resultVersion: z.string().optional(),
  modelProvider: z.string().optional(),
  modelName: z.string().optional(),
  generatedAt: z.string().datetime().optional(),
});

export const dimensionScoreOutputSchema = z.object({
  dimension: dimensionKeySchema,
  status: dimensionStatusSchema,
  score: z.number().int().min(0).max(100).optional(),
  classification: scoreClassificationSchema.optional(),
  confidence: confidenceLevelSchema,
  originalWeight: z.number().min(0).max(100),
  effectiveWeight: z.number().min(0).max(100),
  evidenceAvailable: z.array(z.string()),
  evidenceMissing: z.array(z.string()),
  limitations: z.array(z.string()),
  safeRecommendation: z.string(),
});

export const analysisCalculationResultSchema = z.object({
  profileType: profileTypeSchema,
  scoreKind: z.enum(["complete", "partial"]),
  score: z.number().int().min(0).max(100),
  classification: scoreClassificationSchema,
  confidence: confidenceLevelSchema,
  requiresReview: z.boolean(),
  reviewReasons: z.array(reviewReasonSchema),
  includedDimensions: z.array(dimensionKeySchema),
  excludedDimensions: z.array(dimensionKeySchema),
  weightsSnapshot: weightsSnapshotSchema,
  dimensionScores: z.array(dimensionScoreOutputSchema).length(8),
  methodologyVersion: z.string(),
  promptVersion: z.string(),
  scoringVersion: z.string(),
  resultVersion: z.string(),
  modelProvider: z.string(),
  modelName: z.string(),
  generatedAt: z.string().datetime(),
});
