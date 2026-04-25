#!/usr/bin/env bash
set -euo pipefail

cd /srv/www/htdocs/swiftapp/server

DB_HOST="$(grep '^DB_HOST=' .env | head -n1 | cut -d= -f2- || true)"
DB_USER="$(grep '^DB_USER=' .env | head -n1 | cut -d= -f2- || true)"
DB_PASS="$(grep '^DB_PASS=' .env | head -n1 | cut -d= -f2- || true)"
DB_NAME="$(grep '^DB_DATABASE=' .env | head -n1 | cut -d= -f2- || true)"

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-swiftapp_user}"
DB_NAME="${DB_NAME:-swiftapp}"

echo "[TABLES LIKE stripe]"
MYSQL_PWD="$DB_PASS" mysql -N -B -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e "SHOW TABLES LIKE '%stripe%';"

echo "[stripe_transactions schema]"
MYSQL_PWD="$DB_PASS" mysql -N -B -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e "SHOW COLUMNS FROM stripe_transactions;" || true

echo "[Latest stripe_transactions]"
MYSQL_PWD="$DB_PASS" mysql -N -B -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e "SELECT id, company_id, transaction_type, amount, currency, platform_fee, status, created_at FROM stripe_transactions ORDER BY created_at DESC LIMIT 15;" || true

echo "[Latest paid transactions with platform_fee > 0]"
MYSQL_PWD="$DB_PASS" mysql -N -B -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e "SELECT id, company_id, amount, platform_fee, status, created_at FROM stripe_transactions WHERE transaction_type IN ('payment','charge') AND platform_fee > 0 ORDER BY created_at DESC LIMIT 10;" || true

echo "[Companies fee config sample]"
MYSQL_PWD="$DB_PASS" mysql -N -B -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e "SELECT id, company_name, plan_type, stripe_platform_fee_percentage FROM companies ORDER BY id DESC LIMIT 10;"
