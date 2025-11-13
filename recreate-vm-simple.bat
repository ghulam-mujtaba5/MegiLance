@echo off
REM Simple VM Recreation Script - Pure OCI CLI Commands
setlocal enabledelayedexpansion

set OCI_CLI_AUTH=security_token
set INSTANCE_ID=ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxyckx6ugr65ol6ljyglybtoc2w2kyf3fkqbezouq6l4yzmq

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     RECREATE VM WITH FIREWALL DISABLED (PURE CLI)           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Step 1: Terminate old VM...
oci compute instance terminate --instance-id %INSTANCE_ID% --force --wait-for-state TERMINATED --auth security_token
if errorlevel 1 (
    echo ERROR: Failed to terminate VM
    pause
    exit /b 1
)
echo ✓ Old VM terminated
echo.

echo Step 2: Wait 30 seconds for cleanup...
timeout /t 30 /nobreak >nul
echo.

echo Step 3: Create new VM...
echo Cloud-init will disable firewall automatically on first boot
echo.

REM Cloud-init script (base64 encoded)
set USER_DATA=IyEvYmluL2Jhc2gKc2V0IC14CmV4ZWMgPiAvdmFyL2xvZy9jbG91ZC1pbml0LWN1c3RvbS5sb2cgMj4mMQp1ZncgZGlzYWJsZQppcHRhYmxlcyAtRgppcHRhYmxlcyAtWAppcHRhYmxlcyAtUCBJTlBVVCBBQ0NFUFQKaXB0YWJsZXMgLVAgT1VUUFVUIEFDQ0VQVAppcHRhYmxlcyAtUCBGT1JXQVJEIEFDQ0VQVApzeXN0ZW1jdGwgc3RvcCB1ZncKc3lzdGVtY3RsIGRpc2FibGUgdWZ3CmFwdC1nZXQgdXBkYXRlCmN1cmwgLWZzU0wgaHR0cHM6Ly9nZXQuZG9ja2VyLmNvbSAtbyBnZXQtZG9ja2VyLnNoCnNoIGdldC1kb2NrZXIuc2gKdXNlcm1vZCAtYUcgZG9ja2VyIHVidW50dQpjdXJsIC1MICJodHRwczovL2dpdGh1Yi5jb20vZG9ja2VyL2NvbXBvc2UvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2RvY2tlci1jb21wb3NlLSQodW5hbWUgLXMpLSQodW5hbWUgLW0pIiAtbyAvdXNyL2xvY2FsL2Jpbi9kb2NrZXItY29tcG9zZQpjaG1vZCAreCAv==dXNyL2xvY2FsL2Jpbi9kb2NrZXItY29tcG9zZQphcHQtZ2V0IGluc3RhbGwgLXkgZ2l0Cm1rZGlyIC1wIC9ob21lL3VidW50dS9hcHAKY2hvd24gdWJ1bnR1OnVidW50dSAvaG9tZS91YnVudHUvYXBwCnN5c3RlbWN0bCBlbmFibGUgZG9ja2VyCnN5c3RlbWN0bCBzdGFydCBkb2NrZXIKdWZ3IHN0YXR1cyB8IGdyZXAgLXEgaW5hY3RpdmUgfHwgdWZ3IGRpc2FibGUKZWNobyAiVk0gaW5pdGlhbGl6YXRpb24gY29tcGxldGUgLSBTU0ggcmVhZHkhIiA+IC9ob21lL3VidW50dS9pbml0LWNvbXBsZXRlLnR4dA==

REM Get details from old VM (from saved reference)
set COMPARTMENT_ID=ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq
set AD=WDxd:EU-FRANKFURT-1-AD-3
set SHAPE=VM.Standard.E2.1.Micro
set IMAGE_ID=ocid1.image.oc1.eu-frankfurt-1.aaaaaaaaylo6ubrzuwm3yaxgem3i2d5evrrgth3qkttqdmlevzs6k5yaudoq
set SSH_KEY=ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDoR027D6WBwhKTVqtZIBkAQZrVv9PC+AgXMEq9gf13QkFsof16TcdmUJrKHeMiYYKRXl5clvKypJkYDPRFtobUubmhf1msPJ7yVGzMiSJfFkMYznIX70dXEPgP1r9DPPfFmctBUbHrlIoPssxOq/qmEotGDXZ7cDnoehTN9BCLi4Kw3fGy1zHGNItJHO6P5hpm9BJcwJUEDBxRanufu3BkrXlPbpKe3ZAfWUnGD4I1JLSBGY8cEKvXPxNTOGMGbzY7FoSvthMHVSbiK8BOudpZjzdlEkd91RIVaJqKXLGC63lcDFa3yFtjaAYuaodSnJt1/qpg2YJHP1welPYFpvlV ssh-key-2025-11-13
set SUBNET_ID=ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaalrkc42ccsw22l2xzs5k7xvqx2eo3plrvs5u2qltjlxn6x3hldhcq

echo Creating VM with firewall disabled...
oci compute instance launch ^
    --availability-domain "%AD%" ^
    --compartment-id "%COMPARTMENT_ID%" ^
    --shape "%SHAPE%" ^
    --subnet-id "%SUBNET_ID%" ^
    --image-id "%IMAGE_ID%" ^
    --display-name "megilance-backend-vm-fixed" ^
    --metadata "{\"ssh_authorized_keys\":\"%SSH_KEY%\",\"user_data\":\"%USER_DATA%\"}" ^
    --assign-public-ip true ^
    --wait-for-state RUNNING ^
    --auth security_token > vm-create-output.json

if errorlevel 1 (
    echo ERROR: Failed to create VM
    type vm-create-output.json
    pause
    exit /b 1
)

echo ✓ New VM created!
echo.

echo Step 4: Getting new IP address...
timeout /t 10 /nobreak >nul

REM Extract instance ID from output
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content vm-create-output.json | ConvertFrom-Json).data.id"') do set NEW_INSTANCE_ID=%%a
echo New Instance ID: %NEW_INSTANCE_ID%

REM Get VNIC and IP
for /f "tokens=*" %%a in ('oci compute vnic-attachment list --compartment-id %COMPARTMENT_ID% --instance-id %NEW_INSTANCE_ID% --auth security_token --query "data[0].\"vnic-id\"" --raw-output') do set VNIC_ID=%%a
for /f "tokens=*" %%a in ('oci network vnic get --vnic-id %VNIC_ID% --auth security_token --query "data.\"public-ip\"" --raw-output') do set NEW_IP=%%a

echo ✓ New Public IP: %NEW_IP%
echo.

echo Step 5: Waiting 90 seconds for cloud-init (Docker install + firewall disable)...
timeout /t 90 /nobreak

echo.
echo Step 6: Testing SSH...
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -i oracle-vm-ssh.key ubuntu@%NEW_IP% "echo SSH WORKS"

if errorlevel 1 (
    echo.
    echo ⚠ SSH not ready yet. Wait 2 more minutes and test:
    echo    ssh -i oracle-vm-ssh.key ubuntu@%NEW_IP%
) else (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║                 ✅ SUCCESS! SSH WORKING! ✅                  ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo New VM Details:
    echo   IP Address: %NEW_IP%
    echo   Instance ID: %NEW_INSTANCE_ID%
    echo.
    echo Ready to deploy! Run: .\auto-deploy-to-vm.ps1
    echo (Update the IP in that script to: %NEW_IP%)
)

echo.
echo VM details saved to vm-create-output.json
pause
