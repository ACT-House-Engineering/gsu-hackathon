// WebAuthn passkey credentials for Better Auth
// @see https://www.better-auth.com/docs/plugins/passkey

import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateAuthId } from "./id";
import { user } from "./user";

/**
 * Passkey credential store.
 *
 * Extended fields beyond Better Auth defaults:
 * - lastUsedAt: Tracks last authentication for security audits
 * - deviceName: User-friendly name (e.g., "MacBook Pro", "iPhone 15")
 * - platform: Authenticator platform ("platform" | "cross-platform")
 */
export const passkey = sqliteTable(
  "passkey",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateAuthId("passkey")),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").default(0).notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" }).notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    // Extended operational fields
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    deviceName: text("device_name"),
    platform: text("platform"), // "platform" | "cross-platform"
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .defaultNow()
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("passkey_user_id_idx").on(table.userId)],
);

export type Passkey = typeof passkey.$inferSelect;
export type NewPasskey = typeof passkey.$inferInsert;
