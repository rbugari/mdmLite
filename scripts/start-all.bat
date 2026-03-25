@echo off
setlocal

cd /d "%~dp0.."
set "ROOT_DIR=%CD%"

if not exist ".env" (
  echo [ERROR] No existe el archivo .env en %ROOT_DIR%
  exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
  if not "%%A"=="" (
    set "%%A=%%B"
  )
)

if "%APP_PORT%"=="" set "APP_PORT=3003"
if "%MCP_PORT%"=="" set "MCP_PORT=3103"
if "%WORKER_PORT%"=="" set "WORKER_PORT=3203"
if "%MCP_ENABLED%"=="" set "MCP_ENABLED=0"
if "%WORKER_ENABLED%"=="" set "WORKER_ENABLED=0"

call :ensure_port_available "%APP_PORT%" "Web App"
if errorlevel 1 exit /b 1

if "%MCP_ENABLED%"=="1" (
  call :ensure_port_available "%MCP_PORT%" "MCP"
  if errorlevel 1 exit /b 1
)

if "%WORKER_ENABLED%"=="1" (
  call :ensure_port_available "%WORKER_PORT%" "Worker"
  if errorlevel 1 exit /b 1
)

echo [INFO] Base de datos remota configurada por DATABASE_URL. No se levanta PostgreSQL local.
echo [INFO] Lanzando servicios habilitados...

start "MDM Lite - Web (%APP_PORT%)" cmd /k "cd /d ""%ROOT_DIR%"" && npm run dev"

if "%MCP_ENABLED%"=="1" (
  start "MDM Lite - MCP (%MCP_PORT%)" cmd /k "cd /d ""%ROOT_DIR%"" && echo MCP futuro en puerto %MCP_PORT% && cmd"
) else (
  echo [INFO] MCP deshabilitado en .env
)

if "%WORKER_ENABLED%"=="1" (
  start "MDM Lite - Worker (%WORKER_PORT%)" cmd /k "cd /d ""%ROOT_DIR%"" && echo Worker futuro en puerto %WORKER_PORT% && cmd"
) else (
  echo [INFO] Worker deshabilitado en .env
)

echo [OK] Launcher ejecutado.
exit /b 0

:ensure_port_available
set "PORT_TO_CHECK=%~1"
set "SERVICE_NAME=%~2"
set "FOUND_PID="

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT_TO_CHECK% .*LISTENING"') do (
  set "FOUND_PID=%%P"
  goto :port_in_use
)

echo [OK] Puerto %PORT_TO_CHECK% libre para %SERVICE_NAME%
exit /b 0

:port_in_use
echo [WARN] El puerto %PORT_TO_CHECK% ya esta en uso para %SERVICE_NAME%. PID=%FOUND_PID%
echo [INFO] Cerrando proceso %FOUND_PID% para liberar el puerto %PORT_TO_CHECK%...
taskkill /PID %FOUND_PID% /F >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se pudo cerrar el proceso %FOUND_PID% para %SERVICE_NAME%.
  exit /b 1
)

timeout /t 1 /nobreak >nul

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT_TO_CHECK% .*LISTENING"') do (
  echo [ERROR] El puerto %PORT_TO_CHECK% sigue en uso para %SERVICE_NAME%. PID=%%P
  exit /b 1
)

echo [OK] Puerto %PORT_TO_CHECK% liberado para %SERVICE_NAME%
exit /b 0
