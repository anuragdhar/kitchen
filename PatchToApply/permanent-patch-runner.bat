@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0permanent-patch-runner.ps1" %*
exit /b %ERRORLEVEL%
