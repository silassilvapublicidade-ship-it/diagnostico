import type { AnalysisCalculationInput } from "../../src/domain/methodology-8d";

export const businessCompleteFixture = {
  profileType: "business",
  generatedAt: "2026-08-07T12:00:00.000Z",
  dimensions: [
    {
      dimension: "positioning",
      status: "evaluated",
      score: 68,
      confidence: "high",
      evidenceAvailable: ["bio", "briefing", "educational posts"],
      evidenceMissing: [],
      limitations: ["No sales data was provided."],
      safeRecommendation:
        "Rewrite the bio around audience, problem, transformation, and next step.",
    },
    {
      dimension: "first_impression",
      status: "evaluated",
      score: 58,
      confidence: "high",
      evidenceAvailable: [
        "profile top screenshot",
        "highlights",
        "visible feed",
      ],
      evidenceMissing: [],
      limitations: ["Stories were not assessed."],
      safeRecommendation:
        "Use the first screen to answer who this is for, why trust it, and what to do next.",
    },
    {
      dimension: "authority",
      status: "evaluated",
      score: 62,
      confidence: "medium",
      evidenceAvailable: ["educational content", "feedback highlights"],
      evidenceMissing: ["complete case context"],
      limitations: ["Results cannot be generalized without more evidence."],
      safeRecommendation:
        "Organize proof around patient doubts and process, without promising outcomes.",
    },
    {
      dimension: "content",
      status: "evaluated",
      score: 54,
      confidence: "high",
      evidenceAvailable: ["feed screenshot", "briefing"],
      evidenceMissing: [],
      limitations: ["Performance by post was not provided."],
      safeRecommendation:
        "Create content pillars for pain, education, proof of process, and conversion.",
    },
    {
      dimension: "identity",
      status: "evaluated",
      score: 61,
      confidence: "high",
      evidenceAvailable: ["feed", "visual tone", "profile photo"],
      evidenceMissing: [],
      limitations: ["Brand assets were not provided."],
      safeRecommendation:
        "Create a recurring verbal and visual signature that reinforces nutrition without guilt.",
    },
    {
      dimension: "conversion",
      status: "evaluated",
      score: 46,
      confidence: "high",
      evidenceAvailable: ["bio CTA", "bio link", "declared objective"],
      evidenceMissing: [],
      limitations: ["No real conversion rate was provided."],
      safeRecommendation:
        "Move WhatsApp to the first link and make the CTA explain the first conversation.",
    },
    {
      dimension: "relationship",
      status: "evaluated",
      score: 50,
      confidence: "medium",
      evidenceAvailable: ["content tone", "briefing"],
      evidenceMissing: ["comments", "story replies", "DM evidence"],
      limitations: ["Relationship quality cannot be asserted from feed alone."],
      safeRecommendation:
        "Use low-friction questions tied to routine, anxiety, and organization.",
    },
    {
      dimension: "opportunities",
      status: "evaluated",
      score: 72,
      confidence: "high",
      evidenceAvailable: ["briefing", "conversion gaps", "positioning gaps"],
      evidenceMissing: [],
      limitations: ["No paid acquisition data was provided."],
      safeRecommendation:
        "Turn the approach into a simple three-step method visible in the profile.",
    },
  ],
} satisfies AnalysisCalculationInput;
