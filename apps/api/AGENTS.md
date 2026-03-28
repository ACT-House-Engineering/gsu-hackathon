## Auth

- Server config in `lib/auth.ts`. Better Auth `account` table renamed to `identity` via `account.modelName: "identity"`.
- Auth hint cookie: set/cleared in Better Auth hooks (sign-in, sign-out). NOT a security boundary — false positives cause one redirect. See `docs/adr/001-auth-hint-cookie.md`.
- Session types: `AuthUser` and `AuthSession` from `Auth["$Infer"]["Session"]`.

## Database

- `db` and `dbDirect` currently point at the same D1 binding to preserve the existing call sites.
- D1 binding name is `APP_DB` and is configured in `wrangler.jsonc`.

## tRPC

- `publicProcedure` and `protectedProcedure` defined in `lib/trpc.ts`.
- `protectedProcedure` throws `UNAUTHORIZED` if `ctx.session` or `ctx.user` is null, then narrows both to non-null in downstream context.
- Router in `lib/app.ts` combines routers from `routers/`. Input validation with Zod.

## Email

- Uses the Cloudflare Workers `MAILER` binding via `send_email`.
- Requires both HTML and plain text — use `renderEmailToHtml()` + `renderEmailToText()` from `@repo/email`.
- Validates recipients with Zod before sending.

## Request Context

- `ctx.cache: Map<string | symbol, unknown>` — request-scoped cache.
- DataLoaders use `defineLoader(symbol, batchFn)` helper — handles cache check, instance creation, and typing. See `lib/loaders.ts`.
- AI provider instances (OpenAI) also cached per-request via same pattern.

## Environment

- Zod schema validates env vars in `lib/env.ts` (Bun reads `Bun.env`; Workers get bindings via Hono context).
- `nodejs_compat` compatibility flag required — web and app workers do NOT have it.

## Worker Entry

- `worker.ts` is the Cloudflare Workers entrypoint (`export default`). Hono middleware stack: `secureHeaders` → `requestId` (CF-Ray or UUID) → `logger` → context init (Drizzle + auth instances).
