"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configuracao publica do Supabase ausente.");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
