# MegiLance Deployment - README

## 🎯 What You Get

**100% Free Production Deployment** with continuous deployment from Git!

### Infrastructure
- ✅ **Oracle Cloud Always Free VM** - Backend + AI services
- ✅ **Oracle Autonomous Database 23ai** - Production database
- ✅ **DigitalOcean App Platform** - Next.js frontend (Student Pack)
- ✅ **Git-based CI/CD** - Auto-deploy on every push

### Features
- 🚀 **Zero-downtime deployments** - Docker-based
- 🔄 **Auto-scaling** - Built into DigitalOcean
- 🔒 **SSL/TLS ready** - HTTPS support
- 📊 **Health monitoring** - Container health checks
- 📝 **Logging** - Centralized logs for all services

## 🏁 Quick Start

### Prerequisites
```powershell
# Check you have these installed:
oci --version          # Oracle Cloud CLI
git --version          # Git
ssh -V                 # SSH
doctl version          # DigitalOcean CLI (optional, will guide installation)
```

### Deploy Everything (10 minutes)

```powershell
# Windows PowerShell
.\deploy-complete-pipeline.ps1
```

```bash
# Linux/Mac
bash deploy-oracle-vm-setup.sh
bash deploy-digitalocean-frontend.sh
```

**That's it!** The scripts handle:
1. Creating Oracle VM
2. Configuring networking
3. Deploying backend + AI
4. Deploying frontend to DigitalOcean
5. Setting up auto-deployment

## 📁 Key Files

| File | Purpose |
|------|---------|
| `deploy-complete-pipeline.ps1` | **Main deployment script** - Run this! |
| `deploy-oracle-vm-complete.ps1` | Oracle VM setup only |
| `deploy-digitalocean-complete.ps1` | Frontend deployment only |
| `docker-compose.oracle.yml` | Backend + AI service config |
| `COMPLETE_DEPLOYMENT_GUIDE_V2.md` | **Full documentation** |
| `QUICK_DEPLOY_REFERENCE.md` | Quick command reference |

## 🔧 Configuration

### Environment Variables (Backend)

Located at `/opt/megilance/backend/.env` on VM:

```env
# Database
DATABASE_URL=oracle+oracledb://ADMIN:password@megilanceai_high?wallet_location=/app/oracle-wallet

# Security
SECRET_KEY=your-secret-key-32-chars-min
JWT_SECRET_KEY=your-jwt-secret-32-chars-min

# CORS (update after frontend deployment)
ALLOWED_ORIGINS=https://your-app.ondigitalocean.app
```

### DigitalOcean App Spec

Located at `app-spec.yaml`:
- Auto-generated during deployment
- Connects to GitHub repository
- Auto-deploys on push to main branch

## 🚀 Deployment Workflow

```mermaid
graph LR
    A[Developer] -->|git push| B[GitHub]
    B -->|Webhook| C[Oracle VM]
    B -->|Auto-deploy| D[DigitalOcean]
    C -->|Docker| E[Backend + AI]
    E -->|Connects| F[Oracle DB]
    D -->|Serves| G[Frontend]
    G -->|API Calls| E
```

### What Happens on Git Push:

1. **Frontend (DigitalOcean)**
   - Detects push to main branch
   - Rebuilds Next.js app
   - Deploys to CDN
   - ⏱️ ~5-7 minutes

2. **Backend (Oracle VM)**
   - GitHub webhook triggers VM
   - Pulls latest code
   - Rebuilds Docker containers
   - Restarts services
   - ⏱️ ~2-3 minutes

## 📊 Monitoring

### Check Service Status

```bash
# SSH to VM
ssh -i ~/.ssh/megilance_vm_rsa opc@<VM_IP>

# View all services
docker-compose -f /opt/megilance/docker-compose.oracle.yml ps

# View logs
docker-compose -f /opt/megilance/docker-compose.oracle.yml logs -f

# Check health
curl http://localhost:8000/api/health/live
```

### Frontend Monitoring

```bash
# Get app status
doctl apps get <APP_ID>

# View logs
doctl apps logs <APP_ID> --follow

# List deployments
doctl apps list-deployments <APP_ID>
```

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker exec megilance-backend python -c "from app.core.database import test_connection; test_connection()"

# Restart
docker-compose restart backend
```

### Frontend can't reach backend
1. Check CORS settings in backend `.env`
2. Verify backend is accessible: `curl https://<VM_IP>:8000/api/health/live`
3. Check firewall rules on Oracle VM

### Webhook not triggering
```bash
# Check webhook service
sudo systemctl status megilance-webhook

# View webhook logs
journalctl -u megilance-webhook -f

# Test manually
curl -X POST http://<VM_IP>:9000/health
```

## 💰 Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Oracle VM (1 OCPU, 1GB RAM) | Always Free | $0 |
| Oracle Autonomous DB (20GB) | Always Free | $0 |
| Oracle Storage (100GB) | Always Free | $0 |
| Oracle Network (10TB/month) | Always Free | $0 |
| DigitalOcean App Platform | Student Pack | $0 |
| **Total** | | **$0/month** 🎉 |

## 📚 Documentation

- **Full Deployment Guide**: `COMPLETE_DEPLOYMENT_GUIDE_V2.md`
- **Quick Reference**: `QUICK_DEPLOY_REFERENCE.md`
- **Architecture**: `ARCHITECTURE_DIAGRAMS.md`
- **Backend API**: `BACKEND_COMPLETE_DOCUMENTATION.md`

## 🎓 Learning Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [DigitalOcean Student Pack](https://www.digitalocean.com/github-students)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🆘 Support

- 📖 **Docs**: See `COMPLETE_DEPLOYMENT_GUIDE_V2.md`
- 🐛 **Issues**: https://github.com/ghulam-mujtaba5/MegiLance/issues
- 💬 **Discussions**: GitHub Discussions

## 🎯 Next Steps After Deployment

1. ✅ **Custom Domain** - Configure on DigitalOcean
2. ✅ **SSL Certificate** - Let's Encrypt on Oracle VM
3. ✅ **Monitoring** - Set up health check alerts
4. ✅ **Backups** - Configure database backups
5. ✅ **Scaling** - Add more workers if needed

---

**Version**: 2.0  
**Last Updated**: 2025-01-14  
**Status**: ✅ Production Ready
