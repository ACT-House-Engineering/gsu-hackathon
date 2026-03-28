# Static Placeholder App

Minimal Cloudflare Worker + static assets app used for a public-repo-safe
deployment target.

## Commands

```bash
bunx wrangler dev --config apps/static/wrangler.jsonc --env-file .env.local
bunx wrangler deploy --config apps/static/wrangler.jsonc --env-file .env.local
```

## Credentials

Put Cloudflare credentials in the repo root `.env.local` file. That file is
git-ignored and should never be committed.
