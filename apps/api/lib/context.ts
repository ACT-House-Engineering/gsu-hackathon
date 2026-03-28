import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { Auth, AuthSession, AuthUser } from "./auth.js";
import type { AppDatabase } from "./db.js";
import type { ApiBindings, Env } from "./env.js";

/**
 * Context object passed to all tRPC procedures.
 *
 * @remarks
 * This context is created for each incoming request and provides access to:
 * - Request-specific data (headers, session, etc.)
 * - Shared resources (database, cache)
 * - Environment configuration
 *
 * The context is immutable within a single request but can be extended
 * by middleware functions before reaching the procedure.
 *
 * @example
 * ```typescript
 * // Access context in a tRPC procedure
 * export const getUser = publicProcedure
 *   .input(z.object({ id: z.string() }))
 *   .query(async ({ ctx, input }) => {
 *     return await ctx.db.select().from(user).where(eq(user.id, input.id));
 *   });
 * ```
 */
export type TRPCContext = {
  /** The incoming HTTP request object */
  req: Request;

  /** tRPC request metadata (headers, connection info) */
  info: CreateHTTPContextOptions["info"];

  /** Drizzle ORM database instance backed by Cloudflare D1 */
  db: AppDatabase;

  /** Secondary handle for write paths that expect a dedicated client */
  dbDirect: AppDatabase;

  /** Authenticated user session (null if not authenticated) */
  session: AuthSession | null;

  /** Authenticated user data (null if not authenticated) */
  user: AuthUser | null;

  /** Request-scoped cache for storing computed values during request lifecycle */
  cache: Map<string | symbol, unknown>;

  /** Optional HTTP response object (available in Hono middleware) */
  res?: Response;

  /** Optional response headers (for setting cookies, CORS headers, etc.) */
  resHeaders?: Headers;

  /** Environment variables and secrets */
  env: Env;
};

/**
 * Hono application context.
 *
 * @example
 * ```typescript
 * app.get("/api/health", async (c) => {
 *   const db = c.get("db");
 *   const user = c.get("user");
 *   return c.json({ status: "ok", user: user?.email });
 * });
 * ```
 */
export type AppContext = {
  Bindings: ApiBindings;
  Variables: {
    db: AppDatabase;
    dbDirect: AppDatabase;
    auth: Auth;
    session: AuthSession | null;
    user: AuthUser | null;
  };
};
