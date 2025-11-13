#!/bin/bash
# VM Setup and Deployment Script
# This script will be run on the Oracle VM to complete setup

set -e

echo "🚀 Starting MegiLance Backend Deployment..."
echo ""

# Check if cloud-init completed
if [ -f /home/ubuntu/init-complete.txt ]; then
    echo "✅ Cloud-init completed successfully"
    cat /home/ubuntu/init-complete.txt
else
    echo "⚠️  Cloud-init may still be running, continuing anyway..."
fi

echo ""
echo "📋 System Information:"
echo "-------------------"
uptime
free -h
df -h /
echo ""

# Verify Docker installation
echo "🐳 Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installed: $(docker --version)"
else
    echo "❌ Docker not found! Installing now..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm get-docker.sh
fi

# Verify Docker Compose
echo ""
echo "🔧 Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose installed: $(docker-compose --version)"
else
    echo "❌ Docker Compose not found! Installing now..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Verify Git
echo ""
echo "📦 Checking Git..."
if command -v git &> /dev/null; then
    echo "✅ Git installed: $(git --version)"
else
    echo "❌ Git not found! Installing now..."
    sudo apt-get update
    sudo apt-get install -y git
fi

# Create app directory
echo ""
echo "📁 Setting up application directory..."
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Clone repository
echo ""
echo "📥 Cloning MegiLance repository..."
if [ -d "/home/ubuntu/app/MegiLance" ]; then
    echo "⚠️  Repository already exists, pulling latest..."
    cd MegiLance
    git pull
else
    git clone https://github.com/ghulam-mujtaba5/MegiLance.git
    cd MegiLance
fi

echo ""
echo "✅ Repository cloned successfully!"
echo ""

# Create oracle wallet directory
echo "📂 Creating Oracle wallet directory..."
mkdir -p oracle-wallet-23ai

echo ""
echo "⚠️  NEXT STEPS REQUIRED:"
echo "======================="
echo ""
echo "1. Upload Oracle DB wallet to: /home/ubuntu/app/MegiLance/oracle-wallet-23ai/"
echo "   Use: scp -r ./oracle-wallet-23ai/* ubuntu@152.70.31.175:/home/ubuntu/app/MegiLance/oracle-wallet-23ai/"
echo ""
echo "2. Create backend/.env file with Oracle DB credentials"
echo ""
echo "3. Run: docker-compose -f docker-compose.minimal.yml up -d"
echo ""
echo "🎉 VM setup complete! Ready for deployment."
