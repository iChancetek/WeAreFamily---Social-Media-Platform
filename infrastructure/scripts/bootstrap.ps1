$ErrorActionPreference = "Stop"

function Check-Command {
    param ($Name)
    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        Write-Host "[OK] ${Name} is installed." -ForegroundColor Green
        return $true
    } else {
        Write-Host "[FAIL] ${Name} is NOT installed. Please install it to proceed." -ForegroundColor Red
        return $false
    }
}

function Check-Bypass {
    param ($Name, $Command)
    Write-Host "Checking ${Name} credentials..."
    try {
        Invoke-Expression $Command | Out-Null
        Write-Host "[OK] ${Name}: Authenticated." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[WARN] ${Name}: Not authenticated or error checking." -ForegroundColor Yellow
        return $false
    }
}

Write-Host "--- Famio Infrastructure Bootstrap ---" -ForegroundColor Cyan

# 1. Check Tools
$missingTools = $false
$tools = @("terraform", "aws", "az", "gcloud", "kubectl", "helm")
foreach ($tool in $tools) {
    if (-not (Check-Command $tool)) { $missingTools = $true }
}

if ($missingTools) {
    Write-Host "Please install missing tools and add them to your PATH." -ForegroundColor Yellow
    exit 1
}

# 2. Check Credentials
# Note: These checks are basic and assume default profiles/config
Check-Bypass "AWS" "aws sts get-caller-identity"
Check-Bypass "Azure" "az account show"
Check-Bypass "GCP" "gcloud auth list --filter=status:ACTIVE --format='value(account)'"

# 3. Terraform Init & Plan
$terraformDir = "$PSScriptRoot\..\terraform\environments\prod"
if (Test-Path $terraformDir) {
    Write-Host "`nInitializing Terraform in $terraformDir..." -ForegroundColor Cyan
    Push-Location $terraformDir
    
    try {
        terraform init
        Write-Host "✅ Terraform Initialized." -ForegroundColor Green
        
        Write-Host "Running Terraform Plan..." -ForegroundColor Cyan
        terraform plan
    } catch {
        Write-Host "❌ Terraform error: $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
} else {
    Write-Host "❌ Terraform directory not found: $terraformDir" -ForegroundColor Red
}
