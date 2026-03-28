# Infrastructure

Cloudflare-only Terraform for:

- Worker metadata (`web`, `app`, `api`)
- D1 databases
- Optional DNS records

## Layout

```bash
infra/
  modules/
    cloudflare/
      d1/
      dns/
      worker/
  stacks/
    edge/
  envs/
    dev/edge/
    preview/edge/
    staging/edge/
    prod/edge/
```

## Quick Start

```bash
cp infra/envs/dev/edge/terraform.tfvars.example infra/envs/dev/edge/terraform.tfvars
terraform -chdir=infra/envs/dev/edge init
terraform -chdir=infra/envs/dev/edge plan
```

If you apply later, the important outputs are:

```bash
terraform -chdir=infra/envs/dev/edge output worker_api_name
terraform -chdir=infra/envs/dev/edge output worker_app_name
terraform -chdir=infra/envs/dev/edge output worker_web_name
terraform -chdir=infra/envs/dev/edge output d1_database_id
terraform -chdir=infra/envs/dev/edge output d1_database_name
```

Copy the D1 IDs into [apps/api/wrangler.jsonc](/Users/athena/Code/gsu-hackathon/apps/api/wrangler.jsonc). Terraform does not deploy Worker code or set secrets.

## Variables

Required:

- `cloudflare_api_token`
- `cloudflare_account_id`
- `project_slug`
- `environment`

Optional:

- `cloudflare_zone_id`
- `hostname`
- `d1_jurisdiction`
- `d1_primary_location_hint`
