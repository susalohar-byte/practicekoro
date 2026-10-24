import type { Page, Request, Route } from '@playwright/test';

/**
 * Browser-level fake of the Supabase project the admin-flows build points at
 * (playwright.config.ts → admin-flows project). Every request to the stub host
 * is answered here; anything else that is not the local preview server is
 * aborted, so a spec can never reach production Supabase or Razorpay.
 */
export const STUB_SUPABASE_URL = 'https://e2e-stub.supabase.co';
const STORAGE_KEY = 'sb-e2e-stub-auth-token';

export const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001';
export const ADMIN_EMAIL = 'e2e.admin@example.test';

export type StubKind = 'rest' | 'rpc' | 'function' | 'auth' | 'storage';

export interface StubCall {
  kind: StubKind;
  name: string;
  method: string;
  params: URLSearchParams;
  body: any;
  headers: Record<string, string>;
}

export interface StubReply {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export type StubHandler = (call: StubCall) => StubReply | unknown | undefined;

const isReply = (value: unknown): value is StubReply =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((k) => k === 'status' || k === 'body' || k === 'headers');

/** PostgREST `col=eq.value` filter value, or undefined. */
export const eqFilter = (call: StubCall, column: string) => {
  const raw = call.params.get(column);
  return raw?.startsWith('eq.') ? raw.slice(3) : undefined;
};

/** Values of a PostgREST `col=in.(a,b)` filter. */
export const inFilter = (call: StubCall, column: string) => {
  const raw = call.params.get(column);
  if (!raw?.startsWith('in.(')) return [];
  return raw
    .slice(4, -1)
    .split(',')
    .map((v) => v.replace(/^"|"$/g, ''));
};

const base64url = (value: string) => Buffer.from(value).toString('base64url');

const fakeJwt = (sub: string, email: string, exp: number) =>
  [
    base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64url(
      JSON.stringify({ sub, email, exp, aud: 'authenticated', role: 'authenticated', iat: 0 })
    ),
    base64url('e2e-signature'),
  ].join('.');

export class SupabaseStub {
  readonly calls: StubCall[] = [];
  readonly unhandled: string[] = [];
  /** Messages of alert()/confirm() dialogs the page opened (confirms are accepted). */
  readonly dialogs: string[] = [];
  private readonly handlers = new Map<string, StubHandler[]>();
  private readonly user = {
    id: ADMIN_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: ADMIN_EMAIL,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: 'E2E Super Admin' },
    created_at: '2026-01-01T00:00:00.000Z',
  };

  constructor(private readonly adminRole = 'super_admin') {
    this.on('rest', 'profiles', (call) => {
      if (call.method === 'GET' && eqFilter(call, 'id') === ADMIN_USER_ID) {
        return [
          {
            id: ADMIN_USER_ID,
            email: ADMIN_EMAIL,
            full_name: 'E2E Super Admin',
            role: 'admin',
            admin_role: this.adminRole,
            account_status: 'active',
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ];
      }
      return undefined;
    });
    this.on('rest', 'user_roles', (call) =>
      call.method === 'GET' ? [{ role: 'admin', user_id: ADMIN_USER_ID }] : undefined
    );
    this.on('rpc', 'has_active_subscription', () => false);
  }

  /** Register a handler; later registrations win. Return undefined to fall through. */
  on(kind: StubKind, name: string, handler: StubHandler) {
    const key = `${kind}:${name}`;
    this.handlers.set(key, [handler, ...(this.handlers.get(key) ?? [])]);
    return this;
  }

  callsTo(kind: StubKind, name: string) {
    return this.calls.filter((c) => c.kind === kind && c.name === name);
  }

  async install(page: Page) {
    const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
    const session = {
      access_token: fakeJwt(ADMIN_USER_ID, ADMIN_EMAIL, exp),
      refresh_token: 'e2e-refresh-token',
      token_type: 'bearer',
      expires_in: 24 * 3600,
      expires_at: exp,
      user: this.user,
    };
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
      STORAGE_KEY,
      JSON.stringify(session),
    ] as const);

    page.on('dialog', async (dialog) => {
      this.dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === STUB_SUPABASE_URL) return this.handle(route, url, session);
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      // Fonts, analytics, Razorpay, production Supabase: never leave the machine.
      return route.abort('blockedbyclient');
    });
  }

  private async handle(route: Route, url: URL, session: unknown) {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }
    const call = this.toCall(request, url);
    this.calls.push(call);

    if (call.kind === 'auth') {
      if (call.name === 'user') return json(route, this.user);
      if (call.name === 'token') return json(route, session);
      return json(route, {});
    }

    for (const handler of this.handlers.get(`${call.kind}:${call.name}`) ?? []) {
      const result = await handler(call);
      if (result === undefined) continue;
      return this.reply(route, call, isReply(result) ? result : { body: result });
    }

    this.unhandled.push(`${call.method} ${call.kind}:${call.name}`);
    return this.reply(route, call, { body: defaultBody(call) });
  }

  private reply(route: Route, call: StubCall, reply: StubReply) {
    let body = reply.body;
    const wantsObject = (call.headers.accept || '').includes('vnd.pgrst.object');
    if (call.kind === 'rest' && wantsObject && Array.isArray(body)) {
      if (body.length !== 1) {
        return json(
          route,
          { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
          406
        );
      }
      body = body[0];
    }
    const count = Array.isArray(body) ? body.length : 1;
    return json(route, body ?? null, reply.status ?? (call.method === 'POST' ? 201 : 200), {
      'content-range': `0-${Math.max(0, count - 1)}/${count}`,
      ...reply.headers,
    });
  }

  private toCall(request: Request, url: URL): StubCall {
    const path = url.pathname;
    let kind: StubKind = 'rest';
    let name = path;
    if (path.startsWith('/rest/v1/rpc/')) {
      kind = 'rpc';
      name = path.slice('/rest/v1/rpc/'.length);
    } else if (path.startsWith('/rest/v1/')) {
      name = path.slice('/rest/v1/'.length);
    } else if (path.startsWith('/functions/v1/')) {
      kind = 'function';
      name = path.slice('/functions/v1/'.length);
    } else if (path.startsWith('/auth/v1/')) {
      kind = 'auth';
      name = path.slice('/auth/v1/'.length);
    } else if (path.startsWith('/storage/v1/')) {
      kind = 'storage';
      name = path.slice('/storage/v1/'.length);
    }
    let body: any = request.postData();
    try {
      body = body ? JSON.parse(body) : undefined;
    } catch {
      // keep raw text
    }
    return {
      kind,
      name,
      method: request.method(),
      params: url.searchParams,
      body,
      headers: request.headers(),
    };
  }
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-range',
};

function json(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: { ...corsHeaders, ...headers },
    body: JSON.stringify(body),
  });
}

/** Unknown reads are empty; unknown writes echo what was sent (with an id). */
function defaultBody(call: StubCall) {
  if (call.kind === 'rpc') return null;
  if (call.kind === 'function') return { success: true };
  if (call.kind === 'storage') return {};
  if (call.method === 'GET' || call.method === 'HEAD') return [];
  if (call.method === 'DELETE') return [];
  const rows = Array.isArray(call.body) ? call.body : [call.body ?? {}];
  return rows.map((row: Record<string, unknown>, i: number) => ({
    id: `e2e-${call.name}-${Date.now()}-${i}`,
    ...row,
  }));
}
