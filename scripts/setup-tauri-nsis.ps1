# Pre-download NSIS toolchain for Tauri Windows bundling.
# Fixes: failed to bundle project `timeout: global`
# Cache: %LOCALAPPDATA%\tauri\NSIS  (same as Tauri CLI)

$ErrorActionPreference = "Stop"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$NsisZipUrl = "https://github.com/tauri-apps/binary-releases/releases/download/nsis-3.11/nsis-3.11.zip"
$NsisZipSha1 = "EF7FF767E5CBD9EDD22ADD3A32C9B8F4500BB10D"
$UtilsUrl = "https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll"
$UtilsSha1 = "75197FEE3C6A814FE035788D1C34EAD39349B860"

$TauriDir = Join-Path $env:LOCALAPPDATA "tauri"
$NsisDir = Join-Path $TauriDir "NSIS"
$UtilsRel = "Plugins\x86-unicode\additional\nsis_tauri_utils.dll"
$Required = @(
    "makensis.exe",
    "Bin\makensis.exe",
    "Include\MUI2.nsh",
    $UtilsRel
)

function Test-NsisReady {
    foreach ($rel in $Required) {
        if (-not (Test-Path (Join-Path $NsisDir $rel))) {
            return $false
        }
    }
    return $true
}

function Get-FileSha1Hex([string]$Path) {
    $hash = Get-FileHash -Path $Path -Algorithm SHA1
    return $hash.Hash.ToUpperInvariant()
}

function Download-WithRetry([string]$Url, [string]$OutFile, [int]$Retries = 5) {
    $lastErr = $null
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            Write-Host "  Download ($i/$Retries): $Url"
            Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing -TimeoutSec 600
            return
        } catch {
            $lastErr = $_
            Write-Warning "  Failed: $($_.Exception.Message)"
            if ($i -lt $Retries) { Start-Sleep -Seconds ([Math]::Min(15, 3 * $i)) }
        }
    }
    throw $lastErr
}

if (Test-NsisReady) {
    Write-Host "NSIS toolchain already present: $NsisDir" -ForegroundColor Green
    exit 0
}

Write-Host "Setting up Tauri NSIS toolchain (fixes 'timeout: global')..." -ForegroundColor Cyan
Write-Host "Target: $NsisDir"
Write-Host ""

if ($env:HTTP_PROXY -or $env:HTTPS_PROXY) {
    Write-Host "Using proxy: HTTP_PROXY=$env:HTTP_PROXY HTTPS_PROXY=$env:HTTPS_PROXY"
}

New-Item -ItemType Directory -Force -Path $TauriDir | Out-Null
$zipPath = Join-Path $env:TEMP "tauri-nsis-3.11.zip"
$extractRoot = Join-Path $env:TEMP "tauri-nsis-extract-$([Guid]::NewGuid().ToString('n'))"

try {
    Download-WithRetry -Url $NsisZipUrl -OutFile $zipPath

    $zipSha = Get-FileSha1Hex $zipPath
    if ($zipSha -ne $NsisZipSha1) {
        Write-Warning "NSIS zip SHA1 mismatch (got $zipSha, expected $NsisZipSha1). Continuing anyway."
    }

    if (Test-Path $NsisDir) {
        Remove-Item -Recurse -Force $NsisDir
    }

    New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
    Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

    $inner = Join-Path $extractRoot "nsis-3.11"
    if (-not (Test-Path $inner)) {
        throw "Expected folder 'nsis-3.11' inside zip. Check download integrity."
    }

    Move-Item -Path $inner -Destination $NsisDir

    $utilsDir = Join-Path $NsisDir "Plugins\x86-unicode\additional"
    New-Item -ItemType Directory -Force -Path $utilsDir | Out-Null
    $utilsPath = Join-Path $utilsDir "nsis_tauri_utils.dll"
    Download-WithRetry -Url $UtilsUrl -OutFile $utilsPath

    $dllSha = Get-FileSha1Hex $utilsPath
    if ($dllSha -ne $UtilsSha1) {
        Write-Warning "nsis_tauri_utils.dll SHA1 mismatch (got $dllSha, expected $UtilsSha1)."
    }

    if (-not (Test-NsisReady)) {
        throw "NSIS setup incomplete after extract. Run npm run setup:tauri-nsis"
    }

    Write-Host ""
    Write-Host "NSIS ready. You can run build-tauri-installer.bat now." -ForegroundColor Green
} finally {
    Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $extractRoot -ErrorAction SilentlyContinue
}
