@echo off
REM ================================================================
REM DEPLOY_NOW.bat - One-click backend deployment
REM Run this AFTER connecting to mobile hotspot (no NetFree)
REM ================================================================
chcp 65001 > nul
echo.
echo ============================================================
echo Cheder-BHT Backend Deployment (Phase 1 + 2)
echo ============================================================
echo.
echo Verifying network is NOT NetFree-blocked...
curl -s -m 5 "https://script.googleapis.com/v1/projects" > nul 2>&1
if errorlevel 1 (
  echo [ERROR] Network unreachable. Connect to mobile hotspot first.
  pause
  exit /b 1
)
curl -s -m 5 "https://script.googleapis.com/v1/projects/1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID/content" > test_response.tmp 2>&1
findstr /C:"netfree" test_response.tmp > nul
if not errorlevel 1 (
  del test_response.tmp
  echo [ERROR] Still blocked by NetFree. Switch to mobile hotspot.
  pause
  exit /b 1
)
del test_response.tmp
echo [OK] Network passes NetFree check.
echo.

cd /d "C:\temp\find-cheder-script\test-1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID"
if not exist .clasp.json (
  echo [ERROR] Clone directory not found. Run: npx clasp clone 1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID
  pause
  exit /b 1
)

echo Pushing AuthV2.js + ValidateV2.js to Apps Script...
call npx clasp push --force
if errorlevel 1 (
  echo [ERROR] Push failed. Check error above.
  pause
  exit /b 1
)
echo [OK] Code pushed successfully.
echo.

echo Creating deployment version...
call npx clasp deploy --description "v2-auth+validate-%DATE%"
echo.

echo ============================================================
echo MANUAL STEPS REMAINING (~3 minutes in Apps Script editor):
echo ============================================================
echo.
echo 1. Open https://script.google.com/d/1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID/edit
echo.
echo 2. Click Settings (gear icon left side) ^> Script properties ^> Add:
echo    AGENT_TOKEN   = BHT_AGENT_2026
echo    PWD_SALT      = (paste a random 32-char string)
echo    JWT_SECRET    = (paste a random 64-char string)
echo.
echo 3. In editor: Select function "migrateLegacyPasswords" from dropdown ^> Run
echo    (Authorize if prompted. This hashes existing passwords.)
echo.
echo 4. Deploy ^> Manage deployments ^> Edit pencil ^> New version ^> Deploy
echo.
echo ============================================================
echo Need help generating secrets? Run:
echo    powershell -Command "[Convert]::ToBase64String((1..32 ^| %% { Get-Random -Min 0 -Max 255 }))"
echo ============================================================
echo.
pause
