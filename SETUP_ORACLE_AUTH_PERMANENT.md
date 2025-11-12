# 🔐 Oracle CLI Permanent Authentication Setup

**Account:** Muhammad Salman  
**Method:** API Key Authentication (No browser needed after initial setup)  
**Result:** Fully automated, permanent configuration  

---

## 🎯 Overview

This guide will set up **permanent API key authentication** for Oracle CLI. After this one-time setup, all scripts will work automatically without browser prompts.

---

## 📋 One-Time Setup (Choose Your Method)

### Method 1: Browser Authentication + Convert to API Key (Recommended)

This is the easiest method - authenticate once via browser, then extract the credentials for permanent use.

```powershell
# Step 1: Authenticate via browser (one time only)
oci session authenticate --region us-ashburn-1

# Step 2: Login with Muhammad Salman's Oracle account in browser

# Step 3: After successful login, run this to generate permanent config
.\setup-oracle-permanent-auth.ps1
```

The script will:
- Create API keys automatically
- Configure permanent authentication
- Save credentials securely
- Test the connection

---

### Method 2: Manual API Key Setup (Full Control)

If you prefer full manual control:

#### Step 1: Generate API Key Pair

```powershell
# Create .oci directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.oci"

# Generate RSA key pair (do NOT set passphrase for automation)
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.oci\oci_api_key.pem" -N '""'

# Generate public key
openssl rsa -pubout -in "$env:USERPROFILE\.oci\oci_api_key.pem" -out "$env:USERPROFILE\.oci\oci_api_key_public.pem"
```

**Important:** Do NOT set a passphrase - leave it empty for full automation.

#### Step 2: Upload Public Key to Oracle Cloud

1. **Login to Oracle Cloud Console**: https://cloud.oracle.com/
2. Login with **Muhammad Salman's account**
3. Click profile icon (top right) → **User Settings**
4. Under **Resources** (left sidebar) → **API Keys**
5. Click **Add API Key**
6. Select **Paste Public Key**
7. Copy contents of `$env:USERPROFILE\.oci\oci_api_key_public.pem`
8. Paste and click **Add**
9. **Copy the Configuration File Preview** - you'll need these values:

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaxxxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaaaaaxxxxx
region=us-ashburn-1
key_file=C:\Users\YourUser\.oci\oci_api_key.pem
```

#### Step 3: Create OCI Config File

```powershell
# Create config file
$configContent = @"
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaxxxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaaaaaxxxxx
region=us-ashburn-1
key_file=$env:USERPROFILE\.oci\oci_api_key.pem
"@

Set-Content -Path "$env:USERPROFILE\.oci\config" -Value $configContent
```

**Replace the OCIDs and fingerprint with the values from Step 2!**

#### Step 4: Test Connection

```powershell
# Test authentication
oci iam availability-domain list

# If successful, you'll see list of availability domains
# If error, check your OCIDs and fingerprint
```

---

## ✅ Verification

After setup (either method), verify it works:

```powershell
# Test 1: List availability domains
oci iam availability-domain list

# Test 2: List compartments
oci iam compartment list --all

# Test 3: Get namespace
oci os ns get

# All should work without browser prompts!
```

---

## 🚀 After Setup - Run Migration

Once authentication is configured, the migration is **fully automated**:

```powershell
# This will now run completely automatically - no browser needed!
.\migrate-to-oracle-auto.ps1 -AutoConfirm
```

---

## 🔧 Configuration File Location

Your permanent config is stored at:
```
C:\Users\<YourUser>\.oci\config
C:\Users\<YourUser>\.oci\oci_api_key.pem (private key)
C:\Users\<YourUser>\.oci\oci_api_key_public.pem (public key)
```

**Keep the private key secure! Do NOT share or commit to git.**

---

## 🔐 Security Best Practices

1. **Never share your private key** (`oci_api_key.pem`)
2. **No passphrase for automation** - key must be unencrypted
3. **Keep keys in .oci directory** (already in .gitignore)
4. **Rotate keys periodically** - generate new keys every 90 days
5. **Use separate keys for dev/prod** if needed

---

## 🆘 Troubleshooting

### Error: "Service error: NotAuthenticated"

**Solution:** Your API key or config is incorrect
```powershell
# Check config file
cat $env:USERPROFILE\.oci\config

# Verify fingerprint matches in Oracle Console
# User Settings → API Keys
```

### Error: "Private key file does not exist"

**Solution:** Path in config is wrong
```powershell
# Fix path in config - use full path
$configPath = "$env:USERPROFILE\.oci\config"
$content = Get-Content $configPath -Raw
$content -replace 'key_file=.*', "key_file=$env:USERPROFILE\.oci\oci_api_key.pem" | Set-Content $configPath
```

### Error: "Could not open private key file"

**Solution:** Key permissions issue
```powershell
# Fix permissions (Windows)
icacls "$env:USERPROFILE\.oci\oci_api_key.pem" /inheritance:r /grant:r "${env:USERNAME}:F"
```

### Still using old account?

**Solution:** Remove old session tokens
```powershell
# Remove session tokens
Remove-Item "$env:USERPROFILE\.oci\sessions" -Recurse -Force -ErrorAction SilentlyContinue

# Verify current user
oci iam user get --user-id (oci iam user list --output json | ConvertFrom-Json).data[0].id
```

---

## 📊 Comparison: Session vs API Key

| Feature | Browser Session | API Key |
|---------|----------------|---------|
| **Setup** | Easy (browser) | One-time manual |
| **Automation** | ❌ Expires | ✅ Permanent |
| **Expiration** | 60 minutes | Never |
| **Renewal** | Re-authenticate | Never needed |
| **Scripts** | ❌ Not suitable | ✅ Perfect |
| **CI/CD** | ❌ Not possible | ✅ Works great |

**For automation → Use API Key method!**

---

## 🎯 What You Get

After permanent authentication setup:

✅ **No browser prompts** - fully automated  
✅ **Never expires** - works forever  
✅ **Works in scripts** - CI/CD ready  
✅ **Secure** - industry standard  
✅ **Fast** - instant authentication  

---

## 📝 Quick Commands Reference

```powershell
# Generate API key
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.oci\oci_api_key.pem" -N '""'
openssl rsa -pubout -in "$env:USERPROFILE\.oci\oci_api_key.pem" -out "$env:USERPROFILE\.oci\oci_api_key_public.pem"

# View public key (to upload to Oracle)
cat "$env:USERPROFILE\.oci\oci_api_key_public.pem"

# Test authentication
oci iam availability-domain list

# Run automated migration
.\migrate-to-oracle-auto.ps1 -AutoConfirm
```

---

## ✨ Next Steps

1. ✅ Choose your method (Browser + Convert OR Manual)
2. ✅ Complete one-time setup
3. ✅ Verify with test commands
4. ✅ Run fully automated migration:
   ```powershell
   .\migrate-to-oracle-auto.ps1 -AutoConfirm
   ```

**After this setup, everything is 100% automated!** 🚀
