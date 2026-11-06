@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if errorlevel 1 goto folder_error
if not exist "tools\materials.mjs" goto folder_error
where node >nul 2>nul
if errorlevel 1 goto node_error
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 goto node_error
if not exist "node_modules\fflate\package.json" (
  call npm.cmd install --no-audit --no-fund
  if errorlevel 1 goto install_error
)
node "tools\materials.mjs" %*
set "OSHI_MATERIALS_EXIT=%ERRORLEVEL%"
if not "%OSHI_MATERIALS_EXIT%"=="0" echo The tool stopped. Please copy the error message above.
goto finish

:folder_error
echo Cannot open the website project. Keep this file inside the oshi-official folder.
set "OSHI_MATERIALS_EXIT=1"
goto finish

:node_error
echo Node.js 22 or newer is required. Install it from https://nodejs.org/
set "OSHI_MATERIALS_EXIT=1"
goto finish

:install_error
echo Dependencies could not be installed. Please copy the error message above.
set "OSHI_MATERIALS_EXIT=1"

:finish
echo.
pause
exit /b %OSHI_MATERIALS_EXIT%
