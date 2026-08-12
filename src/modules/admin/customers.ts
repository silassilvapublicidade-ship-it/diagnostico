import "server-only";

import type { AnalysisStatus } from "@/domain/methodology-8d";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DEFAULT_PAGE_SIZE = 20;

export type AdminCustomerRow = {
  userId: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  diagnosesCount: number;
  completedCount: number;
  lastDiagnosisAt: string | null;
  lastDiagnosisStatus: AnalysisStatus | null;
  lastScore: number | null;
};

export type CustomersPage = {
  rows: AdminCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listCustomersForAdmin(
  params: { page?: number; pageSize?: number } = {},
): Promise<CustomersPage> {
  const admin = createSupabaseAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;

  const { data: profiles, count, error } = await admin
    .from("profiles")
    .select("id, full_name, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    throw error;
  }

  const users = (profiles ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
  }>;
  const userIds = users.map((user) => user.id);

  const { data: requestsData } = userIds.length > 0
    ? await admin
        .from("analysis_requests")
        .select("id, user_id, status, created_at")
        .in("user_id", userIds)
    : { data: [] as Array<{ id: string; user_id: string; status: AnalysisStatus; created_at: string }> };

  const requests = (requestsData ?? []) as Array<{
    id: string;
    user_id: string;
    status: AnalysisStatus;
    created_at: string;
  }>;

  const byUser = new Map<string, typeof requests>();
  for (const request of requests) {
    const list = byUser.get(request.user_id) ?? [];
    list.push(request);
    byUser.set(request.user_id, list);
  }

  const latestRequestIds: string[] = [];
  const latestRequestByUser = new Map<string, (typeof requests)[number]>();
  for (const [userId, list] of byUser) {
    const latest = list.reduce((a, b) => (a.created_at > b.created_at ? a : b));
    latestRequestByUser.set(userId, latest);
    latestRequestIds.push(latest.id);
  }

  const { data: resultsData } = latestRequestIds.length > 0
    ? await admin
        .from("analysis_results")
        .select("analysis_request_id, result_sequence, score")
        .in("analysis_request_id", latestRequestIds)
    : { data: [] as Array<{ analysis_request_id: string; result_sequence: number; score: number }> };

  const latestResultByRequest = new Map<string, { sequence: number; score: number }>();
  for (const result of (resultsData ?? []) as Array<{
    analysis_request_id: string;
    result_sequence: number;
    score: number;
  }>) {
    const current = latestResultByRequest.get(result.analysis_request_id);
    if (!current || result.result_sequence > current.sequence) {
      latestResultByRequest.set(result.analysis_request_id, {
        sequence: result.result_sequence,
        score: result.score,
      });
    }
  }

  const rows: AdminCustomerRow[] = users.map((user) => {
    const userRequests = byUser.get(user.id) ?? [];
    const latestRequest = latestRequestByUser.get(user.id) ?? null;

    return {
      userId: user.id,
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
      diagnosesCount: userRequests.length,
      completedCount: userRequests.filter((request) => request.status === "completed").length,
      lastDiagnosisAt: latestRequest?.created_at ?? null,
      lastDiagnosisStatus: latestRequest?.status ?? null,
      lastScore: latestRequest ? latestResultByRequest.get(latestRequest.id)?.score ?? null : null,
    };
  });

  return { rows, total: count ?? 0, page, pageSize };
}
