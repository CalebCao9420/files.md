$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if ((Test-Path $cargoBin) -and ($env:Path -notlike "*$cargoBin*")) {
    $env:Path = "$cargoBin;$env:Path"
}

function Test-RustInstalled {
    return [bool](Get-Command cargo -ErrorAction SilentlyContinue)
}

Push-Location $Root
try {
    if (-not (Test-RustInstalled)) {
        Write-Host ""
        Write-Host "Rust toolchain not found." -ForegroundColor Yellow
        Write-Host "Install: https://rustup.rs/  (then restart terminal)"
        Write-Host "See README (Node + Rust + MSVC required)."
        Write-Host ""
        exit 1
    }

    Write-Host "Building web assets..."
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host ""
    Write-Host "Tauri shell ready. Run:"
    Write-Host "  start-tauri.bat"
    Write-Host "  See README"
} finally {
    Pop-Location
}
