import { defineConfig } from "drizzle-kit";

/**
 * Drizzle ORM configuration for Cloudflare D1 (SQLite dialect)
 *
 * @see https://orm.drizzle.team/docs/drizzle-config-file
 * @see https://orm.drizzle.team/llms.txt
 */
export default defineConfig({
  out: "./migrations",
  schema: "./schema",
  dialect: "sqlite",
  casing: "snake_case",
});
