# Open workspace folder in Explorer or a installed Git GUI (SourceGit / TortoiseGit).
param(
    [Parameter(Position = 0)]
    [string]$WorkspacePath
)

$ErrorActionPreference = "Stop"

if (-not $WorkspacePath) {
    Write-Host "Usage: .\scripts\open-vcs.ps1 ""D:\path\to\workspace"""
    exit 1
}

if (-not (Test-Path -LiteralPath $WorkspacePath)) {
    Write-Error "Path not found: $WorkspacePath"
}

$sourceGitCandidates = @(
    "$env:LOCALAPPDATA\Programs\SourceGit\SourceGit.exe",
    "$env:ProgramFiles\SourceGit\SourceGit.exe",
    "${env:ProgramFiles(x86)}\SourceGit\SourceGit.exe"
)

foreach ($exe in $sourceGitCandidates) {
    if (Test-Path -LiteralPath $exe) {
        Start-Process -FilePath $exe -ArgumentList "`"$WorkspacePath`""
        exit 0
    }
}

$tortoiseProc = Join-Path ${env:ProgramFiles} "TortoiseGit\bin\TortoiseGitProc.exe"
if (Test-Path -LiteralPath $tortoiseProc) {
    Start-Process -FilePath $tortoiseProc -ArgumentList "/command:log", "/path:`"$WorkspacePath`""
    exit 0
}

Start-Process explorer.exe $WorkspacePath
