import { z } from "zod";

/**
 * Zod schema for validating environment variables.
 * Ensures all required configuration values are present and correctly formatted.
 *
 * @throws {ZodError} When environment variables don't match the schema
 */
export const envSchema = z.object({
  ENVIRONMENT: z.enum(["production", "staging", "preview", "development"]),
  APP_NAME: z.string().default("Example"),
  APP_ORIGIN: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  EMAIL_FROM: z.email(),
  EMAIL_REPLY_TO: z.email().optional(),
  // Stripe billing (optional — app works without these, billing features disabled)
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
});

/**
 * Runtime environment variables accessor.
 *
 * @remarks
 * - In Bun runtime: Variables are accessed via `Bun.env`
 * - In Cloudflare Workers: Variables must be accessed via request context
 * - Falls back to empty object when Bun global is unavailable
 *
 * @example
 * // In Bun runtime
 * const fromAddress = env.EMAIL_FROM;
 *
 * // In Cloudflare Workers (must use context)
 * const fromAddress = context.env.EMAIL_FROM;
 */
export const env =
  typeof Bun === "undefined" ? ({} as Env) : envSchema.parse(Bun.env);

/**
 * Type-safe environment variables interface.
 * Inferred from the Zod schema to ensure type safety.
 */
export type Env = z.infer<typeof envSchema>;

export type ApiBindings = Env & {
  APP_DB: D1Database;
  MAILER: SendEmail;
};
