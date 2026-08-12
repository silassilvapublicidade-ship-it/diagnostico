import Link from "next/link";

import { ANALYSIS_STATUSES, type AnalysisStatus, type ProfileType } from "@/domain/methodology-8d";
import { STATUS_COPY } from "@/modules/analysis/status";
import { listDiagnosticsForAdmin } from "@/modules/admin/diagnostics";

import { formatNumber, formatUsdCents, shortId } from "../format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const FILTER_CHIPS: Array<{ label: string; params: Record<string, string> }> = [
  { label: "Todos", params: {} },
  { label: "Concluídos", params: { status: "completed" } },
  { label: "Processando", params: { status: "processing" } },
  { label: "Erro", params: { status: "failed" } },
  { label: "Revisão necessária", params: { requiresReview: "true" } },
  { label: "Reprocessados", params: { reprocessed: "true" } },
  { label: "Business", params: { profileType: "business" } },
  { label: "Creator", params: { profileType: "creator" } },
];

function chipHref(params: Record<string, string>, search?: string) {
  const query = new URLSearchParams(params);
  if (search) query.set("search", search);
  const qs = query.toString();
  return qs ? `/admin/diagnosticos?${qs}` : "/admin/diagnosticos";
}

function isChipActive(
  chipParams: Record<string, string>,
  current: {
    status?: string | undefined;
    requiresReview?: string | undefined;
    reprocessed?: string | undefined;
    profileType?: string | undefined;
  },
) {
  const keys = Object.keys(chipParams);
  if (keys.length === 0) {
    return !current.status && !current.requiresReview && !current.reprocessed && !current.profileType;
  }
  return keys.every((key) => chipParams[key] === current[key as keyof typeof current]);
}

export default async function AdminDiagnosticsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const statusParam = single(params.status);
  const requiresReviewParam = single(params.requiresReview);
  const reprocessedParam = single(params.reprocessed);
  const profileTypeParam = single(params.profileType);
  const search = single(params.search) ?? "";
  const page = Number(single(params.page) ?? "1") || 1;

  const status =
    statusParam && (ANALYSIS_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as AnalysisStatus)
      : undefined;
  const profileType =
    profileTypeParam === "business" || profileTypeParam === "creator"
      ? (profileTypeParam as ProfileType)
      : undefined;

  const { rows, total, pageSize } = await listDiagnosticsForAdmin({
    status,
    requiresReview: requiresReviewParam === "true" ? true : undefined,
    reprocessed: reprocessedParam === "true" ? true : undefined,
    profileType,
    search: search || undefined,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentFilters = {
    status: statusParam,
    requiresReview: requiresReviewParam,
    reprocessed: reprocessedParam,
    profileType: profileTypeParam,
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker text-accent">Projeto 8D · Admin</p>
        <h1 className="display-title mt-3 text-4xl leading-[0.95] sm:text-5xl">
          Diagnósticos.
        </h1>
        <p className="mt-3 text-sm text-cream/50">{formatNumber(total)} diagnóstico(s) no total.</p>
      </div>

      <form action="/admin/diagnosticos" className="flex flex-wrap gap-3" method="get">
        <input
          className="form-control max-w-xs"
          defaultValue={search}
          name="search"
          placeholder="ID, e-mail, nome ou Instagram"
          type="text"
        />
        <button className="action-secondary" type="submit">
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => {
          const active = isChipActive(chip.params, currentFilters);
          return (
            <Link
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-cream/15 text-cream/55 hover:border-accent/50 hover:text-cream"
              }`}
              href={chipHref(chip.params, search)}
              key={chip.label}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-[0.06em] text-cream/45">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Custo</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-cream/50" colSpan={8}>
                  Nenhum diagnóstico encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  className="border-b border-white/5 text-cream/80 transition hover:bg-white/[0.02]"
                  key={row.id}
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-cream">{row.userFullName ?? "—"}</p>
                    <p className="text-[11px] text-cream/40">{row.userEmail ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[160px] truncate text-xs">
                    {row.instagramUrl ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.profileType === "business" ? "Negócio" : "Criador"}
                  </td>
                  <td className="px-4 py-3 text-xs">{STATUS_COPY[row.status].title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.score ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatUsdCents(row.estimatedCostUsdCents)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-cream/55">
                    {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                      href={`/admin/diagnosticos/${row.id}`}
                    >
                      Ver diagnóstico →
                    </Link>
                    <p className="mt-0.5 font-mono text-[10px] text-cream/30">{shortId(row.id)}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-cream/55">
          <p>
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                className="action-secondary px-4 py-2 text-xs"
                href={chipHref({ ...Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v)) as Record<string, string>, page: String(page - 1) }, search)}
              >
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                className="action-secondary px-4 py-2 text-xs"
                href={chipHref({ ...Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v)) as Record<string, string>, page: String(page + 1) }, search)}
              >
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
