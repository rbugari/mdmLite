@echo off
setlocal

cd /d "%~dp0\..\.."

echo [STEP] Instalacion inicial de MDM Lite para Windows...
call scripts\windows\install-production.bat
if errorlevel 1 exit /b 1

echo [STEP] Arrancando aplicacion...
call scripts\windows\start-production.bat
exit /b %ERRORLEVEL%