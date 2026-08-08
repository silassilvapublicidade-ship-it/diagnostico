import { z } from "zod";

export const RESULT_ORIGINS = [
  "ai_generated",
  "development_fixture",
  "human_reviewed",
] as const;

export const resultOriginSchema = z.enum(RESULT_ORIGINS);

export type ResultOrigin = (typeof RESULT_ORIGINS)[number];
