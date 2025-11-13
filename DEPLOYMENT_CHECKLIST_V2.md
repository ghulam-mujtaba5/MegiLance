# ✅ Complete Deployment Checklist v2

## Pre-Deployment Setup ✓

### Oracle Cloud
- [x] Account created (Always Free Tier)
- [x] OCI CLI installed & configured
- [ ] Oracle Autonomous Database 23ai created
- [ ] Database wallet downloaded to `./oracle-wallet-23ai/`

### DigitalOcean
- [ ] Account with GitHub Student Pack
- [ ] doctl CLI ready (or install during deployment)
- [ ] API token ready

### GitHub
- [x] Repository: `ghulam-mujtaba5/MegiLance`
- [x] Code pushed to main branch

---

## Quick Deployment (Recommended)

### Option A: Automated (10 minutes)
```powershell
.\deploy-complete-pipeline.ps1
```

**This handles everything automatically!**

---

## Manual Deployment (If needed)

### Phase 1: Oracle VM (5 min)
1. [ ] Run `.\deploy-oracle-vm-complete.ps1`
2. [ ] SSH to VM: `ssh -i ~/.ssh/megilance_vm_rsa opc@<VM_IP>`
3. [ ] Install Docker, Git, Node.js (script provided)
4. [ ] Clone repo to `/opt/megilance`
5. [ ] Upload wallet: `scp -r ./oracle-wallet-23ai/* opc@<VM_IP>:/opt/megilance/oracle-wallet-23ai/`
6. [ ] Configure `/opt/megilance/backend/.env`
7. [ ] Deploy: `docker-compose -f docker-compose.oracle.yml up -d --build`

### Phase 2: DigitalOcean Frontend (3 min)
1. [ ] Run `.\deploy-digitalocean-complete.ps1`
2. [ ] Note frontend URL from output
3. [ ] Update backend CORS with frontend URL

### Phase 3: Auto-Deploy Setup (2 min)
1. [ ] Start webhook on VM: `sudo systemctl start megilance-webhook`
2. [ ] Add GitHub webhook: `http://<VM_IP>:9000/webhook`
3. [ ] Test with git push

---

## Verification Checklist

### Backend
- [ ] Health endpoint: `curl https://<VM_IP>:8000/api/health/live`
- [ ] API docs: `https://<VM_IP>:8000/api/docs`
- [ ] AI service: `curl http://<VM_IP>:8001/health`

### Frontend
- [ ] App loads at DigitalOcean URL
- [ ] Can connect to backend
- [ ] No CORS errors

### Auto-Deploy
- [ ] Webhook responds: `curl http://<VM_IP>:9000/health`
- [ ] Git push triggers deployment
- [ ] Both frontend & backend update

---

## Post-Deployment

### Optional Enhancements
- [ ] SSL/HTTPS with Let's Encrypt
- [ ] Custom domain configuration
- [ ] Monitoring & alerts
- [ ] Database backups

---

**Quick Reference**: See `QUICK_DEPLOY_REFERENCE.md`  
**Full Guide**: See `COMPLETE_DEPLOYMENT_GUIDE_V2.md`  
**Troubleshooting**: See `DEPLOYMENT_README.md`

---

**Status**: ⬜ Not Started / 🔄 In Progress / ✅ Complete  
**Date**: ________________  
**Deployed By**: ________________
