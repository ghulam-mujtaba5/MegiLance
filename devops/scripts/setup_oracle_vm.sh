#!/usr/bin/env bash
# Setup script to run on Oracle VM after provisioning (run as root or sudo)
# Installs Docker, docker-compose plugin, git, Node (for webhook), certbot (optional)
set -euo pipefail

# Update
apt-get update -y
apt-get upgrade -y

# Install basic tools
apt-get install -y git curl wget ca-certificates gnupg lsb-release

# Install Docker (official)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $SUDO_USER || true

# Install docker-compose plugin
DOCKER_CONFIG_DIR="/usr/libexec/docker/cli-plugins"
mkdir -p "$DOCKER_CONFIG_DIR"
COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-linux-x86_64"
curl -L "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose || true

# Install Node.js (for webhook listener)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install certbot (optional for HTTPS)
apt-get install -y snapd
snap install core; snap refresh core
snap install --classic certbot || true
ln -s /snap/bin/certbot /usr/bin/certbot || true

# Create deploy script location and webhook app dir
mkdir -p /opt/deploy
mkdir -p /opt/deploy/webhook

# Copy the repo's deploy scripts (user should git clone repo to desired location)
# The user should clone repository to /srv/megilance or desired path and configure systemd

echo "Bootstrap complete. Please clone your repo and configure systemd services for the webhook listener."
