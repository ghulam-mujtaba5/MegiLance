# DigitalOcean Frontend Deployment - Ready to Deploy

## Pre-flight Checks ✓

- [x] App spec: `devops/do-app-spec.yaml` configured
- [x] Frontend build: `npm ci && npm run build` command set
- [x] Start script: `npm start` respects `$PORT` env var
- [x] Node.js environment: Professional-1 instance
- [x] Source directory: `frontend/`
- [x] Auto-deploy on push: Enabled for `main` branch
- [x] Deployment script: `devops/deploy_do_frontend.ps1` ready

## Quick Deploy Command

**PowerShell (Windows/macOS/Linux with pwsh):**

```powershell
# Set your DigitalOcean API token (create new one at https://cloud.digitalocean.com/account/api/tokens)
$env:DO_API_TOKEN = Read-Host -AsSecureString "DigitalOcean API Token" | ConvertFrom-SecureString -AsPlainText

# Run deployment
.\devops\deploy_do_frontend.ps1
```

**What it does:**
1. Authenticates with DigitalOcean
2. Creates or updates the app named `megilance-frontend`
3. Polls deployment status every 15 seconds
4. Shows success URL or error logs

**Expected output on success:**
```
✓ Deployed successfully!
  URL: https://megilance-frontend-xxxxx.ondigitalocean.app
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "403 Unauthorized" | Token is invalid or revoked. Create a new token. |
| "heap out of memory" | Increase instance size: change `professional-1` to `professional-2` in `do-app-spec.yaml` |
| "Cannot find module" | Clear Node cache: delete `node_modules` and `.next` locally, commit, and redeploy |
| Build takes >10min | Timeout is 600s; logs will be saved if it fails |

## Manual Debugging

After deployment, check status:

```powershell
# List apps
doctl apps list

# Get deployment logs (replace APP_ID)
doctl apps logs get --app-id abc123 --follow

# Force redeploy latest commit
doctl apps create-deployment abc123
```

## Next Steps After Success

1. Test the live frontend URL
2. Check `/health` endpoint exists (if applicable)
3. Wire up backend API calls in `frontend/.env.local` or App settings
4. Commit and push — auto-deploy will trigger

---

**Ready?** Run the PowerShell command above with your new DigitalOcean API token.
