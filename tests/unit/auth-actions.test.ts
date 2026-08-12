import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureRedirectDigest } from "../mocks/persistence-harness";

const harness = vi.hoisted(() => ({
  signInWithOtp: vi.fn<(credentials: unknown) => Promise<{ error: Error | null }>>(
    async () => ({ error: null }),
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signInWithOtp: harness.signInWithOtp,
    },
  }),
}));

type SignInWithOtpCall = {
  email: string;
  options: { emailRedirectTo: string; data?: { full_name: string } };
};

function lastCall(): SignInWithOtpCall {
  const call = harness.signInWithOtp.mock.calls.at(-1)?.[0] as
    | SignInWithOtpCall
    | undefined;
  if (!call) {
    throw new Error("signInWithOtp was not called");
  }
  return call;
}

function nextFromLastCall(): string | null {
  return new URL(lastCall().options.emailRedirectTo).searchParams.get("next");
}

describe("signInWithMagicLinkAction", () => {
  beforeEach(() => {
    harness.signInWithOtp.mockReset();
    harness.signInWithOtp.mockResolvedValue({ error: null });
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://diagnostico.silassilva.click");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends the magic link to the app's callback and includes the name when provided", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "cliente@example.com");
    formData.set("fullName", "Maria Silva");
    formData.set("next", "/app");

    const digest = await captureRedirectDigest(signInWithMagicLinkAction(formData));

    const call = lastCall();
    expect(call.email).toBe("cliente@example.com");
    expect(call.options.data).toEqual({ full_name: "Maria Silva" });
    expect(new URL(call.options.emailRedirectTo).pathname).toBe("/auth/callback");
    expect(digest).toContain("/comecar?enviado=1");
  });

  it("omits the data field entirely when no name is given, e.g. the /entrar shortcut", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "retorno@example.com");
    formData.set("next", "/app");

    await captureRedirectDigest(signInWithMagicLinkAction(formData));

    expect(lastCall().options.data).toBeUndefined();
  });

  it("uses /app/diagnosticos/novo as the destination when the /comecar form submits it", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "cliente@example.com");
    formData.set("fullName", "Maria Silva");
    formData.set("next", "/app/diagnosticos/novo");

    await captureRedirectDigest(signInWithMagicLinkAction(formData));

    expect(nextFromLastCall()).toBe("/app/diagnosticos/novo");
  });

  it("uses /app as the destination when the /entrar form submits it", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "retorno@example.com");
    formData.set("next", "/app");

    await captureRedirectDigest(signInWithMagicLinkAction(formData));

    expect(nextFromLastCall()).toBe("/app");
  });

  it("falls back to /app when no next field is submitted at all", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "cliente@example.com");

    await captureRedirectDigest(signInWithMagicLinkAction(formData));

    expect(nextFromLastCall()).toBe("/app");
  });

  it("sanitizes a malicious next value posted directly to the action -- never reaches emailRedirectTo as an external URL", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "atacante@example.com");
    formData.set("next", "https://site-malicioso.com");

    await captureRedirectDigest(signInWithMagicLinkAction(formData));

    const call = lastCall();
    expect(nextFromLastCall()).toBe("/app");
    expect(call.options.emailRedirectTo).not.toContain("site-malicioso.com");
  });

  it("sanitizes a protocol-relative next value posted directly to the action", async () => {
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "atacante@example.com");
    formData.set("next", "//site-malicioso.com");

    await captureRedirectDigest(signInWithMagicLinkAction(formData));

    expect(nextFromLastCall()).toBe("/app");
  });

  it("redirects back with an error message when Supabase Auth rejects the request", async () => {
    harness.signInWithOtp.mockResolvedValueOnce({ error: new Error("boom") });
    const { signInWithMagicLinkAction } = await import("@/modules/auth/actions");
    const formData = new FormData();
    formData.set("email", "cliente@example.com");

    const digest = await captureRedirectDigest(signInWithMagicLinkAction(formData));

    expect(digest).toContain("/comecar?erro=");
  });
});
