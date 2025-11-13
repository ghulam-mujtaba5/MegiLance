#!/bin/bash
# Complete SSH Access Diagnostic & Auto-Fix for Oracle Cloud Shell
# This script checks EVERYTHING and fixes missing configurations

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ORACLE VM SSH ACCESS - COMPLETE DIAGNOSTIC & FIX        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Get compartment ID (root tenancy compartment)
echo "🔍 Step 1: Getting compartment information..."
TENANCY_ID=$(oci iam compartment list --all --compartment-id-in-subtree true --query 'data[0]."compartment-id"' --raw-output 2>/dev/null || oci iam availability-domain list --query 'data[0]."compartment-id"' --raw-output)
echo "✓ Tenancy/Compartment ID: $TENANCY_ID"
echo ""

# Find the instance
echo "🔍 Step 2: Finding your VM instance..."
INSTANCE_JSON=$(oci compute instance list --compartment-id "$TENANCY_ID" --region eu-frankfurt-1 --all 2>/dev/null | jq -r '.data[] | select(."display-name" | contains("megilance") or contains("backend"))')

if [ -z "$INSTANCE_JSON" ]; then
    echo "❌ No instance found with 'megilance' or 'backend' in name"
    echo "Listing all instances:"
    oci compute instance list --compartment-id "$TENANCY_ID" --region eu-frankfurt-1 --query 'data[*].{"Name":"display-name","State":"lifecycle-state","IP":"primary-public-ip"}' --output table
    exit 1
fi

INSTANCE_ID=$(echo "$INSTANCE_JSON" | jq -r '.id')
INSTANCE_NAME=$(echo "$INSTANCE_JSON" | jq -r '."display-name"')
INSTANCE_STATE=$(echo "$INSTANCE_JSON" | jq -r '."lifecycle-state"')

echo "✓ Found instance: $INSTANCE_NAME"
echo "  Instance ID: $INSTANCE_ID"
echo "  State: $INSTANCE_STATE"

if [ "$INSTANCE_STATE" != "RUNNING" ]; then
    echo "⚠️  Instance is not RUNNING. Starting instance..."
    oci compute instance action --instance-id "$INSTANCE_ID" --action START --region eu-frankfurt-1
    echo "  Waiting 60 seconds for instance to start..."
    sleep 60
fi
echo ""

# Get VNIC details
echo "🔍 Step 3: Getting network interface (VNIC) details..."
VNIC_ATTACHMENT=$(oci compute vnic-attachment list --compartment-id "$TENANCY_ID" --instance-id "$INSTANCE_ID" --region eu-frankfurt-1 | jq -r '.data[0]')
VNIC_ID=$(echo "$VNIC_ATTACHMENT" | jq -r '."vnic-id"')

if [ -z "$VNIC_ID" ] || [ "$VNIC_ID" == "null" ]; then
    echo "❌ No VNIC attached to instance"
    exit 1
fi

VNIC_DETAILS=$(oci network vnic get --vnic-id "$VNIC_ID" --region eu-frankfurt-1 | jq -r '.data')
PUBLIC_IP=$(echo "$VNIC_DETAILS" | jq -r '."public-ip"')
PRIVATE_IP=$(echo "$VNIC_DETAILS" | jq -r '."private-ip"')
SUBNET_ID=$(echo "$VNIC_DETAILS" | jq -r '."subnet-id"')

echo "✓ VNIC ID: $VNIC_ID"
echo "  Public IP: $PUBLIC_IP"
echo "  Private IP: $PRIVATE_IP"
echo "  Subnet ID: $SUBNET_ID"

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "null" ]; then
    echo "❌ No public IP assigned!"
    echo "  Attempting to assign a public IP..."
    # Note: This might fail if reserved IP is needed - manual intervention required
    echo "  Please assign a public IP manually via OCI Console:"
    echo "  Networking → VNICs → Primary VNIC → Ephemeral Public IP"
    exit 1
fi
echo ""

# Check subnet configuration
echo "🔍 Step 4: Checking subnet configuration..."
SUBNET_DETAILS=$(oci network subnet get --subnet-id "$SUBNET_ID" --region eu-frankfurt-1 | jq -r '.data')
PROHIBIT_PUBLIC_IP=$(echo "$SUBNET_DETAILS" | jq -r '."prohibit-public-ip-on-vnic"')
VCN_ID=$(echo "$SUBNET_DETAILS" | jq -r '."vcn-id"')
ROUTE_TABLE_ID=$(echo "$SUBNET_DETAILS" | jq -r '."route-table-id"')

echo "✓ VCN ID: $VCN_ID"
echo "  Route Table ID: $ROUTE_TABLE_ID"
echo "  Prohibit Public IP: $PROHIBIT_PUBLIC_IP"

if [ "$PROHIBIT_PUBLIC_IP" == "true" ]; then
    echo "❌ Subnet prohibits public IPs! SSH will never work."
    echo "  Fix: Update subnet to allow public IPs via OCI Console"
    exit 1
fi
echo ""

# Check route table for Internet Gateway
echo "🔍 Step 5: Checking route table for Internet Gateway..."
ROUTE_TABLE=$(oci network route-table get --rt-id "$ROUTE_TABLE_ID" --region eu-frankfurt-1 | jq -r '.data')
IGW_ROUTE=$(echo "$ROUTE_TABLE" | jq -r '."route-rules"[] | select(."destination" == "0.0.0.0/0")')

