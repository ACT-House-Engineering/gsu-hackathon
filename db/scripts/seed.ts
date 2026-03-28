#!/usr/bin/env bun
// Usage: bun scripts/seed.ts

import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import * as schema from "../schema";
import { seedUsers } from "../seeds/users";

const environment = process.env.ENVIRONMENT === "preview" ? "preview" : "dev";

const platform = await getPlatformProxy<{ APP_DB: D1Database }>({
  configPath: resolve(import.meta.dirname, "../../apps/api/wrangler.jsonc"),
  environment,
  persist: true,
});

const db = drizzle(platform.env.APP_DB, { schema, casing: "snake_case" });

console.log("🌱 Starting database seeding...");

try {
  await seedUsers(db);
  console.log("✅ Database seeding completed successfully!");
} catch (error) {
  console.error("❌ Database seeding failed:");
  console.error(error);
  process.exitCode = 1;
}
