import { vi } from 'vitest';

// A stand-in for the Supabase client, used with
//   vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }))
// Every `from(table)` call returns a chainable builder that records each method call and
// resolves (when awaited) to the next result queued for that table.

export interface MockResult {
  data?: unknown;
  error?: unknown;
}

export interface QueryCall {
  table: string;
  /** Each chained call in order, e.g. [['select', 'id'], ['eq', 'id', 'x']] */
  chain: [string, ...unknown[]][];
}

const queues = new Map<string, MockResult[]>();
export const queryCalls: QueryCall[] = [];

/** Queues the response for the next awaited query on `table`. */
export function queueTable(table: string, ...results: MockResult[]): void {
  const q = queues.get(table) ?? [];
  q.push(...results);
  queues.set(table, q);
}

function nextResult(table: string): { data: unknown; error: unknown } {
  const r = queues.get(table)?.shift() ?? {};
  return { data: r.data ?? null, error: r.error ?? null };
}

function builder(table: string): unknown {
  const call: QueryCall = { table, chain: [] };
  queryCalls.push(call);
  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          const result = nextResult(table);
          return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject);
        }
        return (...args: unknown[]) => {
          call.chain.push([String(prop), ...args]);
          return proxy;
        };
      },
    }
  );
  return proxy;
}

/** The chained calls made on `table` (all queries, in order). */
export function callsTo(table: string): QueryCall[] {
  return queryCalls.filter((c) => c.table === table);
}

const storageBucket = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
};

export const mockSupabase = {
  from: vi.fn((table: string) => builder(table)),
  rpc: vi.fn(),
  auth: {
    updateUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
  functions: { invoke: vi.fn() },
  storage: { from: vi.fn(() => storageBucket), bucket: storageBucket },
};

export function resetSupabaseMock(): void {
  queues.clear();
  queryCalls.length = 0;
  mockSupabase.from.mockClear();
  mockSupabase.rpc.mockReset();
  mockSupabase.auth.updateUser.mockReset();
  mockSupabase.functions.invoke.mockReset();
  mockSupabase.storage.from.mockClear();
  for (const fn of Object.values(storageBucket)) fn.mockReset();
}
