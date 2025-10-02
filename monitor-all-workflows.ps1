#!/usr/bin/env pwsh
# Comprehensive workflow monitor - watches all workflows until complete success

$env:GH_TOKEN = "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"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   COMPREHENSIVE WORKFLOW MONITOR - AUTO FIX & RETRY          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$maxAttempts = 10
$checkInterval = 45

function Get-ActiveWorkflows {
    $allRuns = gh run list --limit 20 --json databaseId,status,conclusion,workflowName,displayTitle,createdAt | ConvertFrom-Json
    $active = $allRuns | Where-Object { $_.status -ne "completed" }
    return $active
}

function Watch-WorkflowCompletion {
    param([string]$RunId, [string]$WorkflowName)
    
    Write-Host "`n👁️ Monitoring: $WorkflowName (Run: $RunId)" -ForegroundColor Cyan
    
    $completed = $false
    $checks = 0
    
    while (-not $completed -and $checks -lt 60) {
        $checks++
        Start-Sleep -Seconds $checkInterval
        
        try {
            $info = gh run view $RunId --json status,conclusion 2>&1 | ConvertFrom-Json
            $status = $info.status
            $conclusion = $info.conclusion
            
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "  [$timestamp] Check #$checks - Status: $status" -ForegroundColor Yellow
            
            if ($status -eq "completed") {
                $completed = $true
                return @{ Success = ($conclusion -eq "success"); Conclusion = $conclusion }
            }
        } catch {
            Write-Host "  [Error checking status]" -ForegroundColor Red
        }
    }
    
    return @{ Success = $false; Conclusion = "timeout" }
}

# Main monitoring loop
$attempt = 0
$infrastructureComplete = $false
$deploymentComplete = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    
    Write-Host "`n╔════════════════ CYCLE $attempt/$maxAttempts ═══════════════════╗" -ForegroundColor Cyan
    
    # Check active workflows
    $active = Get-ActiveWorkflows
    
    if ($active) {
        Write-Host "`n📊 Active workflows: $($active.Count)" -ForegroundColor Yellow
        
        foreach ($run in $active) {
            Write-Host "   → $($run.workflowName) (ID: $($run.databaseId))" -ForegroundColor White
            
            # Monitor infrastructure first
            if ($run.workflowName -match "Infrastructure|Terraform" -and -not $infrastructureComplete) {
                $result = Watch-WorkflowCompletion -RunId $run.databaseId -WorkflowName $run.workflowName
                
                if ($result.Success) {
                    Write-Host "`n✅ Infrastructure setup COMPLETE!" -ForegroundColor Green
                    $infrastructureComplete = $true
                    
                    # Now trigger deployment
                    Write-Host "`n🚀 Triggering deployment workflow..." -ForegroundColor Cyan
                    gh workflow run auto-deploy.yml -f environment=production -f deploy_backend=true -f deploy_frontend=true
                    Start-Sleep -Seconds 10
                } else {
                    Write-Host "`n❌ Infrastructure failed: $($result.Conclusion)" -ForegroundColor Red
                    Write-Host "   Retrying infrastructure setup..." -ForegroundColor Yellow
                    gh workflow run infrastructure.yml -f apply=yes
                    Start-Sleep -Seconds 10
                }
            }
            
            # Monitor deployment
            if ($run.workflowName -match "Build and Deploy" -and $infrastructureComplete -and -not $deploymentComplete) {
                $result = Watch-WorkflowCompletion -RunId $run.databaseId -WorkflowName $run.workflowName
                
                if ($result.Success) {
                    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green -BackgroundColor DarkGreen
                    Write-Host "║                                                                ║" -ForegroundColor Green -BackgroundColor DarkGreen
                    Write-Host "║     ✅✅✅ ALL WORKFLOWS COMPLETED SUCCESSFULLY! ✅✅✅         ║" -ForegroundColor Green -BackgroundColor DarkGreen
                    Write-Host "║                                                                ║" -ForegroundColor Green -BackgroundColor DarkGreen
                    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green -BackgroundColor DarkGreen
                    
                    $deploymentComplete = $true
                    exit 0
                } else {
                    Write-Host "`n❌ Deployment failed: $($result.Conclusion)" -ForegroundColor Red
                    
                    # Analyze and retry
                    Write-Host "   Analyzing error and retrying..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 30
                    gh workflow run auto-deploy.yml -f environment=production -f deploy_backend=true -f deploy_frontend=true
                    Start-Sleep -Seconds 10
                }
            }
        }
    } else {
        Write-Host "`n⏳ No active workflows, checking completion status..." -ForegroundColor Yellow
        
        # Check if everything is done
        $recent = gh run list --limit 5 --json workflowName,conclusion | ConvertFrom-Json
        $infraSuccess = $recent | Where-Object { $_.workflowName -match "Infrastructure|Terraform" -and $_.conclusion -eq "success" }
        $deploySuccess = $recent | Where-Object { $_.workflowName -match "Build and Deploy" -and $_.conclusion -eq "success" }
        
        if ($infraSuccess -and $deploySuccess) {
            Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host "║     ✅ ALL WORKFLOWS COMPLETED SUCCESSFULLY! ✅                ║" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green -BackgroundColor DarkGreen
            exit 0
        }
        
        if (-not $infrastructureComplete) {
            Write-Host "   Triggering infrastructure setup..." -ForegroundColor Yellow
            gh workflow run infrastructure.yml -f apply=yes
            Start-Sleep -Seconds 10
        }
    }
    
    Write-Host "`n⏳ Waiting $checkInterval seconds before next check..." -ForegroundColor Gray
    Start-Sleep -Seconds $checkInterval
}

Write-Host "`n⚠️ Maximum attempts reached. Please check manually." -ForegroundColor Yellow
exit 1
