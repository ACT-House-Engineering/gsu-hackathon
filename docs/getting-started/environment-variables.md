---
outline: [2, 3]
---

# Environment Variables

## File Conventions

The repo follows [Vite env file](https://vite.dev/guide/env-and-mode#env-files) conventions for local development:

| File                    | Committed | Purpose                                               |
| ----------------------- | --------- | ----------------------------------------------------- |
| `.env`                  | Yes       | Shared defaults and placeholders                      |
| `.env.local`            | No        | Local overrides with real secrets                     |
| `.env.staging.local`    | No        | Staging-specific local overrides                      |
| `.env.production.local` | No        | Production-specific local overrides                   |

Create a local override file with:

```bash
cp .env .env.local
```

::: warning
Do not commit real secrets. Keep them in `.env.local` or in Cloudflare secrets.
:::

## Cloudflare Bindings

The API worker relies on file-based Cloudflare config instead of ad hoc dashboard setup:

- Worker bindings and per-environment vars live in `apps/api/wrangler.jsonc`
- Terraform-managed infra inputs live in `infra/envs/*/edge/terraform.tfvars`
- D1 migrations live in `db/migrations/`

The API worker expects these bindings at runtime:

| Binding  | Type         | Purpose                     |
| -------- | ------------ | --------------------------- |
| `APP_DB` | `D1Database` | Primary application database |
| `MAILER` | `SendEmail`  | Transactional email delivery |

Cloudflare secrets are still required for sensitive values:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put OPENAI_API_KEY
```

## Variable Reference

### Application

| Variable          | Required | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `APP_NAME`        | Yes      | Display name used in emails and auth prompts    |
| `APP_ORIGIN`      | Yes      | Frontend origin (for example `http://localhost:5173`) |
| `API_ORIGIN`      | Yes      | Local API origin used by the frontend dev server |
| `ENVIRONMENT`     | Yes      | `development`, `preview`, `staging`, or `production` |
| `ALLOWED_ORIGINS` | Yes      | Comma-separated origins accepted by the API     |

### Database

There is no `DATABASE_URL` in the app runtime anymore. Database access is through the `APP_DB` D1 binding.

| Variable      | Required | Description                                      |
| ------------- | -------- | ------------------------------------------------ |
| `ENVIRONMENT` | Yes      | Determines which Wrangler environment to emulate |

Local migrations and seeding use Wrangler's D1 emulation:

```bash
bun db:migrate
bun db:seed
```

Remote environments use the checked-in Wrangler config plus `--remote` in the workspace scripts.

### Authentication

| Variable               | Required | Description                                                                           |
| ---------------------- | -------- | ------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Yes      | Secret for signing sessions and tokens                                                |
| `GOOGLE_CLIENT_ID`     | Yes      | Google OAuth client ID                                                                |
| `GOOGLE_CLIENT_SECRET` | Yes      | Google OAuth client secret                                                            |

### AI

| Variable         | Required | Description                   |
| ---------------- | -------- | ----------------------------- |
| `OPENAI_API_KEY` | Yes      | OpenAI API key for AI routes  |

### Email

The worker sends mail through Cloudflare's `send_email` binding. Sender configuration is file-based in `apps/api/wrangler.jsonc`.

| Variable         | Required | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `EMAIL_FROM`     | Yes      | Allowed sender address for the `MAILER` binding  |
| `EMAIL_REPLY_TO` | No       | Reply-to address added to outgoing messages      |

### Billing (Optional)

Stripe billing is optional. The app works without these values, but billing endpoints return 404.

| Variable                     | Required | Description                                |
| ---------------------------- | -------- | ------------------------------------------ |
| `STRIPE_SECRET_KEY`          | No       | Stripe API secret key                      |
| `STRIPE_WEBHOOK_SECRET`      | No       | Stripe webhook signing secret              |
| `STRIPE_STARTER_PRICE_ID`    | No       | Stripe Price ID for the Starter plan       |
| `STRIPE_PRO_PRICE_ID`        | No       | Stripe Price ID for the Pro plan (monthly) |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | No       | Stripe Price ID for the Pro plan (annual)  |

### Cloudflare

| Variable                | Required    | Description                    |
| ----------------------- | ----------- | ------------------------------ |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy only | Cloudflare account ID          |
| `CLOUDFLARE_ZONE_ID`    | Deploy only | DNS zone ID for custom domains |
| `CLOUDFLARE_API_TOKEN`  | Deploy only | API token for Wrangler/Terraform |
