@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 請先安裝 Node.js，再重新開啟此工具。
  pause
  exit /b 1
)
if not exist "node_modules\fflate\package.json" (
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
node tools/materials.mjs
pause
