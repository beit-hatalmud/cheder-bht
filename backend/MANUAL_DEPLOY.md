# Manual Deployment (NetFree workaround)

NetFree blocks `script.googleapis.com/v1/projects/.../content` POST.
Use one of these workarounds:

## Option A: Mobile Hotspot (3 minutes)
1. On your phone: enable Mobile Hotspot
2. Connect this PC to the phone hotspot
3. In a terminal in `cheder-bht`:
   ```
   cd C:\temp\find-cheder-script\test-1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID
   npx clasp push --force
   ```
4. Reconnect WiFi

## Option B: Manual Paste (10 minutes)
1. Open https://script.google.com/d/1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID/edit
2. Click "+" near Files → New Script file → name it `AuthV2`
3. Paste contents of `C:\temp\find-cheder-script\test-1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID\AuthV2.js`
4. Repeat for `ValidateV2`
5. Go to ⚙ Project Settings → Script Properties → Add:
   - `AGENT_TOKEN` = `BHT_AGENT_2026`
   - `PWD_SALT` = generate random 32 chars
   - `JWT_SECRET` = generate random 64 chars
6. Save (Ctrl+S)
7. Deploy → New deployment → Deploy

## Option C: Direct From This Session (if hotspot connects)
Run this in your terminal:
```
! cd C:\temp\find-cheder-script\test-1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID && npx clasp push --force
```

The `!` prefix runs in your shell context which may have different filtering.

## Status
- Script ID identified: `1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID`
- Files prepared: `AuthV2.js`, `ValidateV2.js` (in local clone dir)
- Action needed: push to deploy
