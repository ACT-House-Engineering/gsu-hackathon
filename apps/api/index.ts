/**
 * @file Public API surface for the backend package.
 *
 * Re-exports the Hono app, tRPC router, and core utilities.
 */

// Core utilities and services
export { getOpenAI } from "./lib/ai.js";
// Type exports
export type { AppRouter } from "./lib/app.js";
// Application and router exports
// Default export is the core app
export { appRouter, default as app, default } from "./lib/app.js";
export { createAuth } from "./lib/auth.js";
// Re-export context type to fix TypeScript portability issues
export type * from "./lib/context.js";
export type { AppContext } from "./lib/context.js";
export { createDb } from "./lib/db.js";
