#!/bin/bash
# Check VM 138.2.180.83 firewall status from Cloud Shell

IP="138.2.180.83"

echo "=== Testing connectivity from Cloud Shell ==="
timeout 5 nc -zv $IP 22 2>&1

echo -e "\n=== Getting VM instance details ==="
oci compute instance list \
  --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" \
  --display-name "megilance-backend-FINAL" \
  --query 'data[0].{id:id,state:"lifecycle-state",ip:""}' \
  --output table

echo -e "\n=== Getting instance console connection for firewall fix ==="
INSTANCE_ID=$(oci compute instance list \
  --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" \
  --display-name "megilance-backend-FINAL" \
  --query 'data[0].id' \
  --raw-output)

echo "Instance ID: $INSTANCE_ID"

# Check if console connection exists
CONSOLE_CONN=$(oci compute instance-console-connection list \
  --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" \
  --instance-id "$INSTANCE_ID" \
  --query 'data[0].id' \
  --raw-output 2>/dev/null)

if [ -z "$CONSOLE_CONN" ] || [ "$CONSOLE_CONN" == "null" ]; then
    echo "No console connection. Creating one..."
    oci compute instance-console-connection create \
      --instance-id "$INSTANCE_ID" \
      --ssh-public-key-file ~/.ssh/id_rsa.pub \
      --wait-for-state ACTIVE
    
    CONSOLE_CONN=$(oci compute instance-console-connection list \
      --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" \
      --instance-id "$INSTANCE_ID" \
      --query 'data[0].id' \
      --raw-output)
fi

echo -e "\n=== Console Connection Details ==="
oci compute instance-console-connection get --instance-console-connection-id "$CONSOLE_CONN"

echo -e "\n\n=== SOLUTION ==="
echo "The VM firewall is blocking SSH. You have 3 options:"
echo ""
echo "1️⃣  EASIEST - Delete and recreate with working cloud-init:"
echo "   oci compute instance terminate --instance-id $INSTANCE_ID --force --wait-for-state TERMINATED"
echo "   Then run: .\FINAL-CREATE-VM-WORKING-SUBNET.ps1"
echo ""
echo "2️⃣  Use Console Connection (requires manual interaction):"
echo "   - Go to Oracle Console → Compute → Instance → Console Connection"
echo "   - Click 'Connect' and follow SSH instructions"
echo "   - Login and run: sudo ufw disable && sudo iptables -F"
echo ""
echo "3️⃣  Wait 5 more minutes for cloud-init to finish"
echo "   Sometimes cloud-init takes 10+ minutes on first boot"
