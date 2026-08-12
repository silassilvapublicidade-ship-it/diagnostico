import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(async () => ({ error: null as Error | null })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { exchangeCodeForSession: harness.exchangeCodeForSession },
  }),
}));

const ORIGIN = "https://diagnostico.silassilva.click";

function requestFor(query: string) {
  return new NextRequest(`${ORIGIN}/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    harness.exchangeCodeForSession.mockReset();
    harness.exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("exchanges a valid code and redirects to /app when next is absent", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(requestFor("?code=abc123"));

    expect(harness.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/app`);
  });

  it("redirects to the commercial destination when next=/app/diagnosticos/novo", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      requestFor("?code=abc123&next=%2Fapp%2Fdiagnosticos%2Fnovo"),
    );

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/app/diagnosticos/novo`,
    );
  });

  it("never redirects to an absolute external URL passed as next", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      requestFor(`?code=abc123&next=${encodeURIComponent("https://site-malicioso.com")}`),
    );

    expect(response.headers.get("location")).toBe(`${ORIGIN}/app`);
  });

  it("never redirects to a protocol-relative //host next value", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      requestFor(`?code=abc123&next=${encodeURIComponent("//site-malicioso.com")}`),
    );

    expect(response.headers.get("location")).toBe(`${ORIGIN}/app`);
  });

  it("redirects to /entrar with an error and never calls exchangeCodeForSession when code is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(requestFor("?next=/app"));

    expect(harness.exchangeCodeForSession).not.toHaveBeenCalled();
    const location = response.headers.get("location")!;
    expect(location.startsWith(`${ORIGIN}/entrar?erro=`)).toBe(true);
  });

  it("redirects to /entrar with a generic error when exchangeCodeForSession fails, never leaking the internal message", async () => {
    harness.exchangeCodeForSession.mockResolvedValueOnce({
      error: new Error("invalid grant: pkce verifier mismatch (supabase internal)"),
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(requestFor("?code=bad-code&next=/app"));

    const location = response.headers.get("location")!;
    expect(location.startsWith(`${ORIGIN}/entrar?erro=`)).toBe(true);
    expect(location).not.toContain("invalid grant");
    expect(location).not.toContain("pkce");
    expect(location).not.toContain("supabase");
  });
});
