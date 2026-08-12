import { beforeEach, describe, expect, it, vi } from "vitest";

import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import { resetFakeStore } from "../mocks/persistence-harness";

const harness = vi.hoisted(() => ({ store: {} as FakeStore }));

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

describe("listCustomersForAdmin", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("aggregates diagnosis counts, completed count, and last score per customer", async () => {
    seedRow(harness.store, "profiles", {
      id: "user-1",
      full_name: "Maria Silva",
      email: "maria@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "completed",
      created_at: "2026-01-05T00:00:00.000Z",
    });
    seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "failed",
      created_at: "2026-01-10T00:00:00.000Z",
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: (harness.store.analysis_requests ?? [])[0]!.id,
      result_sequence: 1,
      score: 58,
    });

    const { listCustomersForAdmin } = await import("@/modules/admin/customers");
    const page = await listCustomersForAdmin({});

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]!.diagnosesCount).toBe(2);
    expect(page.rows[0]!.completedCount).toBe(1);
    // The most recent request (2026-01-10, failed) has no result yet, so the
    // last score stays null even though an earlier request has a score.
    expect(page.rows[0]!.lastDiagnosisStatus).toBe("failed");
    expect(page.rows[0]!.lastScore).toBeNull();
  });

  it("shows zero diagnoses for a customer who never submitted one, without throwing", async () => {
    seedRow(harness.store, "profiles", {
      id: "user-2",
      full_name: "Novo Usuario",
      email: "novo@example.com",
      created_at: new Date().toISOString(),
    });

    const { listCustomersForAdmin } = await import("@/modules/admin/customers");
    const page = await listCustomersForAdmin({});

    expect(page.rows[0]!.diagnosesCount).toBe(0);
    expect(page.rows[0]!.lastDiagnosisAt).toBeNull();
    expect(page.rows[0]!.lastScore).toBeNull();
  });

  it("paginates customers server-side", async () => {
    for (let i = 0; i < 5; i += 1) {
      seedRow(harness.store, "profiles", {
        id: `user-${i}`,
        full_name: `Cliente ${i}`,
        email: `cliente${i}@example.com`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
      });
    }

    const { listCustomersForAdmin } = await import("@/modules/admin/customers");
    const page = await listCustomersForAdmin({ page: 1, pageSize: 2 });

    expect(page.rows).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});
