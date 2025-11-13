# MegiLance VM Deployment - Quick Reference

## 🚀 VM Information
```
Public IP:     152.70.31.175
Private IP:    10.0.0.126
Instance OCID: ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxyckx6ugr65ol6ljyglybtoc2w2kyf3fkqbezouq6l4yzmq
Region:        eu-frankfurt-1
VCN:           megilance-vcn
SSH Key:       oracle-vm-ssh.key
```

## 📦 What's Ready
- ✅ Oracle DB wallet (oracle-wallet-23ai/)
- ✅ Production environment file (backend/.env.production)
- ✅ Docker Compose configuration (docker-compose.minimal.yml)
- ✅ Git webhook script (deploy-webhook.sh)
- ✅ SSH keys stored in project (oracle-vm-ssh.key)

## 🔌 Connect to VM
```powershell
# From local machine
ssh -i oracle-vm-ssh.key ubuntu@152.70.31.175

# Or use Oracle Cloud Shell
# 1. Open Oracle Console
# 2. Click Cloud Shell icon (>_)
# 3. Run: ssh ubuntu@152.70.31.175
```

## 📤 Upload Files to VM
```powershell
# Upload Oracle wallet
scp -i oracle-vm-ssh.key -r oracle-wallet-23ai/* ubuntu@152.70.31.175:/home/ubuntu/app/MegiLance/oracle-wallet-23ai/

# Upload production env file
scp -i oracle-vm-ssh.key backend/.env.production ubuntu@152.70.31.175:/home/ubuntu/app/MegiLance/backend/.env

# Upload webhook script
scp -i oracle-vm-ssh.key deploy-webhook.sh ubuntu@152.70.31.175:/home/ubuntu/app/MegiLance/
```

## 🚀 Deploy Backend (Run on VM)
```bash
# SSH into VM first
ssh -i oracle-vm-ssh.key ubuntu@152.70.31.175

# Navigate to project
cd /home/ubuntu/app/MegiLance

# Deploy with Docker
docker-compose -f docker-compose.minimal.yml up -d

# Check status
docker ps
docker-compose -f docker-compose.minimal.yml logs -f
```

## 🧪 Test Backend
```bash
# From VM
curl http://localhost:8000/api/health/live

# From local machine
curl http://152.70.31.175:8000/api/health/live
```

## 🔗 Setup Git Webhook
1. Make webhook script executable:
   ```bash
   chmod +x /home/ubuntu/app/MegiLance/deploy-webhook.sh
   ```

2. Add to GitHub:
   - Go to: https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks
   - Add webhook
   - Payload URL: `http://152.70.31.175:9000/deploy`
   - Content type: `application/json`
   - Events: `Just the push event`

3. Run webhook listener on VM:
   ```bash
   nohup python3 -m http.server 9000 &
   ```

## 🔄 Manual Deployment
```bash
cd /home/ubuntu/app/MegiLance
git pull origin main
docker-compose -f docker-compose.minimal.yml up -d --build
```

## 📊 Useful Commands
```bash
# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.minimal.yml logs -f

# Restart backend
docker-compose -f docker-compose.minimal.yml restart

# Stop all
docker-compose -f docker-compose.minimal.yml down

# Rebuild
docker-compose -f docker-compose.minimal.yml up -d --build

# Check system resources
free -h
df -h
docker stats --no-stream
```

## 🌐 Access Points
- **API**: http://152.70.31.175:8000
- **Health Check**: http://152.70.31.175:8000/api/health/live
- **API Docs**: http://152.70.31.175:8000/api/docs
- **ReDoc**: http://152.70.31.175:8000/api/redoc

## ⚡ Automated Deployment Script
Run this from your local machine:
```powershell
.\auto-deploy-to-vm.ps1
```

This script will:
- ✅ Wait for VM to be ready
- ✅ Upload all files
- ✅ Deploy backend automatically
- ✅ Setup webhook
- ✅ Test everything

## 🆘 Troubleshooting
```bash
# Check if Docker is running
systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check cloud-init status
cat /home/ubuntu/init-complete.txt

# View cloud-init logs
sudo cat /var/log/cloud-init-output.log

# Check disk space
df -h

# Check memory
free -h

# Check network
curl -I http://google.com
```

## 📝 Next Steps
1. Wait for cloud-init to complete (~5-10 minutes from VM creation)
2. Run automated deployment script or follow manual steps
3. Verify backend is running and accessible
4. Deploy frontend to DigitalOcean
5. Connect frontend to backend API
