@echo off
setlocal

cd /d "%~dp0\..\.."

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta disponible en PATH.
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm no esta disponible en PATH.
  exit /b 1
)

if not exist ".env" (
  echo [STEP] No existe .env. Se iniciara la configuracion inicial...
  call scripts\windows\configure-production.bat
  if errorlevel 1 exit /b 1
)

echo [STEP] Validando variables de entorno...
call npm.cmd run env:check
if errorlevel 1 (
  echo [WARN] La configuracion actual no paso la validacion.
  echo [STEP] Abriendo configuracion para corregir valores...
  call scripts\windows\configure-production.bat
  if errorlevel 1 exit /b 1

  echo [STEP] Revalidando variables de entorno...
  call npm.cmd run env:check
  if errorlevel 1 exit /b 1
)

echo [STEP] Instalando dependencias...
call npm.cmd install
if errorlevel 1 exit /b 1

echo [STEP] Aplicando esquema PostgreSQL...
call npm.cmd run db:apply
if errorlevel 1 exit /b 1

echo [STEP] Generando build productivo...
call npm.cmd run build
if errorlevel 1 exit /b 1

echo [OK] Instalacion completada.
echo [INFO] La configuracion runtime quedo guardada en .env.
echo [NEXT] Usa scripts\windows\start-production.bat para arrancar la app.
exit /b 0