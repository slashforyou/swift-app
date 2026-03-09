#!/usr/bin/env python3
"""
fix_contractor_calendar.py
==========================
Two targeted patches on the Swift App backend server:

1. endPoints/v1/jobs/transfers.js
   → Lorsqu'un transfer est CRÉÉ, mettre à jour contractor_company_id = recipient_company_id
     et assignment_status = 'pending' sur le job, pour qu'il apparaisse immédiatement
     dans le calendrier du prestataire.

2. endPoints/calendarDays.js
   → Ajouter j.assignment_status, j.contractee_company_id, j.contractor_company_id
     aux SELECTs JOUR et MOIS des managers, pour que le frontend puisse ouvrir
     le ContractorJobWizardModal avec le bon état.

Usage (on the server):
    python3 fix_contractor_calendar.py
"""
import os, re, sys, shutil
from datetime import datetime

SERVER_ROOT = "/srv/www/htdocs/swiftapp/server"
TRANSFERS_FILE = os.path.join(SERVER_ROOT, "endPoints/v1/jobs/transfers.js")
CALENDAR_FILE  = os.path.join(SERVER_ROOT, "endPoints/calendarDays.js")

def backup(path):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = f"{path}.bak_{ts}"
    shutil.copy2(path, bak)
    print(f"  Backup: {bak}")

def patch_transfers():
    print("\n=== Patching transfers.js ===")
    with open(TRANSFERS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Check already patched
    if "// [PATCH] Set contractor_company_id on job at transfer creation" in content:
        print("  Already patched, skipping.")
        return

    # We insert BEFORE the final SELECT that fetches the created transfer.
    # The anchor is the SELECT jt.* just after the INSERT.
    ANCHOR = "    const [transfer] = await connection.execute(\n      `SELECT jt.*,"
    if ANCHOR not in content:
        print(f"  ERROR: anchor not found in {TRANSFERS_FILE}")
        print("  Looking for alternative anchor...")
        # Try simpler anchor
        ALT = "const [transfer] = await connection.execute("
        if ALT not in content:
            print(f"  ERROR: no anchor found, aborting transfers patch.")
            return
        # split on first occurrence
        idx = content.index(ALT)
        insertion = """    // [PATCH] Set contractor_company_id on job at transfer creation
    // so the job appears immediately in the contractor's calendar (pending state)
    if (recipient_company_id) {
      await connection.execute(
        `UPDATE jobs SET contractor_company_id = ?, assignment_status = 'pending'
         WHERE id = ? AND (contractor_company_id IS NULL OR contractor_company_id = ?)`,
        [recipient_company_id, jobId, senderCompanyId]
      );
      console.log('[PATCH] Set contractor_company_id =', recipient_company_id, 'on job', jobId);
    }

    """
        content = content[:idx] + insertion + content[idx:]
    else:
        idx = content.index(ANCHOR)
        insertion = """    // [PATCH] Set contractor_company_id on job at transfer creation
    // so the job appears immediately in the contractor's calendar (pending state)
    if (recipient_company_id) {
      await connection.execute(
        `UPDATE jobs SET contractor_company_id = ?, assignment_status = 'pending'
         WHERE id = ? AND (contractor_company_id IS NULL OR contractor_company_id = ?)`,
        [recipient_company_id, jobId, senderCompanyId]
      );
      console.log('[PATCH] Set contractor_company_id =', recipient_company_id, 'on job', jobId);
    }

    """
        content = content[:idx] + insertion + content[idx:]

    backup(TRANSFERS_FILE)
    with open(TRANSFERS_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print("  OK — contractor_company_id will now be set at transfer creation.")


def patch_calendar_days():
    print("\n=== Patching calendarDays.js ===")
    with open(CALENDAR_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    if "// [PATCH] contractor_calendar" in content:
        print("  Already patched, skipping.")
        return

    patched = 0

    # ── JOUR level: manager query (contains amount_total, payment_status) ──────
    # We add the extra fields after j.payment_status
    OLD_JOUR = "                           j.amount_total, j.payment_status,"
    NEW_JOUR = """                           j.amount_total, j.payment_status,
                           j.assignment_status, j.contractee_company_id, j.contractor_company_id, -- [PATCH] contractor_calendar"""

    if OLD_JOUR in content:
        content = content.replace(OLD_JOUR, NEW_JOUR, 1)  # only first occurrence = JOUR manager
        patched += 1
        print("  OK — JOUR manager SELECT patched.")
    else:
        print("  WARN: JOUR anchor not found (j.amount_total, j.payment_status)")

    # ── MOIS level: manager query (contains contact info but not amount_total) ──
    # Find the MOIS manager SELECT — it has j.contact_phone, j.created_at but NOT j.amount_total
    # Pattern: "j.contact_phone, j.created_at\n                    FROM jobs j\n                    WHERE j.contractor_company_id"
    MOIS_ANCHOR = "j.contact_phone, j.created_at\n                    FROM jobs j\n                    WHERE j.contractor_company_id = ?"
    MOIS_REPLACE = """j.contact_phone, j.created_at,
                           j.assignment_status, j.contractor_company_id -- [PATCH] contractor_calendar
                    FROM jobs j
                    WHERE j.contractor_company_id = ?"""

    if MOIS_ANCHOR in content:
        content = content.replace(MOIS_ANCHOR, MOIS_REPLACE, 1)
        patched += 1
        print("  OK — MOIS manager SELECT patched.")
    else:
        print("  WARN: MOIS anchor not found")

    if patched == 0:
        print("  ERROR: No anchors found, calendarDays.js NOT patched.")
        return

    backup(CALENDAR_FILE)
    with open(CALENDAR_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  OK — {patched} queries patched in calendarDays.js")


def check_existing_jobs():
    """Show last 5 jobs with contractor info for debugging."""
    print("\n=== Checking DB: last 5 jobs with contractor_company_id ===")
    env_path = os.path.join(SERVER_ROOT, ".env")
    if not os.path.exists(env_path):
        print("  .env not found, skipping DB check.")
        return

    # Read .env for DB credentials
    db_creds = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                db_creds[k.strip()] = v.strip().strip('"').strip("'")

    db_host = db_creds.get("DB_HOST", "127.0.0.1")
    db_user = db_creds.get("DB_USER", db_creds.get("DB_USERNAME", ""))
    db_pass = db_creds.get("DB_PASSWORD", db_creds.get("DB_PASS", ""))
    db_name = db_creds.get("DB_NAME", db_creds.get("DB_DATABASE", ""))

    if not db_user:
        print("  DB credentials not found in .env, skipping.")
        return

    try:
        import subprocess
        cmd = (
            f'mysql -h{db_host} -u{db_user} -p{db_pass} {db_name} -e '
            f'"SELECT id, code, assignment_status, contractor_company_id, contractee_company_id '
            f'FROM jobs ORDER BY created_at DESC LIMIT 5\\G"'
        )
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(result.stdout)
        else:
            print("  mysql error:", result.stderr[:200])
    except Exception as e:
        print(f"  DB check error: {e}")


if __name__ == "__main__":
    print("Swift App — Contractor Calendar Fix")
    print(f"Server root: {SERVER_ROOT}")

    for f in [TRANSFERS_FILE, CALENDAR_FILE]:
        if not os.path.exists(f):
            print(f"ERROR: File not found: {f}")
            sys.exit(1)

    patch_transfers()
    patch_calendar_days()
    check_existing_jobs()

    print("\n✅ Done. Restart PM2 to apply: pm2 restart all")
