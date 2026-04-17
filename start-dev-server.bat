@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "APP_PORT=3003"
if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /I "%%~A"=="APP_PORT" set "APP_PORT=%%~B"
  )
)

echo [MDM Lite] Root: %CD%
echo [MDM Lite] Port: %APP_PORT%

set "FOUND_LISTENER="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /I /C:":%APP_PORT%" ^| findstr /I "LISTENING"') do (
  echo [MDM Lite] Closing PID %%P listening on port %APP_PORT%...
  taskkill /PID %%P /F >nul 2>&1
  set "FOUND_LISTENER=1"
)

if not defined FOUND_LISTENER (
  echo [MDM Lite] No active listener found on port %APP_PORT%.
)

echo [MDM Lite] Starting dev server in a new cmd window...
start "MDM Lite Dev Server" cmd /k "cd /d ""%~dp0"" && npm.cmd run dev"

echo [MDM Lite] Done.
endlocal