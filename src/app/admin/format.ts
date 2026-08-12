// AI cost is billed by Anthropic in USD, unlike the product's BRL price --
// always render it as USD to avoid implying a currency it isn't.
export function formatUsdCents(cents: number | null): string {
  if (cents == null) return "—";
  return `US$ ${(cents / 100).toFixed(2)}`;
}

export function formatDurationMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPercent(ratio: number | null): string {
  if (ratio == null) return "—";
  return `${Math.round(ratio * 100)}%`;
}

export function formatNumber(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}
