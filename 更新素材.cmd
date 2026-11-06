@echo off
setlocal DisableDelayedExpansion
title Oshi Materials Updater
chcp 65001 >nul
cd /d "%~dp0"
if errorlevel 1 goto folder_error
if not exist "tools\materials.mjs" goto folder_error
if not exist ".material-work\" mkdir ".material-work"
set "OSHI_MATERIALS_LAUNCH_LOG=%CD%\.material-work\launcher.log"
>"%OSHI_MATERIALS_LAUNCH_LOG%" echo Materials updater started: %DATE% %TIME%
set "OSHI_NODE="
for %%I in (node.exe) do set "OSHI_NODE=%%~$PATH:I"
call :check_node
if not errorlevel 1 goto node_ready
set "OSHI_NODE=D:\node.exe"
call :check_node
if not errorlevel 1 goto node_ready
set "OSHI_NODE=%ProgramFiles%\nodejs\node.exe"
call :check_node
if errorlevel 1 goto node_error

:node_ready
>>"%OSHI_MATERIALS_LAUNCH_LOG%" echo Node: "%OSHI_NODE%"
"%OSHI_NODE%" --version >>"%OSHI_MATERIALS_LAUNCH_LOG%" 2>&1
call :check_dependencies
if not errorlevel 1 goto run_tool
echo Preparing updater dependencies. Please wait...
>>"%OSHI_MATERIALS_LAUNCH_LOG%" echo Installing missing dependencies
for %%I in ("%OSHI_NODE%") do set "OSHI_NPM_CLI=%%~dpInode_modules\npm\bin\npm-cli.js"
if not exist "%OSHI_NPM_CLI%" goto install_from_path
"%OSHI_NODE%" "%OSHI_NPM_CLI%" install --no-audit --no-fund >>"%OSHI_MATERIALS_LAUNCH_LOG%" 2>&1
goto installed

:install_from_path
call npm.cmd install --no-audit --no-fund >>"%OSHI_MATERIALS_LAUNCH_LOG%" 2>&1

:installed
if errorlevel 1 goto install_error
call :check_dependencies
if errorlevel 1 goto install_error

:run_tool
>>"%OSHI_MATERIALS_LAUNCH_LOG%" echo Starting the materials tool
"%OSHI_NODE%" "tools\materials.mjs" %*
set "OSHI_MATERIALS_EXIT=%ERRORLEVEL%"
>>"%OSHI_MATERIALS_LAUNCH_LOG%" echo Materials tool exited: %OSHI_MATERIALS_EXIT%
if not "%OSHI_MATERIALS_EXIT%"=="0" echo The tool stopped. See the message above and .material-work\launcher.log.
goto finish

:folder_error
echo Cannot open the website project. Keep this file inside the oshi-official folder.
set "OSHI_MATERIALS_EXIT=1"
goto finish

:node_error
echo Node.js 22.18 or newer is required. Install it from https://nodejs.org/
>>"%OSHI_MATERIALS_LAUNCH_LOG%" echo No supported Node.js found
set "OSHI_MATERIALS_EXIT=1"
goto finish

:install_error
echo Dependencies could not be prepared. See .material-work\launcher.log.
set "OSHI_MATERIALS_EXIT=1"

:finish
echo.
pause
exit /b %OSHI_MATERIALS_EXIT%

:check_node
if not defined OSHI_NODE exit /b 1
if not exist "%OSHI_NODE%" exit /b 1
"%OSHI_NODE%" -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 18) ? 0 : 1)" >nul 2>nul
exit /b %ERRORLEVEL%

:check_dependencies
if not exist "node_modules\wrangler\bin\wrangler.js" exit /b 1
"%OSHI_NODE%" --input-type=module -e "await Promise.all(['fflate','sharp','parse5','postcss','postcss-selector-parser'].map(name => import(name)))" >nul 2>>"%OSHI_MATERIALS_LAUNCH_LOG%"
exit /b %ERRORLEVEL%
