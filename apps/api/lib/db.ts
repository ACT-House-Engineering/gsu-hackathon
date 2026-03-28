/**
 * @file Database client using Cloudflare D1.
 */

import { type DatabaseSchema, schema } from "@repo/db";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

export type AppDatabase = DrizzleD1Database<DatabaseSchema>;

/**
 * Creates a Drizzle ORM client backed by a Cloudflare D1 binding.
 */
export function createDb(database: D1Database): AppDatabase {
  return drizzle(database, { schema, casing: "snake_case" });
}

export { schema as Db };
