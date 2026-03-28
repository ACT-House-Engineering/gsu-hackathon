# Database Layer

Database layer using [Drizzle ORM](https://orm.drizzle.team/) with the SQLite dialect and Cloudflare D1 bindings.

## Structure

```bash
db/
├── schema/       # Table definitions and relations
├── migrations/   # Generated SQL migrations for D1
├── seeds/        # Seed helpers
├── scripts/      # Seed/export utilities
└── drizzle.config.ts
```

## Commands

From the repo root:

```bash
bun db:generate
bun db:migrate
bun db:seed
bun db:export
bun db:check
```

Remote export helpers are also available:

```bash
bun db:export:staging
bun db:export:prod
```

## Notes

- Local migrations are applied through Wrangler against the `APP_DB` binding in [apps/api/wrangler.jsonc](/Users/athena/Code/gsu-hackathon/apps/api/wrangler.jsonc).
- The local seed script uses Wrangler's persisted local D1 state, so it seeds the same database used by `bun api:dev`.
- Primary keys are still application-generated prefixed CUID2 values.
