# 🎯 Oracle Migration Checklist - Complete Guide

## ✅ Migration Status Tracker

### Phase 1: Oracle Account Setup
- [ ] Remove old OCI profile (ghulammujtaba)
- [ ] Configure OCI CLI with new account (muhammad salman)
- [ ] Authenticate: `oci session authenticate --profile DEFAULT --region us-ashburn-1`
- [ ] Verify login: `oci iam region list`

### Phase 2: Oracle Infrastructure Setup
- [ ] Run setup script: `.\oracle-setup.ps1`
- [ ] Create Autonomous Database (Always Free)
- [ ] Download database wallet to `./oracle-wallet/`
- [ ] Create Object Storage buckets:
  - [ ] megilance-uploads
  - [ ] megilance-assets
  - [ ] megilance-logs
- [ ] Create VCN and subnet
- [ ] Create 2x Compute VMs (Always Free):
  - [ ] Backend VM
  - [ ] AI Service VM
- [ ] Configure security lists (ports 80, 443, 8000, 8001)
- [ ] Verify `oracle-config.json` created

### Phase 3: Backend Code Migration
- [ ] Install Oracle dependencies:
  ```powershell
  cd backend
  pip install oci cx_Oracle oracledb
  ```
- [ ] Copy wallet files:
  ```powershell
  Copy-Item -Recurse .\oracle-wallet .\backend\oracle-wallet
  ```
- [ ] Update `.env` file with OCI configuration:
  ```env
  OCI_REGION=us-ashburn-1
  OCI_NAMESPACE=<from oracle-config.json>
  OCI_BUCKET_UPLOADS=megilance-uploads
  OCI_BUCKET_ASSETS=megilance-assets
  DATABASE_URL=oracle+cx_oracle://admin:YourPassword@...
  ```
- [ ] Test OCI storage locally:
  ```powershell
  python -c "from app.core.oci_storage import oci_storage_client; print('✓ OCI Storage OK')"
  ```
- [ ] Test database connection:
  ```powershell
  python -c "from app.db.session import engine; engine.connect(); print('✓ DB OK')"
  ```

### Phase 4: Database Migration
- [ ] Export data from PostgreSQL:
  ```powershell
  docker exec megilance-db pg_dump -U megilance megilance_db > backup.sql
  ```
- [ ] Convert SQL for Oracle (if using Oracle native):
  - [ ] Replace `SERIAL` with `NUMBER` + sequence
  - [ ] Replace `TEXT` with `CLOB`
  - [ ] Replace `BOOLEAN` with `NUMBER(1)`
  - [ ] Replace `NOW()` with `SYSDATE`
- [ ] OR use PostgreSQL-compatible mode (easier):
  ```env
  DATABASE_URL=postgresql+psycopg2://admin:Pass@adb.oracle:5432/db
  ```
- [ ] Run Alembic migrations:
  ```powershell
  cd backend
  alembic upgrade head
  ```
- [ ] Verify tables created:
  ```powershell
  python -c "from app.db.base import Base; from app.db.session import engine; print(engine.table_names())"
  ```
- [ ] Import data (if needed):
  ```powershell
  # Use Oracle SQL Developer or sqlplus
  sqlplus admin/Pass@megilancedb_high @backup.sql
  ```

### Phase 5: Deploy Backend to Oracle VM
- [ ] Get Backend VM IP from Oracle Console
- [ ] Add VM IP to known_hosts:
  ```powershell
  ssh -i ~/.ssh/id_rsa ubuntu@<VM-IP> "echo Connected"
  ```
- [ ] Deploy backend:
  ```powershell
  .\deploy-to-oracle.ps1 backend -VmIpBackend <VM-IP>
  ```
- [ ] Verify backend running:
  ```powershell
  curl http://<VM-IP>/api/health/live
  ```
- [ ] Check logs:
  ```powershell
  ssh -i ~/.ssh/id_rsa ubuntu@<VM-IP> "sudo journalctl -u backend -f"
  ```
- [ ] Configure firewall rules:
  - [ ] Allow ingress: 80 (HTTP)
  - [ ] Allow ingress: 443 (HTTPS)
  - [ ] Allow ingress: 8000 (backend, optional)

