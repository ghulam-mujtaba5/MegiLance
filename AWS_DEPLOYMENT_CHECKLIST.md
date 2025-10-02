# 🚀 AWS Deployment Checklist - MegiLance

## ✅ Pre-Deployment Verification

### Local Build Status
- [x] Backend container built successfully
- [x] Frontend container built successfully  
- [x] Database container running
- [x] All health checks passing
- [x] Backend accessible at http://localhost:8000
- [x] Frontend accessible at http://localhost:3000
- [x] API documentation accessible at http://localhost:8000/api/docs

### Code Issues Fixed
- [x] ProjectCategory enum added
- [x] UserType enum added
- [x] ProjectStatus enum added
- [x] Docker volume mounts fixed
- [x] Frontend build artifacts properly copied
- [x] All import errors resolved

---

## 🔐 AWS Prerequisites

### Required AWS Resources
- [ ] AWS Account with appropriate permissions
- [ ] AWS OIDC Identity Provider configured for GitHub Actions
- [ ] IAM roles created:
  - [ ] GitHub Actions deployment role
  - [ ] ECS task execution role
  - [ ] ECS task role

### Required GitHub Secrets
Go to: https://github.com/ghulam-mujtaba5/MegiLance/settings/secrets/actions

Add these secrets:
- [ ] `AWS_OIDC_ROLE_ARN` - ARN of GitHub Actions OIDC role
  - Format: `arn:aws:iam::ACCOUNT_ID:role/github-actions-role`
- [ ] `TF_VAR_db_password` - Strong password for RDS database
  - Example: Generate with `openssl rand -base64 32`

---

## 🎯 Deployment Options

### Option 1: Fully Automated (Recommended)
Run the automated deployment script:

```powershell
# Full deployment (infrastructure + application)
.\DEPLOY_TO_AWS_AUTO.ps1

# Skip infrastructure (if already provisioned)
.\DEPLOY_TO_AWS_AUTO.ps1 -SkipInfrastructure

# Deploy to staging
.\DEPLOY_TO_AWS_AUTO.ps1 -Environment staging
```

This script will:
1. ✅ Verify local build
2. ✅ Push code to GitHub
3. ✅ Check GitHub secrets
4. ✅ Trigger infrastructure setup
5. ✅ Run Terraform provisioning
6. ✅ Deploy backend to ECS
7. ✅ Deploy frontend to ECS
8. ✅ Run database migrations
9. ✅ Execute smoke tests

### Option 2: Manual GitHub Actions
1. Go to: https://github.com/ghulam-mujtaba5/MegiLance/actions

2. **First Run: Infrastructure Setup**
   - Click on "Complete AWS Infrastructure Setup"
   - Click "Run workflow"
   - Set `apply` to `yes`
   - Click "Run workflow"
   - Wait ~10-15 minutes for completion

3. **Second Run: Terraform**
   - Click on "Terraform Plan & Apply"
   - Click "Run workflow"
   - Wait ~5-10 minutes for completion

4. **Third Run: Deploy Application**
   - Click on "Build and Deploy Application"
   - Click "Run workflow"
   - Choose:
     - Environment: `production`
     - Deploy backend: `true`
     - Deploy frontend: `true`
   - Click "Run workflow"
   - Wait ~15-20 minutes for completion

### Option 3: Local Terraform + Manual Deploy
```powershell
# Navigate to Terraform directory
cd infra/terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Then manually trigger GitHub Actions deployment
```

---

## 📋 Deployment Workflow Details

### Infrastructure Workflow (`infrastructure.yml`)
**Purpose:** Creates base AWS infrastructure
**Runtime:** ~10-15 minutes
**Resources Created:**
- VPC with public/private subnets
- Internet Gateway & NAT Gateway
- Security Groups
- RDS PostgreSQL database
- ECR repositories (backend & frontend)
- ECS Cluster
- IAM roles and policies
- S3 buckets for assets
- CloudWatch Log Groups
- Secrets Manager entries

### Terraform Workflow (`terraform.yml`)
**Purpose:** Provisions infrastructure via Terraform
**Runtime:** ~5-10 minutes
**Actions:**
- Validates Terraform configuration
- Plans infrastructure changes
- Applies changes to AWS
- Outputs resource information

### Deployment Workflow (`auto-deploy.yml`)
**Purpose:** Builds and deploys application
**Runtime:** ~15-20 minutes
**Steps:**
1. Build Docker images for backend & frontend
2. Push images to ECR
3. Run database migrations
4. Deploy backend to ECS
5. Deploy frontend to ECS
6. Run smoke tests
7. Send deployment notifications

---

## 🔍 Monitoring Deployment

### GitHub Actions Status
Monitor all workflows at:
https://github.com/ghulam-mujtaba5/MegiLance/actions

