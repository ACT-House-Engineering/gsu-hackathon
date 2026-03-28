# API Server

Hono + tRPC + Better Auth on Cloudflare Workers.

This API uses:

- Cloudflare D1 via Drizzle
- Cloudflare Workers `send_email` binding for auth emails
- Wrangler environment config in [wrangler.jsonc](/Users/athena/Code/gsu-hackathon/apps/api/wrangler.jsonc)

## Development

```bash
bun api:dev
bun api:build
```

## Notes

- Local development uses `getPlatformProxy()` with the same `APP_DB` binding configured in Wrangler.
- Auth email delivery reads `MAILER`, `EMAIL_FROM`, and `EMAIL_REPLY_TO` from the Worker bindings and vars.
