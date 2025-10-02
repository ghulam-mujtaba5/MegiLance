# ============================================================================
# AWS Deployment - Real-Time Monitoring
# ============================================================================

$repo = "ghulam-mujtaba5/MegiLance"
$checkInterval = 30 # seconds

Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║           🚀 MegiLance AWS Deployment - Live Monitoring 🚀               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "Repository: $repo" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""

# Get initial runs
$workflows = @(
    @{Name="Infrastructure"; File="infrastructure.yml"}
    @{Name="Terraform"; File="terraform.yml"}
    @{Name="Deployment"; File="auto-deploy.yml"}
)

function Get-WorkflowStatus {
    param($workflowFile)
    
    $run = gh run list --repo $repo --workflow=$workflowFile --limit 1 --json status,conclusion,databaseId,createdAt | ConvertFrom-Json
    return $run[0]
}

function Show-Status {
    param($name, $status, $conclusion, $runId)
    
    $icon = switch($status) {
        "in_progress" { "⏳" }
        "queued" { "📋" }
        "completed" { 
            if ($conclusion -eq "success") { "✅" } 
            elseif ($conclusion -eq "failure") { "❌" }
            else { "⚠️" }
        }
        default { "❓" }
    }
    
    $color = switch($status) {
        "in_progress" { "Yellow" }
        "queued" { "Gray" }
        "completed" { 
            if ($conclusion -eq "success") { "Green" }
            else { "Red" }
        }
        default { "White" }
    }
    
    Write-Host "$icon $name : " -NoNewline -ForegroundColor $color
    Write-Host "$status" -ForegroundColor $color
    
    if ($runId) {
        Write-Host "   Run ID: $runId" -ForegroundColor DarkGray
    }
}

$iteration = 0
$allCompleted = $false

while (-not $allCompleted) {
    $iteration++
    
    Clear-Host
    
    Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                    Deployment Status - Update #$iteration                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
    
    Write-Host "Last Updated: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    
    $completed = 0
    $failed = 0
    $running = 0
    
    foreach ($workflow in $workflows) {
        $status = Get-WorkflowStatus -workflowFile $workflow.File
        
        if ($status) {
            Show-Status -name $workflow.Name -status $status.status -conclusion $status.conclusion -runId $status.databaseId
            
            if ($status.status -eq "completed") {
                $completed++
                if ($status.conclusion -ne "success") {
                    $failed++
                }
            } else {
                $running++
            }
        }
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "   Running: $running" -ForegroundColor Yellow
    Write-Host "   Completed: $completed" -ForegroundColor Green
    if ($failed -gt 0) {
        Write-Host "   Failed: $failed" -ForegroundColor Red
    }
    
    if ($running -eq 0) {
        $allCompleted = $true
        Write-Host ""
        if ($failed -eq 0) {
            Write-Host "🎉 ALL DEPLOYMENTS COMPLETED SUCCESSFULLY! 🎉" -ForegroundColor Green -BackgroundColor Black
        } else {
            Write-Host "⚠️  Some workflows failed. Check logs for details." -ForegroundColor Red
        }
        break
    }
    
    Write-Host ""
    Write-Host "Checking again in $checkInterval seconds... (Press Ctrl+C to stop)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 View detailed logs:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$repo/actions" -ForegroundColor Yellow
    
    Start-Sleep -Seconds $checkInterval
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check AWS ECS Console:" -ForegroundColor White
Write-Host "   https://us-east-2.console.aws.amazon.com/ecs/v2/clusters" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Get service endpoints:" -ForegroundColor White
Write-Host "   aws ecs list-tasks --cluster megilance-cluster --service-name megilance-backend-service --region us-east-2" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. View application logs:" -ForegroundColor White
Write-Host "   aws logs tail /ecs/megilance-backend --follow --region us-east-2" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Test your deployed application:" -ForegroundColor White
Write-Host "   curl http://YOUR_ECS_PUBLIC_IP:8000/api/health/live" -ForegroundColor Yellow
Write-Host ""
