variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "name" {
  type        = string
  description = "D1 database name"
}

variable "jurisdiction" {
  type        = string
  description = "Optional D1 jurisdiction (for example: eu or fedramp)"
  default     = ""
}

variable "primary_location_hint" {
  type        = string
  description = "Preferred D1 primary location hint (for example: wnam, enam, weur)"
  default     = "wnam"
}
