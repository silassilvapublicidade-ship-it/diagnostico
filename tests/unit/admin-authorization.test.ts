import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureRedirectDigest } from "../mocks/persistence-harness";

const harness = vi.hoisted(() => ({
  user: null as { id: string; app_metadata?: { role?: string } } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: harness.user } }),
    },
  }),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    harness.user = null;
  });

  it("redirects an unauthenticated visitor to /entrar", async () => {
    const { requireAdmin } = await import("@/modules/auth/session");

    const digest = await captureRedirectDigest(requireAdmin());

    expect(digest).toContain("/entrar");
  });

  it("redirects an authenticated user without the admin role to /app", async () => {
    harness.user = { id: "user-1" };
    const { requireAdmin } = await import("@/modules/auth/session");

    const digest = await captureRedirectDigest(requireAdmin());

    expect(digest).toContain("/app");
  });

  it("redirects an authenticated user with a non-admin role to /app", async () => {
    harness.user = { id: "user-1", app_metadata: { role: "support" } };
    const { requireAdmin } = await import("@/modules/auth/session");

    const digest = await captureRedirectDigest(requireAdmin());

    expect(digest).toContain("/app");
  });

  it("returns the user when app_metadata.role is admin", async () => {
    harness.user = { id: "admin-1", app_metadata: { role: "admin" } };
    const { requireAdmin } = await import("@/modules/auth/session");

    const user = await requireAdmin();

    expect(user.id).toBe("admin-1");
  });
});
