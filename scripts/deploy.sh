#!/bin/bash

# MegiLance Production Deployment Script
# Usage: ./deploy.sh

echo "🚀 Starting MegiLance Production Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Build Containers
echo "🏗️ Building containers (this may take a while)..."
docker compose -f docker-compose.prod.yml build

# 3. Start Services
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# 4. Prune unused images
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment Complete! Application is running."
echo "🌍 Frontend: http://localhost (or your domain)"
echo "🔌 API: http://localhost/api/docs"
