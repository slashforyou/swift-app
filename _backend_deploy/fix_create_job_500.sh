#!/bin/bash
set -e
DB_USER="swiftapp_user"
DB_PASS="U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME="swiftapp"
MYSQL="mysql -hlocalhost -u${DB_USER} -p${DB_PASS} ${DB_NAME}"
SERVER="/srv/www/htdocs/swiftapp/server"
CREATE_JOB="${SERVER}/endPoints/v1/createJob.js"
LOGGER_DST="${SERVER}/utils/jobActionLogger.js"
LOGGER_SRC="${SERVER}/_deploy/utils/jobActionLogger.js"

echo "=== [1/4] Logger file ==="
if [ -f "$LOGGER_SRC" ]; then
  cp -v "$LOGGER_SRC" "$LOGGER_DST"
  echo "  OK copied to $LOGGER_DST"
else
  echo "  ERROR: source not found: $LOGGER_SRC"
  exit 1
fi

echo ""
echo "=== [2/4] Create job_actions table ==="
$MYSQL <<'EOSQL'
CREATE TABLE IF NOT EXISTS job_actions (
  id                      INT(11)       NOT NULL AUTO_INCREMENT,
  job_id                  INT(11)       NOT NULL,
  action_type             VARCHAR(80)   NOT NULL,
  actor_role              VARCHAR(40)   NULL,
  permission_level        VARCHAR(40)   NULL,
  old_status              VARCHAR(80)   NULL,
  new_status              VARCHAR(80)   NULL,
  metadata                JSON          NULL,
  performed_by_user_id    INT(11)       NULL,
  performed_by_company_id INT(11)       NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ja_job        (job_id),
  KEY idx_ja_type       (action_type),
  KEY idx_ja_user       (performed_by_user_id),
  KEY idx_ja_company    (performed_by_company_id),
  KEY idx_ja_created    (created_at),
  CONSTRAINT fk_ja_job  FOREIGN KEY (job_id)
    REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOSQL
echo "  OK table job_actions created (or already exists)"

echo ""
echo "=== [3/4] Check createJob.js has require ==="
if grep -q "jobActionLogger" "$CREATE_JOB"; then
  echo "  OK createJob.js already has jobActionLogger require"
else
  echo "  MISSING — adding require..."
  cp "$CREATE_JOB" "${CREATE_JOB}.bak_$(date +%Y%m%d_%H%M%S)"
  # Add require after the first require line
  sed -i "0,/^const.*require/s||const { logJobAction } = require('../../utils/jobActionLogger');\n&|" "$CREATE_JOB"
  if grep -q "jobActionLogger" "$CREATE_JOB"; then
    echo "  OK require added"
  else
    echo "  ERROR: failed to add require — check createJob.js manually"
  fi
fi

echo ""
echo "=== [4/4] Restart PM2 ==="
pm2 restart swiftapp
pm2 logs swiftapp --lines 5 --nostream --no-color 2>/dev/null || true

echo ""
echo "=== DONE ==="
