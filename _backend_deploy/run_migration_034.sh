#!/bin/bash
set -e
export MYSQL_PWD='U%Xgxvc54EKUD39PcwNAYvuS'
SOCK=/run/mysql/mysql.sock
DB=swiftapp
USR=swiftapp_user

echo "=== Existing phone columns ==="
mysql -u "$USR" --socket="$SOCK" "$DB" -e "DESC users;" 2>&1 | grep -i phone || echo "(none)"

echo "=== Applying migration 034 ==="
mysql -u "$USR" --socket="$SOCK" "$DB" < /tmp/034_add_users_phone_digits.sql

echo "=== After migration ==="
mysql -u "$USR" --socket="$SOCK" "$DB" -e "DESC users;" 2>&1 | grep -i phone || echo "(none)"

echo "=== Index ==="
mysql -u "$USR" --socket="$SOCK" "$DB" -e "SHOW INDEX FROM users WHERE Key_name='idx_users_phone_digits';"

echo "=== Sample backfill check ==="
mysql -u "$USR" --socket="$SOCK" "$DB" -e "SELECT COUNT(*) AS total, COUNT(phone) AS with_phone, COUNT(phone_digits) AS with_digits FROM users;"

echo "=== DONE ==="
