@echo off
setlocal

set "WSL_DISTRO=Ubuntu"
set "WINDOWS_WORKSPACE=%~dp0."

where wsl.exe >nul 2>nul
if errorlevel 1 (
  echo WSL was not found. Install or enable Windows Subsystem for Linux first.
  pause
  exit /b 1
)

echo Starting Muse terminal in %WSL_DISTRO%...
echo Workspace: %WINDOWS_WORKSPACE%
echo.

wsl.exe -d %WSL_DISTRO% --cd "%WINDOWS_WORKSPACE%" -- bash -lc "export PATH=/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; echo 'Muse terminal ready.'; printf 'Workspace: '; pwd; echo 'Try: muse --version'; echo; exec bash"

if errorlevel 1 (
  echo.
  echo Failed to start Muse terminal.
  echo Check that the Ubuntu WSL distro exists and that WSL can access %WINDOWS_WORKSPACE%.
  pause
  exit /b 1
)

endlocal
