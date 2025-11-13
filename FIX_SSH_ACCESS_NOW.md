# 🚨 URGENT: Fix SSH Access to Your Oracle VM

## Problem Identified
**Port 22 (SSH) is blocked.** Your VM at `152.70.31.175` is not reachable.

**Test Result:**
```
❌ TCP connection to port 22: FAILED
❌ Ping: FAILED (timeout)
```

## Root Causes (One or More)
1. ❌ Security List missing port 22 ingress rule
2. ❌ Network Security Group blocking traffic
3. ❌ VM internal firewall (iptables/ufw) blocking
4. ❌ VM is stopped or still initializing (cloud-init)

---

## ✅ SOLUTION - Follow These Steps EXACTLY

### Step 1: Check VM Status (Oracle Console)

1. Go to: https://cloud.oracle.com/
2. Navigate: **Compute** → **Instances**
3. Find your instance: **oracle-vm** or OCID ending in `...ouq6l4yzmq`
4. Check **Status**: Should be **RUNNING** (green)
   - If STOPPED: Click **Start** and wait 2-3 minutes
   - If PROVISIONING: Wait until RUNNING

---

### Step 2: Fix Security List Rules

1. In instance details page, scroll down to **Primary VNIC**
2. Click on the VNIC name (usually `primaryvnic`)
3. On the left sidebar, click **Security Lists**
4. Click on your security list name (likely `Default Security List`)
5. Click **Add Ingress Rules** button

**Add This Rule:**
```
Source Type:      CIDR
Source CIDR:      0.0.0.0/0
IP Protocol:      TCP
Source Port:      All
Destination Port: 22
Description:      SSH access
```

6. Click **Add Ingress Rules**
7. Verify you also have rules for ports **80** and **443**

---

### Step 3: Check Network Security Groups (NSG)

1. In the VNIC details page, check if any **Network Security Groups** are attached
2. If YES:
   - Click on the NSG name
   - Click **Add Rules**
   - Add the same rule as Step 2 (port 22, TCP, 0.0.0.0/0)

---

### Step 4: Use Cloud Shell to Fix Internal Firewall

**This is the fastest way to access your VM right now:**

1. In Oracle Console, click the **Developer Tools** icon (terminal icon, top right)
2. Click **Cloud Shell** (it will open a terminal at the bottom)
3. Wait for shell to start (30 seconds)
4. Run these commands:

```bash
# Connect via private network (bypasses security lists)
ssh ubuntu@152.70.31.175

# If that fails, try instance console connection
# (Ask me for help with this)
```

5. Once connected, disable the VM's internal firewall:

```bash
# Check if ufw is active
sudo ufw status

# If active, allow SSH then disable (for testing)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw disable

# OR if using iptables
sudo iptables -L -n | grep 22
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables-save
```

---

### Step 5: Test SSH from Your PC

Open PowerShell and run:

```powershell
cd E:\MegiLance
ssh -i oracle-vm-ssh.key ubuntu@152.70.31.175 "echo 'Success!'"
```

**Expected Output:**
```
Success!
```

If it works, proceed to Step 6. If not, go back to Step 2-4.

---

### Step 6: Run the Deployment Script

Once SSH works:

```powershell
cd E:\MegiLance
.\auto-deploy-to-vm.ps1
```

The script will now succeed and deploy your backend automatically.

---

## 🆘 Still Not Working? Try Instance Console Connection

If SSH still fails after all steps:

1. In Oracle Console → Instance Details
2. Scroll down to **Resources** → **Console Connection**
3. Click **Create Console Connection**
4. Select **SSH** connection type
5. Follow the instructions to connect via serial console
6. Once connected, manually check:
   ```bash
   # Check SSH service
   sudo systemctl status sshd
   sudo systemctl restart sshd
   
   # Check cloud-init status
   cloud-init status
   
   # Check network
   ip addr show
   curl ifconfig.me  # Should show 152.70.31.175
   ```

---

## 📞 Quick Checklist

Before asking for help, verify:

- [ ] VM Status = RUNNING
- [ ] Security List has port 22 ingress rule (0.0.0.0/0)
- [ ] No NSG blocking traffic
- [ ] Cloud Shell can connect OR serial console works
- [ ] Internal firewall (ufw/iptables) allows port 22

---

## Why This Happened

Your earlier script worked on the OCI side (created VM, keys, etc.) but the **network layer** wasn't configured to allow incoming SSH traffic. This is Oracle Cloud's default secure posture—all ports blocked unless explicitly opened.

**Common Mistake:** Security list rules were added but not saved, or added to wrong list.

---

## Next Steps After SSH Works

1. Run `.\auto-deploy-to-vm.ps1` → Will deploy backend automatically
2. Update DB password in `/home/ubuntu/app/MegiLance/backend/.env`
3. Restart backend: `docker-compose -f docker-compose.minimal.yml restart`
4. Test: `curl http://152.70.31.175:8000/api/health/live`

---

**Need Help?** Share screenshot of:
1. Instance Status page
2. Security List rules page
3. Output of `ssh -vvv` command
