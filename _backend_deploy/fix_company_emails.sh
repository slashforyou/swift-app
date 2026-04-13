#!/bin/bash
# Fix existing companies without email - backfill from owner user email
mysql -u root swiftapp -e "
SELECT c.id, c.name, c.email, u.email as user_email 
FROM companies c 
LEFT JOIN users u ON u.company_id = c.id AND u.company_role = 'patron' 
WHERE c.email IS NULL OR c.email = '' 
LIMIT 20;
"

echo "--- Backfilling missing emails ---"

mysql -u root swiftapp -e "
UPDATE companies c
JOIN users u ON u.company_id = c.id AND u.company_role = 'patron'
SET c.email = u.email
WHERE (c.email IS NULL OR c.email = '') AND u.email IS NOT NULL AND u.email != '';
"

echo "✅ Backfill complete"

mysql -u root swiftapp -e "
SELECT c.id, c.name, c.email 
FROM companies c 
WHERE c.email IS NULL OR c.email = '' 
LIMIT 20;
"
