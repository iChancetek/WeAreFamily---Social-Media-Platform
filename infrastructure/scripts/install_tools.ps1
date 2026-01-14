$ErrorActionPreference = "Stop"

function Install-Tool {
    param ($Name, $Id)
    Write-Host "Installing $Name ($Id)..." -ForegroundColor Cyan
    try {
        if (Get-Command $Name -ErrorAction SilentlyContinue) {
            Write-Host "✅ $Name is already installed." -ForegroundColor Green
        } else {
            winget install --id $Id -e --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity
            if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 0x8a150014) { # 0=Success, 0x8a150014=RebootRequired(but installed)
                 Write-Host "[OK] ${Name} installed successfully." -ForegroundColor Green
            } else {
                 Write-Host "[FAIL] ${Name} installation failed with exit code $LASTEXITCODE." -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "[ERROR] Error installing ${Name}: $_" -ForegroundColor Red
    }
}

Write-Host "--- Famio Tool Installer ---" -ForegroundColor Cyan

Install-Tool "terraform" "Hashicorp.Terraform"
Install-Tool "aws" "Amazon.AWSCLI"
Install-Tool "az" "Microsoft.AzureCLI"
Install-Tool "gcloud" "Google.CloudSDK"
Install-Tool "kubectl" "Kubernetes.kubectl"
Install-Tool "helm" "Helm.Helm"

Write-Host "`nInstallation process completed." -ForegroundColor Cyan
Write-Host "⚠️ IMPORTANT: You MUST restart your terminal (or VSCode) for the changes to take effect!" -ForegroundColor Yellow
