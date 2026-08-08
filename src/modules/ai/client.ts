import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { getServerEnv } from "@/lib/env";

export function createAnthropicClient(): Anthropic {
  const env = getServerEnv();

  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }

  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

export function getAnthropicModel(): string {
  return getServerEnv().ANTHROPIC_MODEL;
}
