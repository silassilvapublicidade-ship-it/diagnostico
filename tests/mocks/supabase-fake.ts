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

function applyEqFilters(
  rows: FakeRow[],
  filters: Array<{ col: string; val: unknown }>,
) {
  return rows.filter((row) => filters.every((f) => row[f.col] === f.val));
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
    filters: Array<{ col: string; val: unknown }>;
    orderCol?: string;
    orderAsc: boolean;
    limitN?: number;
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
      const matched = applyEqFilters(rows, state.filters);
      matched.forEach((row) => Object.assign(row, state.payload));
      return { data: null, error: null };
    }

    let visible = applyEqFilters(rows, state.filters);
    visible = applyRls(table, visible, store, mode);

    if (state.countMode) {
      return {
        data: state.head ? null : visible,
        error: null,
        count: visible.length,
      };
    }

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

    if (state.limitN != null) {
      visible = visible.slice(0, state.limitN);
    }

    return finalizeSelect(visible);
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
      state.filters.push({ col, val });
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
