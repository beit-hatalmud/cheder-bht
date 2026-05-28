@echo off
REM tools/qa-cycle.cmd — invoked by Windows Scheduled Task every 60 minutes.
REM Runs qa-bot-real.js against the live site and appends a one-line summary
REM to loop_status.log. Designed to survive across sessions.

set ROOT=C:\Users\יוסף שניידר\AppData\Local\Temp\cheder-bht
set LOG=C:\Logs\BHT_Cameras\loop_status.log
set NODE=node

cd /d "%ROOT%"
if not exist "C:\Logs\BHT_Cameras" mkdir "C:\Logs\BHT_Cameras"

REM Timestamp at start
for /f "tokens=2 delims==" %%i in ('"wmic os get localdatetime /value | findstr LocalDateTime"') do set TS=%%i
set TS=%TS:~0,4%-%TS:~4,2%-%TS:~6,2% %TS:~8,2%:%TS:~10,2%:%TS:~12,2%

REM Run the bot — output discarded (report file holds the data)
"%NODE%" tools\qa-bot-real.js > tools\qa-cycle-last.log 2>&1
set EXIT=%ERRORLEVEL%

REM Extract a one-line summary from the report
"%NODE%" -e "try{const d=JSON.parse(require('fs').readFileSync('qa_real_report.json','utf8'));const t=d.totals||{};console.log(`ok=${d.ok} login_ms=${(d.login&&d.login.ms)||'?'} pageErrors=${t.pageErrors||0} stalls=${t.stalls||0} clicks=${t.clicks||0} errs=${t.perPageErrors||0}`);}catch(e){console.log('no-report '+e.message);}" > tools\qa-cycle-summary.log

set /p SUMMARY=<tools\qa-cycle-summary.log
echo %TS% ^| QA-cycle (exit=%EXIT%) ^| %SUMMARY% >> "%LOG%"
