@echo off
setlocal

cd /d "%~dp0\..\.."

set "OUTPUT_ROOT=dist\trial-package"
if not "%~1"=="" set "OUTPUT_ROOT=%~1"

set "STAGE_DIR=%OUTPUT_ROOT%\mdm-lite-trial"
set "ZIP_FILE=%OUTPUT_ROOT%\mdm-lite-windows-trial.zip"

where powershell >nul 2>&1
if errorlevel 1 (
  echo [ERROR] PowerShell no esta disponible para generar el ZIP.
  exit /b 1
)

echo [STEP] Preparando carpeta de salida...
if exist "%STAGE_DIR%" rmdir /s /q "%STAGE_DIR%"
if exist "%ZIP_FILE%" del /f /q "%ZIP_FILE%"
mkdir "%STAGE_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se pudo crear %STAGE_DIR%.
  exit /b 1
)

call :copy_dir src
if errorlevel 1 exit /b 1
call :copy_dir scripts
if errorlevel 1 exit /b 1
call :copy_dir db
if errorlevel 1 exit /b 1

call :copy_file docs\windows-installation.md
if errorlevel 1 exit /b 1
call :copy_file docs\trial-install-access-and-db-guide.md
if errorlevel 1 exit /b 1

call :copy_file package.json
if errorlevel 1 exit /b 1
call :copy_file package-lock.json
if errorlevel 1 exit /b 1
call :copy_file README.md
if errorlevel 1 exit /b 1
call :copy_file next.config.ts
if errorlevel 1 exit /b 1
call :copy_file tsconfig.json
if errorlevel 1 exit /b 1
call :copy_file eslint.config.mjs
if errorlevel 1 exit /b 1
call :copy_file .env.example
if errorlevel 1 exit /b 1
call :copy_file middleware.ts
if errorlevel 1 exit /b 1
call :copy_file next-env.d.ts
if errorlevel 1 exit /b 1

call :copy_root_alias handoff\windows-quick-start-es.md LEER-PRIMERO-INSTALACION.md
if errorlevel 1 exit /b 1
call :copy_root_alias handoff\windows-operator-step-by-step-es.md LEER-DETALLADO-INSTALACION.md
if errorlevel 1 exit /b 1

echo [STEP] Generando ZIP de entrega...
powershell -NoProfile -Command "Compress-Archive -Path '%STAGE_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"
if errorlevel 1 (
  echo [ERROR] No se pudo generar el ZIP.
  exit /b 1
)

echo [OK] Paquete generado.
echo [INFO] Carpeta staging: %STAGE_DIR%
echo [INFO] ZIP final: %ZIP_FILE%
echo [NEXT] Entrega el ZIP junto con la URL/credenciales PostgreSQL preparadas para el cliente.
exit /b 0

:copy_dir
set "DIR_NAME=%~1"
if not exist "%DIR_NAME%" exit /b 0

echo [COPY] %DIR_NAME%\
robocopy "%DIR_NAME%" "%STAGE_DIR%\%DIR_NAME%" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if errorlevel 8 (
  echo [ERROR] Fallo copiando carpeta %DIR_NAME%.
  exit /b 1
)
exit /b 0

:copy_file
set "FILE_NAME=%~1"
if not exist "%FILE_NAME%" (
  echo [WARN] No existe %FILE_NAME%. Se omite.
  exit /b 0
)

echo [COPY] %FILE_NAME%
call :ensure_parent_dir "%STAGE_DIR%\%FILE_NAME%"
if errorlevel 1 exit /b 1
copy /Y "%FILE_NAME%" "%STAGE_DIR%\%FILE_NAME%" >nul
if errorlevel 1 (
  echo [ERROR] Fallo copiando archivo %FILE_NAME%.
  exit /b 1
)
exit /b 0

:ensure_parent_dir
for %%I in (%~1) do set "PARENT_DIR=%%~dpI"
if not exist "%PARENT_DIR%" mkdir "%PARENT_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se pudo crear %PARENT_DIR%.
  exit /b 1
)
exit /b 0

:copy_root_alias
set "SOURCE_FILE=%~1"
set "TARGET_FILE=%~2"
if not exist "%SOURCE_FILE%" (
  echo [WARN] No existe %SOURCE_FILE%. Se omite.
  exit /b 0
)

echo [COPY] %SOURCE_FILE% as %TARGET_FILE%
copy /Y "%SOURCE_FILE%" "%STAGE_DIR%\%TARGET_FILE%" >nul
if errorlevel 1 (
  echo [ERROR] Fallo copiando archivo %SOURCE_FILE% a %TARGET_FILE%.
  exit /b 1
)
exit /b 0