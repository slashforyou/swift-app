#!/bin/bash
ROUTE="  app.get('/swift-app/v1/billing/monthly-invoices/clients', authenticateToken, monthlyInvoices.listInvoiceClients);"
FILE="/srv/www/htdocs/swiftapp/server/index.js"

# Check if route already exists
if grep -q 'monthly-invoices/clients' "$FILE"; then
  echo "Route already exists"
  exit 0
fi

LINE_NUM=$(grep -n 'monthly-invoices/generate' "$FILE" | head -1 | cut -d: -f1)
if [ -n "$LINE_NUM" ]; then
  sed -i "${LINE_NUM}a\\${ROUTE}" "$FILE"
  echo "Route added after line $LINE_NUM"
else
  echo "ERROR: Could not find generate route"
  exit 1
fi
