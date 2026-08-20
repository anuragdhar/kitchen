@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "FREECAD_CMD=C:\Users\anurdhar\Downloads\FreeCAD_1.1.3-Windows-x86_64-py311\FreeCAD_1.1.3-Windows-x86_64-py311\FreeCADCmd.exe"
set "GENERATOR=%ROOT_DIR%freecad\generate_kitchen_rule9.py"

if not exist "%FREECAD_CMD%" (
    echo Could not find FreeCADCmd.exe:
    echo %FREECAD_CMD%
    echo.
    pause
    exit /b 1
)

if not exist "%GENERATOR%" (
    echo Could not find generator:
    echo %GENERATOR%
    echo.
    pause
    exit /b 1
)

pushd "%ROOT_DIR%"
"%FREECAD_CMD%" -c "exec(open(r'%GENERATOR%', encoding='utf-8').read())"
set "RESULT=%ERRORLEVEL%"
popd

if not "%RESULT%"=="0" (
    echo.
    echo FreeCAD model generation failed.
    pause
    exit /b %RESULT%
)

echo.
echo Generated freecad\kitchen_rule9.FCStd
pause
