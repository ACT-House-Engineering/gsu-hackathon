variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_id" {
  type    = string
  default = ""
}

variable "hostname" {
  type    = string
  default = ""
}

variable "project_slug" {
  type = string
}

variable "environment" {
  type = string
}

variable "d1_jurisdiction" {
  type    = string
  default = ""
}

variable "d1_primary_location_hint" {
  type    = string
  default = "wnam"
}
