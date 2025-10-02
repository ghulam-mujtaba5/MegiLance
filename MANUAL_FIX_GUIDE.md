# 🔧 Manual Fix Guide - Apply IAM and VPC Endpoint Changes

## Issue
Terraform state is out of sync - it's trying to create resources that already exist in AWS.

## Solution
Apply the IAM and VPC endpoint changes manually using AWS CLI, then import into Terraform state.

---

## ⚠️ Current Status

### Terraform Workflow
**Status:** ❌ Failed  
**Reason:** Resources already exist (IAM roles, VPC, ECR repos, secrets)  
**Error:** `EntityAlreadyExists`, `VpcLimitExceeded`, `RepositoryAlreadyExistsException`, etc.

### Deployment Workflow
**Status:** ⏳ Still Running (5+ minutes)  
**Run ID:** 18198066766  
**What it's doing:** Building and deploying with our fixed secret ARN format

---

## 🎯 Priority Actions

### Option 1: Wait for Deployment Workflow ⏳ (RECOMMENDED)

The deployment workflow might succeed even without Terraform changes because:
- ✅ We fixed the secret ARN format in `auto-deploy.yml`
- ✅ Task definition will use correct `valueFrom` with JSON keys
- ⚠️ But exec role still lacks Secrets Manager permissions
- ⚠️ And VPC endpoints don't exist yet

**Let it run to completion** (should finish in ~10-15 minutes total)

If it **fails again** with `ResourceInitializationError`, proceed to Option 2.

---

### Option 2: Manual IAM Policy Fix (IMMEDIATE)

Apply IAM permissions manually to unblock ECS tasks:

#### Step 1: Create IAM Policy
```bash
# Create the secrets access policy JSON
cat > secrets-policy.json << 'EOF'
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
        "arn:aws:secretsmanager:us-east-2:789406175220:secret:megilance/prod/database-*",
        "arn:aws:secretsmanager:us-east-2:789406175220:secret:megilance/prod/jwt-*"
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
EOF

# Create the policy (if doesn't exist)
aws iam create-policy \
  --policy-name megilance-secrets-access \
  --policy-document file://secrets-policy.json \
  --description "Allow ECS tasks to read secrets from Secrets Manager" \
  --region us-east-2

# If policy exists, get its ARN
POLICY_ARN=$(aws iam list-policies \
  --scope Local \
  --query 'Policies[?PolicyName==`megilance-secrets-access`].Arn' \
  --output text)

echo "Policy ARN: $POLICY_ARN"
```

#### Step 2: Attach Policy to Exec Role
```bash
# Attach to execution role
aws iam attach-role-policy \
  --role-name megilance-exec-role \
  --policy-arn $POLICY_ARN \
  --region us-east-2

# Verify attachment
aws iam list-attached-role-policies \
  --role-name megilance-exec-role \
  --region us-east-2
```

**Expected Output:**
```json
{
    "AttachedPolicies": [
        {
            "PolicyName": "AmazonECSTaskExecutionRolePolicy",
            "PolicyArn": "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        },
        {
            "PolicyName": "megilance-secrets-access",
            "PolicyArn": "arn:aws:iam::789406175220:policy/megilance-secrets-access"
        }
    ]
}
```

---

### Option 3: Create VPC Endpoints (OPTIONAL - Better Performance)

VPC endpoints improve connectivity but aren't strictly required if NAT gateway exists.

#### Get Required IDs First
```bash
# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=megilance-vpc" \
  --query 'Vpcs[0].VpcId' \
  --output text \
  --region us-east-2)

echo "VPC ID: $VPC_ID"

# Get private subnet IDs
PRIVATE_SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=private" \
  --query 'Subnets[*].SubnetId' \
  --output text \
  --region us-east-2)

echo "Private Subnets: $PRIVATE_SUBNET_IDS"

# Get VPC CIDR
VPC_CIDR=$(aws ec2 describe-vpcs \
  --vpc-ids $VPC_ID \
  --query 'Vpcs[0].CidrBlock' \
  --output text \
  --region us-east-2)

echo "VPC CIDR: $VPC_CIDR"
```

