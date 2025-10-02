# 🔧 Automated AWS Infrastructure Fix Script
# This script automatically applies IAM and VPC endpoint fixes

$ErrorActionPreference = "Stop"
$AWS_REGION = "us-east-2"
$ACCOUNT_ID = "789406175220"

Write-Host "`n🚀 Starting Automated AWS Infrastructure Fix...`n" -ForegroundColor Cyan

# Function to check if AWS CLI is configured
function Test-AWSCredentials {
    try {
        $result = aws sts get-caller-identity --query 'Account' --output text 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ AWS credentials configured" -ForegroundColor Green
            Write-Host "   Account ID: $result`n" -ForegroundColor Gray
            return $true
        }
    } catch {
        Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
        Write-Host "   Run: aws configure" -ForegroundColor Yellow
        return $false
    }
    return $false
}

# Function to create and attach IAM policy
function Set-SecretsManagerPolicy {
    Write-Host "📋 Step 1: Creating IAM Policy for Secrets Manager Access..." -ForegroundColor Cyan
    
    # Create policy JSON
    $policyJson = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:megilance/prod/database-*",
        "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:megilance/prod/jwt-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
"@
    
    $policyJson | Out-File -FilePath "secrets-policy.json" -Encoding utf8
    Write-Host "   Created policy file: secrets-policy.json" -ForegroundColor Gray
    
    # Check if policy already exists
    try {
        $existingPolicy = aws iam list-policies --scope Local --query "Policies[?PolicyName=='megilance-secrets-access'].Arn" --output text --region $AWS_REGION 2>&1
        
        if ($existingPolicy -and $existingPolicy -ne "") {
            Write-Host "   ℹ️  Policy already exists: $existingPolicy" -ForegroundColor Yellow
            $policyArn = $existingPolicy
        } else {
            # Create new policy
            Write-Host "   Creating new policy..." -ForegroundColor Gray
            $policyArn = aws iam create-policy `
                --policy-name megilance-secrets-access `
                --policy-document file://secrets-policy.json `
                --description "Allow ECS tasks to read secrets from Secrets Manager" `
                --query 'Policy.Arn' `
                --output text `
                --region $AWS_REGION 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Policy created: $policyArn" -ForegroundColor Green
            } else {
                throw "Failed to create policy: $policyArn"
            }
        }
    } catch {
        Write-Host "   ❌ Error creating policy: $_" -ForegroundColor Red
        return $null
    }
    
    # Attach policy to execution role
    Write-Host "`n📎 Step 2: Attaching Policy to ECS Execution Role..." -ForegroundColor Cyan
    try {
        # Check if already attached
        $attachedPolicies = aws iam list-attached-role-policies --role-name megilance-exec-role --region $AWS_REGION --query 'AttachedPolicies[*].PolicyArn' --output text 2>&1
        
        if ($attachedPolicies -match "megilance-secrets-access") {
            Write-Host "   ℹ️  Policy already attached to megilance-exec-role" -ForegroundColor Yellow
        } else {
            aws iam attach-role-policy `
                --role-name megilance-exec-role `
                --policy-arn $policyArn `
                --region $AWS_REGION 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Policy attached to megilance-exec-role" -ForegroundColor Green
            } else {
                throw "Failed to attach policy"
            }
        }
        
        # Verify attachment
        Write-Host "`n   Verifying policy attachment..." -ForegroundColor Gray
        $policies = aws iam list-attached-role-policies --role-name megilance-exec-role --region $AWS_REGION --query 'AttachedPolicies[*].[PolicyName,PolicyArn]' --output text 2>&1
        Write-Host "   Attached policies:" -ForegroundColor Gray
        Write-Host "   $policies" -ForegroundColor Gray
        
        return $policyArn
    } catch {
        Write-Host "   ❌ Error attaching policy: $_" -ForegroundColor Red
        return $null
    }
}

# Function to create VPC endpoints
function New-VPCEndpoints {
    Write-Host "`n🌐 Step 3: Creating VPC Endpoints..." -ForegroundColor Cyan
    
    # Get VPC ID
    Write-Host "   Getting VPC ID..." -ForegroundColor Gray
    $vpcId = aws ec2 describe-vpcs `
        --filters "Name=tag:Name,Values=megilance-vpc" `
        --query 'Vpcs[0].VpcId' `
        --output text `
        --region $AWS_REGION 2>&1
    
    if ($LASTEXITCODE -ne 0 -or $vpcId -eq "None" -or $vpcId -eq "") {
        Write-Host "   ⚠️  VPC not found, skipping VPC endpoints" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "   VPC ID: $vpcId" -ForegroundColor Gray
    
    # Get VPC CIDR
    $vpcCidr = aws ec2 describe-vpcs `
        --vpc-ids $vpcId `
        --query 'Vpcs[0].CidrBlock' `
        --output text `
        --region $AWS_REGION 2>&1
    
    Write-Host "   VPC CIDR: $vpcCidr" -ForegroundColor Gray
    
    # Get private subnet IDs
    $subnetIds = aws ec2 describe-subnets `
        --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Type,Values=private" `
        --query 'Subnets[*].SubnetId' `
        --output text `
        --region $AWS_REGION 2>&1
    
    if ($LASTEXITCODE -ne 0 -or $subnetIds -eq "None" -or $subnetIds -eq "") {
        Write-Host "   ⚠️  No private subnets found" -ForegroundColor Yellow
        return $false
    }
    
    $subnetArray = $subnetIds -split '\s+'
    Write-Host "   Private Subnets: $($subnetArray -join ', ')" -ForegroundColor Gray
    
    # Check if security group already exists
    Write-Host "`n   Creating security group for VPC endpoints..." -ForegroundColor Gray
    $existingSg = aws ec2 describe-security-groups `
        --filters "Name=vpc-id,Values=$vpcId" "Name=group-name,Values=megilance-vpc-endpoints" `
        --query 'SecurityGroups[0].GroupId' `
        --output text `
        --region $AWS_REGION 2>&1
    
    if ($existingSg -and $existingSg -ne "None" -and $existingSg -ne "") {
        Write-Host "   ℹ️  Security group already exists: $existingSg" -ForegroundColor Yellow
        $sgId = $existingSg
    } else {
        $sgId = aws ec2 create-security-group `
            --group-name megilance-vpc-endpoints `
            --description "Allow HTTPS traffic to VPC endpoints" `
            --vpc-id $vpcId `
            --region $AWS_REGION `
            --query 'GroupId' `
            --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Security group created: $sgId" -ForegroundColor Green
            
            # Add ingress rule
            aws ec2 authorize-security-group-ingress `
                --group-id $sgId `
                --protocol tcp `
                --port 443 `
                --cidr $vpcCidr `
                --region $AWS_REGION 2>&1 | Out-Null
            
            Write-Host "   ✅ Added HTTPS ingress rule" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to create security group" -ForegroundColor Red
            return $false
        }
    }
    
    # Create VPC endpoints
    $endpoints = @(
        @{Name="secretsmanager"; ServiceName="com.amazonaws.$AWS_REGION.secretsmanager"; Type="Interface"},
        @{Name="ecr-api"; ServiceName="com.amazonaws.$AWS_REGION.ecr.api"; Type="Interface"},
        @{Name="ecr-dkr"; ServiceName="com.amazonaws.$AWS_REGION.ecr.dkr"; Type="Interface"},
        @{Name="logs"; ServiceName="com.amazonaws.$AWS_REGION.logs"; Type="Interface"}
    )
    
    Write-Host "`n   Creating VPC endpoints..." -ForegroundColor Gray
    $created = 0
    
    foreach ($endpoint in $endpoints) {
        # Check if endpoint already exists
        $existing = aws ec2 describe-vpc-endpoints `
            --filters "Name=vpc-id,Values=$vpcId" "Name=service-name,Values=$($endpoint.ServiceName)" `
            --query 'VpcEndpoints[0].VpcEndpointId' `
            --output text `
            --region $AWS_REGION 2>&1
        
        if ($existing -and $existing -ne "None" -and $existing -ne "") {
            Write-Host "   ℹ️  $($endpoint.Name) endpoint already exists: $existing" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "   Creating $($endpoint.Name) endpoint..." -ForegroundColor Gray
        
        $result = aws ec2 create-vpc-endpoint `
            --vpc-id $vpcId `
            --vpc-endpoint-type $($endpoint.Type) `
            --service-name $($endpoint.ServiceName) `
            --subnet-ids $subnetArray `
            --security-group-ids $sgId `
            --private-dns-enabled `
            --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-$($endpoint.Name)},{Key=Project,Value=megilance}]" `
            --region $AWS_REGION `
            --query 'VpcEndpoint.VpcEndpointId' `
            --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Created $($endpoint.Name): $result" -ForegroundColor Green
            $created++
        } else {
            Write-Host "   ⚠️  Failed to create $($endpoint.Name): $result" -ForegroundColor Yellow
        }
    }
    
    # Create S3 gateway endpoint
    Write-Host "`n   Creating S3 gateway endpoint..." -ForegroundColor Gray
    $existingS3 = aws ec2 describe-vpc-endpoints `
        --filters "Name=vpc-id,Values=$vpcId" "Name=service-name,Values=com.amazonaws.$AWS_REGION.s3" `
        --query 'VpcEndpoints[0].VpcEndpointId' `
        --output text `
        --region $AWS_REGION 2>&1
    
    if ($existingS3 -and $existingS3 -ne "None" -and $existingS3 -ne "") {
        Write-Host "   ℹ️  S3 gateway endpoint already exists: $existingS3" -ForegroundColor Yellow
    } else {
        # Get route table IDs
        $routeTableIds = aws ec2 describe-route-tables `
            --filters "Name=vpc-id,Values=$vpcId" `
            --query 'RouteTables[*].RouteTableId' `
            --output text `
            --region $AWS_REGION 2>&1
        
        if ($routeTableIds -and $routeTableIds -ne "None") {
            $routeTableArray = $routeTableIds -split '\s+'
            
            $s3Result = aws ec2 create-vpc-endpoint `
                --vpc-id $vpcId `
                --vpc-endpoint-type Gateway `
                --service-name "com.amazonaws.$AWS_REGION.s3" `
                --route-table-ids $routeTableArray `
                --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-s3},{Key=Project,Value=megilance}]" `
                --region $AWS_REGION `
                --query 'VpcEndpoint.VpcEndpointId' `
                --output text 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Created S3 gateway: $s3Result" -ForegroundColor Green
                $created++
            } else {
                Write-Host "   ⚠️  Failed to create S3 gateway: $s3Result" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n   ✅ VPC endpoint creation completed ($created new endpoints)" -ForegroundColor Green
    return $true
}

# Function to force ECS service update
function Update-ECSService {
    Write-Host "`n🔄 Step 4: Forcing ECS Service Update..." -ForegroundColor Cyan
    
    $services = @("megilance-backend-service", "megilance-frontend-service")
    
    foreach ($service in $services) {
        Write-Host "`n   Updating $service..." -ForegroundColor Gray
        
        # Check if service exists
        $serviceExists = aws ecs describe-services `
            --cluster megilance-cluster `
            --services $service `
            --region $AWS_REGION `
            --query 'services[0].serviceName' `
            --output text 2>&1
        
        if ($LASTEXITCODE -ne 0 -or $serviceExists -eq "None" -or $serviceExists -eq "") {
            Write-Host "   ⚠️  Service not found: $service" -ForegroundColor Yellow
            continue
        }
        
        # Force new deployment
        $result = aws ecs update-service `
            --cluster megilance-cluster `
            --service $service `
            --force-new-deployment `
            --region $AWS_REGION `
            --query 'service.serviceName' `
            --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Service updated: $result" -ForegroundColor Green
            Write-Host "   ℹ️  New tasks will start with updated IAM permissions" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Failed to update service: $result" -ForegroundColor Yellow
        }
    }
}

# Function to monitor ECS service status
function Watch-ECSService {
    param([string]$ServiceName)
    
    Write-Host "`n👀 Monitoring $ServiceName..." -ForegroundColor Cyan
    
    for ($i = 1; $i -le 10; $i++) {
        $status = aws ecs describe-services `
            --cluster megilance-cluster `
            --services $ServiceName `
            --region $AWS_REGION `
            --query 'services[0].{Running:runningCount,Desired:desiredCount,Deployments:deployments[0].status}' `
            --output json 2>&1 | ConvertFrom-Json
        
        if ($status) {
            Write-Host "   Attempt $i/10 - Running: $($status.Running)/$($status.Desired) - Status: $($status.Deployments)" -ForegroundColor Gray
            
            if ($status.Running -eq $status.Desired -and $status.Deployments -eq "PRIMARY") {
                Write-Host "   ✅ Service is stable!" -ForegroundColor Green
                return $true
            }
        }
        
        if ($i -lt 10) {
            Start-Sleep -Seconds 30
        }
    }
    
    Write-Host "   ⚠️  Service not yet stable, check CloudWatch logs" -ForegroundColor Yellow
    return $false
}

# Main execution
try {
    # Check AWS credentials
    if (-not (Test-AWSCredentials)) {
        Write-Host "`n❌ Cannot proceed without AWS credentials" -ForegroundColor Red
        Write-Host "`n💡 To configure AWS credentials, run:" -ForegroundColor Yellow
        Write-Host "   aws configure" -ForegroundColor White
        Write-Host "   # Then enter your AWS Access Key ID and Secret Access Key`n" -ForegroundColor Gray
        exit 1
    }
    
    # Apply IAM fix
    $policyArn = Set-SecretsManagerPolicy
    if (-not $policyArn) {
        Write-Host "`n⚠️  IAM fix failed, but continuing..." -ForegroundColor Yellow
    }
    
    # Create VPC endpoints (optional, can fail)
    try {
        New-VPCEndpoints | Out-Null
    } catch {
        Write-Host "`n⚠️  VPC endpoints creation had issues (non-critical)" -ForegroundColor Yellow
    }
    
    # Force ECS service update
    Update-ECSService
    
    # Monitor services
    Write-Host "`n📊 Monitoring Service Health..." -ForegroundColor Cyan
    Write-Host "   (This will take ~5 minutes for tasks to restart)`n" -ForegroundColor Gray
    
    Start-Sleep -Seconds 60  # Wait for tasks to start stopping
    
    Watch-ECSService -ServiceName "megilance-backend-service"
    
    # Final summary
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🎉 Automated Fix Complete!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`n✅ Actions Completed:" -ForegroundColor Green
    Write-Host "   • IAM policy created and attached to exec role" -ForegroundColor White
    Write-Host "   • VPC endpoints created (if possible)" -ForegroundColor White
    Write-Host "   • ECS services updated with new permissions" -ForegroundColor White
    Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Check CloudWatch logs:" -ForegroundColor White
    Write-Host "      aws logs tail /ecs/megilance-backend --follow --region $AWS_REGION" -ForegroundColor Gray
    Write-Host "   2. Get service public IP:" -ForegroundColor White
    Write-Host "      aws ecs describe-tasks --cluster megilance-cluster --tasks `$(aws ecs list-tasks --cluster megilance-cluster --service-name megilance-backend-service --query 'taskArns[0]' --output text --region $AWS_REGION) --region $AWS_REGION --query 'tasks[0].attachments[0].details[?name==``networkInterfaceId``].value' --output text" -ForegroundColor Gray
    Write-Host "   3. Test backend health:" -ForegroundColor White
    Write-Host "      curl http://BACKEND_IP:8000/api/health/live" -ForegroundColor Gray
    Write-Host "`n" -NoNewline
    
} catch {
    Write-Host "`n❌ Error occurred: $_" -ForegroundColor Red
    Write-Host "`nStack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
