#!/bin/bash
# @AI-HINT: Complete setup script for Oracle Cloud Always Free VM
# Provisions VM, installs Docker, sets up backend+AI services with auto-deployment

set -e

echo "🚀 MegiLance Oracle Cloud Always Free VM Setup"
echo "================================================"

# Configuration
COMPARTMENT_ID="ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
VM_SHAPE="VM.Standard.E2.1.Micro"  # Always Free eligible
VM_OCPUS=1
VM_MEMORY_GB=1
AVAILABILITY_DOMAIN="KYdC:US-ASHBURN-AD-1"
DISPLAY_NAME="megilance-backend-vm"
IMAGE_ID="ocid1.image.oc1.iad.aaaaaaaag2uyozo7266bmg26j5ixvi42jhaujso2pddpsigtib6vfnqy5f6q"  # Oracle Linux 8

echo ""
echo "📋 Step 1: Creating Oracle Cloud VM Instance..."
echo "  Shape: $VM_SHAPE (Always Free)"
echo "  Memory: ${VM_MEMORY_GB}GB"
echo "  Image: Oracle Linux 8"

# Create VM instance
VM_JSON=$(oci compute instance launch \
  --compartment-id "$COMPARTMENT_ID" \
  --availability-domain "$AVAILABILITY_DOMAIN" \
  --shape "$VM_SHAPE" \
  --shape-config '{"ocpus":1,"memoryInGBs":1}' \
  --image-id "$IMAGE_ID" \
  --display-name "$DISPLAY_NAME" \
  --subnet-id "$(oci network subnet list --compartment-id $COMPARTMENT_ID --limit 1 | jq -r '.data[0].id')" \
  --assign-public-ip true \
  --wait-for-state RUNNING \
  --wait-interval-seconds 10)

VM_OCID=$(echo $VM_JSON | jq -r '.data.id')
echo "✅ VM Created: $VM_OCID"

# Get public IP
echo ""
echo "📡 Getting VM Public IP..."
sleep 30  # Wait for networking to initialize

VNIC_ID=$(oci compute instance list-vnics --instance-id "$VM_OCID" | jq -r '.data[0].id')
PUBLIC_IP=$(oci network vnic get --vnic-id "$VNIC_ID" | jq -r '.data."public-ip"')

echo "✅ VM Public IP: $PUBLIC_IP"

# Save VM details
cat > oracle-vm-details.json <<EOF
{
  "vm_ocid": "$VM_OCID",
  "public_ip": "$PUBLIC_IP",
  "shape": "$VM_SHAPE",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo ""
echo "📋 Step 2: Configuring firewall rules..."

# Get network security group
NSG_ID=$(oci network nsg list --compartment-id "$COMPARTMENT_ID" --limit 1 | jq -r '.data[0].id')

# Add security rules for ports 80, 443, 8000, 8001
oci network nsg rules add --nsg-id "$NSG_ID" \
  --security-rules '[
    {
      "direction": "INGRESS",
      "protocol": "6",
      "source": "0.0.0.0/0",
      "tcpOptions": {"destinationPortRange": {"min": 80, "max": 80}},
      "isStateless": false
    },
    {
      "direction": "INGRESS",
      "protocol": "6",
      "source": "0.0.0.0/0",
      "tcpOptions": {"destinationPortRange": {"min": 443, "max": 443}},
      "isStateless": false
    },
    {
      "direction": "INGRESS",
      "protocol": "6",
      "source": "0.0.0.0/0",
      "tcpOptions": {"destinationPortRange": {"min": 8000, "max": 8000}},
      "isStateless": false
    },
    {
      "direction": "INGRESS",
      "protocol": "6",
      "source": "0.0.0.0/0",
      "tcpOptions": {"destinationPortRange": {"min": 8001, "max": 8001}},
      "isStateless": false
    }
  ]' 2>/dev/null || echo "⚠️  Rules may already exist"

echo "✅ Firewall configured"

echo ""
echo "📋 Step 3: Generating SSH keys and VM setup script..."

# Generate SSH key if not exists
if [ ! -f ~/.ssh/megilance_vm_rsa ]; then
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/megilance_vm_rsa -N "" -C "megilance-vm"
  echo "✅ SSH key generated: ~/.ssh/megilance_vm_rsa"
else
  echo "✅ Using existing SSH key"
fi

# Create remote setup script
cat > vm-remote-setup.sh <<'REMOTE_SCRIPT'
#!/bin/bash
# @AI-HINT: This script runs on the Oracle VM to set up Docker and deployment automation

set -e

echo "🔧 Setting up MegiLance Backend VM..."

# Update system
sudo yum update -y

# Install Docker
echo "📦 Installing Docker..."
sudo yum install -y docker-engine docker-cli
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📦 Installing Git..."
sudo yum install -y git

