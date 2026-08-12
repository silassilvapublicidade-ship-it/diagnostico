"use server";

import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env";
import { sanitizeInternalPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const next = field(formData, "next") || "/app";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithError("/entrar", "Nao foi possivel entrar com esses dados.");
  }

  redirect(next.startsWith("/app") ? next : "/app");
}

export async function signUpAction(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const fullName = field(formData, "fullName");
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/app`,
    },
  });

  if (error) {
    redirectWithError("/cadastro", "Nao foi possivel criar sua conta.");
  }

  redirect("/app");
}

export async function signInWithMagicLinkAction(formData: FormData) {
  const email = field(formData, "email");
  const fullName = field(formData, "fullName");
  // The hidden `next` field is only a hint from the client -- it is never
  // trusted as-is. sanitizeInternalPath() is the same function the callback
  // route re-validates against, so a tampered value here can only ever
  // resolve to a same-origin path, never an external redirect.
  const next = sanitizeInternalPath(field(formData, "next") || null, "/app");
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      // Only set on first creation (raw_user_meta_data); an existing user's
      // name is left untouched. Omitted entirely when blank -- e.g. the
      // /entrar shortcut, which only asks for email -- rather than sent as
      // an empty string.
      ...(fullName ? { data: { full_name: fullName } } : {}),
    },
  });

  if (error) {
    redirectWithError("/comecar", "Nao foi possivel enviar o link de acesso.");
  }

  redirect("/comecar?enviado=1");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = field(formData, "email");
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atualizar-senha`,
  });

  if (error) {
    redirectWithError(
      "/recuperar-acesso",
      "Nao foi possivel iniciar a recuperacao.",
    );
  }

  redirect("/recuperar-acesso?enviado=1");
}

export async function updatePasswordAction(formData: FormData) {
  const password = field(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirectWithError(
      "/atualizar-senha",
      "Nao foi possivel atualizar a senha.",
    );
  }

  redirect("/app");
}
