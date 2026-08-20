@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%"
set "SCRIPT_PS1=Kitchen-design-2D-layout.ps1"
set "SCRIPT_POWERSHELL=Kitchen-design-2D-layout.powershell"

if exist "%SCRIPT_PS1%" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\%SCRIPT_PS1%" "."
    goto :done
)

if exist "%SCRIPT_POWERSHELL%" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$script = Get-Content -LiteralPath '.\%SCRIPT_POWERSHELL%' -Raw; Invoke-Expression $script"
    goto :done
)

echo Could not find Kitchen-design-2D-layout.ps1 or Kitchen-design-2D-layout.powershell in:
echo %SCRIPT_DIR%

:done
echo.
popd
pause