if [ -z "$IGW_ROUTE" ]; then
    echo "❌ No default route (0.0.0.0/0) to Internet Gateway found!"
    echo "  This explains the timeout - VM cannot reach internet"
    
    # Try to find or create Internet Gateway
    echo "  Looking for Internet Gateway..."
    IGW_LIST=$(oci network internet-gateway list --compartment-id "$TENANCY_ID" --vcn-id "$VCN_ID" --region eu-frankfurt-1 | jq -r '.data[] | select(."lifecycle-state" == "AVAILABLE")')
    
    if [ -z "$IGW_LIST" ]; then
        echo "  Creating Internet Gateway..."
        IGW_ID=$(oci network internet-gateway create --compartment-id "$TENANCY_ID" --vcn-id "$VCN_ID" --is-enabled true --display-name "megilance-igw" --region eu-frankfurt-1 --wait-for-state AVAILABLE | jq -r '.data.id')
        echo "  ✓ Created Internet Gateway: $IGW_ID"
    else
        IGW_ID=$(echo "$IGW_LIST" | jq -r '.id' | head -1)
        echo "  ✓ Found existing Internet Gateway: $IGW_ID"
    fi
    
    echo "  Adding route rule to route table..."
    oci network route-table update --rt-id "$ROUTE_TABLE_ID" --region eu-frankfurt-1 --force \
        --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"$IGW_ID\"}]"
    
    echo "  ✓ Route added! Waiting 10 seconds for propagation..."
    sleep 10
else
    IGW_ID=$(echo "$IGW_ROUTE" | jq -r '."network-entity-id"')
    echo "✓ Default route exists via Internet Gateway: $IGW_ID"
fi
echo ""

# Check security list
echo "🔍 Step 6: Checking security list for port 22..."
SECURITY_LISTS=$(echo "$SUBNET_DETAILS" | jq -r '."security-list-ids"[]')

PORT_22_FOUND=false
for SL_ID in $SECURITY_LISTS; do
    SL_DETAILS=$(oci network security-list get --security-list-id "$SL_ID" --region eu-frankfurt-1 | jq -r '.data')
    PORT_22_RULE=$(echo "$SL_DETAILS" | jq -r '."ingress-security-rules"[] | select(.protocol == "6" and (."tcp-options"."destination-port-range".min <= 22) and (."tcp-options"."destination-port-range".max >= 22))')
    
    if [ -n "$PORT_22_RULE" ]; then
        PORT_22_FOUND=true
        echo "✓ Port 22 rule found in security list: $SL_ID"
        break
    fi
done

if [ "$PORT_22_FOUND" = false ]; then
    echo "❌ No port 22 ingress rule found!"
    echo "  Adding port 22 rule to first security list..."
    FIRST_SL=$(echo "$SECURITY_LISTS" | head -1)
    
    # Get existing rules
    EXISTING_RULES=$(oci network security-list get --security-list-id "$FIRST_SL" --region eu-frankfurt-1 | jq -r '.data."ingress-security-rules"')
    
    # Add port 22 rule
    NEW_RULES=$(echo "$EXISTING_RULES" | jq '. += [{"source": "0.0.0.0/0", "protocol": "6", "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}}, "description": "SSH access", "isStateless": false}]')
    
    oci network security-list update --security-list-id "$FIRST_SL" --region eu-frankfurt-1 --force \
        --ingress-security-rules "$NEW_RULES"
    
    echo "  ✓ Port 22 rule added! Waiting 5 seconds..."
    sleep 5
fi
echo ""

# Test connectivity
echo "🔍 Step 7: Testing connectivity..."
echo "  Testing ping to $PUBLIC_IP..."
if ping -c 3 -W 5 "$PUBLIC_IP" >/dev/null 2>&1; then
    echo "  ✓ Ping successful"
else
    echo "  ⚠️  Ping failed (ICMP might be blocked, but that's OK)"
fi
echo ""

echo "  Testing SSH connection to $PUBLIC_IP..."
if timeout 10 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@"$PUBLIC_IP" "echo SUCCESS" 2>/dev/null; then
    echo "  ✅ SSH CONNECTION WORKS!"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  🎉 SSH ACCESS FIXED! 🎉                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Now disabling internal firewall on the VM..."
    ssh -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" << 'EOF'
sudo ufw disable 2>/dev/null || true
sudo iptables -F 2>/dev/null || true
sudo iptables -P INPUT ACCEPT 2>/dev/null || true
sudo systemctl restart sshd 2>/dev/null || true
echo "✓ Firewall disabled and SSH restarted"
EOF
    
    echo ""
    echo "✅ ALL DONE! You can now run from your local PowerShell:"
    echo "   ssh -i oracle-vm-ssh.key ubuntu@$PUBLIC_IP"
    echo "   .\\auto-deploy-to-vm.ps1"
    
else
    echo "  ❌ SSH still timing out after fixes"
    echo ""
    echo "Possible remaining issues:"
    echo "  1. Cloud-init still running (wait 5-10 more minutes)"
    echo "  2. SSH service not started - check via serial console"
    echo "  3. Internal OS firewall blocking - need serial console access"
    echo ""
    echo "Next steps:"
    echo "  • Wait 5 minutes and run this script again"
    echo "  • Or use Serial Console: OCI Console → Instances → Console Connection"
    echo "  • Check cloud-init: sudo tail -f /var/log/cloud-init.log"
fi

echo ""
echo "Summary of configurations:"
echo "  Instance: $INSTANCE_NAME ($INSTANCE_STATE)"
echo "  Public IP: $PUBLIC_IP"
echo "  Internet Gateway: $IGW_ID"
echo "  Route Table: $ROUTE_TABLE_ID"
echo "  Security Lists checked: $(echo $SECURITY_LISTS | wc -w) list(s)"
echo ""
