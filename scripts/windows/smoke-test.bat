@echo off
setlocal

cd /d "%~dp0\..\.."

echo [STEP] Ejecutando smoke test HTTP y DB...
call npm.cmd run smoke:prod
exit /b %ERRORLEVEL%