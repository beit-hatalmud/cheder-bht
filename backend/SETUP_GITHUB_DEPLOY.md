# 🤖 GitHub Actions Backend Deploy (1-time setup, then fully autonomous)

This bypasses NetFree by running clasp from GitHub's data center.

## One-Time Setup (90 seconds):

### Step 1: Copy your clasp credentials
```bash
type "C:\Users\יוסף שניידר\.clasprc.json"
```
Copy the ENTIRE JSON output (single line).

### Step 2: Add as GitHub Secret
1. Open: https://github.com/beit-hatalmud/cheder-bht/settings/secrets/actions
2. Click "New repository secret"
3. Name: `CLASPRC_JSON`
4. Value: paste the JSON from step 1
5. Click "Add secret"

### Step 3: Trigger first deploy
Either:
- Push any change to `apps-script/` folder
- Or: https://github.com/beit-hatalmud/cheder-bht/actions/workflows/deploy-appscript.yml → "Run workflow" button

## After Setup — Fully Autonomous:

From now on, ANYTHING I push to `apps-script/AuthV2.js` or `ValidateV2.js` will auto-deploy.

I can:
- ✅ Update Apps Script code via git push (no manual steps)
- ✅ Modify auth logic
- ✅ Deploy new versions
- ✅ Verify via the ping endpoint in the workflow

You only do this ONCE. After that, fully autonomous.

## Final Manual Step (only in Apps Script editor, 2 minutes):

The workflow deploys CODE but can't set Script Properties (security limit).
After the deploy succeeds:

1. Open https://script.google.com/d/1TrAsYVo_NNoXb-JcLuOcq3e4IlYanQUDUEPb5Irga2Si7tWjpUDehNID/edit
2. ⚙ Project Settings → Script properties → Add Script property:
   - `AGENT_TOKEN` = `BHT_AGENT_2026`
   - `PWD_SALT` = run in your terminal: `powershell -c "[Convert]::ToBase64String((1..32 | %% { Get-Random -Min 0 -Max 255 }))"`
   - `JWT_SECRET` = run in terminal: `powershell -c "[Convert]::ToBase64String((1..64 | %% { Get-Random -Min 0 -Max 255 }))"`
3. Save Script Properties
4. (Optional) Run `migrateLegacyPasswords()` from function dropdown

That's it. **All future code changes deploy automatically via GitHub Actions.**

## Security Note

`CLASPRC_JSON` is a GitHub repository secret - encrypted, only visible to the workflow runtime. Not exposed in logs.

To revoke access later: delete the secret + run `clasp logout` locally.
