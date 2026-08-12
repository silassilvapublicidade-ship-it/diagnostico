import { NextResponse, type NextRequest } from "next/server";

import { sanitizeInternalPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AUTH_ERROR_MESSAGE =
  "Nao foi possivel confirmar seu acesso. Tente novamente.";

function redirectToSignInWithError(origin: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/entrar?erro=${encodeURIComponent(AUTH_ERROR_MESSAGE)}`, origin),
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Re-validated here even though signInWithMagicLinkAction already
  // sanitizes `next` before sending the email: this endpoint is a public
  // GET route that accepts whatever query string a request carries,
  // regardless of who or what constructed the link, so it can never trust
  // the caller.
  const next = sanitizeInternalPath(requestUrl.searchParams.get("next"), "/app");

  if (!code) {
    return redirectToSignInWithError(requestUrl.origin);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth-callback] exchangeCodeForSession failed:", error.message);
    return redirectToSignInWithError(requestUrl.origin);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
