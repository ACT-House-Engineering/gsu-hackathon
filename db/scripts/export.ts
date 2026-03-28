#!/usr/bin/env bun
/**
 * Cloudflare D1 export utility with schema/data options.
 *
 * Usage:
 *   bun scripts/export.ts                    # Schema only (default)
 *   bun scripts/export.ts --data             # Schema + data
 *   bun scripts/export.ts --data-only        # Data only
 *   bun scripts/export.ts --table=users      # Specific table
 *   bun scripts/export.ts -- --preview       # Pass Wrangler flags directly
 *
 * Environment:
 *   bun --env ENVIRONMENT=staging scripts/export.ts
 *   bun --env ENVIRONMENT=production scripts/export.ts
 */

import { existsSync } from "node:fs";
import { chmod, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { $ } from "bun";

// Parse arguments
const args = process.argv.slice(2);
const passThrough: string[] = [];
let includeData = false;
let dataOnly = false;
let table: string | undefined;
const environment = process.env.ENVIRONMENT ?? "development";
const wranglerEnv = environment === "development" ? "dev" : environment;
const isLocal = wranglerEnv === "dev";

// Find pass-through arguments (after --)
const dashIndex = args.indexOf("--");
if (dashIndex !== -1) {
  passThrough.push(...args.slice(dashIndex + 1));
  args.splice(dashIndex);
}

// Parse named arguments
for (const arg of args) {
  if (arg === "--data") {
    includeData = true;
  } else if (arg === "--data-only") {
    dataOnly = true;
  } else if (arg.startsWith("--table=")) {
    table = arg.split("=")[1];
  }
}

// Generate filename based on options with high precision timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const envSuffix = `-${wranglerEnv}`;
const typeSuffix = dataOnly ? "-data" : includeData ? "-full" : "-schema";
const tableSuffix = table ? `-${table}` : "";

// Ensure backups directory exists
const backupsDir = resolve("./backups");
if (!existsSync(backupsDir)) {
  await mkdir(backupsDir, { recursive: true });
  console.log(`📁 Created backups directory: ${backupsDir}`);
}

const outputPath = resolve(
  backupsDir,
  `dump${envSuffix}${typeSuffix}${tableSuffix}-${timestamp}.sql`,
);

console.log("📤 Exporting database...");
console.log(`📁 Output: ${outputPath}`);

try {
  const wranglerArgs = [
    "wrangler",
    "d1",
    "export",
    "APP_DB",
    "--config",
    "../apps/api/wrangler.jsonc",
    isLocal ? "--local" : "--remote",
    "--output",
    outputPath,
  ];

  if (wranglerEnv !== "production") {
    wranglerArgs.push("--env", wranglerEnv);
  }

  if (table) {
    wranglerArgs.push("--table", table);
  }

  if (dataOnly) {
    wranglerArgs.push("--no-schema");
  } else if (!includeData) {
    wranglerArgs.push("--no-data");
  }

  wranglerArgs.push(...passThrough);

  await $`bunx ${wranglerArgs}`;

  // Set file permissions to owner-only readable (600)
  await chmod(outputPath, 0o600);

  console.log("✅ Export completed successfully!");
} catch (error) {
  console.error("❌ Export failed:");
  console.error(error);
  process.exit(1);
}
