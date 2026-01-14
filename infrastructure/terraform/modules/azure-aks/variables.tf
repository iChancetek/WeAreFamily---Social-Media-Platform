variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "node_count" {
  description = "Number of nodes"
  type        = number
  default     = 2
}

variable "vm_size" {
  description = "Node VM size"
  type        = string
  default     = "Standard_D2_v2"
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {
    Environment = "prod"
  }
}