### AWS Console Links (us-east-2)
- **ECS Clusters:** https://us-east-2.console.aws.amazon.com/ecs/v2/clusters
- **ECS Services:** https://us-east-2.console.aws.amazon.com/ecs/v2/clusters/megilance-cluster/services
- **ECR Repositories:** https://us-east-2.console.aws.amazon.com/ecr/repositories
- **RDS Databases:** https://us-east-2.console.aws.amazon.com/rds/home?region=us-east-2
- **CloudWatch Logs:** https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
- **Secrets Manager:** https://us-east-2.console.aws.amazon.com/secretsmanager/home?region=us-east-2

### Check Deployment Status
```powershell
# Using GitHub CLI
gh run list --workflow=auto-deploy.yml --limit 5

# Watch specific run
gh run watch RUN_ID

# View logs
gh run view RUN_ID --log
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. GitHub Secrets Missing
**Error:** "AWS_OIDC_ROLE_ARN secret is empty"
**Solution:** 
- Go to repository settings → Secrets and variables → Actions
- Add required secrets

#### 2. OIDC Role Not Found
**Error:** "An error occurred (AccessDenied) when calling AssumeRoleWithWebIdentity"
**Solution:**
- Verify OIDC provider is configured in AWS IAM
- Check trust relationship in IAM role
- Ensure role ARN is correct

#### 3. Terraform State Lock
**Error:** "Error acquiring the state lock"
**Solution:**
```powershell
cd infra/terraform
terraform force-unlock LOCK_ID
```

#### 4. ECS Service Won't Start
**Error:** "Service failed to start"
**Solution:**
- Check CloudWatch logs: `/ecs/megilance-backend` or `/ecs/megilance-frontend`
- Verify security group allows required ports
- Check task definition environment variables
- Ensure RDS is accessible from ECS tasks

#### 5. Database Connection Failed
**Error:** "FATAL: password authentication failed"
**Solution:**
- Verify `TF_VAR_db_password` secret matches RDS password
- Check security group allows port 5432
- Verify database exists and is in available state

---

## ✅ Post-Deployment Verification

### After Deployment Completes

1. **Check ECS Services**
   ```powershell
   # Get service status
   aws ecs describe-services --cluster megilance-cluster --services megilance-backend-service megilance-frontend-service --region us-east-2
   ```

2. **Get Public IPs**
   ```powershell
   # Get backend task public IP
   aws ecs list-tasks --cluster megilance-cluster --service-name megilance-backend-service --region us-east-2
   
   # Describe task to get IP
   aws ecs describe-tasks --cluster megilance-cluster --tasks TASK_ARN --region us-east-2
   ```

3. **Test Backend API**
   ```powershell
   # Replace PUBLIC_IP with actual IP from step 2
   curl http://PUBLIC_IP:8000/api/health/live
   curl http://PUBLIC_IP:8000/api/docs
   ```

4. **Test Frontend**
   ```powershell
   curl http://PUBLIC_IP:3000
   ```

5. **Check Database**
   ```powershell
   # Connect to RDS (from EC2 or via VPN)
   psql -h RDS_ENDPOINT -U megilance -d megilance_db
   ```

---

## 🎯 Next Steps After Deployment

### 1. Configure Domain & SSL
- Register or use existing domain
- Create hosted zone in Route 53
- Request SSL certificate via ACM
- Configure ALB with HTTPS listener
- Update DNS records

### 2. Set Up Monitoring
- Configure CloudWatch alarms
- Set up SNS topics for alerts
- Enable Container Insights for ECS
- Configure X-Ray tracing (optional)

### 3. Configure CI/CD
- Enable auto-deployment on push to main
- Set up staging environment
- Configure branch protection rules
- Add deployment approvals

### 4. Security Hardening
- Enable AWS WAF (Web Application Firewall)
- Configure VPC Flow Logs
- Enable AWS GuardDuty
- Set up CloudTrail logging
- Review IAM permissions (least privilege)

### 5. Backup & Disaster Recovery
- Enable RDS automated backups
- Configure snapshot policies
- Set up cross-region replication
- Document recovery procedures

---

## 📞 Support & Resources

### Documentation
- **Local Build Status:** `BUILD_AND_DEPLOYMENT_SUCCESS.md`
- **Deployment Guide:** `docs/DeploymentGuide.md`
- **AWS Deployment:** `docs/AWS-Deployment.md`

### Useful Commands
```powershell
# View all running workflows
gh run list --limit 10

# Trigger specific workflow
gh workflow run WORKFLOW_NAME

# View workflow logs
gh run view --log

# Cancel running workflow
gh run cancel RUN_ID

# Re-run failed workflow
gh run rerun RUN_ID
```

### AWS CLI Commands
```powershell
# List ECS clusters
aws ecs list-clusters --region us-east-2

# List services
aws ecs list-services --cluster megilance-cluster --region us-east-2

# View service events
aws ecs describe-services --cluster megilance-cluster --services megilance-backend-service --region us-east-2

# View logs
aws logs tail /ecs/megilance-backend --follow --region us-east-2
```

---

## 🎊 Ready to Deploy?

### Quick Start Command
```powershell
# Run this command to start automated deployment:
.\DEPLOY_TO_AWS_AUTO.ps1
```

This will handle everything automatically! ✨
