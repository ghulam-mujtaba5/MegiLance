# 🚀 Manual Deployment - Final Steps

## Current Status
- ✅ VM running at **193.122.57.193**
- ✅ Wallet uploaded to `~/oracle-wallet-23ai/`
- ⏳ Docker + Git installing (yum process running, SSH locked)

## Wait 3-5 Minutes
Yum installation takes time on Oracle Linux. SSH will work again when yum finishes.

---

## Then Run This ONE Command:

```bash
ssh -i oracle-vm-ssh.key opc@193.122.57.193 "
  # Clone repo
  git clone https://github.com/ghulam-mujtaba5/MegiLance.git ~/MegiLance 2>/dev/null || (cd ~/MegiLance && git pull)
  
  # Setup directories
  mkdir -p ~/MegiLance/{backend,oracle-wallet-23ai}
  mv ~/oracle-wallet-23ai/* ~/MegiLance/oracle-wallet-23ai/ 2>/dev/null || true
  
  # Create env file
  cat > ~/MegiLance/backend/.env << 'EOF'
DATABASE_URL=oracle://admin:Admin123456@megilancedb_high?wallet_location=/app/oracle-wallet-23ai
SECRET_KEY=supersecretkey32charsminimumforjwt123
CORS_ORIGINS=http://localhost:3000,http://193.122.57.193
EOF
  
  # Start containers
  cd ~/MegiLance
  sudo docker compose -f docker-compose.minimal.yml up -d
  
  # Wait and test
  sleep 30
  curl http://localhost:8000/api/health/live
  echo 'Done!'
"
```

---

## OR Run Automated Script:

```powershell
.\DEPLOY-NOW-AUTO.ps1
```

This will:
1. Check Docker installation
2. Clone repository
3. Move wallet
4. Create environment file
5. Start containers
6. Test API health

---

## Verify Deployment:

```bash
# Check containers
ssh -i oracle-vm-ssh.key opc@193.122.57.193 "sudo docker ps"

# Test API
curl http://193.122.57.193:8000/api/health/live

# View logs
ssh -i oracle-vm-ssh.key opc@193.122.57.193 "cd ~/MegiLance && sudo docker compose -f docker-compose.minimal.yml logs backend"
```

---

## API Endpoints (Once Running):

- **Health:** http://193.122.57.193:8000/api/health/live
- **Docs:** http://193.122.57.193:8000/api/docs
- **ReDoc:** http://193.122.57.193:8000/api/redoc

---

## Troubleshooting:

### If SSH still times out:
```powershell
# Reboot VM
$env:OCI_CLI_AUTH="security_token"
oci compute instance action --instance-id ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxycd5usancnwqh3nygqpna3ck462qtirmjcc3ftpm5cvtnq --action RESET
```

### If containers fail:
```bash
ssh -i oracle-vm-ssh.key opc@193.122.57.193
cd ~/MegiLance
sudo docker compose -f docker-compose.minimal.yml logs
```

### Update database password:
```bash
ssh -i oracle-vm-ssh.key opc@193.122.57.193
cd ~/MegiLance/backend
nano .env  # Update DATABASE_URL password
cd ..
sudo docker compose -f docker-compose.minimal.yml restart
```

---

## 🎯 Next: Wait 3-5 minutes, then run `.\DEPLOY-NOW-AUTO.ps1`