#### Create Security Group for Endpoints
```bash
# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name megilance-vpc-endpoints \
  --description "Allow HTTPS traffic to VPC endpoints" \
  --vpc-id $VPC_ID \
  --region us-east-2 \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# Add ingress rule for HTTPS from VPC
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr $VPC_CIDR \
  --region us-east-2
```

#### Create VPC Endpoints
```bash
# 1. Secrets Manager Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-2.secretsmanager \
  --subnet-ids $PRIVATE_SUBNET_IDS \
  --security-group-ids $SG_ID \
  --private-dns-enabled \
  --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-secretsmanager},{Key=Project,Value=megilance}]' \
  --region us-east-2

# 2. ECR API Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-2.ecr.api \
  --subnet-ids $PRIVATE_SUBNET_IDS \
  --security-group-ids $SG_ID \
  --private-dns-enabled \
  --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-ecr-api},{Key=Project,Value=megilance}]' \
  --region us-east-2

# 3. ECR DKR Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-2.ecr.dkr \
  --subnet-ids $PRIVATE_SUBNET_IDS \
  --security-group-ids $SG_ID \
  --private-dns-enabled \
  --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-ecr-dkr},{Key=Project,Value=megilance}]' \
  --region us-east-2

# 4. S3 Gateway Endpoint (for ECR layers)
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Gateway \
  --service-name com.amazonaws.us-east-2.s3 \
  --route-table-ids $(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[*].RouteTableId' --output text --region us-east-2) \
  --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-s3},{Key=Project,Value=megilance}]' \
  --region us-east-2

# 5. CloudWatch Logs Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-2.logs \
  --subnet-ids $PRIVATE_SUBNET_IDS \
  --security-group-ids $SG_ID \
  --private-dns-enabled \
  --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=megilance-logs},{Key=Project,Value=megilance}]' \
  --region us-east-2
```

#### Verify Endpoints Created
```bash
# List all VPC endpoints
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'VpcEndpoints[*].[VpcEndpointId, ServiceName, State]' \
  --output table \
  --region us-east-2
```

**Expected Output:**
```
-------------------------------------------------------------
|                   DescribeVpcEndpoints                   |
+---------------------------+------------------------------+
|  vpce-xxxx               |  secretsmanager  | available |
|  vpce-yyyy               |  ecr.api         | available |
|  vpce-zzzz               |  ecr.dkr         | available |
|  vpce-aaaa               |  s3              | available |
|  vpce-bbbb               |  logs            | available |
+---------------------------+------------------------------+
```

---

## 📋 Verification Steps

### 1. Check IAM Policy Attached
```bash
aws iam list-attached-role-policies \
  --role-name megilance-exec-role \
  --region us-east-2
```

### 2. Test Secret Access
```bash
# Try to get secret (should work if IAM is correct)
aws secretsmanager get-secret-value \
  --secret-id megilance/prod/database \
  --region us-east-2
```

### 3. Check VPC Endpoints Status
```bash
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" \
  --region us-east-2 \
  --query 'VpcEndpoints[*].[ServiceName, State]' \
  --output table
```

### 4. Force ECS Service Update
After IAM fix, force ECS to pull new task definition:
```bash
# Update service to force new deployment
aws ecs update-service \
  --cluster megilance-cluster \
  --service megilance-backend-service \
  --force-new-deployment \
  --region us-east-2
```

### 5. Monitor Task Startup
```bash
# Watch task events
aws ecs describe-tasks \
  --cluster megilance-cluster \
  --tasks $(aws ecs list-tasks --cluster megilance-cluster --service-name megilance-backend-service --desired-status RUNNING --region us-east-2 --query 'taskArns[0]' --output text) \
  --region us-east-2 \
  --query 'tasks[0].containers[0].lastStatus'

# Check logs
aws logs tail /ecs/megilance-backend --follow --region us-east-2
```

