# 🚀 START HERE - MegiLance Deployment

## ⚡ Quick Deploy (One Command)

### Windows (PowerShell)
```powershell
.\deploy-complete-pipeline.ps1
```

### Linux/Mac (Bash)
```bash
bash deploy-oracle-vm-setup.sh
bash deploy-digitalocean-frontend.sh
```

**That's it!** ☝️ Run the command above and follow the prompts.

---

## ✅ What You Need

Before running the deployment:

1. **Oracle Cloud Account** (Always Free tier)
   - ✅ You already have OCI CLI configured
   - ✅ You have Autonomous Database 23ai created
   - ⚠️ Make sure wallet is in `./oracle-wallet-23ai/` folder

2. **DigitalOcean Account** (GitHub Student Pack)
   - Get doctl: https://github.com/digitalocean/doctl/releases
   - Or the script will guide you to install it

3. **GitHub Repository**
   - ✅ Already configured: `ghulam-mujtaba5/MegiLance`

---

## 🎯 What Happens

The deployment script will:

1. **Create Oracle VM** (~2 min)
   - Provision VM.Standard.E2.1.Micro (Always Free)
   - Assign public IP
   - Configure firewall

2. **Guide VM Setup** (~5 min)
   - SSH instructions
   - Install Docker, Git, Node.js
   - Clone repository
   - Deploy backend + AI services

3. **Deploy Frontend** (~3 min)
   - Create DigitalOcean app
   - Configure auto-deployment
   - Connect to backend

4. **Setup Auto-Deploy** (~2 min)
   - Configure webhook server
   - GitHub webhook instructions

**Total Time: ~10-15 minutes**

---

## 📋 After Deployment

You'll get:

```
Frontend:  https://megilance-xxxxx.ondigitalocean.app
Backend:   https://<VM_IP>:8000
API Docs:  https://<VM_IP>:8000/api/docs
Webhook:   http://<VM_IP>:9000/webhook
```

### Test Auto-Deployment
```bash
echo "# Test" >> README.md
git add .
git commit -m "Test auto-deploy"
git push origin main
```

Both frontend and backend will auto-deploy! 🎉

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **DEPLOYMENT_README.md** | Overview & getting started |
| **COMPLETE_DEPLOYMENT_GUIDE_V2.md** | Full step-by-step guide |
| **QUICK_DEPLOY_REFERENCE.md** | Command cheat sheet |
| **DEPLOYMENT_SYSTEM_SUMMARY.md** | What was built & why |

---

## 🆘 Troubleshooting

### VM creation fails
- Check OCI CLI: `oci iam region list`
- Verify compartment access
- Ensure Always Free tier is available

### Frontend deploy fails
- Install doctl: https://github.com/digitalocean/doctl/releases
- Authenticate: `doctl auth init`
- Check repo access on GitHub

### Services won't start
- Check logs: `docker-compose logs`
- Verify wallet uploaded to VM
- Check environment variables

**Full troubleshooting**: See `COMPLETE_DEPLOYMENT_GUIDE_V2.md`

---

## 💰 Cost

**$0/month** - Everything runs on free tiers:
- Oracle Cloud: Always Free tier
- DigitalOcean: Student Pack credits
- GitHub: Free tier

---

## 🎉 Ready?

### Run this now:

```powershell
.\deploy-complete-pipeline.ps1
```

**The script will guide you through everything!**

---

**Questions?** Check `DEPLOYMENT_README.md`  
**Need help?** See troubleshooting in `COMPLETE_DEPLOYMENT_GUIDE_V2.md`
