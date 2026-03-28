# Worker names for wrangler deploy
output "worker_api_name" {
  value       = module.worker_api.name
  description = "API worker name for wrangler deploy"
}

output "worker_app_name" {
  value       = module.worker_app.name
  description = "App worker name for wrangler deploy"
}

output "worker_web_name" {
  value       = module.worker_web.name
  description = "Web worker name for wrangler deploy"
}

# D1 database metadata for wrangler.jsonc
output "d1_database_id" {
  value       = module.d1.id
  description = "D1 database ID for wrangler.jsonc"
}

output "d1_database_name" {
  value       = module.d1.name
  description = "D1 database name"
}

output "hostname" {
  value       = var.hostname != "" ? var.hostname : null
  description = "Configured hostname (null if using workers.dev)"
}

# Stripe webhook URL for dashboard configuration
output "stripe_webhook_url" {
  value       = "https://${var.hostname != "" ? var.hostname : "${module.worker_api.name}.workers.dev"}/api/auth/stripe/webhook"
  description = "Register in Stripe Dashboard → Webhooks (only needed if billing is enabled)"
}
