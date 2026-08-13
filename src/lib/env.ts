import "server-only";
import { z } from "zod";

const rawServerEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NODE_ENV: z.string().optional(),
  ENABLE_DEVELOPMENT_FIXTURES: z.enum(["true", "false"]).optional(),
  OPENAI_MODEL_PROVIDER: z.string().min(1).default("not_integrated"),
  OPENAI_MODEL_NAME: z.string().min(1).default("not_integrated"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
  MERCADO_PAGO_PUBLIC_KEY: z.string().min(1).optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export type ServerEnv = {
  NEXT_PUBLIC_APP_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ENABLE_DEVELOPMENT_FIXTURES: boolean;
  OPENAI_MODEL_PROVIDER: string;
  OPENAI_MODEL_NAME: string;
  ANTHROPIC_API_KEY: string | undefined;
  ANTHROPIC_MODEL: string;
  MERCADO_PAGO_PUBLIC_KEY: string | undefined;
  MERCADO_PAGO_ACCESS_TOKEN: string | undefined;
  MERCADO_PAGO_WEBHOOK_SECRET: string | undefined;
};
export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getServerEnv(): ServerEnv {
  const env = rawServerEnvSchema.parse(process.env);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const supabaseAnonKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    ENABLE_DEVELOPMENT_FIXTURES:
      env.NODE_ENV === "development" &&
      env.ENABLE_DEVELOPMENT_FIXTURES === "true",
    OPENAI_MODEL_PROVIDER: env.OPENAI_MODEL_PROVIDER,
    OPENAI_MODEL_NAME: env.OPENAI_MODEL_NAME,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
    MERCADO_PAGO_PUBLIC_KEY: env.MERCADO_PAGO_PUBLIC_KEY,
    MERCADO_PAGO_ACCESS_TOKEN: env.MERCADO_PAGO_ACCESS_TOKEN,
    MERCADO_PAGO_WEBHOOK_SECRET: env.MERCADO_PAGO_WEBHOOK_SECRET,
  };
}

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse(process.env);
}
