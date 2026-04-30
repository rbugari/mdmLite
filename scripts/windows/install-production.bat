@echo off
setlocal

cd /d "%~dp0\..\.."

echo [INFO] Instalacion por fases para MDM Lite.
echo [INFO] Para primera instalacion, el entrypoint oficial es scripts\windows\install-and-start.bat.

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

echo [STEP] Verificando conectividad PostgreSQL...
call npm.cmd run db:check
if errorlevel 1 (
  echo [ERROR] No se pudo validar la conexion a PostgreSQL.
  echo [INFO] Revisa DATABASE_URL y DATABASE_SSL_MODE en .env.
  echo [INFO] Si hace falta, ejecuta scripts\windows\configure-production.bat y corrige los valores.
  exit /b 1
)

echo [STEP] Aplicando esquema PostgreSQL...
call npm.cmd run db:apply
if errorlevel 1 exit /b 1

echo [STEP] Generando build productivo...
call npm.cmd run build
if errorlevel 1 exit /b 1

if not exist ".next\standalone\server.js" (
  echo [ERROR] El build no genero .next\standalone\server.js.
  exit /b 1
)

echo [OK] Instalacion completada.
echo [INFO] La configuracion runtime quedo guardada en .env.
echo [INFO] El launcher productivo quedo listo en .next\standalone\server.js.
echo [NEXT] Usa scripts\windows\start-production.bat para arrancar la app si ya estas operando por fases.
exit /b 0