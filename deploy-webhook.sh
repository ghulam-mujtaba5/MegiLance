#!/bin/bash
# MegiLance Backend - Git Auto-Deploy Webhook Handler
# This script deploys the latest code from GitHub when triggered

set -e

DEPLOY_DIR="/home/ubuntu/app/MegiLance"
LOG_FILE="/home/ubuntu/app/deploy.log"

echo "========================================" | tee -a $LOG_FILE
echo "Deployment started at $(date)" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE

cd $DEPLOY_DIR

echo "📥 Pulling latest code from GitHub..." | tee -a $LOG_FILE
git pull origin main 2>&1 | tee -a $LOG_FILE

echo "🐳 Rebuilding and restarting containers..." | tee -a $LOG_FILE
docker-compose -f docker-compose.minimal.yml pull 2>&1 | tee -a $LOG_FILE
docker-compose -f docker-compose.minimal.yml up -d --build 2>&1 | tee -a $LOG_FILE

echo "⏳ Waiting for services to start..." | tee -a $LOG_FILE
sleep 10

echo "🧪 Testing health endpoint..." | tee -a $LOG_FILE
HEALTH_CHECK=$(curl -s http://localhost:8000/api/health/live || echo "failed")

if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ Deployment successful! Backend is healthy." | tee -a $LOG_FILE
else
    echo "⚠️  Warning: Health check failed. Check logs." | tee -a $LOG_FILE
    docker-compose -f docker-compose.minimal.yml logs --tail=20 2>&1 | tee -a $LOG_FILE
fi

echo "========================================" | tee -a $LOG_FILE
echo "Deployment completed at $(date)" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
