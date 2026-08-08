import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_MODEL_PROVIDER: z.string().min(1).default("openai"),
  OPENAI_MODEL_NAME: z.string().min(1),
  MERCADO_PAGO_PUBLIC_KEY: z.string().min(1),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse(process.env);
}
