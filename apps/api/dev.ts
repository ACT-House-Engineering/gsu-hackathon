/**
 * @file Local development server emulating Cloudflare Workers runtime.
 *
 * Requires wrangler.jsonc with APP_DB and MAILER bindings.
 */

import { parseArgs } from "node:util";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { getPlatformProxy } from "wrangler";
import api from "./index.js";
import { createAuth } from "./lib/auth.js";
import type { AppContext } from "./lib/context.js";
import { createDb } from "./lib/db.js";
import type { ApiBindings } from "./lib/env.js";
import { errorHandler, notFoundHandler } from "./lib/middleware.js";

const { values: args } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    env: { type: "string" },
  },
});

const app = new Hono<AppContext>();

// Error and 404 handlers (must be on top-level app)
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Standard middleware
app.use(secureHeaders());
app.use(requestId());
app.use(logger());

// persist:true maintains state across restarts in .wrangler directory
const cf = await getPlatformProxy<ApiBindings>({
  configPath: "./wrangler.jsonc",
  environment: args.env ?? "dev",
  persist: true,
});

// Reuse the same D1 binding for both read/write handles to minimize
// downstream changes in callers that expect separate clients.
app.use(async (c, next) => {
  const db = createDb(cf.env.APP_DB);
  const dbDirect = db;

  // Merge secrets from process.env (local dev) with Cloudflare bindings
  const secretKeys = [
    "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "OPENAI_API_KEY",
    "EMAIL_FROM",
    "EMAIL_REPLY_TO",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_STARTER_PRICE_ID",
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_PRO_ANNUAL_PRICE_ID",
  ] as const;

  const env = {
    ...cf.env,
    ...Object.fromEntries(
      secretKeys.map((key) => [key, process.env[key] || cf.env[key]]),
    ),
    APP_NAME: process.env.APP_NAME || cf.env.APP_NAME || "Example",
    APP_ORIGIN:
      c.req.header("x-forwarded-origin") ||
      process.env.APP_ORIGIN ||
      c.env.APP_ORIGIN ||
      "http://localhost:5173",
  };

  c.set("db", db);
  c.set("dbDirect", dbDirect);
  c.set("auth", createAuth(db, env));
  await next();
});

app.route("/", api);

export default app;
