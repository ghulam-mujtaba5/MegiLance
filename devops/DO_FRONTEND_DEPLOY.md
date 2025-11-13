# DigitalOcean Frontend Deployment Guide

## ⚠️ Security Alert

If you pasted a DigitalOcean API token in chat, **revoke it immediately** at https://cloud.digitalocean.com/account/api/tokens and create a new one.

## Quick Start

### Option 1: Bash (recommended for Linux/macOS/WSL)

```bash
export DO_API_TOKEN="dop_v1_your_token_here"
bash devops/scripts/deploy_do_app.sh
```

### Option 2: PowerShell (Windows)

```powershell
$env:DO_API_TOKEN = Read-Host -AsSecureString "DigitalOcean API Token" | ConvertFrom-SecureString -AsPlainText
pwsh .\devops\deploy_do.ps1
```

## What Gets Deployed

- **Repository**: ghulam-mujtaba5/MegiLance
- **Branch**: main
- **Source Directory**: frontend
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start` (which runs `next start`)
- **Instance**: Professional-1 (1 vCPU, 2GB RAM)
- **Region**: New York (nyc)

## Deployment Workflow

1. Script authenticates with DigitalOcean API
2. Creates or updates App Platform app named `megilance-frontend`
3. Polls deployment status every 15 seconds
4. On success: displays app URL
5. On failure: saves deployment logs to `do_deploy_logs_*.log` for debugging

## Troubleshooting

### Build Fails

Common issues and fixes:

| Error | Fix |
|-------|-----|
| `next: command not found` | Ensure `npm run build` works locally: `cd frontend && npm install && npm run build` |
| `heap out of memory` | Increase instance size in `devops/do-app-spec.yaml` from `professional-1` to `professional-2` |
| `Cannot find module` | Run `npm ci` (not `npm install`) in frontend for locked dependencies |

### View Logs After Deployment

Bash:
```bash
APP_ID="your_app_id"
DEP_ID="your_deployment_id"
doctl apps logs get --app-id $APP_ID --deployment-id $DEP_ID --follow
```

PowerShell:
```powershell
$appId = "your_app_id"
doctl apps logs get --app-id $appId --follow
```

### Manual Control

```bash
# List apps
doctl apps list

# Redeploy latest commit
doctl apps create-deployment <APP_ID>

# Get app details
doctl apps get <APP_ID>

# Delete app
doctl apps delete <APP_ID>
```

## Continuous Deployment

The spec (`devops/do-app-spec.yaml`) includes:
```yaml
github:
  deploy_on_push: true
```

This means **every push to `main` branch** will trigger an automatic deployment. Verify in DigitalOcean dashboard under Deployments tab.

## Environment Variables

To add environment variables (e.g., API endpoint, feature flags):

1. Edit `devops/do-app-spec.yaml` and add to `envs` section:
   ```yaml
   envs:
     - key: NEXT_PUBLIC_API_URL
       value: "https://api.example.com"
   ```

2. Or via `doctl`:
   ```bash
   doctl apps update <APP_ID> --spec devops/do-app-spec.yaml
   ```

## Scaling & Costs

- **Professional-1** (current): ~$12/month, suitable for development
- **Professional-2**: ~$24/month, for higher traffic
- **Professional-3**: ~$48/month, for production

To change: edit `instance_size_slug` in `devops/do-app-spec.yaml` then redeploy.

## Next Steps

1. Create a new DigitalOcean API token (don't reuse the one you pasted)
2. Run the deployment script:
   ```bash
   bash devops/scripts/deploy_do_app.sh <TOKEN>
   ```
3. Monitor app at https://cloud.digitalocean.com/apps
4. Set up GitHub webhook for backend (separate guide in `ORACLE_DEPLOYMENT.md`)
