# 🚀 Vercel-Style Auto-Deployment for AWS

## Overview

Your MegiLance project now has **automatic deployment** just like Vercel! Every time you push code to GitHub, it automatically:

1. ✅ Detects what changed (backend/frontend/infrastructure)
2. 🧪 Runs tests
3. 🏗️ Builds Docker images
4. 🚀 Deploys to AWS ECS
5. 🔍 Verifies deployment health
6. 🔄 Auto-rolls back on failure
7. 📧 Sends notifications

---

## How It Works

### Workflow: `auto-deploy.yml`

```
Push to main → GitHub Actions → Auto-Deploy Workflow
                                      ↓
                          1. Detect Changes (smart)
                                      ↓
                          2. Run Tests (parallel)
                                      ↓
                          3. Build & Push Images
                                      ↓
                          4. Deploy to ECS
                                      ↓
                          5. Health Checks
                                      ↓
                          6. Notify (SNS/Email)
```

### Smart Change Detection

The workflow only deploys what changed:

- Changed `backend/**` → Deploy backend only
- Changed `frontend/**` → Deploy frontend only
- Changed `infra/**` → Update infrastructure only
- Changed multiple → Deploy all affected

This saves time and reduces deployment risk!

---

## Setup Instructions

### 1. Required GitHub Secrets (Already Set)

✅ You already have:
- `AWS_OIDC_ROLE_ARN` - AWS authentication
- `TF_VAR_db_password` - Database password

### 2. Optional: Vercel Integration

For automatic frontend deployment to Vercel, add these secrets:

```bash
# Get Vercel token from https://vercel.com/account/tokens
# Add to GitHub Secrets:
VERCEL_TOKEN=your_token_here
VERCEL_ORG_ID=team_xxx or user_xxx
VERCEL_PROJECT_ID=prj_xxx
```

**How to get Vercel IDs:**
```bash
cd frontend
vercel link
cat .vercel/project.json
```

### 3. Enable Auto-Deployment

**It's already enabled!** The workflow runs automatically on every push to `main`.

---

## Usage

### Automatic Deployment (Default)

