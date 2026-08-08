import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function getSupabasePublicConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public configuration.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPrivateRoute = request.nextUrl.pathname.startsWith("/app");
  const isAuthRoute = [
    "/entrar",
    "/cadastro",
    "/recuperar-acesso",
    "/atualizar-senha",
  ].some((path) => request.nextUrl.pathname.startsWith(path));

  if (isPrivateRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/entrar";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
