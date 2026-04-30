@echo off
setlocal

cd /d "%~dp0\..\.."

if not exist ".env" (
  echo [ERROR] No existe .env en la raiz del proyecto.
  echo [INFO] Ejecuta primero scripts\windows\configure-production.bat.
  exit /b 1
)

echo [STEP] Verificando conexion PostgreSQL...
call npm.cmd run db:check
exit /b %ERRORLEVEL%