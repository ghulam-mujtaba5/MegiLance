# Backend Deployment Guide

## 🎯 Current Status

✅ **Backend Implementation Complete**
- 18 database models
- 48+ Pydantic schemas
- 118 API endpoints across 12 modules
- All code committed and pushed to GitHub

## 📋 Next Steps for Deployment

### 1. Database Migrations (Required)

The new models need to be added to the database schema.

```bash
cd backend

# Install Alembic if not already installed
pip install alembic

# Initialize Alembic (skip if already done)
alembic init alembic

# Create migration for all new models
alembic revision --autogenerate -m "Add messaging, notifications, reviews, disputes, milestones, skills models"

# Review the generated migration file in alembic/versions/
# Make sure it includes all new tables and columns

# Apply migration to local database (for testing)
alembic upgrade head
```

### 2. Update ECS Task Definition

The backend needs to be redeployed with the new code.

**Option A: Using AWS Console**
1. Go to ECS → Task Definitions → megilance-backend-task
2. Create new revision
3. No changes needed (code will be pulled from latest Docker image)
4. Update service to use new revision

**Option B: Using AWS CLI (Automated)**
```bash
# Build and push new Docker image
cd backend
docker build -t megilance-backend:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 789406175220.dkr.ecr.us-east-2.amazonaws.com
docker tag megilance-backend:latest 789406175220.dkr.ecr.us-east-2.amazonaws.com/megilance-backend:latest

# Push to ECR
docker push 789406175220.dkr.ecr.us-east-2.amazonaws.com/megilance-backend:latest

# Update ECS service (forces new deployment)
aws ecs update-service \
  --cluster megilance-cluster \
  --service megilance-backend-service \
  --force-new-deployment \
  --region us-east-2
```

### 3. Run Database Migrations on Production

**IMPORTANT:** Migrations must be run on production database after deployment.

```bash
# Option 1: Run migration from ECS task
aws ecs run-task \
  --cluster megilance-cluster \
  --task-definition megilance-backend-task \
  --overrides '{"containerOverrides":[{"name":"megilance-backend","command":["alembic","upgrade","head"]}]}' \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0d5767ac77f08653e,subnet-02e4b9a4eab86a8db],securityGroups=[sg-0ab019c9e46be07fb],assignPublicIp=DISABLED}" \
  --region us-east-2

# Option 2: SSH into running container and run migration
# (This requires ECS Exec to be enabled)
aws ecs execute-command \
  --cluster megilance-cluster \
  --task <task-id> \
  --container megilance-backend \
  --interactive \
  --command "/bin/bash"

# Then inside container:
cd /app
alembic upgrade head
```

### 4. Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster megilance-cluster \
  --services megilance-backend-service \
  --region us-east-2

# Check task health
aws ecs list-tasks \
  --cluster megilance-cluster \
  --service-name megilance-backend-service \
  --region us-east-2

# Check logs
aws logs tail /ecs/megilance-backend --follow --region us-east-2

# Test API endpoints
curl https://<alb-dns>/health
curl https://<alb-dns>/api/skills
curl https://<alb-dns>/docs  # Swagger UI
```

### 5. Test New Endpoints

Use the Swagger UI at `https://<alb-dns>/docs` or test with curl:

```bash
# Get skills catalog (public endpoint)
curl https://<alb-dns>/api/skills

# Login to get token
curl -X POST https://<alb-dns>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test authenticated endpoint (replace TOKEN)
curl https://<alb-dns>/api/notifications \
  -H "Authorization: Bearer <TOKEN>"

# Create a conversation
curl -X POST https://<alb-dns>/api/conversations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"client_id":1,"freelancer_id":2,"contract_id":1}'

# Send a message
curl -X POST https://<alb-dns>/api/messages \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id":2,"content":"Hello!","message_type":"text"}'
```

## 🔍 Troubleshooting

### Issue: Database Migration Fails

**Solution:** Check database connection and permissions
```bash
# Test database connection from backend container
aws ecs execute-command \
  --cluster megilance-cluster \
  --task <task-id> \
  --container megilance-backend \
  --interactive \
  --command "python -c 'from app.db.session import engine; print(engine.url)'"
```

### Issue: Import Errors

**Solution:** Rebuild Docker image with latest code
```bash
cd backend
docker build --no-cache -t megilance-backend:latest .
# Then push and redeploy
```

### Issue: 404 on New Endpoints

**Solution:** Check router registration
```bash
# In Python shell within container
python -c "from app.api.routers import api_router; print(f'Routes: {len(api_router.routes)}')"
# Should print: Routes: 118
```

### Issue: Authentication Fails

**Solution:** Verify JWT secret is set correctly
```bash
# Check environment variables
aws ecs describe-tasks \
  --cluster megilance-cluster \
  --tasks <task-arn> \
  --region us-east-2
```

## 📊 Expected Results

After successful deployment:

- ✅ Backend service: RUNNING (1/1 tasks)
- ✅ Database: All 18 tables created
- ✅ API: 118 endpoints available
- ✅ Health check: Passing
- ✅ Logs: No errors
- ✅ Swagger UI: Accessible at `/docs`

## 🎯 Quick Deploy Script

Create this script for automated deployment:

```bash
#!/bin/bash
# deploy-backend.sh

set -e

echo "🚀 Deploying MegiLance Backend..."

# 1. Build Docker image
echo "📦 Building Docker image..."
cd backend
docker build -t megilance-backend:latest .

# 2. Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  789406175220.dkr.ecr.us-east-2.amazonaws.com

# 3. Tag and push
echo "⬆️ Pushing to ECR..."
docker tag megilance-backend:latest \
  789406175220.dkr.ecr.us-east-2.amazonaws.com/megilance-backend:latest
docker push 789406175220.dkr.ecr.us-east-2.amazonaws.com/megilance-backend:latest

# 4. Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster megilance-cluster \
  --service megilance-backend-service \
  --force-new-deployment \
  --region us-east-2

# 5. Wait for deployment
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster megilance-cluster \
  --services megilance-backend-service \
  --region us-east-2

echo "✅ Deployment complete!"
echo "📝 Don't forget to run database migrations!"
```

## 📝 Post-Deployment Checklist

- [ ] Docker image built and pushed to ECR
- [ ] ECS service updated with new task definition
- [ ] Database migrations applied successfully
- [ ] All 18 database tables exist
- [ ] Health check endpoint returns 200
- [ ] New API endpoints accessible (test with Swagger UI)
- [ ] Authentication working (test login)
- [ ] Logs show no errors
- [ ] Service shows RUNNING status (1/1 tasks)
- [ ] Test key workflows:
  - [ ] Create conversation and send message
  - [ ] Create notification
  - [ ] Create review
  - [ ] Raise dispute
  - [ ] Create milestone

---

**Need Help?** Check logs:
```bash
aws logs tail /ecs/megilance-backend --follow --region us-east-2
```
