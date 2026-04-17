@echo off
setlocal

cd /d "%~dp0\..\.."

if not exist ".env" (
	echo [ERROR] No existe .env en la raiz del proyecto.
	echo [INFO] Para primera instalacion usa scripts\windows\install-and-start.bat.
	exit /b 1
)

echo [STEP] Ejecutando smoke test HTTP y DB...
call npm.cmd run smoke:prod
exit /b %ERRORLEVEL%