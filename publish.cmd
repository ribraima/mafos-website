@echo off
rem Double-click to publish your changes to the live website.
rem GitHub checks the content and updates the site in about a minute.
cd /d "%~dp0"

echo Getting the latest version from GitHub...
git pull --rebase --autostash -q
if errorlevel 1 goto failed

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Nothing new to publish.
  echo.
  pause
  exit /b 0
)

echo.
echo These files changed:
git diff --cached --name-status
echo.
set "msg="
set /p "msg=What did you change? (press Enter to skip): "
if not defined msg set "msg=Update website"

git commit -q -m "%msg%"
if errorlevel 1 goto failed
git push -q
if errorlevel 1 goto failed

echo.
echo Sent. The live site updates in about a minute:
echo   https://mafos.pages.dev
echo Progress and any problems: https://github.com/ribraima/mafos-website/actions
echo.
pause
exit /b 0

:failed
echo.
echo Publishing stopped. Read the message above. Nothing on the live site was changed.
echo.
pause
exit /b 1
