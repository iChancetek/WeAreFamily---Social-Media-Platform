terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0"
    }
  }
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "azurerm" {
  features {}
}

provider "google" {
  project = var.gcp_project_id
  region  = "us-central1"
}

module "eks_cluster" {
  source = "../../modules/aws-eks"

  cluster_name = "famio-prod-eks"
  cluster_version = "1.27"
}

module "aks_cluster" {
  source = "../../modules/azure-aks"

  cluster_name = "famio-prod-aks"
  location     = "East US"
  node_count   = 3
}

module "gke_cluster" {
  source = "../../modules/gcp-gke"

  project_id   = var.gcp_project_id
  cluster_name = "famio-prod-gke"
  region       = "us-central1"
  node_count   = 2
}
