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

REM Extract a structured status line — format requested by Yosef
"%NODE%" -e "try{const d=JSON.parse(require('fs').readFileSync('qa_real_report.json','utf8'));const t=d.totals||{};const ok=d.ok===true;const pageErr=t.pageErrors||0;const stalls=t.stalls||0;const errs=t.perPageErrors||0;const clicks=t.clicks||0;const total=clicks+(d.login&&d.login.loggedIn?1:0)+1;const failed=errs+stalls+pageErr+(d.login&&d.login.loggedIn?0:1);const reliability=Math.max(0,Math.round((total-failed)/Math.max(1,total)*100));const status=ok?'GREEN':'RED';const next=ok?'continue':(d.login&&!d.login.loggedIn?'login-flow':'click-stalls');console.log(`[Status: ${status}] [pageErr=${pageErr} stalls=${stalls} clickErr=${errs}] [Reliability: ${reliability}%] [Next: ${next}]`);}catch(e){console.log('[Status: UNKNOWN] [report-missing: '+e.message+']');}" > tools\qa-cycle-summary.log

set /p SUMMARY=<tools\qa-cycle-summary.log
echo %TS% ^| %SUMMARY% >> "%LOG%"