### Phase 6: Deploy AI Service to Oracle VM
- [ ] Get AI Service VM IP from Oracle Console
- [ ] Deploy AI service:
  ```powershell
  .\deploy-to-oracle.ps1 ai -VmIpAi <VM-IP>
  ```
- [ ] Verify AI service running:
  ```powershell
  curl http://<VM-IP>:8001/health
  ```
- [ ] Update backend `.env` with AI service URL:
  ```env
  AI_SERVICE_URL=http://<AI-VM-PRIVATE-IP>:8001
  ```
- [ ] Restart backend service:
  ```powershell
  ssh -i ~/.ssh/id_rsa ubuntu@<BACKEND-VM-IP> "sudo systemctl restart backend"
  ```

### Phase 7: Frontend Deployment (Digital Ocean)
- [ ] Install `doctl` CLI:
  ```powershell
  winget install DigitalOcean.doctl
  ```
- [ ] Authenticate with Digital Ocean:
  ```powershell
  doctl auth init
  ```
- [ ] Update `.digitalocean/app.yaml` with backend URL
- [ ] Create app:
  ```powershell
  doctl apps create --spec .digitalocean\app.yaml
  ```
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Get frontend URL:
  ```powershell
  doctl apps list
  ```
- [ ] Verify frontend loads:
  ```powershell
  curl https://<your-app>.ondigitalocean.app
  ```

### Phase 8: DNS & SSL Configuration
- [ ] Point domain to Oracle backend VM IP:
  ```
  api.megilance.com → A record → <Backend-VM-IP>
  ```
- [ ] Point domain to Digital Ocean frontend:
  ```
  www.megilance.com → CNAME → <do-app>.ondigitalocean.app
  megilance.com → CNAME → <do-app>.ondigitalocean.app
  ```
- [ ] Install SSL on backend VM:
  ```powershell
  ssh -i ~/.ssh/id_rsa ubuntu@<Backend-VM-IP>
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d api.megilance.com
  ```
- [ ] Configure auto-renewal:
  ```bash
  sudo systemctl enable certbot.timer
  ```
- [ ] Update frontend env with HTTPS backend URL:
  ```env
  NEXT_PUBLIC_API_URL=https://api.megilance.com
  ```

### Phase 9: Testing & Validation
- [ ] Test user registration
- [ ] Test user login
- [ ] Test file upload (profile image)
- [ ] Test portfolio image upload
- [ ] Test project creation
- [ ] Test proposal submission
- [ ] Test AI features (if applicable)
- [ ] Test email notifications (SendGrid)
- [ ] Load test (optional):
  ```powershell
  # Install Apache Bench
  choco install apachebench
  # Test
  ab -n 1000 -c 10 http://<Backend-VM-IP>/api/health/live
  ```

### Phase 10: Monitoring Setup
- [ ] Setup UptimeRobot:
  - [ ] Add monitor for frontend: `https://megilance.com`
  - [ ] Add monitor for backend: `http://<VM-IP>/api/health/live`
  - [ ] Add alert email
- [ ] Enable Oracle Cloud Monitoring:
  - [ ] VM CPU metrics
  - [ ] VM memory metrics
  - [ ] Database CPU metrics
  - [ ] Object Storage metrics
- [ ] Configure log rotation on VMs:
  ```bash
  sudo tee /etc/logrotate.d/megilance <<EOF
  /var/log/megilance/*.log {
      daily
      rotate 7
      compress
      delaycompress
      notifempty
      create 0640 ubuntu ubuntu
  }
  EOF
  ```

### Phase 11: Email Service Setup (SendGrid)
- [ ] Create SendGrid account (free tier)
- [ ] Get API key from dashboard
- [ ] Add to backend `.env`:
  ```env
  SENDGRID_API_KEY=SG.xxxxx
  SENDGRID_FROM_EMAIL=noreply@megilance.com
  ```
- [ ] Update email service code:
  ```python
  # backend/app/services/email_service.py
  import sendgrid
  from sendgrid.helpers.mail import Mail
  
  sg = sendgrid.SendGridAPIClient(settings.sendgrid_api_key)
  ```
- [ ] Test email sending
- [ ] Verify domain in SendGrid (optional, for better deliverability)

### Phase 12: Cleanup & Decommission AWS
- [ ] Backup AWS data (if any):
  - [ ] Export RDS database
  - [ ] Download S3 files
  - [ ] Export CloudWatch logs
