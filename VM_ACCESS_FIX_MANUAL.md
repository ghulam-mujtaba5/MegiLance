# VM Access Troubleshooting - Manual Steps Required

## 🚨 Current Issue: SSH Connection Timeout

Your VM is created but SSH connection is timing out. This could be due to:
1. Security list rules not fully applied yet
2. Cloud-init still running (takes 3-5 minutes)
3. SSH keys mismatch

## ✅ Your VM Details
```
Instance OCID: ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxyckx6ugr65ol6ljyglybtoc2w2kyf3fkqbezouq6l4yzmq
Public IP: 152.70.31.175
Private IP: 10.0.0.126
VCN: megilance-vcn
Status: RUNNING
```

## 🔧 Manual Steps to Fix

### Step 1: Verify Security List in Oracle Console

1. Go to Oracle Cloud Console
2. Navigate to: **Networking** → **Virtual Cloud Networks**
3. Click **megilance-vcn**
4. Click **Security Lists** on the left
5. Click **"Default Security List for megilance-vcn"**
6. Under **"Ingress Rules"**, verify you have:

```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 22
Description: SSH
```

**If NOT present**, click **"Add Ingress Rules"** and add:
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `22`
- Description: `SSH access`

Click **"Add Ingress Rules"** button.

### Step 2: Check VM Instance Firewall (iptables)

The Ubuntu instance might have its own firewall blocking connections. You need to access via Oracle Console:

1. Go to your VM instance page
2. Click **"Console Connection"** on the left menu
3. Click **"Create console connection"**
4. Select "SSH keys" and use your SSH public key
5. Once created, click **"Connect with SSH"**
6. Follow the connection command shown

OR use **"Launch Cloud Shell connection"** for browser-based access.

### Step 3: Wait for Cloud-Init to Complete

The cloud-init script takes 3-5 minutes to run. Check status:

1. Use Console Connection (from Step 2) to access VM
2. Run: `cat /home/ubuntu/init-complete.txt`
3. If file exists with "VM initialization complete!", cloud-init is done
4. If not, wait 5 more minutes

### Step 4: Test SSH from Your Machine

After security list is configured and cloud-init completes:

```powershell
# Test SSH connection
ssh ubuntu@152.70.31.175

# If you generated SSH key during VM creation, use:
ssh -i C:\path\to\oracle-vm-key.key ubuntu@152.70.31.175
```

---

## 🎯 Quick Fix - Add Security Rules Manually

If automated configuration didn't work, add these rules manually in Oracle Console:

### Navigate to Security List
1. **Networking** → **Virtual Cloud Networks** → **megilance-vcn**
2. Click **Security Lists** → **Default Security List**
3. Click **"Add Ingress Rules"**

### Add 4 Rules:

**Rule 1: SSH**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 22
Description: SSH access
```

**Rule 2: HTTP**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
Description: HTTP
```

**Rule 3: HTTPS**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 443
Description: HTTPS
```

**Rule 4: Backend API**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 8000
Description: Backend API
```

Click **"Add Ingress Rules"** after each.

---

## 🔄 Alternative: Use Oracle Cloud Shell

If SSH still doesn't work from your machine:

1. In Oracle Console, click the **Cloud Shell** icon (>_) in top right
2. Run:
```bash
ssh ubuntu@152.70.31.175
```

This connects from within Oracle's network and should work.

---

## ✅ Once SSH Works

Run this command to verify everything is ready:

```bash
# Check Docker installation
docker --version
docker-compose --version
git --version

# Check cloud-init completed
cat /home/ubuntu/init-complete.txt

# Check system resources
free -h
df -h
```

**Then tell me "SSH is working now"** and I'll continue with automated deployment!

---

## 🆘 If Still Stuck

Try these diagnostic commands:

```powershell
# Check if port 22 is open (from your machine)
Test-NetConnection -ComputerName 152.70.31.175 -Port 22

# Ping test
ping 152.70.31.175
```

If ping works but SSH doesn't:
- ✅ Internet connectivity is fine
- ❌ Port 22 is blocked (security list issue)

If ping doesn't work:
- ❌ Routing/Internet Gateway issue

---

## 📞 Common Solutions

### Issue: "Connection timed out"
**Cause**: Security list doesn't allow port 22
**Fix**: Add SSH ingress rule (port 22) manually in console

### Issue: "Permission denied (publickey)"
**Cause**: Wrong SSH key
**Fix**: Use the private key you generated/uploaded during VM creation

### Issue: "Connection refused"
**Cause**: SSH service not started yet (cloud-init running)
**Fix**: Wait 5 minutes, then try again

---

## 🎯 Next Steps After SSH Works

Once you can SSH into the VM, provide confirmation and I will:

1. ✅ Upload Oracle DB wallet
2. ✅ Configure environment variables
3. ✅ Deploy backend with Docker
4. ✅ Setup Git webhook (push → auto-deploy)
5. ✅ Deploy frontend to DigitalOcean
6. ✅ Test end-to-end connectivity

**Let me know when SSH is working!** 🚀
