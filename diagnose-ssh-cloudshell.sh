#!/bin/bash
# Test SSH from Oracle Cloud Shell (bypasses local network issues)

IP="193.122.57.193"

echo "=== Testing from Cloud Shell (bypasses local firewall) ==="
timeout 10 nc -zv $IP 22 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Port 22 is OPEN from Cloud Shell!"
    echo "Problem is your LOCAL network blocking outbound SSH"
else
    echo "❌ Port 22 blocked even from Cloud Shell"
    echo "This means Oracle's Network Security Group or route table issue"
fi

echo -e "\n=== Checking Internet Gateway ==="
SUBNET_ID="ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaaxopxgcqddh2bdfrlbzj2mpqzhsgi4ulur2hbvrsv4r7x6clizgxq"
VCN_ID=$(oci network subnet get --subnet-id "$SUBNET_ID" --query 'data."vcn-id"' --raw-output)

echo "VCN ID: $VCN_ID"

# Check for Internet Gateway
IGW=$(oci network internet-gateway list --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" --vcn-id "$VCN_ID" --query 'data[0]."lifecycle-state"' --raw-output)

echo "Internet Gateway State: $IGW"

if [ "$IGW" != "AVAILABLE" ]; then
    echo "❌ PROBLEM: Internet Gateway not available!"
    echo "This subnet cannot reach the internet"
fi

echo -e "\n=== Checking Route Table ==="
ROUTE_TABLE_ID=$(oci network subnet get --subnet-id "$SUBNET_ID" --query 'data."route-table-id"' --raw-output)
echo "Route Table: $ROUTE_TABLE_ID"

oci network route-table get --rt-id "$ROUTE_TABLE_ID" --query 'data."route-rules"[].{dest:destination, target:"network-entity-id"}' --output table

echo -e "\n=== DIAGNOSIS ==="
echo "If nc shows 'Connection refused' → SSH is reachable but not running"
echo "If nc shows 'Connection timed out' → Firewall/routing blocking"
echo "If IGW not AVAILABLE → Subnet can't reach internet"
