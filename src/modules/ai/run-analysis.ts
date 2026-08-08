import "server-only";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  calculateAnalysisResult,
  type AnalysisCalculationResult,
  type ProfileType,
} from "@/domain/methodology-8d";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createAnthropicClient, getAnthropicModel } from "./client";
import {
  extractWebPayload,
  mapAiOutputToDomainInput,
  type WebPayload,
} from "./map-to-domain";
import {
  aiDiagnosisOutputSchema,
  type AiDiagnosisOutput,
} from "./output-schema";
import {
  buildSystemPrompt,
  buildUserContent,
  type PromptAsset,
} from "./prompt";

const MAX_ASSETS_SENT_TO_AI = 12;

// Anthropic's per-image size limit applies to the base64-encoded payload, not
// the raw file. Kept deliberately conservative here; confirm against
// https://platform.claude.com/docs/en/build-with-claude/vision.md before
// raising it.
const MAX_ASSET_BASE64_BYTES = 5 * 1024 * 1024;

const ASSET_TYPE_PRIORITY: Record<string, number> = {
  profile_top: 0,
  feed: 1,
  highlights: 2,
  insights: 3,
  stories: 4,
  comments: 5,
  other: 6,
};

const MODEL_PRICING_USD_PER_MTOK: Record<
  string,
  { input: number; output: number }
> = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

function estimateCostUsdCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const pricing = MODEL_PRICING_USD_PER_MTOK[model];

  if (!pricing) {
    return null;
  }

  const dollars =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;

  return Math.round(dollars * 100);
}

// Anthropic's thinking API has two incompatible shapes depending on model
// generation: "adaptive only" models (Sonnet 5, Opus 5, Fable 5, Mythos,
// Opus 4.6+, Sonnet 4.6) reject `thinking.type: "enabled"`, while "extended
// only" models (Haiku 4.5, Sonnet 4.5, Opus 4.5, earlier Claude 4) reject
// `thinking.type: "adaptive"`. `output_config.effort` is only accepted by
// the adaptive-capable family. See
// https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting#supported-models
const ADAPTIVE_THINKING_MODEL_PATTERNS = [
  /sonnet-5/,
  /opus-5/,
  /fable-5/,
  /mythos/,
  /opus-4-8/,
  /opus-4-7/,
  /opus-4-6/,
  /sonnet-4-6/,
];

function supportsAdaptiveThinking(model: string): boolean {
  return ADAPTIVE_THINKING_MODEL_PATTERNS.some((pattern) =>
    pattern.test(model),
  );
}

// Reasoning time before the model starts writing the response — real
// wall-clock latency, not just token cost. Kept modest on purpose: the
// product is a lightweight directional guide, not an exhaustive analysis,
// so it doesn't need a large deliberation budget on extended-thinking-only
// models.
const EXTENDED_THINKING_BUDGET_TOKENS = 4000;

export class AiAnalysisError extends Error {}

type AnalysisAnswerRow = { question_key: string; answer: unknown };

type AnalysisAssetRow = {
  asset_type: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  processing_consent_at: string | null;
};

async function loadContext(requestId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: request, error: requestError } = await supabase
    .from("analysis_requests")
    .select("id, user_id, profile_type, instagram_url")
    .eq("id", requestId)
    .single();

  if (requestError || !request || request.user_id !== userId) {
    throw new AiAnalysisError("Diagnostico nao encontrado para este usuario.");
  }

  const { data: answers, error: answersError } = await supabase
    .from("analysis_answers")
    .select("question_key, answer")
    .eq("analysis_request_id", requestId);

  if (answersError) {
    throw answersError;
  }

  const { data: assets, error: assetsError } = await supabase
    .from("analysis_assets")
    .select(
      "asset_type, storage_bucket, storage_path, mime_type, processing_consent_at",
    )
    .eq("analysis_request_id", requestId)
    .order("created_at", { ascending: true });

  if (assetsError) {
    throw assetsError;
  }

  return {
    request: request as {
      id: string;
      user_id: string;
      profile_type: ProfileType;
      instagram_url: string | null;
    },
    answers: (answers ?? []) as AnalysisAnswerRow[],
    assets: ((assets ?? []) as AnalysisAssetRow[]).filter((asset) =>
      Boolean(asset.processing_consent_at),
    ),
  };
}

