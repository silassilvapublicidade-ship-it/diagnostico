import type { AnalysisCalculationInput } from "../../src/domain/methodology-8d";

export const creatorLowEvidenceFixture = {
  profileType: "creator",
  generatedAt: "2026-08-07T12:00:00.000Z",
  reviewSignals: [
    "incomplete_briefing",
    "unclear_bio_link",
    "no_relationship_evidence",
    "strong_ambiguity",
    "missing_metric_inference_risk",
  ],
  dimensions: [
    {
      dimension: "positioning",
      status: "evaluated",
      score: 38,
      confidence: "low",
      evidenceAvailable: ["bio", "partial briefing"],
      evidenceMissing: ["audience", "territory", "specific objective"],
      limitations: ["Positioning can be assessed only as initial clarity."],
      safeRecommendation:
        "Replace generic wording with a recognizable territory such as local accessible finds.",
    },
    {
      dimension: "first_impression",
      status: "evaluated",
      score: 44,
      confidence: "medium",
      evidenceAvailable: ["profile top screenshot"],
      evidenceMissing: ["highlights", "pinned posts", "link destination"],
      limitations: ["The full visitor journey cannot be assessed."],
      safeRecommendation:
        "Clarify who should follow the profile and why within the first screen.",
    },
    {
      dimension: "authority",
      status: "insufficient_evidence",
      confidence: "low",
      evidenceAvailable: ["partial feed sample"],
      evidenceMissing: [
        "recognition",
        "criteria",
        "collaborations",
        "proof of repertoire",
      ],
      limitations: [
        "Authority cannot be asserted from a small partial feed sample.",
      ],
      safeRecommendation:
        "Send representative posts, comments, collaborations, or criteria that demonstrate repertoire.",
    },
    {
      dimension: "content",
      status: "evaluated",
      score: 46,
      confidence: "low",
      evidenceAvailable: ["partial feed with 9 visible posts"],
      evidenceMissing: ["full feed", "captions", "performance", "frequency"],
      limitations: ["Consistency and retention cannot be inferred."],
      safeRecommendation:
        "Organize the visible themes into three clear recurring content frames before increasing volume.",
    },
    {
      dimension: "identity",
      status: "evaluated",
      score: 52,
      confidence: "low",
      evidenceAvailable: ["small visual sample", "bio tone"],
      evidenceMissing: [
        "stories",
        "captions",
        "recurring symbols",
        "signature language",
      ],
      limitations: ["Memorability cannot be asserted from this evidence set."],
      safeRecommendation:
        "Define one recurring language pattern or content frame that can be recognized across posts.",
    },
    {
      dimension: "conversion",
      status: "insufficient_evidence",
      confidence: "low",
      evidenceAvailable: ["bio mentions a link"],
      evidenceMissing: [
        "link destination",
        "media kit",
        "CTA",
        "partnership objective",
      ],
      limitations: [
        "Commercial readiness cannot be evaluated without the link destination.",
      ],
      safeRecommendation:
        "Send the link destination and clarify the desired next step for audience and brands.",
    },
    {
      dimension: "relationship",
      status: "insufficient_evidence",
      confidence: "low",
      evidenceAvailable: [],
      evidenceMissing: [
        "comments",
        "DMs",
        "story replies",
        "insights",
        "community prompts",
      ],
      limitations: [
        "Relationship quality cannot be evaluated without interaction evidence.",
      ],
      safeRecommendation:
        "Send comments, story replies, poll results, or insight screenshots to evaluate community.",
    },
    {
      dimension: "opportunities",
      status: "insufficient_evidence",
      confidence: "low",
      evidenceAvailable: ["broad lifestyle theme"],
      evidenceMissing: [
        "audience",
        "brand targets",
        "metrics",
        "differentiation",
        "commercial paths",
      ],
      limitations: [
        "Prioritized opportunities would require unsupported inference.",
      ],
      safeRecommendation:
        "Complete the briefing with audience, desired brands, formats, and editorial limits.",
    },
  ],
} satisfies AnalysisCalculationInput;
