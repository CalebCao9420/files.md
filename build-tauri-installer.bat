@echo off
REM Build Windows NSIS installer (.exe setup) + release binary.
REM First run may take 5–15 minutes (Rust Release compile).
REM If you see "timeout: global", run scripts\setup-tauri-nsis.ps1 first (or use proxy).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-tauri-nsis.ps1"
if errorlevel 1 (
    echo.
    echo NSIS setup failed. Run npm run setup:tauri-nsis or see scripts/setup-tauri-nsis.ps1
    pause
    exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1" -TauriBuild
pause