async function loadAssetContentBlocks(assets: AnalysisAssetRow[]) {
  const supabase = await createSupabaseServerClient();
  const prioritized = [...assets]
    .sort(
      (a, b) =>
        (ASSET_TYPE_PRIORITY[a.asset_type] ?? 99) -
        (ASSET_TYPE_PRIORITY[b.asset_type] ?? 99),
    )
    .slice(0, MAX_ASSETS_SENT_TO_AI);

  const blocks: PromptAsset[] = [];
  const skipped: string[] = [];

  for (const asset of prioritized) {
    const { data: blob, error } = await supabase.storage
      .from(asset.storage_bucket)
      .download(asset.storage_path);

    if (error || !blob) {
      skipped.push(`${asset.asset_type}: nao foi possivel ler o arquivo.`);
      continue;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const data = buffer.toString("base64");

    if (data.length > MAX_ASSET_BASE64_BYTES) {
      skipped.push(
        `${asset.asset_type}: arquivo grande demais para envio a IA.`,
      );
      continue;
    }

    blocks.push({
      assetType: asset.asset_type,
      mimeType: asset.mime_type,
      data,
    });
  }

  return { blocks, skipped };
}

export type GeneratedAiDiagnosis = {
  result: AnalysisCalculationResult;
  rawOutput: AiDiagnosisOutput;
  webPayload: WebPayload;
  usage: {
    inputTokens: number;
    outputTokens: number;
    modelDurationMs: number;
    estimatedCostUsdCents: number | null;
  };
};

export async function generateAiDiagnosis(params: {
  requestId: string;
  userId: string;
}): Promise<GeneratedAiDiagnosis> {
  const { request, answers, assets } = await loadContext(
    params.requestId,
    params.userId,
  );
  const { blocks, skipped } = await loadAssetContentBlocks(assets);

  if (blocks.length === 0) {
    throw new AiAnalysisError(
      "Nenhuma evidencia valida disponivel para analise.",
    );
  }

  const client = createAnthropicClient();
  const model = getAnthropicModel();
  const profileType = request.profile_type;
  const useAdaptiveThinking = supportsAdaptiveThinking(model);

  // Built manually (schema only, no `.parse`) instead of passing
  // zodOutputFormat(...) directly to output_config.format: the SDK's own
  // `.parse` throws on any validation failure with no access to the raw
  // text, which makes failures undebuggable (we only ever saw Zod's
  // abstract issue list, never what the model actually produced). We
  // validate ourselves below with safeParse, so the raw payload is always
  // available to log when something doesn't validate.
  const rawFormat = zodOutputFormat(aiDiagnosisOutputSchema);
  const outputFormat = { type: rawFormat.type, schema: rawFormat.schema };

  const startedAt = Date.now();
  // Streamed rather than a single blocking call: the Anthropic SDK itself
  // refuses non-streaming requests it estimates at over ~10 minutes based on
  // max_tokens (this project hit that guard once max_tokens rose to 24000),
  // and the SDK's own docs recommend streaming for any large max_tokens
  // request regardless, since idle non-streaming connections risk being
  // dropped by intermediate networks.
  const stream = client.messages.stream({
    model,
    // A full 8-dimension structured response (diagnosis + strengths +
    // weaknesses + >=1 structured recommendation per dimension) plus the
    // EXTENDED_THINKING_BUDGET_TOKENS budget needs real headroom: one
    // successful production run alone used 18638 output tokens, and a
    // later run hit stop_reason "max_tokens" and was truncated at the
    // previous 24000 ceiling (confirmed via analysis_jobs.error_message).
    max_tokens: 32000,
    thinking: useAdaptiveThinking
      ? { type: "adaptive" }
      : { type: "enabled", budget_tokens: EXTENDED_THINKING_BUDGET_TOKENS },
    system: buildSystemPrompt(profileType),
    output_config: useAdaptiveThinking
      ? { effort: "medium", format: outputFormat }
      : { format: outputFormat },
    messages: [
      {
        role: "user",
        content: buildUserContent({
          profileType,
          instagramUrl: request.instagram_url,
          answers,
          assets: blocks,
          skippedAssetNotes: skipped,
        }),
      },
    ],
  });
  const response = await stream.finalMessage();
  const modelDurationMs = Date.now() - startedAt;

  if (response.stop_reason === "refusal") {
    const category = response.stop_details?.category;
    throw new AiAnalysisError(
      `A analise foi recusada pelos filtros de seguranca da IA${category ? ` (${category})` : ""}.`,
    );
  }

  if (response.stop_reason === "max_tokens") {
    throw new AiAnalysisError(
      "A resposta da IA foi truncada por limite de tokens.",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new AiAnalysisError("A IA nao retornou nenhum bloco de texto.");
  }

  let rawJson: unknown;

  try {
    rawJson = JSON.parse(textBlock.text);
  } catch (error) {
    console.error("[ai] output was not valid JSON:", textBlock.text);
    throw new AiAnalysisError(
      `A saida da IA nao era um JSON valido: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const validation = aiDiagnosisOutputSchema.safeParse(rawJson);

  if (!validation.success) {
    console.error(
      "[ai] output failed schema validation. Raw output:",
      JSON.stringify(rawJson),
      "Issues:",
      validation.error.issues,
    );
    const issueSummary = validation.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new AiAnalysisError(
      `A saida da IA nao seguiu o schema esperado (${issueSummary}).`,
    );
  }

  const parsed = validation.data;

  const domainInput = mapAiOutputToDomainInput({
    output: parsed,
    profileType,
    modelProvider: "anthropic",
    modelName: model,
  });

  const result = calculateAnalysisResult(domainInput);

  return {
    result,
    rawOutput: parsed,
    webPayload: extractWebPayload(parsed),
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      modelDurationMs,
      estimatedCostUsdCents: estimateCostUsdCents(
        model,
        response.usage.input_tokens,
        response.usage.output_tokens,
      ),
    },
  };
}
