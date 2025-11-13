# Oracle Cloud Console - Manual VM Creation Guide

## 🎯 Step-by-Step Instructions for Creating VM.Standard.E2.1.Micro

Follow these exact steps in the Oracle Cloud Console web interface.

---

## 📋 Before You Start - Information You'll Need

### Your Oracle Cloud Details
```
Tenancy OCID: ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq
Home Region: EU (Frankfurt)
```

### Existing Network Resources
```
VCN Name: megilance-vcn
Subnet OCID: ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaas2bgihzfymimftv6cab3wnjqilje7ue7ru2piysw44qktvfgbvba
```

---

## 🚀 Step 1: Access Oracle Cloud Console

1. Go to: **https://cloud.oracle.com**
2. Sign in with your Oracle Cloud account
3. Make sure you're in the **EU (Frankfurt)** region (check top right corner)

---

## 🖥️ Step 2: Navigate to Compute Instances

1. Click the **hamburger menu** (☰) in top left
2. Go to: **Compute** → **Instances**
3. Click the blue **"Create Instance"** button

---

## ⚙️ Step 3: Configure Instance Details

### Section: Name and Compartment

**Field: Name**
```
megilance-backend-vm
```

**Field: Create in compartment**
```
Select: (root) - Your root compartment
```
*Note: Usually pre-selected, just verify it's your root compartment*

**Field: Placement**
```
Availability domain: Keep default or select any available AD (like AD-1, AD-2, or AD-3)
Capacity type: On-demand capacity
Fault domain: Let Oracle choose the best fault domain (default)
```

---

## 🔧 Step 4: Image and Shape

### Image Selection

1. In the **"Image and shape"** section, click **"Edit"** next to "Image"

2. **Choose Operating System**:
   - Click **"Change Image"** button
   - Select: **"Canonical Ubuntu"**
   - Version: **"22.04"** (look for "22.04 Minimal" or "22.04")
   - Image build: **Latest available**
   - Click **"Select Image"**

### Shape Selection

1. Click **"Change Shape"** button

2. **Instance type**: Select **"Virtual machine"**

3. **Shape series**: Select **"AMD"** or filter to find E2

4. **Shape name**: Find and select:
   ```
   VM.Standard.E2.1.Micro
   ```

5. **Verify the shape shows**:
   ```
   OCPU count: 1
   Memory (GB): 1
   Network bandwidth (Gbps): 0.48
   Always Free-eligible: ✓ Yes
   ```

6. Click **"Select Shape"**

---

## 🌐 Step 5: Networking Configuration

### Primary VNIC Information

**Field: Primary network**
```
Select existing virtual cloud network
```

**Field: Virtual cloud network in (root)**
```
Select: megilance-vcn
```
*If you don't see it, you may need to create a new VCN - see Appendix A below*

**Field: Subnet in (root)**
```
Select: megilance-subnet (Regional)
```
*This is the subnet with OCID: ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaas2bgihzfymimftv6cab3wnjqilje7ue7ru2piysw44qktvfgbvba*

**Field: Public IPv4 address**
```
☑ Assign a public IPv4 address (CHECK THIS BOX!)
```
*This is CRITICAL - you need public IP to access the VM*

**Field: Private IPv4 address (optional)**
```
Leave as: Automatically assign private IPv4 address
```

**Field: Hostname**
```
Leave default or enter: megilance-backend
```

---

## 🔐 Step 6: Add SSH Keys

### Option A: Generate New SSH Key Pair (Recommended)

1. Select: **"Generate a key pair for me"**
2. Click **"Save Private Key"** - Save it as `oracle-vm-key.key`
3. Click **"Save Public Key"** - Save it as `oracle-vm-key.pub`
4. **IMPORTANT**: Store these files safely! You'll need the private key to SSH into the VM

### Option B: Use Existing SSH Key

