#!/usr/bin/env python3
"""
migrate_plans_commission.py
────────────────────────────────
Migration MVP — Plans & système de commission

1. Ensure companies.plan_type has a NOT NULL DEFAULT 'free'
2. Create the `plans` reference table with commission rates
3. Create the `job_commissions` table to persist per-job commission

Run on server:
  python3 /srv/www/htdocs/swiftapp/server/_deploy/migrate_plans_commission.py
"""
import subprocess, sys, os

# Load credentials from server .env
def load_env(path):
    vals = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    vals[k.strip()] = v.strip()
    except Exception:
        pass
    return vals

ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
env = load_env(ENV_FILE)

SOCKET = env.get('DB_SOCKET', '/run/mysql/mysql.sock')
DB     = env.get('DB_DATABASE', 'swiftapp')
USER   = env.get('DB_USER', 'root')
PASS   = env.get('DB_PASS', '')

def run_sql(sql: str, description: str):
    cmd = ["mysql", "--socket=" + SOCKET, "-u", USER, "-p" + PASS, DB, "-e", sql]
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    result.stdout = result.stdout.decode("utf-8", errors="replace")
    result.stderr = result.stderr.decode("utf-8", errors="replace")
    if result.returncode != 0:
        print(f"   ✗ {description}: {result.stderr.strip()}")
    else:
        print(f"   ✓ {description}")
    return result.returncode == 0

print("=== migrate_plans_commission ===")

# ── 1. Ensure companies.plan_type column exists with default 'free' ───────────
run_sql(
    """
    ALTER TABLE companies
      MODIFY COLUMN plan_type VARCHAR(32) NOT NULL DEFAULT 'free';
    """,
    "companies.plan_type: set NOT NULL DEFAULT 'free'"
)

# Backfill any NULL plan_type
run_sql(
    "UPDATE companies SET plan_type = 'free' WHERE plan_type IS NULL OR plan_type = '';",
    "backfill NULL plan_type → 'free'"
)

# ── 2. Create plans reference table ──────────────────────────────────────────
run_sql(
    """
    CREATE TABLE IF NOT EXISTS plans (
      id              VARCHAR(32)    NOT NULL PRIMARY KEY,
      label           VARCHAR(64)    NOT NULL,
      commission_rate DECIMAL(5,4)   NOT NULL DEFAULT 0.0300 COMMENT 'e.g. 0.0300 = 3%',
      min_fee_aud     DECIMAL(10,2)  NOT NULL DEFAULT 0.50 COMMENT 'minimum fee AUD',
      is_public       TINYINT(1)     NOT NULL DEFAULT 0 COMMENT '1 = visible in onboarding',
      created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
    "CREATE TABLE plans"
)

# Seed plan rows (INSERT IGNORE to be idempotent)
run_sql(
    """
    INSERT IGNORE INTO plans (id, label, commission_rate, min_fee_aud, is_public) VALUES
      ('free',       'Gratuit',    0.0300, 0.50, 1),
      ('pro',        'Pro',        0.0150, 0.25, 0),
      ('enterprise', 'Enterprise', 0.0050, 0.00, 0);
    """,
    "seed plans table"
)

# ── 3. Create job_commissions table ──────────────────────────────────────────
run_sql(
    """
    CREATE TABLE IF NOT EXISTS job_commissions (
      id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
      job_id              INT UNSIGNED    NOT NULL,
      payment_intent_id   VARCHAR(255)    NULL     COMMENT 'Stripe PaymentIntent ID',
      company_id          INT UNSIGNED    NOT NULL,
      plan_type           VARCHAR(32)     NOT NULL DEFAULT 'free',
      job_amount_aud      DECIMAL(10,2)   NOT NULL COMMENT 'job total billed (AUD)',
      commission_rate     DECIMAL(5,4)    NOT NULL,
      commission_amount   DECIMAL(10,2)   NOT NULL COMMENT 'fee collected (AUD)',
      status              ENUM('pending','collected','refunded') NOT NULL DEFAULT 'pending',
      created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_job_id    (job_id),
      INDEX idx_company   (company_id),
      INDEX idx_pi        (payment_intent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
    "CREATE TABLE job_commissions"
)

print("\nDone. Next step: run patch_payment_commission.py to update the payment endpoint.")
