@echo off
cd /d "%~dp0"
echo ==== Aurum music uploader ====
echo.

where node >nul 2>nul || (echo Node.js is not installed. Get it from nodejs.org, install it, then double-click this file again. & pause & exit /b 1)

if not exist node_modules (
  echo Installing needed packages, this takes a minute...
  call npm install || (echo Install failed. Take a screenshot of this window and send it to Claude. & pause & exit /b 1)
)

echo.
set /p MUSIC=Paste the full path of your Music folder and press Enter: 
set MUSIC=%MUSIC:"=%

echo.
echo ---- PREVIEW, nothing is uploaded yet ----
node upload-music.mjs "%MUSIC%" --dry-run
echo.
set /p GO=Does that look right? Type YES to upload for real, or close this window to stop: 
if /i not "%GO%"=="YES" exit /b

echo.
set /p SUPABASE_URL=Paste your Supabase project URL: 
set /p SUPABASE_SERVICE_ROLE_KEY=Paste your service role key: 

echo.
node upload-music.mjs "%MUSIC%"
echo.
pause
