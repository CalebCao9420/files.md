# Build latest.json for GitHub Release from NSIS build output + .sig file.
#
# Usage (after build-tauri-installer.bat with TAURI_SIGNING_PRIVATE_KEY set):
#   npm run generate:latest-json -- -Version "1.0.1" -Notes "Bug fixes"
#
# Upload to Release assets:
#   latest.json
#   MD Toolkit_1.0.1_x64-setup.exe
#   MD Toolkit_1.0.1_x64-setup.exe.sig

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [string]$Notes = "",
    [string]$Repo = "YOUR_USER/YOUR_REPO",
    [string]$BundleDir = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
if (-not $BundleDir) {
    $BundleDir = Join-Path $Root "src-tauri\target\release\bundle\nsis"
}

$setup = Get-ChildItem $BundleDir -Filter "*-setup.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $setup) {
    Write-Error "No *-setup.exe in $BundleDir. Run build-tauri-installer.bat first."
}

$sigPath = "$($setup.FullName).sig"
if (-not (Test-Path $sigPath)) {
    Write-Error "Missing signature file: $sigPath (set TAURI_SIGNING_PRIVATE_KEY when building)"
}

$signature = (Get-Content $sigPath -Raw).Trim()
$url = "https://github.com/$Repo/releases/download/v$Version/$($setup.Name)"

$manifest = @{
    version  = $Version
    notes    = $Notes
    pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    platforms = @{
        "windows-x86_64" = @{
            url       = $url
            signature = $signature
        }
    }
} | ConvertTo-Json -Depth 5

$outPath = Join-Path $Root "latest.json"
Set-Content -Path $outPath -Value $manifest -Encoding utf8NoBOM
Write-Host "Wrote $outPath"
Write-Host $manifest
