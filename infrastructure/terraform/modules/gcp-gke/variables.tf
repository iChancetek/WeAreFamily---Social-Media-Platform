variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "cluster_name" {
  description = "GKE Cluster Name"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "node_count" {
  description = "Number of nodes"
  type        = number
  default     = 1
}

variable "machine_type" {
  description = "Machine type"
  type        = string
  default     = "e2-medium"
}
