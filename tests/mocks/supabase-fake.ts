import { randomUUID } from "node:crypto";

export type FakeRow = Record<string, unknown>;

export type FakeStore = Record<string, FakeRow[] | undefined> & {
  __storage?: Array<{ bucket: string; path: string }>;
  __storageShouldFail?: boolean;
  __insertFaults?: Record<string, string>;
  __storageFiles?: Record<string, { data: BlobPart; type: string }>;
};

export function createFakeStore(): FakeStore {
  return {};
}

export function seedStorageFile(
  store: FakeStore,
  bucket: string,
  path: string,
  content: { data: BlobPart; type: string },
) {
  store.__storageFiles ??= {};
  store.__storageFiles[`${bucket}/${path}`] = content;
}

export function seedRow(store: FakeStore, table: string, row: FakeRow) {
  const rows = store[table] ?? (store[table] = []);
  const inserted = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...row,
  };
  rows.push(inserted);
  return inserted;
}

type ClientMode = { kind: "admin" } | { kind: "rls"; userId: string };

type FakeResult = {
  data: FakeRow | FakeRow[] | null;
  error: Error | null;
  count?: number;
};

/**
 * Mirrors the RLS `select` policies from supabase/migrations/0001_initial_schema.sql
 * closely enough to catch a persistence-layer regression that reads via the
 * service-role client instead of the session-scoped one, or that forgets the
 * requires_review / deleted_at guards the real policies enforce.
 */
const RLS_SELECT_POLICIES: Record<
  string,
  (row: FakeRow, store: FakeStore, userId: string) => boolean
> = {
  analysis_requests: (row, _store, userId) => row.user_id === userId,
  analysis_results: (row, store, userId) => {
    if (row.requires_review === true) {
      return false;
    }
    const request = (store.analysis_requests ?? []).find(
      (candidate) => candidate.id === row.analysis_request_id,
    );
    return request?.user_id === userId;
  },
  analysis_assets: (row, store, userId) => {
    if (row.deleted_at != null) {
      return false;
    }
    const request = (store.analysis_requests ?? []).find(
      (candidate) => candidate.id === row.analysis_request_id,
    );
    return request?.user_id === userId;
  },
  analysis_reports: (row, store, userId) => {
    if (row.status !== "available") {
      return false;
    }
    const result = (store.analysis_results ?? []).find(
      (candidate) => candidate.id === row.analysis_result_id,
    );
    if (!result || result.requires_review === true) {
      return false;
    }
    const request = (store.analysis_requests ?? []).find(
      (candidate) => candidate.id === result.analysis_request_id,
    );
    return request?.user_id === userId;
  },
};

type FakeFilter =
  | { kind: "eq"; col: string; val: unknown }
  | { kind: "neq"; col: string; val: unknown }
  | { kind: "in"; col: string; vals: unknown[] }
  | { kind: "gte"; col: string; val: unknown }
  | { kind: "lte"; col: string; val: unknown }
  | { kind: "ilike"; col: string; pattern: string };

function ilikeToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/%/g, ".*").replace(/_/g, ".")}$`, "i");
}

function matchesFilter(row: FakeRow, filter: FakeFilter): boolean {
  const value = row[filter.col];
  switch (filter.kind) {
    case "eq":
      return value === filter.val;
    case "neq":
      return value !== filter.val;
    case "in":
      return filter.vals.includes(value);
    case "gte":
      return value != null && (value as string | number) >= (filter.val as string | number);
    case "lte":
      return value != null && (value as string | number) <= (filter.val as string | number);
    case "ilike":
      return typeof value === "string" && ilikeToRegExp(filter.pattern).test(value);
  }
}

function applyFilters(rows: FakeRow[], filters: FakeFilter[]) {
  return rows.filter((row) => filters.every((f) => matchesFilter(row, f)));
}

function applyRls(
  table: string,
  rows: FakeRow[],
  store: FakeStore,
  mode: ClientMode,
) {
  if (mode.kind === "admin") {
    return rows;
  }

  const policy = RLS_SELECT_POLICIES[table];
  return policy ? rows.filter((row) => policy(row, store, mode.userId)) : rows;
}

function createQueryBuilder(table: string, store: FakeStore, mode: ClientMode) {
  const state: {
    op?: "insert" | "update" | "select";
    payload?: FakeRow | FakeRow[];
    selectAfterWrite?: string;
    filters: FakeFilter[];
    orderCol?: string;
    orderAsc: boolean;
    limitN?: number;
    rangeFrom?: number;
    rangeTo?: number;
    single: boolean;
    countMode?: "exact";
    head: boolean;
  } = { filters: [], orderAsc: true, single: false, head: false };

  function finalizeSelect(rows: FakeRow[]): FakeResult {
    if (state.single) {
      if (rows.length !== 1) {
        return {
          data: null,
          error: new Error(
            rows.length === 0 ? "Row not found" : "Multiple rows returned",
          ),
        };
      }
      return { data: { ...rows[0] }, error: null };
    }
    return { data: rows.map((row) => ({ ...row })), error: null };
  }

  function execute(): FakeResult {
    const rows = store[table] ?? (store[table] = []);

    if (state.op === "insert") {
      const fault = store.__insertFaults?.[table];
      if (fault) {
        return { data: null, error: new Error(fault) };
      }

      const incoming = Array.isArray(state.payload)
        ? state.payload
        : [state.payload!];
      const inserted = incoming.map((row) => ({
        id: row.id ?? randomUUID(),
        created_at: row.created_at ?? new Date().toISOString(),
        ...row,
      }));
      rows.push(...inserted);
      return state.selectAfterWrite !== undefined
        ? finalizeSelect(inserted)
        : { data: null, error: null };
    }

    if (state.op === "update") {
      const matched = applyFilters(rows, state.filters);
      matched.forEach((row) => Object.assign(row, state.payload));
      return { data: null, error: null };
    }

    let visible = applyFilters(rows, state.filters);
    visible = applyRls(table, visible, store, mode);
    const totalCount = visible.length;

    if (state.orderCol) {
      const col = state.orderCol;
      visible = [...visible].sort((a, b) => {
        const left = a[col] as string | number;
        const right = b[col] as string | number;
        if (left === right) return 0;
        const comparison = left > right ? 1 : -1;
        return state.orderAsc ? comparison : -comparison;
      });
    }

    let page = visible;
    if (state.rangeFrom != null) {
      page = visible.slice(state.rangeFrom, (state.rangeTo ?? visible.length - 1) + 1);
    } else if (state.limitN != null) {
      page = visible.slice(0, state.limitN);
    }

    if (state.countMode) {
      return {
        data: state.head ? null : page.map((row) => ({ ...row })),
        error: null,
        count: totalCount,
      };
    }

    return finalizeSelect(page);
  }

  const builder = {
    insert(payload: FakeRow | FakeRow[]) {
      state.op = "insert";
      state.payload = payload;
      return builder;
    },
    update(payload: FakeRow) {
      state.op = "update";
      state.payload = payload;
      return builder;
    },
    select(cols?: string, opts?: { count?: "exact"; head?: boolean }) {
      if (state.op === "insert") {
        state.selectAfterWrite = cols ?? "*";
        return builder;
      }
      state.op = state.op ?? "select";
      if (opts?.count) state.countMode = opts.count;
      if (opts?.head) state.head = true;
      return builder;
    },
    eq(col: string, val: unknown) {
      state.filters.push({ kind: "eq", col, val });
      return builder;
    },
    neq(col: string, val: unknown) {
      state.filters.push({ kind: "neq", col, val });
      return builder;
    },
    in(col: string, vals: unknown[]) {
      state.filters.push({ kind: "in", col, vals });
      return builder;
    },
    gte(col: string, val: unknown) {
      state.filters.push({ kind: "gte", col, val });
      return builder;
    },
    lte(col: string, val: unknown) {
      state.filters.push({ kind: "lte", col, val });
      return builder;
    },
    ilike(col: string, pattern: string) {
      state.filters.push({ kind: "ilike", col, pattern });
      return builder;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      state.orderCol = col;
      state.orderAsc = opts?.ascending ?? true;
      return builder;
    },
    limit(n: number) {
      state.limitN = n;
      return builder;
    },
    range(from: number, to: number) {
      state.rangeFrom = from;
      state.rangeTo = to;
      return builder;
    },
    single() {
      state.single = true;
      return Promise.resolve(execute());
    },
    then<TResult1 = FakeResult, TResult2 = never>(
      onfulfilled?:
        ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?:
        ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve(execute()).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function createFakeStorageApi(store: FakeStore) {
  return {
    from(bucket: string) {
      return {
        createSignedUploadUrl(path: string) {
          return Promise.resolve({
            data: {
              path,
              signedUrl: `https://storage.example/upload/${bucket}/${path}?token=fake-token`,
              token: "fake-token",
            },
            error: null,
          });
        },
        exists(path: string) {
          const uploaded = store.__storage?.some(
            (file) => file.bucket === bucket && file.path === path,
          );
          const seeded = Boolean(store.__storageFiles?.[`${bucket}/${path}`]);

          return Promise.resolve({
            data: Boolean(uploaded || seeded),
            error: null,
          });
        },
        upload(path: string) {
          if (store.__storageShouldFail) {
            return Promise.resolve({
              data: null,
              error: new Error("Simulated storage failure"),
            });
          }
          store.__storage ??= [];
          store.__storage.push({ bucket, path });
          return Promise.resolve({ data: { path }, error: null });
        },
        download(path: string) {
          const file = store.__storageFiles?.[`${bucket}/${path}`];
          if (!file) {
            return Promise.resolve({
              data: null,
              error: new Error("Object not found"),
            });
          }
          return Promise.resolve({
            data: new Blob([file.data], { type: file.type }),
            error: null,
          });
        },
      };
    },
  };
}

export function createFakeAdminClient(store: FakeStore) {
  return {
    from(table: string) {
      return createQueryBuilder(table, store, { kind: "admin" });
    },
    storage: createFakeStorageApi(store),
  };
}

export function createFakeServerClient(store: FakeStore, userId: string) {
  return {
    from(table: string) {
      return createQueryBuilder(table, store, { kind: "rls", userId });
    },
    storage: createFakeStorageApi(store),
  };
}
