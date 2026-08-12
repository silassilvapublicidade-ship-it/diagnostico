import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const middlewareSource = readFileSync(
  new URL("../../src/lib/supabase/middleware.ts", import.meta.url),
  "utf8",
);
const proxySource = readFileSync(
  new URL("../../src/proxy.ts", import.meta.url),
  "utf8",
);

describe("private route protection", () => {
  it("uses the Next.js proxy entrypoint to run auth session checks", () => {
    expect(proxySource).toContain("export async function proxy");
    expect(proxySource).toContain("return updateSession(request)");
    expect(proxySource).toContain("export const proxyConfig");
  });

  it("protects the private app namespace and redirects anonymous users", () => {
    expect(middlewareSource).toContain('pathname.startsWith("/app")');
    expect(middlewareSource).toContain('redirectUrl.pathname = "/entrar"');
    expect(middlewareSource).toContain('searchParams.set("next"');
  });

  it("keeps service role out of middleware/browser auth flow", () => {
    expect(middlewareSource).not.toContain("SERVICE_ROLE");
    expect(middlewareSource).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("treats /admin as a private route and redirects anonymous visitors to /entrar", () => {
    expect(middlewareSource).toContain('pathname.startsWith("/admin")');
    expect(middlewareSource).toContain(
      'request.nextUrl.pathname.startsWith("/app") || isAdminRoute',
    );
  });

  it("redirects an authenticated non-admin session away from /admin, never revealing why", () => {
    expect(middlewareSource).toContain("isAdminRoute && user");
    expect(middlewareSource).toContain('role !== "admin"');
    expect(middlewareSource).toContain('redirectUrl.pathname = "/app"');
  });

  it("treats /comecar (magic link entry) as an auth route, redirecting logged-in users to /app", () => {
    expect(middlewareSource).toContain('"/comecar"');
  });
});
