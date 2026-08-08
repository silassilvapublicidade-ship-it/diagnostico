import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertDevelopmentFixturesEnabled,
  buildDevelopmentFixtureResult,
} from "../../src/modules/analysis/development-fixture";

describe("development fixture gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows fixtures only when development env and explicit flag are present", () => {
    expect(() =>
      assertDevelopmentFixturesEnabled({
        NODE_ENV: "development",
        ENABLE_DEVELOPMENT_FIXTURES: "true",
      }),
    ).not.toThrow();
  });

  it("blocks fixtures outside development", () => {
    expect(() =>
      assertDevelopmentFixturesEnabled({
        NODE_ENV: "production",
        ENABLE_DEVELOPMENT_FIXTURES: "true",
      }),
    ).toThrow(/only available in development/);
  });

  it("blocks fixtures without the explicit flag", () => {
    expect(() =>
      assertDevelopmentFixturesEnabled({
        NODE_ENV: "development",
        ENABLE_DEVELOPMENT_FIXTURES: "false",
      }),
    ).toThrow(/explicit env flag/);
  });

  it("marks generated development results with a typed fixture origin", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEVELOPMENT_FIXTURES", "true");

    const fixture = buildDevelopmentFixtureResult("business");

    expect(fixture.origin).toBe("development_fixture");
    expect(fixture.fixtureKind).toBe("business_complete");
    expect(fixture.result.score).toBe(58);
  });
});
