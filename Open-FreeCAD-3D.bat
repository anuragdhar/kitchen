@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "FREECAD_EXE=C:\Users\anurdhar\Downloads\FreeCAD_1.1.3-Windows-x86_64-py311\FreeCAD_1.1.3-Windows-x86_64-py311\FreeCAD.exe"
set "MODEL=%ROOT_DIR%freecad\kitchen_rule9.FCStd"

if not exist "%FREECAD_EXE%" (
    echo Could not find FreeCAD.exe:
    echo %FREECAD_EXE%
    echo.
    pause
    exit /b 1
)

if not exist "%MODEL%" (
    echo FreeCAD model not found. Generating it first...
    "%ROOT_DIR%Generate-FreeCAD-3D.bat"
)

if not exist "%MODEL%" (
    echo Could not find or generate:
    echo %MODEL%
    echo.
    pause
    exit /b 1
)

start "" "%FREECAD_EXE%" "%MODEL%"
