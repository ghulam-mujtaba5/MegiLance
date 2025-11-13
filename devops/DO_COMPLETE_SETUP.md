# DigitalOcean Frontend Deployment - Complete Setup

## Summary

Your MegiLance frontend is **ready to deploy** to DigitalOcean App Platform with:
- Automatic builds from `main` branch on every push
- Professional-1 instance (1 vCPU, 2GB RAM)
- Next.js 16 with all dependencies pre-configured
- Health monitoring and auto-restart on failure

## Files Updated/Created

1. **`devops/do-app-spec.yaml`** — App Platform configuration (ready to use)
2. **`devops/deploy_do_frontend.ps1`** — PowerShell deployment automation
3. **`frontend/package.json`** — Updated `start` script to respect `$PORT`
4. **`devops/DEPLOY_NOW.md`** — Quick reference guide

## Deployment Steps

### Step 1: Create DigitalOcean API Token

1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name it (e.g., "MegiLance Deploy")
4. Select "Write" scope (to create/manage apps)
5. Copy the token (save it securely, don't share)

⚠️ **If you previously pasted a token in chat, revoke it immediately at the same URL above.**

### Step 2: Run Deployment Script

Open PowerShell and run:

```powershell
cd e:\MegiLance

# Store token securely in this session
$env:DO_API_TOKEN = Read-Host -AsSecureString "Paste DigitalOcean API Token" | ConvertFrom-SecureString -AsPlainText

# Run deployment
.\devops\deploy_do_frontend.ps1
```

### Step 3: Monitor Deployment

The script will:
- Print: `Step 1: Authenticating doctl...` → `✓ Authenticated`
- Print: `Step 2: Looking for existing app...` → Creates/updates app
- Print: `Step 3: Polling deployment status...` → Checks every 15 seconds
- Print: Success URL or error logs

**Expected runtime: 5-15 minutes** (depends on build time)

## Common Issues & Fixes

### "Authentication failed" / "401 Unauthorized"

**Cause:** Invalid token

**Fix:**
1. Revoke old token at https://cloud.digitalocean.com/account/api/tokens
2. Create a new token with "Write" scope
3. Run script again

### "heap out of memory" in logs

**Cause:** Build runs out of memory on Professional-1

**Fix:**
1. Edit `devops/do-app-spec.yaml`
2. Change `instance_size_slug: professional-1` to `professional-2`
3. Run deployment again

### Build takes >10 minutes or times out

**Cause:** Dependencies or build is slow

**Fix:**
1. Check logs saved to `do_deploy_logs_*.log`
2. If it's just slow, wait (timeout is 600 seconds)
3. If error: share the log and I'll debug

### App deploys but shows "502 Bad Gateway"

**Cause:** Next.js server didn't start correctly

**Fix:**
1. Check `frontend/package.json` has `"start": "next start -p ${PORT:-3000}"`
2. Check `frontend/.next/` directory exists after build
3. Try increasing instance size to `professional-2`

## Verification After Success

Once the script shows success:

```powershell
# Get the app URL
doctl apps list

# Test the frontend
$url = "https://your-app-url-here"
curl $url
```

Expected: HTML page loads (homepage)

## Continuous Deployment

After first deployment, every push to `main` branch will auto-deploy:

1. Push code: `git push origin main`
2. GitHub notifies DigitalOcean
3. DigitalOcean triggers build
4. Frontend redeploys automatically

No additional action needed — check progress in DigitalOcean dashboard: https://cloud.digitalocean.com/apps

## Environment Variables

To add API endpoints or config:

1. Edit `devops/do-app-spec.yaml`
2. Add to `envs` section:
   ```yaml
   - key: NEXT_PUBLIC_API_URL
     value: "https://api.example.com"
   ```
3. Re-run deployment script

Or update via DigitalOcean dashboard (Settings → Components → Environment)

## Costs

| Size | vCPU | RAM | Price/month |
|------|------|-----|------------|
| professional-1 | 1 | 2GB | ~$12 |
| professional-2 | 2 | 4GB | ~$24 |
| professional-3 | 4 | 8GB | ~$48 |

Current: **professional-1** ($12/month)

## Support

If deployment fails:
1. Check `do_deploy_logs_*.log` file
2. Verify token is valid
3. Ensure `frontend/package.json` is valid JSON
4. Share the error logs and I'll fix it

---

## Ready? Run This Now

```powershell
cd e:\MegiLance
$env:DO_API_TOKEN = Read-Host -AsSecureString "DO API Token" | ConvertFrom-SecureString -AsPlainText
.\devops\deploy_do_frontend.ps1
```

After success, your frontend will be live at: `https://megilance-frontend-xxxx.ondigitalocean.app`