1. Select: **"Upload public key files (.pub)"**
2. Click **"Choose files"**
3. Upload your public SSH key file (e.g., `id_rsa.pub` from `C:\Users\YourName\.ssh\`)

### Option C: Paste SSH Key

1. Select: **"Paste public keys"**
2. Paste the content of your public SSH key
3. Example format:
   ```
   ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... your_email@example.com
   ```

---

## 💾 Step 7: Boot Volume Configuration

**Field: Boot volume size (GB)**
```
50
```
*Always Free tier includes 200 GB total boot volume storage - 50 GB is good for our needs*

**Field: Use in-transit encryption**
```
☐ Leave unchecked (optional feature, not needed)
```

**Backup Policy**
```
Leave as: No backup policy (default)
```

---

## 🔧 Step 8: Advanced Options (Optional but Recommended)

Click **"Show advanced options"** at the bottom

### Management Tab

**Cloud-init script** (Paste this):
```bash
#!/bin/bash

# Update system
apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt-get install -y git

# Create app directory
mkdir -p /home/ubuntu/app
chown ubuntu:ubuntu /home/ubuntu/app

# Enable and start Docker
systemctl enable docker
systemctl start docker

echo "VM initialization complete!" > /home/ubuntu/init-complete.txt
```

This script will automatically:
- ✅ Install Docker
- ✅ Install Docker Compose
- ✅ Install Git
- ✅ Set up docker permissions
- ✅ Create app directory

---

## 📊 Step 9: Review and Create

1. Review all settings:
   - Name: `megilance-backend-vm`
   - Shape: `VM.Standard.E2.1.Micro` (1 OCPU, 1 GB RAM)
   - Image: Ubuntu 22.04
   - VCN: `megilance-vcn`
   - Public IP: ✓ Assigned
   - SSH Key: ✓ Added
   - Boot Volume: 50 GB

2. Verify **"Always Free-eligible"** badge is shown

3. Click the blue **"Create"** button

---

## ⏱️ Step 10: Wait for Provisioning

1. You'll be redirected to the instance details page
2. Status will show: **"PROVISIONING"** (orange)
3. Wait 2-5 minutes
4. Status will change to: **"RUNNING"** (green)

---

## 📝 Step 11: Save Important Information

Once the VM is **RUNNING**, note down:

### Instance OCID
```
(Copy from instance details page - starts with ocid1.instance.oc1...)
Example: ocid1.instance.oc1.eu-frankfurt-1.anzxsljrlkjfhsdkjfhskdjfh
```

### Public IP Address
```
(Copy from "Instance information" section)
Example: 130.61.123.45
```

### Private IP Address
```
(Also shown in "Primary VNIC information")
Example: 10.0.1.5
```

**SAVE THESE VALUES** - You'll provide them to me for automated deployment setup!

---

## ✅ Step 12: Verify VM Access

### Test SSH Connection

**Using Windows PowerShell**:
```powershell
ssh -i C:\path\to\oracle-vm-key.key ubuntu@YOUR_PUBLIC_IP
```

**Using Command Prompt**:
```cmd
ssh ubuntu@YOUR_PUBLIC_IP
```

**First time connecting**:
- You'll see: "Are you sure you want to continue connecting?"
- Type: `yes` and press Enter

**Expected result**:
```
Welcome to Ubuntu 22.04.x LTS
ubuntu@megilance-backend:~$
```

### Verify Docker Installation
```bash
docker --version
docker-compose --version
```

Both should show version numbers if cloud-init script ran successfully.

---

## 🔒 Step 13: Configure Security List (If Needed)

If you can't access the VM on ports 80/443/8000, configure security rules:

1. Go to **Instance Details** page
2. Click on your **VCN name** under "Primary VNIC"
3. Click **"Security Lists"** on the left
4. Click on **"Default Security List for megilance-vcn"**
5. Click **"Add Ingress Rules"**

Add these rules:

### Rule 1: HTTP
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
Description: HTTP access
```

### Rule 2: HTTPS
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 443
Description: HTTPS access
```

### Rule 3: Backend API
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 8000
Description: Backend API
```

---

## 🎉 SUCCESS! What You Should Have Now

✅ **VM Created**: VM.Standard.E2.1.Micro (1 OCPU, 1 GB RAM)
✅ **OS Installed**: Ubuntu 22.04 LTS
✅ **Public IP**: Assigned and accessible
✅ **SSH Access**: Working with your key
✅ **Docker**: Installed and ready
✅ **Network**: Connected to megilance-vcn
✅ **Always Free**: No charges!

---

## 📤 Next Steps - What to Give Me

After VM creation, provide me with these 2 values:

```
1. Instance OCID: ocid1.instance.oc1.eu-frankfurt-1.xxxxx
2. Public IP Address: xxx.xxx.xxx.xxx
```

I will then configure:
- ✅ Backend deployment with Oracle DB connection
- ✅ Git webhook for continuous deployment (push → auto-update)
- ✅ Nginx reverse proxy
- ✅ Health monitoring
- ✅ Auto-restart on failure

---

## 📞 Appendix A: Create VCN (If Needed)

If you don't have `megilance-vcn`, create it first:

1. Go to **Networking** → **Virtual Cloud Networks**
2. Click **"Start VCN Wizard"**
3. Select **"Create VCN with Internet Connectivity"**
4. Click **"Start VCN Wizard"**

**Configuration**:
```
VCN Name: megilance-vcn
Compartment: (root)
VCN CIDR Block: 10.0.0.0/16
Public Subnet CIDR Block: 10.0.0.0/24
Private Subnet CIDR Block: 10.0.1.0/24
```

5. Click **"Next"**
6. Click **"Create"**
7. Wait for creation to complete
8. Go back to VM creation steps

---

## 🆘 Troubleshooting

### Problem: "Out of capacity for shape VM.Standard.E2.1.Micro"

**Solution 1**: Try different Availability Domain
- In Step 3, manually select AD-1, AD-2, or AD-3
- Try each until one works

**Solution 2**: Try different region
- Change region (top right) to:
  - US West (Phoenix)
  - US East (Ashburn)
  - UK South (London)
- Create VM there instead

### Problem: "Shape VM.Standard.E2.1.Micro not found"

**Solution**: 
- Make sure you're in a region that supports Always Free
- Look under AMD shapes or filter for "E2"
- The shape might be listed as "E2.1.Micro" without "VM.Standard" prefix

### Problem: "Cannot find megilance-vcn"

**Solution**:
- Make sure you're in EU (Frankfurt) region
- Check compartment selection (use root)
- Or create new VCN using Appendix A

### Problem: SSH connection refused

**Solution**:
- Wait 5 minutes for cloud-init to complete
- Check Security List has port 22 open (should be default)
- Verify you're using correct private key
- Try: `ssh -v ubuntu@IP` for verbose debugging

---

## 💡 Tips

1. **Save your SSH private key safely** - You can't download it again
2. **Note down Public IP immediately** - You'll need it often
3. **Always Free means FREE** - This VM costs $0/month forever
4. **50 GB boot volume** is plenty for Docker containers
5. **Cloud-init takes 3-5 minutes** - Be patient for Docker installation

---

## 🎯 Quick Reference - What Goes Where

```
Form Section          | What to Enter/Select
--------------------- | ----------------------------------------
Name                  | megilance-backend-vm
Compartment           | (root)
Availability Domain   | Any available (AD-1/AD-2/AD-3)
Image                 | Canonical Ubuntu 22.04
Shape                 | VM.Standard.E2.1.Micro (1 OCPU, 1 GB)
VCN                   | megilance-vcn (or create new)
Subnet                | megilance-subnet (public subnet)
Public IP             | ☑ Assign a public IPv4 address
SSH Key               | Generate new OR upload your public key
Boot Volume           | 50 GB
Cloud-init            | Paste the script from Step 8
```

---

**Ready to create? Follow these steps in order, and you'll have your VM running in 10 minutes!** 🚀

After creation, give me the **Instance OCID** and **Public IP**, and I'll handle the rest! 🎉
