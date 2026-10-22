@echo off
rem Drag a folder with a project's files onto this file (or double-click it and type the folder).
rem Big originals stay on this computer; the site gets small web copies.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\add-project.ps1" %*
echo.
pause
