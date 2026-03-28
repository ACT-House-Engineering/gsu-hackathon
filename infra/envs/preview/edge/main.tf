module "stack" {
  source = "../../../stacks/edge"

  cloudflare_account_id    = var.cloudflare_account_id
  cloudflare_zone_id       = var.cloudflare_zone_id
  hostname                 = var.hostname
  project_slug             = var.project_slug
  environment              = var.environment
  d1_jurisdiction          = var.d1_jurisdiction
  d1_primary_location_hint = var.d1_primary_location_hint
}

output "worker_api_name" {
  value = module.stack.worker_api_name
}

output "worker_app_name" {
  value = module.stack.worker_app_name
}

output "worker_web_name" {
  value = module.stack.worker_web_name
}

output "d1_database_id" {
  value = module.stack.d1_database_id
}

output "d1_database_name" {
  value = module.stack.d1_database_name
}
