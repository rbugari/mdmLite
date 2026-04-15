@echo off
setlocal

cd /d "%~dp0\..\.."

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta disponible en PATH.
  exit /b 1
)

echo [STEP] Generando o actualizando .env...
node scripts\configure-production.mjs
exit /b %ERRORLEVEL%