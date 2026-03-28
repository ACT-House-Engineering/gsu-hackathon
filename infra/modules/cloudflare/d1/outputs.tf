output "id" {
  value       = cloudflare_d1_database.database.id
  description = "D1 database ID"
}

output "name" {
  value       = cloudflare_d1_database.database.name
  description = "D1 database name"
}