Just push your code:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# 🎉 That's it! Deployment happens automatically
```

### Manual Deployment

Trigger manually from GitHub:
1. Go to Actions tab
2. Select "🚀 Vercel-Style Auto Deploy"
3. Click "Run workflow"
4. Choose options (force deploy, skip tests, etc.)

### Monitor Deployment

**GitHub Actions UI:**
- Go to: https://github.com/ghulam-mujtaba5/MegiLance/actions
- Click on the latest workflow run
- View real-time logs

**Deployment Summary:**
Each deployment creates a summary showing:
- What was deployed
- Image tags
- Health check results
- URLs

---

## Deployment Flow

### Backend Deployment

```
1. Detect changes in backend/** → Yes
         ↓
2. Run Python tests (pytest)
         ↓
3. Build Docker image (with cache)
         ↓
4. Push to ECR (tag: commit SHA + latest)
         ↓
5. Update ECS service (force new deployment)
         ↓
6. Wait for service to stabilize
         ↓
7. Health check: curl /api/health/live
         ↓
8. ✅ Success or 🔄 Auto-rollback
```

### Frontend Deployment

```
1. Detect changes in frontend/** → Yes
         ↓
2. Run npm tests & linting
         ↓
3. Build production bundle
         ↓
4. Deploy to Vercel (if configured)
    OR
   Push to ECR & deploy to ECS
         ↓
5. ✅ Success
```

### Infrastructure Deployment

```
1. Detect changes in infra/terraform/** → Yes
         ↓
2. Terraform init
         ↓
3. Terraform apply -auto-approve
         ↓
4. Update AWS resources
         ↓
5. ✅ Success
```

---

## Rollback System

### Automatic Rollback

If deployment fails, the workflow automatically:
1. Detects failure
2. Gets previous task definition
3. Reverts ECS service
4. Sends notification

### Manual Rollback

```bash
# Via GitHub Actions
1. Go to Actions → Latest failed run
2. Re-run previous successful workflow

# Via AWS CLI
aws ecs update-service \
  --cluster megilance-cluster \
  --service megilance-backend-service \
  --task-definition megilance-backend:PREVIOUS_REVISION
```

---

## Deployment Stages

### Stage 1: Pre-Deployment ⏱️ ~2 min
- Checkout code
- Detect changes
- Setup environment

### Stage 2: Testing ⏱️ ~3-5 min
- Backend: pytest, coverage
- Frontend: lint, build

### Stage 3: Build ⏱️ ~5-10 min
- Docker build (with cache)
- Push to ECR

### Stage 4: Deploy ⏱️ ~3-5 min
- Update ECS service
- Wait for stability

### Stage 5: Verify ⏱️ ~1-2 min
- Health checks
- Smoke tests

**Total Deployment Time: ~15-25 minutes**

---

## Monitoring Deployments

### Real-Time Logs

**GitHub Actions:**
```
https://github.com/ghulam-mujtaba5/MegiLance/actions
```

**CloudWatch Logs:**
```bash
aws logs tail /ecs/megilance-backend --follow
```

**ECS Console:**
```
https://console.aws.amazon.com/ecs/home?region=us-east-2#/clusters/megilance-cluster
```

### Deployment Notifications

You'll receive notifications via:
1. **GitHub Actions UI** - Real-time status
2. **SNS Email** - Success/failure alerts
3. **PR Comments** - For pull requests

---

## Deployment Status Badges

Add this to your README.md:

```markdown
[![Auto Deploy](https://github.com/ghulam-mujtaba5/MegiLance/actions/workflows/auto-deploy.yml/badge.svg)](https://github.com/ghulam-mujtaba5/MegiLance/actions/workflows/auto-deploy.yml)
```

---

## Troubleshooting

### Deployment Stuck

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster megilance-cluster \
  --services megilance-backend-service

# Check task status
aws ecs list-tasks --cluster megilance-cluster
```

### Health Check Failing

```bash
# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names megilance-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test manually
curl http://$ALB_DNS/api/health/live
```

### Deployment Failed

1. Check GitHub Actions logs for error
2. Review CloudWatch logs: `/ecs/megilance-backend`
3. Check ECS task stopped reason
4. Verify secrets are set correctly

### Rollback Not Working

```bash
# Manual rollback
PREVIOUS_REV=megilance-backend:123  # Get from ECS console

aws ecs update-service \
  --cluster megilance-cluster \
  --service megilance-backend-service \
  --task-definition $PREVIOUS_REV \
  --force-new-deployment
```

---

## Advanced Features

### Environment-Specific Deployments

Create separate workflows for dev/staging/prod:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [staging]

env:
  ECS_CLUSTER: megilance-staging-cluster
  ECS_SERVICE: megilance-staging-backend
```

### Deployment Approval

Add manual approval for production:

```yaml
jobs:
  deploy-prod:
    environment:
      name: production
      # Requires manual approval in GitHub Settings
```

### Canary Deployments

Gradually roll out to users:

```bash
# Deploy to 10% of tasks first
aws ecs update-service \
  --cluster megilance-cluster \
  --service megilance-backend-service \
  --deployment-configuration "maximumPercent=110,minimumHealthyPercent=100"
```

### Blue-Green Deployments

Zero-downtime deployments:
1. Deploy new version alongside old
2. Switch traffic via ALB
3. Terminate old version

---

## Comparison: Vercel vs Our AWS Setup

| Feature | Vercel | Our AWS Setup |
|---------|--------|---------------|
| **Auto-deploy on push** | ✅ Yes | ✅ Yes |
| **Smart change detection** | ✅ Yes | ✅ Yes |
| **Preview deployments** | ✅ Yes | ⏳ Coming soon |
| **Instant rollback** | ✅ Yes | ✅ Yes (auto) |
| **Real-time logs** | ✅ Yes | ✅ Yes (CloudWatch) |
| **Health checks** | ✅ Yes | ✅ Yes |
| **Notifications** | ✅ Yes | ✅ Yes (SNS) |
| **Deploy time** | ~2-5 min | ~15-25 min |
| **Custom infrastructure** | ❌ No | ✅ Yes |
| **Database included** | ❌ No | ✅ Yes (RDS) |
| **Full AWS control** | ❌ No | ✅ Yes |
| **Cost** | $20+/mo | ~$100/mo |

---

## Cost of Auto-Deployments

**GitHub Actions (Free Tier):**
- 2,000 minutes/month free
- Each deployment: ~25 minutes
- **~80 deployments/month free**

**AWS Costs:**
- Same as before (~$100/month)
- No additional cost for auto-deployment
- ECR storage: minimal (~$1/month for images)

---

## Best Practices

### 1. Commit Messages
Use conventional commits for automatic changelogs:
```bash
git commit -m "feat: add user profile"     # New feature → Deploy
git commit -m "fix: resolve login bug"     # Bug fix → Deploy
git commit -m "docs: update README"        # Docs → No deploy
```

### 2. Testing
- Always run tests locally first: `npm test` or `pytest`
- Don't skip tests in production deployments
- Add more test coverage over time

### 3. Deployment Frequency
- Deploy often (multiple times per day)
- Keep changes small and focused
- Easier to debug and rollback

### 4. Monitoring
- Watch first few deployments closely
- Subscribe to SNS alerts
- Check CloudWatch dashboard regularly

### 5. Secrets Management
- Never commit secrets to Git
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly

---

## Next Steps

### Immediate
1. ✅ Auto-deployment is configured
2. ⏳ Make a small change and push to test it
3. ⏳ Subscribe to SNS alerts
4. ⏳ Add Vercel secrets for frontend auto-deploy

### Soon
1. Setup staging environment
2. Add preview deployments for PRs
3. Implement canary deployments
4. Add more comprehensive tests

### Future
1. Multi-region deployments
2. Advanced monitoring (DataDog/New Relic)
3. A/B testing infrastructure
4. Auto-scaling based on traffic

---

## Support

**Issues with Auto-Deployment?**
1. Check GitHub Actions logs
2. Review this guide
3. Check CloudWatch logs
4. Ask in team chat

**GitHub Actions Status:**
https://github.com/ghulam-mujtaba5/MegiLance/actions

---

## Summary

🎉 **You now have Vercel-style auto-deployment for AWS!**

**What happens when you push code:**
1. GitHub Actions starts automatically
2. Tests run
3. Code builds
4. Deploys to AWS
5. Health checks verify
6. You get notified

**Just like Vercel, but with:**
- Full AWS infrastructure control
- Your own database
- Custom configuration
- Better security
- More power

**Push code → It's live in ~20 minutes!** 🚀

---

*Last Updated: October 2, 2025*
