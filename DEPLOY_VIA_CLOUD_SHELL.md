# Deploy MegiLance Backend - Using Oracle Cloud Shell

## 🎯 Quick Deployment Guide (Use Oracle Cloud Shell)

Since SSH from your local machine isn't working yet, use Oracle's built-in Cloud Shell.

---

## Step 1: Open Oracle Cloud Shell

1. Go to **Oracle Cloud Console**: https://cloud.oracle.com
2. Click the **Cloud Shell icon** (>_) in the top right corner
3. Wait for Cloud Shell to initialize (15-30 seconds)

---

## Step 2: Connect to Your VM

In the Cloud Shell terminal, paste this command:

```bash
ssh ubuntu@152.70.31.175
```

**First time**: Type `yes` when asked about fingerprint

You should see: `ubuntu@megilance-backend-vm:~$`

---

## Step 3: Check Cloud-Init Status

Run these commands to verify Docker is installed:

```bash
# Check if cloud-init completed
cat /home/ubuntu/init-complete.txt

# Check Docker
docker --version

# Check Docker Compose
docker-compose --version

# Check Git
git --version

# Check system resources
free -h
df -h
```

**Expected Output**:
- ✅ "VM initialization complete!"
- ✅ Docker version 27.x
- ✅ docker-compose version 2.x
- ✅ git version 2.x

---

## Step 4: Clone Repository

```bash
# Create app directory
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Clone MegiLance
git clone https://github.com/ghulam-mujtaba5/MegiLance.git
cd MegiLance

# Verify files
ls -la
```

---

## Step 5: Create Oracle Wallet Directory

```bash
# Create wallet directory
mkdir -p oracle-wallet-23ai

# Check it exists
ls -la | grep oracle-wallet
```

---

## Step 6: Upload Oracle DB Wallet (From Your Local Machine)

**Switch back to your local PowerShell** and run:

```powershell
# Upload wallet files to VM
scp -r .\oracle-wallet-23ai\* ubuntu@152.70.31.175:/home/ubuntu/app/MegiLance/oracle-wallet-23ai/
```

**OR** if that doesn't work, upload via Oracle Console:
1. Go to VM instance page
2. Click "Resources" → "Attached Block Volumes"
3. Use File Transfer or upload to Object Storage and download from VM

**OR** use Cloud Shell:
1. In Oracle Cloud Console, click Cloud Shell
2. Click the ⚙️ icon → "Upload"
3. Upload your wallet files
4. Then in Cloud Shell: `mv wallet-files/* /home/ubuntu/app/MegiLance/oracle-wallet-23ai/`

---

## Step 7: Configure Environment Variables

**In Cloud Shell** (connected to VM):

```bash
cd /home/ubuntu/app/MegiLance

# Create backend .env file
cat > backend/.env << 'EOF'
# Oracle Database Configuration
DATABASE_URL=oracle+oracledb://ADMIN:YOUR_DB_PASSWORD@megilanceai_high
WALLET_LOCATION=/app/oracle-wallet

# Backend Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://152.70.31.175

# Environment
ENVIRONMENT=production
EOF

# Edit the file to add your actual database password
nano backend/.env
```

**Press:**
- Change `YOUR_DB_PASSWORD` to your actual Oracle DB password
- `Ctrl + X` to exit
- `Y` to save
- `Enter` to confirm

---

## Step 8: Deploy Backend with Docker

```bash
cd /home/ubuntu/app/MegiLance

# Start backend in detached mode
docker-compose -f docker-compose.minimal.yml up -d

# Wait 30 seconds for containers to start
sleep 30

# Check running containers
docker ps

# Check logs
docker-compose -f docker-compose.minimal.yml logs --tail=50
```

**Expected Output**:
- ✅ Container `megilance-backend` running
- ✅ Logs show "Application startup complete"
- ✅ Database connection successful

---

## Step 9: Test Backend API

```bash
# Test health endpoint (from VM)
curl http://localhost:8000/api/health/live

# Expected: {"status":"healthy"}

# Test from public IP (from VM)
curl http://152.70.31.175:8000/api/health/live

# Test database connection
curl http://localhost:8000/api/health/ready
```

---

## Step 10: Test from Your Local Machine

**Switch to your local PowerShell**:

```powershell
# Test public access
curl http://152.70.31.175:8000/api/health/live

# Should return: {"status":"healthy"}
```

---

## Step 11: Setup Git Webhook (Optional - For Auto-Deploy)

**In Cloud Shell** (on VM):

```bash
cd /home/ubuntu/app/MegiLance

# Create webhook script
cat > deploy-webhook.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/app/MegiLance
git pull origin main
docker-compose -f docker-compose.minimal.yml up -d --build
echo "$(date): Deployed latest version" >> deploy.log
EOF

chmod +x deploy-webhook.sh

# Create webhook listener (simple HTTP server)
cat > webhook-server.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/deploy':
            subprocess.run(['/home/ubuntu/app/MegiLance/deploy-webhook.sh'])
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'Deployment triggered')
        else:
            self.send_response(404)
            self.end_headers()

httpd = HTTPServer(('0.0.0.0', 9000), WebhookHandler)
print("Webhook server running on port 9000")
httpd.serve_forever()
EOF

# Run webhook server in background
nohup python3 webhook-server.py > webhook.log 2>&1 &
```

**Then in GitHub**:
1. Go to your repository settings
2. Webhooks → Add webhook
3. Payload URL: `http://152.70.31.175:9000/deploy`
4. Content type: application/json
5. Events: Just the push event
6. Save

Now every push to `main` branch will auto-deploy! 🚀

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] VM is accessible via SSH from Cloud Shell
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to `/home/ubuntu/app/MegiLance`
- [ ] Oracle wallet uploaded to `oracle-wallet-23ai/`
- [ ] Backend `.env` file created with DB credentials
- [ ] Docker containers running (`docker ps` shows backend)
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] API accessible from public IP
- [ ] Webhook configured for auto-deployment (optional)

---

## 🆘 Troubleshooting

### Issue: "Permission denied (publickey)"
**Solution**: Make sure you're connecting from Oracle Cloud Shell, not your local machine

### Issue: "Docker: command not found"
**Solution**: Cloud-init may still be running. Wait 5 minutes and try again, or install manually:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```
Then log out and log back in.

### Issue: "Database connection failed"
**Solution**: 
- Verify wallet files are in `/home/ubuntu/app/MegiLance/oracle-wallet-23ai/`
- Check `backend/.env` has correct password
- Verify wallet has `tnsnames.ora` and `sqlnet.ora`

### Issue: "Container exited immediately"
**Solution**: Check logs:
```bash
docker-compose -f docker-compose.minimal.yml logs
```

---

## 🎉 Success!

Once everything is running, your backend will be accessible at:
- **Public API**: http://152.70.31.175:8000
- **Health Check**: http://152.70.31.175:8000/api/health/live
- **API Docs**: http://152.70.31.175:8000/api/docs

---

**Next**: Deploy frontend to DigitalOcean and connect it to this backend! 🚀
