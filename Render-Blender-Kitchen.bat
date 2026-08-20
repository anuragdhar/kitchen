@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BLENDER_EXE=blender.exe"
set "SCRIPT=%ROOT_DIR%blender\render_kitchen.py"

where blender.exe >nul 2>nul
if not "%ERRORLEVEL%"=="0" (
    echo Could not find blender.exe on PATH.
    echo Install Blender or add blender.exe to PATH, then run this file again.
    echo.
    pause
    exit /b 1
)

if not exist "%SCRIPT%" (
    echo Could not find Blender render script:
    echo %SCRIPT%
    echo.
    pause
    exit /b 1
)

pushd "%ROOT_DIR%"
"%BLENDER_EXE%" --background --python "%SCRIPT%"
set "RESULT=%ERRORLEVEL%"
popd

if not "%RESULT%"=="0" (
    echo.
    echo Blender render failed.
    pause
    exit /b %RESULT%
)

echo.
echo Rendered images in blender\renders
pause