- [ ] Delete AWS resources:
  - [ ] Terminate EC2 instances
  - [ ] Delete RDS database
  - [ ] Empty and delete S3 buckets
  - [ ] Delete Secrets Manager secrets
  - [ ] Delete SNS topics
  - [ ] Delete SES identities
  - [ ] Delete IAM roles/users
- [ ] Cancel AWS subscription (if applicable)
- [ ] Remove AWS credentials from code:
  ```powershell
  Remove-Item backend\app\core\s3.py
  ```
- [ ] Update documentation to remove AWS references

### Phase 13: Documentation Updates
- [ ] Update README.md with new architecture
- [ ] Update deployment documentation
- [ ] Document Oracle setup process
- [ ] Add troubleshooting guide
- [ ] Update API documentation with new URLs
- [ ] Create runbook for common operations

### Phase 14: Performance Optimization
- [ ] Enable Oracle Database caching
- [ ] Configure Nginx caching on backend VM
- [ ] Add Cloudflare CDN (optional):
  - [ ] Create Cloudflare account
  - [ ] Add domain
  - [ ] Point DNS to Cloudflare
  - [ ] Enable caching rules
- [ ] Optimize database queries:
  - [ ] Add indexes
  - [ ] Analyze slow queries
  - [ ] Use connection pooling
- [ ] Optimize frontend bundle:
  ```powershell
  cd frontend
  npm run build
  npm run analyze  # Check bundle size
  ```

### Phase 15: Security Hardening
- [ ] Enable Oracle Cloud Guard
- [ ] Configure VM firewall rules (security lists)
- [ ] Enable database encryption (enabled by default)
- [ ] Rotate secrets:
  - [ ] Database password
  - [ ] JWT secret
  - [ ] SendGrid API key
- [ ] Enable fail2ban on VMs:
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable fail2ban
  ```
- [ ] Disable password authentication (SSH keys only):
  ```bash
  sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  sudo systemctl restart sshd
  ```
- [ ] Enable automatic security updates:
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure --priority=low unattended-upgrades
  ```

---

## 🎯 Quick Verification Commands

```powershell
# Check Oracle CLI
oci --version

# Check database connectivity
sqlplus admin/YourPassword@megilancedb_high

# Check bucket access
oci os object list --bucket-name megilance-uploads

# Check VM status
oci compute instance list --compartment-id <ID>

# Check backend health
curl http://<VM-IP>/api/health/live

# Check frontend
curl https://megilance.com
```

---

## 📊 Success Criteria

### ✅ Migration Complete When:
1. [ ] All backend API endpoints working
2. [ ] Frontend loads and displays data
3. [ ] User authentication working
4. [ ] File uploads working
5. [ ] Database queries performing well (<100ms avg)
6. [ ] No AWS dependencies remaining
7. [ ] Monitoring alerts configured
8. [ ] SSL certificates installed and auto-renewing
9. [ ] Documentation updated
10. [ ] Team trained on new infrastructure

---

## 🆘 Troubleshooting

### Backend won't start
```bash
ssh -i ~/.ssh/id_rsa ubuntu@<VM-IP>
sudo systemctl status backend
sudo journalctl -u backend -n 50
```

### Database connection fails
```bash
# Check wallet permissions
ls -la ~/backend/oracle-wallet/
# Test connection
sqlplus admin/Pass@megilancedb_high
```

### File upload fails
```bash
# Test OCI storage
python3 -c "
from app.core.oci_storage import oci_storage_client
print(oci_storage_client.list_files('megilance-uploads'))
"
```

### Frontend can't reach backend
- Check CORS configuration in backend
- Verify firewall rules allow port 80/443
- Check Nginx configuration
- Verify DNS pointing to correct IP

---

## 📞 Support Resources

- **Oracle Cloud Docs**: https://docs.oracle.com/en-us/iaas/
- **Oracle Always Free**: https://www.oracle.com/cloud/free/
- **Digital Ocean Docs**: https://docs.digitalocean.com/
- **SendGrid Docs**: https://docs.sendgrid.com/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs

---

**Migration completed by**: _____________  
**Date**: _____________  
**Total cost**: $0/month (excl. domain ~$1/month) ✅
