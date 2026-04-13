#!/bin/bash
# Fix subscribe.js: add email to company INSERT

FILE="/srv/www/htdocs/swiftapp/server/endPoints/subscribe.js"

# Replace the INSERT INTO companies line to include email
sed -i "s|INSERT INTO companies (name, company_code) VALUES (?, ?)|INSERT INTO companies (name, company_code, email) VALUES (?, ?, ?)|" "$FILE"

# Replace the parameters array to include mail
sed -i 's|\[companyName.trim(), companyCode\]|[companyName.trim(), companyCode, mail]|' "$FILE"

echo "✅ subscribe.js patched - company email now stored"

# Verify
grep -n "INSERT INTO companies" "$FILE"
grep -n "companyCode, mail" "$FILE"
