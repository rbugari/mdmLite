@echo off
setlocal

cd /d "%~dp0\..\.."

if not exist ".env" (
  echo [ERROR] No existe .env en la raiz del proyecto.
  echo [INFO] Para primera instalacion usa scripts\windows\install-and-start.bat.
  exit /b 1
)

if not exist ".next\standalone\server.js" (
  echo [ERROR] No existe launcher standalone productivo.
  echo [INFO] Para primera instalacion usa scripts\windows\install-and-start.bat.
  echo [INFO] Si ya estas operando por fases, ejecuta scripts\windows\install-production.bat primero.
  exit /b 1
)

echo [STEP] Validando entorno...
call npm.cmd run env:check
if errorlevel 1 exit /b 1

echo [STEP] Arrancando MDM Lite en modo productivo...
call node scripts\run-next.mjs start