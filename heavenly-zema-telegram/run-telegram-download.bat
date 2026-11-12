@echo off
cd /d "%~dp0"
echo ==== Heavenly Zema Telegram downloader ====
echo.

where node >nul 2>nul || (echo Node.js is not installed. Get it from nodejs.org, install it, then double-click this file again. & pause & exit /b 1)

if not exist node_modules (
  echo Installing needed packages, this takes a minute...
  call npm install || (echo Install failed. Take a screenshot of this window and send it to Claude. & pause & exit /b 1)
)

echo.
echo   1 = PREVIEW  - list the songs in the channel, download nothing
echo   2 = TEST     - download only the first 5 songs
echo   3 = DOWNLOAD EVERYTHING
echo.
set /p CH=Type 1, 2 or 3 and press Enter: 
if "%CH%"=="1" node tg-download.mjs --preview
if "%CH%"=="2" node tg-download.mjs --limit 5
if "%CH%"=="3" node tg-download.mjs
echo.
pause
