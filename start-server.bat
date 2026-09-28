@echo off
setlocal EnableExtensions DisableDelayedExpansion

rem The only application launcher in the repository root.
set "APP_DIR=%~dp0react-configurator"
set "RESULT=1"

if not exist "%APP_DIR%\package.json" (
    echo Could not find "%APP_DIR%\package.json".
    goto :failed
)

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found. Install Node.js 22, then run this file again.
    goto :failed
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm was not found. Reinstall Node.js 22 with npm, then try again.
    goto :failed
)

pushd "%APP_DIR%"
if errorlevel 1 goto :failed

if not exist "node_modules\.bin\vite.cmd" (
    echo Installing locked application dependencies...
    call npm ci
    if errorlevel 1 goto :install_failed
)

echo.
echo Starting Home Interior. The local URL will be printed below.
echo Keep this window open. Press Ctrl+C to stop the server.
echo.
rem Vite selects the next free port when 5173 is busy and opens the matching URL.
call npm run dev -- --host 127.0.0.1 --port 5173 --open
set "RESULT=%ERRORLEVEL%"
popd
if not "%RESULT%"=="0" goto :failed
exit /b 0

:install_failed
set "RESULT=%ERRORLEVEL%"
popd

:failed
echo.
echo Failed to prepare or start Home Interior. See the error above.
rem Keep double-click failures visible, but do not block automated checks.
if not defined CI pause
exit /b %RESULT%