# Install Node.js (for webhook server)
echo "📦 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Create app directory
sudo mkdir -p /opt/megilance
sudo chown $USER:$USER /opt/megilance
cd /opt/megilance

# Clone repository
echo "📥 Cloning MegiLance repository..."
git clone https://github.com/ghulam-mujtaba5/MegiLance.git .

# Create deployment directories
mkdir -p oracle-wallet-23ai
mkdir -p logs

# Install webhook listener (simple Node.js server)
cat > webhook-server.js <<'WEBHOOK_EOF'
const http = require('http');
const { execSync } = require('child_process');
const crypto = require('crypto');

const PORT = 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'megilance-webhook-secret';

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];
      
      if (!signature || !verifySignature(body, signature)) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      console.log(`[${new Date().toISOString()}] Webhook received - deploying...`);
      
      try {
        execSync('bash /opt/megilance/auto-deploy.sh', { stdio: 'inherit' });
        res.writeHead(200);
        res.end('Deployment triggered');
      } catch (error) {
        console.error('Deployment failed:', error);
        res.writeHead(500);
        res.end('Deployment failed');
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
WEBHOOK_EOF

# Create auto-deployment script
cat > auto-deploy.sh <<'DEPLOY_EOF'
#!/bin/bash
# @AI-HINT: Auto-deployment script triggered by Git webhooks

set -e

cd /opt/megilance

echo "[$(date)] 🔄 Starting auto-deployment..."

# Pull latest changes
git fetch origin main
git reset --hard origin/main

# Stop running containers
docker-compose -f docker-compose.oracle.yml down || true

# Rebuild and start backend + AI services
docker-compose -f docker-compose.oracle.yml up -d --build backend ai

# Check health
sleep 10
curl -f http://localhost:8000/api/health/live || exit 1

echo "[$(date)] ✅ Deployment complete!"
DEPLOY_EOF

chmod +x auto-deploy.sh

# Create systemd service for webhook server
sudo tee /etc/systemd/system/megilance-webhook.service > /dev/null <<'SERVICE_EOF'
[Unit]
Description=MegiLance Webhook Server
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/megilance
Environment="WEBHOOK_SECRET=megilance-webhook-secret"
ExecStart=/usr/bin/node /opt/megilance/webhook-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo systemctl daemon-reload
sudo systemctl enable megilance-webhook
sudo systemctl start megilance-webhook

echo "✅ VM setup complete!"
echo "📋 Next steps:"
echo "  1. Upload Oracle wallet to /opt/megilance/oracle-wallet-23ai/"
echo "  2. Configure environment variables in /opt/megilance/backend/.env"
echo "  3. Run initial deployment: cd /opt/megilance && ./auto-deploy.sh"

REMOTE_SCRIPT

echo "✅ Remote setup script created"

echo ""
echo "📋 Step 4: Waiting for VM to be fully ready..."
sleep 60

echo ""
echo "📋 Step 5: Connecting to VM and running setup..."
echo "  SSH: ssh -i ~/.ssh/megilance_vm_rsa opc@$PUBLIC_IP"

# Copy setup script to VM
scp -i ~/.ssh/megilance_vm_rsa -o StrictHostKeyChecking=no vm-remote-setup.sh opc@$PUBLIC_IP:/tmp/

# Execute setup on VM
ssh -i ~/.ssh/megilance_vm_rsa -o StrictHostKeyChecking=no opc@$PUBLIC_IP "bash /tmp/vm-remote-setup.sh"

echo ""
echo "✅ ================================================"
echo "✅ Oracle VM Setup Complete!"
echo "✅ ================================================"
echo ""
echo "📋 VM Details:"
echo "  Public IP: $PUBLIC_IP"
echo "  SSH: ssh -i ~/.ssh/megilance_vm_rsa opc@$PUBLIC_IP"
echo "  Backend API: http://$PUBLIC_IP:8000"
echo "  AI Service: http://$PUBLIC_IP:8001"
echo "  Webhook: http://$PUBLIC_IP:9000/webhook"
echo ""
echo "📋 Next Steps:"
echo "  1. Upload Oracle wallet:"
echo "     scp -i ~/.ssh/megilance_vm_rsa -r ./oracle-wallet-23ai/* opc@$PUBLIC_IP:/opt/megilance/oracle-wallet-23ai/"
echo ""
echo "  2. Set up GitHub webhook:"
echo "     URL: http://$PUBLIC_IP:9000/webhook"
echo "     Secret: megilance-webhook-secret"
echo "     Events: push (main branch)"
echo ""
echo "  3. Test deployment:"
echo "     ssh -i ~/.ssh/megilance_vm_rsa opc@$PUBLIC_IP"
echo "     cd /opt/megilance && ./auto-deploy.sh"
echo ""
