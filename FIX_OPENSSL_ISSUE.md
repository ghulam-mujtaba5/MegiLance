# 🔧 Fix: OpenSSL Required for Oracle Setup

You got this error because OpenSSL is needed to generate Oracle-compatible API keys.

---

## ⚡ Quick Fix (Choose One Method)

### Method 1: Auto-Install OpenSSL (Fastest - 2 minutes)

```powershell
.\install-openssl.ps1
```

This will automatically install OpenSSL via Chocolatey or winget.

After installation completes:
```powershell
.\setup-oracle-permanent-auth.ps1
```

---

### Method 2: Let Oracle Generate Keys (Easiest - No OpenSSL needed)

```powershell
.\setup-oracle-permanent-auth.ps1
```

When prompted, select option **4 - Use Oracle Console to generate keys**

This will:
1. Open Oracle Cloud Console
2. You generate keys directly in Oracle (they do it for you)
3. Download the keys Oracle generates
4. Copy them to the `.oci` folder
5. Done!

**This is the easiest if you don't want to install OpenSSL.**

---

### Method 3: Manual OpenSSL Install

1. **Download OpenSSL:**
   - Go to: https://slproweb.com/products/Win32OpenSSL.html
   - Download: "Win64 OpenSSL v3.x.x Light" (not the EXE installer)
   - Install to default location

2. **Restart PowerShell** (important - refreshes PATH)

3. **Run setup again:**
   ```powershell
   .\setup-oracle-permanent-auth.ps1
   ```

---

## 🎯 Recommended: Use Oracle Console Method

Since you're setting this up for the first time, I **recommend Method 2** (Oracle Console generates keys).

**Why?**
- ✅ No OpenSSL installation needed
- ✅ Oracle generates keys for you
- ✅ Download and copy - done in 3 minutes
- ✅ 100% compatible
- ✅ No command-line key generation

---

## 📋 Step-by-Step (Oracle Console Method)

1. **Run the setup script:**
   ```powershell
   .\setup-oracle-permanent-auth.ps1
   ```

2. **Select option 1** (Automated setup)

3. **When asked about OpenSSL, select option 4** (Oracle Console)

4. **Browser opens to Oracle Cloud**

5. **In Oracle Console:**
   - Profile icon → User Settings
   - Resources → API Keys
   - Add API Key
   - **Generate API Key Pair** (Oracle does it for you!)
   - Download Private Key → save as `oci_api_key.pem`
   - Download Public Key → save as `oci_api_key_public.pem`

6. **Copy both files to:**
   ```
   C:\Users\ghula\.oci\
   ```

7. **Copy the Configuration Preview** (user OCID, tenancy OCID, fingerprint)

8. **Press Enter in PowerShell**

9. **Paste the configuration values**

10. **Done! ✅**

---

## ✨ After Setup

Once authentication is configured, run the fully automated migration:

```powershell
.\migrate-to-oracle-auto.ps1 -AutoConfirm
```

**No browser prompts - completely automated!**

---

## 🆘 Still Having Issues?

If you prefer to install OpenSSL first:

```powershell
# Quick auto-install
.\install-openssl.ps1

# Then restart PowerShell and run:
.\setup-oracle-permanent-auth.ps1
```

---

**Recommended path: Use Oracle Console method (option 4) - easiest and fastest!** 🚀
