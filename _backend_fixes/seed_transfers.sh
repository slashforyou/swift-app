#!/bin/bash
# Seed job_transfers with resource data using admin mysql access

MYSQL="sudo -u mysql mysql swiftapp"

echo "=== Checking job_transfers ==="
$MYSQL -e "SELECT id, job_id, status FROM job_transfers ORDER BY id;"

echo "=== Checking trucks ==="
$MYSQL -e "SELECT id FROM trucks LIMIT 5;"

echo "=== Getting truck IDs ==="
TRUCK_IDS=$($MYSQL -sN -e "SELECT id FROM trucks ORDER BY id LIMIT 5;")
TRUCK_ARR=($TRUCK_IDS)
echo "Truck IDs: ${TRUCK_ARR[@]}"

echo "=== Getting transfer IDs ==="
TRANSFER_IDS=$($MYSQL -sN -e "SELECT id FROM job_transfers ORDER BY id;")

echo "=== Updating transfers ==="
i=0
for TID in $TRANSFER_IDS; do
  case $((i % 8)) in
    0) D=1; O=0; PA=120; PT="hourly"; NOTE="1 chauffeur + camion requis" ;;
    1) D=2; O=1; PA=850; PT="flat"; NOTE="2 chauffeurs + 1 offsider" ;;
    2) D=1; O=2; PA=95;  PT="hourly"; NOTE="Demenagement complet" ;;
    3) D=0; O=2; PA=1200;PT="flat"; NOTE="Equipe manutention (2 packers)" ;;
    4) D=1; O=1; PA=680; PT="daily"; NOTE="Livraison standard" ;;
    5) D=2; O=0; PA=110; PT="hourly"; NOTE="2 chauffeurs + 1 packer" ;;
    6) D=1; O=3; PA=1500;PT="flat"; NOTE="Equipe offsider requise (3)" ;;
    7) D=0; O=1; PA=750; PT="daily"; NOTE="Emballage prioritaire (3 packers)" ;;
  esac
  
  # Pick a truck ID if we have any
  if [ ${#TRUCK_ARR[@]} -gt 0 ] && [ $D -gt 0 ]; then
    TRUCK_IDX=$((i % ${#TRUCK_ARR[@]}))
    TRUCK="'${TRUCK_ARR[$TRUCK_IDX]}'"
  else
    TRUCK="NULL"
  fi

  SQL="UPDATE job_transfers SET requested_drivers=$D, requested_offsiders=$O, preferred_truck_id=$TRUCK, resource_note='$NOTE', pricing_amount=$PA, pricing_type='$PT' WHERE id=$TID;"
  $MYSQL -e "$SQL" 2>&1
  echo "Transfer $TID: drivers=$D offsiders=$O truck=$TRUCK price=$PA $PT"
  i=$((i+1))
done

echo "=== Verification ==="
$MYSQL -e "SELECT id, requested_drivers, requested_offsiders, preferred_truck_id, pricing_amount, pricing_type, LEFT(resource_note, 30) as note FROM job_transfers;"
