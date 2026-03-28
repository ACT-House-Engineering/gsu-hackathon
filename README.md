# GSU Build Day Techie Workshop

This repository contains the source code and companion materials for the GSU
Build Day Techie Workshop, built around the public
`Techie Workshop: Agentic Engineering` materials from ACT House and the
`Build Day X Innovation Bootcamp: Georgia State University` event hub.

The public event promo describes Build Day X as a 24-hour innovation
environment where students turn ideas into working prototypes with access to
mentorship, workshops, and cross-disciplinary collaboration. The ENIGSU
announcement also highlights a prize pool of up to `$2,500` and lists FanDuel
as a sponsor.

## Public Links

- Workshop materials:
  [link.act.house/bdx](https://link.act.house/bdx)
- Workshop source page:
  [Techie Workshop: Agentic Engineering](https://acthouse.notion.site/agentic-gsu?source=copy_link)
- Event hub:
  [Build Day X Innovation Bootcamp: Georgia State University](https://acthouse.notion.site/Build-Day-X-Innovation-Bootcamp-Georgia-State-University-3254a99790e080bd8281f7b14619a8eb)
- ENIGSU announcement:
  [Instagram post](https://www.instagram.com/p/DVcWCH9FGyn/)
- Georgia State entrepreneurship ecosystem:
  [ENI at GSU](https://eni.gsu.edu/)
- Student startup program at GSU:
  [LaunchGSU](https://eni.gsu.edu/launchgsu/)

## Workshop Focus

The current workshop materials center on agentic engineering and move through a
simple hands-on progression:

1. Simple prompting
2. Talking to a dataset
3. Prototyping code

The Notion workshop page explicitly references tools and examples including
ChatGPT, Claude, Codex, Claude Code, Google Takeout JSON, Replit, and Gemini
share links. This repo now uses that event/workshop framing instead of the
generic starter-kit branding.

## Repo Stack

- `apps/web`: Astro overview site and edge router
- `apps/app`: React 19 workshop app
- `apps/api`: Hono + tRPC + Better Auth on Cloudflare Workers
- `apps/email`: React Email templates used by the API
- `db`: Drizzle schema, migrations, seed/export scripts for Cloudflare D1
- `infra`: Terraform for Cloudflare Workers, DNS, and D1

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Copy local env overrides and update secrets:

```bash
cp .env .env.local
```

3. Fill in the Cloudflare bindings in
   [apps/api/wrangler.jsonc](/Users/athena/Code/gsu-hackathon/apps/api/wrangler.jsonc):

- `APP_DB.database_id`
- `MAILER.allowed_sender_addresses`
- environment-specific `database_id` values for `dev`, `staging`, and `preview`

4. Apply the local D1 migrations and optional seed data:

```bash
bun db:migrate
bun db:seed
```

5. Start the apps:

```bash
bun dev
```

Local URLs:

- App: `http://localhost:5173`
- Overview site: `http://localhost:4321`
- API: `http://localhost:8787`

## Tooling

- Lint: `bun lint`
- Format: `bun format`
- Typecheck: `bun typecheck`
- Tests: `bun test`

## Agent Git Workflow

This repo is configured for direct-to-`main` agent publishing.

- Agents should work on `main`, not task branches.
- Stage only the files for the current task.
- Run the relevant checks.
- Publish with:

```bash
bun git:publish -- "docs(repo): update workshop copy"
```

The repo also includes a `pre-push` guard that rejects non-`main` pushes.

For this to work end-to-end, the authenticated Git actor must have permission
to push directly to `main`. If GitHub branch protection requires pull requests,
status checks, or admin bypass, those rules must explicitly allow your bot/user
to push.

## Infrastructure Notes

This repo uses Drizzle with the SQLite dialect and Cloudflare D1 bindings.
Migrations live in
[db/migrations](/Users/athena/Code/gsu-hackathon/db/migrations) and are
referenced directly from
[apps/api/wrangler.jsonc](/Users/athena/Code/gsu-hackathon/apps/api/wrangler.jsonc).

Terraform under [infra](/Users/athena/Code/gsu-hackathon/infra) provisions:

- Worker metadata for `web`, `app`, and `api`
- One D1 database per environment
- Optional DNS records when `hostname` and `cloudflare_zone_id` are set

The Terraform outputs are intended to be copied into the Wrangler config files.
This repo has not been deployed from the current workspace state.
