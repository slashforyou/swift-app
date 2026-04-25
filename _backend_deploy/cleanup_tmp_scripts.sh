#!/bin/bash
# Clean up obsolete deploy/inject scripts in /tmp.
# Only removes files older than 1 day to keep current-session work intact.
set -e

cd /tmp

echo "=== BEFORE ==="
COUNT_BEFORE=$(find /tmp -maxdepth 1 -type f \( -name '*.py' -o -name '*.sh' -o -name '*.js' -o -name '*.sql' \) | wc -l)
SIZE_BEFORE=$(du -sh /tmp 2>/dev/null | awk '{print $1}')
echo "Script files: $COUNT_BEFORE"
echo "Total /tmp size: $SIZE_BEFORE"

echo ""
echo "=== Deleting deploy artifacts older than 1 day ==="
find /tmp -maxdepth 1 -type f \( -name '*.py' -o -name '*.sh' -o -name '*.js' -o -name '*.sql' \) -mtime +0 -delete
DELETED=$((COUNT_BEFORE - $(find /tmp -maxdepth 1 -type f \( -name '*.py' -o -name '*.sh' -o -name '*.js' -o -name '*.sql' \) | wc -l)))
echo "Deleted: $DELETED files"

echo ""
echo "=== AFTER ==="
COUNT_AFTER=$(find /tmp -maxdepth 1 -type f \( -name '*.py' -o -name '*.sh' -o -name '*.js' -o -name '*.sql' \) | wc -l)
SIZE_AFTER=$(du -sh /tmp 2>/dev/null | awk '{print $1}')
echo "Script files remaining: $COUNT_AFTER"
echo "Total /tmp size: $SIZE_AFTER"

echo ""
echo "=== Remaining (today's session) ==="
ls -la /tmp/*.py /tmp/*.sh /tmp/*.js /tmp/*.sql 2>/dev/null || echo "(none)"
