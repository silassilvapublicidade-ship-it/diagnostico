import { describe, expect, it } from "vitest";

import { extractInstagramUsername } from "@/modules/analysis/profile-photo";

describe("extractInstagramUsername", () => {
  it("extracts the username from a plain profile URL", () => {
    expect(
      extractInstagramUsername("https://instagram.com/silassilva.click"),
    ).toBe("silassilva.click");
  });

  it("extracts the username with www, trailing slash, and query params", () => {
    expect(
      extractInstagramUsername(
        "https://www.instagram.com/silassilva.click/?hl=pt-br",
      ),
    ).toBe("silassilva.click");
  });

  it("returns null for a non-Instagram host", () => {
    expect(
      extractInstagramUsername("https://example.com/silassilva.click"),
    ).toBeNull();
  });

  it("returns null for reel/post/story links, never mistaking them for a username", () => {
    expect(
      extractInstagramUsername("https://instagram.com/reel/abc123/"),
    ).toBeNull();
    expect(
      extractInstagramUsername("https://instagram.com/p/abc123/"),
    ).toBeNull();
    expect(
      extractInstagramUsername("https://instagram.com/stories/someone/"),
    ).toBeNull();
  });

  it("returns null for a URL with no path segment", () => {
    expect(extractInstagramUsername("https://instagram.com/")).toBeNull();
  });

  it("returns null for a malformed URL instead of throwing", () => {
    expect(extractInstagramUsername("not a url")).toBeNull();
  });
});
