@echo off
setlocal

cd /d "%~dp0\..\.."

if not exist ".env" (
  echo [ERROR] No existe .env en la raiz del proyecto.
  exit /b 1
)

if not exist ".next\BUILD_ID" (
  echo [ERROR] No existe build productivo.
  echo [INFO] Ejecuta scripts\windows\install-production.bat primero.
  exit /b 1
)

echo [STEP] Validando entorno...
call npm.cmd run env:check
if errorlevel 1 exit /b 1

echo [STEP] Arrancando MDM Lite en modo productivo...
call npm.cmd run start