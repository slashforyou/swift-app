#!/bin/bash
# Fix existing companies without email - backfill from owner user email
DB_USER="swiftapp_user"
DB_PASS="U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME="swiftapp"

MYSQL="mysql -u $DB_USER -p$DB_PASS $DB_NAME"

echo "=== Companies without email ==="
$MYSQL -e "
SELECT c.id, c.name, c.email, u.email as user_email 
FROM companies c 
LEFT JOIN users u ON u.company_id = c.id AND u.company_role = 'patron' 
WHERE c.email IS NULL OR c.email = '' 
LIMIT 20;
"

echo "--- Backfilling missing emails ---"
$MYSQL -e "
UPDATE companies c
JOIN users u ON u.company_id = c.id AND u.company_role = 'patron'
SET c.email = u.email
WHERE (c.email IS NULL OR c.email = '') AND u.email IS NOT NULL AND u.email != '';
"

echo "=== Remaining companies without email ==="
$MYSQL -e "
SELECT c.id, c.name, c.email 
FROM companies c 
WHERE c.email IS NULL OR c.email = '' 
LIMIT 20;
"

echo "✅ Backfill complete"
