variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID (required when hostname is set)"
  default     = ""
}

variable "hostname" {
  type        = string
  description = "Public hostname (e.g., example.com). If empty, uses workers.dev URLs."
  default     = ""
}

variable "project_slug" {
  type        = string
  description = "Short identifier for resource naming (e.g., myapp)"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "d1_jurisdiction" {
  type        = string
  description = "Optional D1 jurisdiction (for example: eu or fedramp)"
  default     = ""
}

variable "d1_primary_location_hint" {
  type        = string
  description = "Preferred D1 primary location hint (for example: wnam, enam, weur)"
  default     = "wnam"
}
