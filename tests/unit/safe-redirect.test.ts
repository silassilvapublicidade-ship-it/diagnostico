import { describe, expect, it } from "vitest";

import { sanitizeInternalPath } from "@/lib/safe-redirect";

describe("sanitizeInternalPath", () => {
  it("accepts a plain internal path", () => {
    expect(sanitizeInternalPath("/app")).toBe("/app");
    expect(sanitizeInternalPath("/app/diagnosticos/novo")).toBe(
      "/app/diagnosticos/novo",
    );
  });

  it("rejects absolute URLs regardless of scheme", () => {
    expect(sanitizeInternalPath("https://site-malicioso.com")).toBe("/app");
    expect(sanitizeInternalPath("http://site-malicioso.com")).toBe("/app");
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeInternalPath("//site-malicioso.com")).toBe("/app");
  });

  it("rejects backslash variants that browsers normalize into protocol-relative URLs", () => {
    expect(sanitizeInternalPath("/\\site-malicioso.com")).toBe("/app");
    expect(sanitizeInternalPath("\\\\site-malicioso.com")).toBe("/app");
  });

  it("falls back on empty, null, or undefined values", () => {
    expect(sanitizeInternalPath("")).toBe("/app");
    expect(sanitizeInternalPath(null)).toBe("/app");
    expect(sanitizeInternalPath(undefined)).toBe("/app");
  });

  it("falls back on a relative path that does not start with /", () => {
    expect(sanitizeInternalPath("app/diagnosticos")).toBe("/app");
  });

  it("honors a custom fallback", () => {
    expect(sanitizeInternalPath("https://evil.com", "/entrar")).toBe("/entrar");
    expect(sanitizeInternalPath(null, "/entrar")).toBe("/entrar");
  });
});
