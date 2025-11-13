#!/bin/bash
# @AI-HINT: DigitalOcean App Platform deployment for MegiLance Frontend
# Uses doctl CLI to deploy with Git-based continuous deployment

set -e

echo "🚀 MegiLance DigitalOcean Frontend Deployment"
echo "=============================================="

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Installing..."
    
    # Download and install doctl
    cd ~
    wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
    tar xf doctl-1.104.0-linux-amd64.tar.gz
    sudo mv doctl /usr/local/bin
    rm doctl-1.104.0-linux-amd64.tar.gz
    
    echo "✅ doctl installed"
    echo "📋 Please authenticate with: doctl auth init"
    echo "   Get your API token from: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

# Check authentication
if ! doctl account get &> /dev/null; then
    echo "❌ Not authenticated with DigitalOcean"
    echo "📋 Run: doctl auth init"
    exit 1
fi

echo "✅ Authenticated with DigitalOcean"

# Get the backend URL (Oracle VM IP)
if [ -f oracle-vm-details.json ]; then
    BACKEND_IP=$(jq -r '.public_ip' oracle-vm-details.json)
    BACKEND_URL="https://$BACKEND_IP"
    echo "✅ Backend URL: $BACKEND_URL"
else
    echo "⚠️  oracle-vm-details.json not found"
    read -p "Enter your Oracle VM public IP: " BACKEND_IP
    BACKEND_URL="https://$BACKEND_IP"
fi

# Create App Platform spec
cat > app-spec.yaml <<EOF
name: megilance-frontend
region: nyc
services:
  - name: frontend
    github:
      repo: ghulam-mujtaba5/MegiLance
      branch: main
      deploy_on_push: true
    source_dir: /frontend
    build_command: npm install && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    envs:
      - key: NODE_ENV
        value: production
        scope: RUN_AND_BUILD_TIME
      - key: NEXT_PUBLIC_API_URL
        value: $BACKEND_URL/api
        scope: RUN_AND_BUILD_TIME
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"
        scope: RUN_AND_BUILD_TIME
    health_check:
      http_path: /
      initial_delay_seconds: 60
      period_seconds: 30
      timeout_seconds: 10
      success_threshold: 1
      failure_threshold: 3
EOF

echo ""
echo "📋 App Platform Specification:"
cat app-spec.yaml

echo ""
echo "📋 Creating/Updating App Platform deployment..."

# Check if app already exists
APP_ID=$(doctl apps list --format ID,Name | grep megilance-frontend | awk '{print $1}' || echo "")

if [ -z "$APP_ID" ]; then
    echo "Creating new app..."
    APP_JSON=$(doctl apps create --spec app-spec.yaml --format ID,Name,LiveURL --no-header)
    APP_ID=$(echo $APP_JSON | awk '{print $1}')
    APP_URL=$(echo $APP_JSON | awk '{print $3}')
    echo "✅ App created: $APP_ID"
else
    echo "Updating existing app: $APP_ID"
    doctl apps update $APP_ID --spec app-spec.yaml
    APP_URL=$(doctl apps get $APP_ID --format LiveURL --no-header)
    echo "✅ App updated"
fi

# Save app details
cat > digitalocean-app-details.json <<EOF
{
  "app_id": "$APP_ID",
  "app_url": "$APP_URL",
  "backend_url": "$BACKEND_URL",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo ""
echo "✅ ================================================"
echo "✅ DigitalOcean Frontend Deployment Complete!"
echo "✅ ================================================"
echo ""
echo "📋 App Details:"
echo "  App ID: $APP_ID"
echo "  Live URL: $APP_URL"
echo "  Backend: $BACKEND_URL"
echo ""
echo "📋 The app will automatically deploy on every push to main branch"
echo ""
echo "📋 Monitor deployment:"
echo "  doctl apps list"
echo "  doctl apps get $APP_ID"
echo "  doctl apps logs $APP_ID"
echo ""
echo "📋 Manage app:"
echo "  View: https://cloud.digitalocean.com/apps/$APP_ID"
echo "  Update spec: doctl apps update $APP_ID --spec app-spec.yaml"
echo "  Delete: doctl apps delete $APP_ID"
echo ""
