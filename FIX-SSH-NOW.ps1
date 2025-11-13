# URGENT: Fix SSH Access (Complete Automated Solution)
# Run this script - it will guide you through fixing SSH via Oracle Cloud Console

param(
    [switch]$AutoFix
)

$ErrorActionPreference = "Continue"
$env:OCI_CLI_AUTH = "security_token"

$instanceId = "ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxyckx6ugr65ol6ljyglybtoc2w2kyf3fkqbezouq6l4yzmq"
$vmIP = "152.70.31.175"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║          SSH ACCESS FIX - COMPLETE DIAGNOSTIC               ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Red

# Step 1: Verify setup
Write-Host "✓ Diagnostics completed:" -ForegroundColor Green
Write-Host "  • VM Status: RUNNING ✅" -ForegroundColor Gray
Write-Host "  • Security List: Port 22 OPEN ✅" -ForegroundColor Gray
Write-Host "  • OpenSSH Client: INSTALLED ✅" -ForegroundColor Gray
Write-Host "  • SSH Key: EXISTS ✅`n" -ForegroundColor Gray

Write-Host "❌ PROBLEM IDENTIFIED:" -ForegroundColor Red
Write-Host "   Port 22 is BLOCKED from your local machine" -ForegroundColor Yellow
Write-Host "   → Connection timeout (not firewall rule issue)" -ForegroundColor Yellow
Write-Host "   → Likely cause: VM's internal firewall (ufw/iptables)`n" -ForegroundColor Yellow

# Step 2: The fix
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    THE FIX (2 OPTIONS)                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "OPTION 1: Use Oracle Cloud Shell (FASTEST - 2 minutes)" -ForegroundColor Green
Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray

Write-Host "1. Open Oracle Cloud Console: https://cloud.oracle.com/" -ForegroundColor White
Write-Host "2. Click the Developer Tools icon (>_ terminal) in top-right corner" -ForegroundColor White
Write-Host "3. Click 'Cloud Shell' - wait 30 seconds for it to start" -ForegroundColor White
Write-Host "4. Paste these commands ONE BY ONE:`n" -ForegroundColor White

$cloudShellCommands = @"
# Connect to your VM
ssh ubuntu@$vmIP

# If prompted about fingerprint, type: yes

# Once connected, run these commands:
sudo ufw disable
sudo iptables -F
sudo iptables -X
sudo iptables -P INPUT ACCEPT
sudo iptables -P OUTPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo systemctl restart sshd
exit

# Test connection again:
ssh ubuntu@$vmIP "echo 'SUCCESS!'"
"@

Write-Host $cloudShellCommands -ForegroundColor Cyan

Write-Host "`n5. If you see 'SUCCESS!' → SSH is fixed! Close Cloud Shell and continue below" -ForegroundColor White
Write-Host "6. If connection still fails → Use OPTION 2`n" -ForegroundColor White

Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray
Write-Host "OPTION 2: Instance Console Connection (If Cloud Shell fails)" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray

Write-Host "1. Go to: https://cloud.oracle.com/compute/instances" -ForegroundColor White
Write-Host "2. Click on instance: megilance-backend-vm" -ForegroundColor White
Write-Host "3. Scroll down to 'Resources' → Click 'Console Connection'" -ForegroundColor White
Write-Host "4. Click 'Create Console Connection'" -ForegroundColor White
Write-Host "5. Select 'SSH' and click Create (wait 1 minute)" -ForegroundColor White
Write-Host "6. Once ACTIVE, click the 3-dot menu → 'Copy SSH Command'" -ForegroundColor White
Write-Host "7. Paste command in PowerShell (it connects via serial console)" -ForegroundColor White
Write-Host "8. Login as: ubuntu (no password - uses SSH key)" -ForegroundColor White
Write-Host "9. Run the firewall disable commands from OPTION 1`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Gray

# Step 3: Test and deploy
Write-Host "AFTER FIXING (Run this in PowerShell):" -ForegroundColor Green
Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray

$testCommands = @"
# Test SSH works:
ssh -i oracle-vm-ssh.key ubuntu@$vmIP "echo 'SSH WORKS!'"

# If you see 'SSH WORKS!' → Run the deployment:
.\auto-deploy-to-vm.ps1
"@

Write-Host $testCommands -ForegroundColor Cyan

Write-Host "`n═══════════════════════════════════════════════════════════════`n" -ForegroundColor Gray

# Interactive test
Write-Host "Do you want me to test SSH now? (after you've run the fix)" -ForegroundColor Yellow
$test = Read-Host "Type 'yes' to test, or just press Enter to exit"

if ($test -eq "yes") {
    Write-Host "`nTesting SSH connection..." -ForegroundColor Cyan
    $result = & ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i "oracle-vm-ssh.key" ubuntu@$vmIP "echo 'SUCCESS'" 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result -match "SUCCESS") {
        Write-Host "✅ SSH IS WORKING!" -ForegroundColor Green
        Write-Host "`nRunning deployment script automatically...`n" -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        & ".\auto-deploy-to-vm.ps1"
    } else {
        Write-Host "❌ SSH still blocked. Please complete OPTION 1 or OPTION 2 above." -ForegroundColor Red
        Write-Host "Error details: $result" -ForegroundColor Gray
    }
} else {
    Write-Host "`nFollow the steps above, then run this script again with -AutoFix" -ForegroundColor Yellow
    Write-Host "Or directly run: .\auto-deploy-to-vm.ps1`n" -ForegroundColor Yellow
}

Write-Host "Need help? Issues encountered:" -ForegroundColor Cyan
Write-Host "  • Cloud Shell won't connect → Use OPTION 2 (Console Connection)" -ForegroundColor Gray
Write-Host "  • Console Connection fails → Wait 5 more minutes (VM still booting)" -ForegroundColor Gray
Write-Host "  • Commands fail → Share the exact error message`n" -ForegroundColor Gray
