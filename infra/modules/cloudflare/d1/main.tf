resource "cloudflare_d1_database" "database" {
  account_id = var.account_id
  name       = var.name

  jurisdiction          = var.jurisdiction != "" ? var.jurisdiction : null
  primary_location_hint = var.jurisdiction == "" ? var.primary_location_hint : null
}
