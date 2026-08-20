@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "APP_DIR=%ROOT_DIR%react-configurator"
set "APP_URL=http://127.0.0.1:5173/"

if not exist "%APP_DIR%\package.json" (
    echo Could not find react-configurator\package.json in:
    echo %APP_DIR%
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm was not found. Install Node.js, then run this file again.
    echo.
    pause
    exit /b 1
)

pushd "%APP_DIR%"

if not exist "node_modules" (
    echo Installing React app dependencies...
    call npm install
    if errorlevel 1 goto :failed
) else (
    echo Dependencies found. Using latest local source code.
)

echo.
echo Starting kitchen React app:
echo %APP_URL%
echo.
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process '%APP_URL%'"
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
goto :done

:failed
echo.
echo Failed to prepare or start the React app.

:done
echo.
popd
pause