---

## 🔄 Import Resources into Terraform (Later)

Once everything works, import existing resources into Terraform state:

```bash
cd infra/terraform

# Import IAM roles
terraform import aws_iam_role.exec_role megilance-exec-role
terraform import aws_iam_role.task_role megilance-task-role
terraform import aws_iam_role.apprunner_ecr_access megilance-apprunner-ecr-access

# Import VPC
terraform import aws_vpc.main $VPC_ID

# Import ECR repos
terraform import 'aws_ecr_repository.backend[0]' megilance-backend
terraform import 'aws_ecr_repository.frontend[0]' megilance-frontend

# Import secrets
terraform import aws_secretsmanager_secret.db_credentials megilance/prod/database
terraform import aws_secretsmanager_secret.jwt megilance/prod/jwt

# Import VPC endpoints (after creating them)
terraform import aws_vpc_endpoint.secretsmanager vpce-xxxx
terraform import aws_vpc_endpoint.ecr_api vpce-yyyy
terraform import aws_vpc_endpoint.ecr_dkr vpce-zzzz
terraform import aws_vpc_endpoint.s3 vpce-aaaa
terraform import aws_vpc_endpoint.logs vpce-bbbb

# Verify state
terraform plan  # Should show no changes
```

---

## 🎯 Recommended Action Plan

### RIGHT NOW (5 min):
1. ⏳ **Wait** for current deployment workflow to finish (Run ID: 18198066766)
2. 👀 **Watch** for `ResourceInitializationError` in ECS task events

### IF DEPLOYMENT FAILS (15 min):
1. 🔧 **Apply Option 2** - Manual IAM policy fix (critical)
2. 🔄 **Force ECS service update** to pull new task
3. 📊 **Monitor** CloudWatch logs for successful secret retrieval

### FOR BETTER PERFORMANCE (30 min):
1. 🌐 **Apply Option 3** - Create VPC endpoints (optional)
2. 📥 **Import resources** into Terraform state
3. ✅ **Verify** with `terraform plan` (should show no changes)

---

## 🚨 Quick Troubleshooting

### Error: Unable to retrieve secret from asm
**Fix:** Apply Option 2 (IAM policy)

### Error: EntityAlreadyExists (Terraform)
**Fix:** Import existing resources or use AWS CLI directly

### Error: VpcLimitExceeded
**Fix:** Delete unused VPCs or request limit increase

### Error: Connection timeout to Secrets Manager
**Fix:** Check security groups allow HTTPS (443) from VPC CIDR

### Task keeps stopping immediately
**Fix:** Check CloudWatch logs: `aws logs tail /ecs/megilance-backend --follow --region us-east-2`

---

## 📊 Current State Summary

✅ **Code Fixed:**
- IAM policy defined in `iam.tf`
- VPC endpoints defined in `network.tf`
- Secret ARN format fixed in `auto-deploy.yml`

⚠️ **Infrastructure Status:**
- IAM: exec-role exists but missing secrets policy attachment
- VPC: Exists but no VPC endpoints
- Secrets: Exist with correct values
- ECR: Repos exist with Docker images

❌ **Terraform Status:**
- State out of sync with reality
- Trying to create existing resources
- Needs import or manual fixes

🔄 **Deployment Status:**
- Workflow running with fixed secret format
- May still fail due to missing IAM permissions
- VPC endpoints not critical if NAT works

---

## 💡 Key Insight

The **minimum required fix** to unblock deployment is:
1. ✅ Attach secrets policy to exec role (Option 2)
2. ✅ Ensure secret ARN format is correct (already done in code)

VPC endpoints are **nice to have** but not critical if NAT gateway is working.

**Execute Option 2 immediately if deployment fails again.**
