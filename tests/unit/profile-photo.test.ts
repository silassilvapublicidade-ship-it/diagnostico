import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import { resetFakeStore } from "../mocks/persistence-harness";
import { extractInstagramUsername } from "@/modules/analysis/profile-photo";

const harness = vi.hoisted(() => ({
  store: {} as FakeStore,
}));

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

function htmlWithOgImage(url: string) {
  return `<html><head><meta property="og:image" content="${url}" /></head></html>`;
}

function jpegResponse(bytes: number) {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "content-type": "image/jpeg" },
  });
}

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

describe("fetchAndStoreProfilePhotoBestEffort", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("downloads the og:image and records the storage path on success", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });

    const fetchMock = vi.fn(async (url: string | URL) => {
      const href = url.toString();
      if (href.includes("instagram.com/silassilva.click")) {
        return new Response(
          htmlWithOgImage("https://scontent.cdninstagram.com/photo.jpg"),
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      if (href === "https://scontent.cdninstagram.com/photo.jpg") {
        return jpegResponse(1024);
      }
      throw new Error(`Unexpected fetch: ${href}`);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await fetchAndStoreProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      instagramUrl: "https://instagram.com/silassilva.click",
    });

    const updated = (harness.store.analysis_requests ?? [])[0]!;
    expect(updated.profile_photo_storage_path).toContain(
      `user-1/${request.id}/profile-photo/`,
    );
    expect(updated.profile_photo_mime_type).toBe("image/jpeg");
    expect(harness.store.__storage).toHaveLength(1);
  });

  it("never throws and never touches the request when the URL is not an Instagram profile", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://example.com/nope",
    });
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      fetchAndStoreProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        instagramUrl: "https://example.com/nope",
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws when Instagram blocks the request (non-200 response)", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });
    global.fetch = vi.fn(
      async () => new Response("blocked", { status: 429 }),
    ) as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      fetchAndStoreProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        instagramUrl: "https://instagram.com/silassilva.click",
      }),
    ).resolves.toBeUndefined();

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws when the page has no og:image tag (e.g. private account)", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });
    global.fetch = vi.fn(
      async () =>
        new Response("<html><head></head></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    ) as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await fetchAndStoreProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      instagramUrl: "https://instagram.com/silassilva.click",
    });

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws when fetch itself throws (network error, timeout/abort)", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });
    global.fetch = vi.fn(async () => {
      throw new Error("network blip");
    }) as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      fetchAndStoreProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        instagramUrl: "https://instagram.com/silassilva.click",
      }),
    ).resolves.toBeUndefined();
  });

  it("never throws and never stores when the fetched content is not an image", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });
    global.fetch = vi.fn(async (url: string | URL) => {
      const href = url.toString();
      if (href.includes("instagram.com/silassilva.click")) {
        return new Response(
          htmlWithOgImage("https://scontent.cdninstagram.com/notreally.jpg"),
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      return new Response("<html>login wall</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }) as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await fetchAndStoreProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      instagramUrl: "https://instagram.com/silassilva.click",
    });

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("never throws when the Storage upload itself fails", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });
    harness.store.__storageShouldFail = true;

    global.fetch = vi.fn(async (url: string | URL) => {
      const href = url.toString();
      if (href.includes("instagram.com/silassilva.click")) {
        return new Response(
          htmlWithOgImage("https://scontent.cdninstagram.com/photo.jpg"),
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      return jpegResponse(1024);
    }) as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await expect(
      fetchAndStoreProfilePhotoBestEffort({
        requestId: request.id as string,
        userId: "user-1",
        instagramUrl: "https://instagram.com/silassilva.click",
      }),
    ).resolves.toBeUndefined();

    expect(
      (harness.store.analysis_requests ?? [])[0]!.profile_photo_storage_path,
    ).toBeUndefined();
  });

  it("is never inserted into analysis_assets -- it must never be treated as AI evidence", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      instagram_url: "https://instagram.com/silassilva.click",
    });

    global.fetch = vi.fn(async (url: string | URL) => {
      const href = url.toString();
      if (href.includes("instagram.com/silassilva.click")) {
        return new Response(
          htmlWithOgImage("https://scontent.cdninstagram.com/photo.jpg"),
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      return jpegResponse(1024);
    }) as unknown as typeof fetch;

    const { fetchAndStoreProfilePhotoBestEffort } =
      await import("@/modules/analysis/profile-photo");

    await fetchAndStoreProfilePhotoBestEffort({
      requestId: request.id as string,
      userId: "user-1",
      instagramUrl: "https://instagram.com/silassilva.click",
    });

    expect(harness.store.analysis_assets ?? []).toHaveLength(0);
  });
});
