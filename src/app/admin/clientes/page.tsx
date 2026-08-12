import Link from "next/link";

import { listCustomersForAdmin } from "@/modules/admin/customers";
import { STATUS_COPY } from "@/modules/analysis/status";

import { formatDateTime, formatNumber } from "../format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number(rawPage ?? "1") || 1;

  const { rows, total, pageSize } = await listCustomersForAdmin({ page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker text-accent">Projeto 8D · Admin</p>
        <h1 className="display-title mt-3 text-4xl leading-[0.95] sm:text-5xl">
          Clientes.
        </h1>
        <p className="mt-3 text-sm text-cream/50">{formatNumber(total)} cliente(s) cadastrado(s).</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[840px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-[0.06em] text-cream/45">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Diagnósticos</th>
              <th className="px-4 py-3">Concluídos</th>
              <th className="px-4 py-3">Último diagnóstico</th>
              <th className="px-4 py-3">Último score</th>
              <th className="px-4 py-3">Status recente</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-cream/50" colSpan={8}>
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="border-b border-white/5 text-cream/80" key={row.userId}>
                  <td className="px-4 py-3">{row.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-cream/60">{row.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-cream/55">{formatDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3">{row.diagnosesCount}</td>
                  <td className="px-4 py-3">{row.completedCount}</td>
                  <td className="px-4 py-3 text-xs text-cream/55">{formatDateTime(row.lastDiagnosisAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.lastScore ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {row.lastDiagnosisStatus ? STATUS_COPY[row.lastDiagnosisStatus].title : "—"}
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
              <Link className="action-secondary px-4 py-2 text-xs" href={`/admin/clientes?page=${page - 1}`}>
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link className="action-secondary px-4 py-2 text-xs" href={`/admin/clientes?page=${page + 1}`}>
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
