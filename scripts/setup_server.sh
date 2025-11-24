#!/bin/bash

# MegiLance Server Setup Script (Ubuntu 22.04)
# Usage: sudo ./setup_server.sh

echo "🛠️ Setting up MegiLance Server..."

# 1. Update System
echo "🔄 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker..."
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Install Git
echo "📦 Installing Git..."
apt-get install -y git

# 4. Setup Firewall (UFW)
echo "🛡️ Configuring Firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Server Setup Complete! You can now clone the repo and run deploy.sh."
