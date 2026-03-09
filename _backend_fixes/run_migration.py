import subprocess, sys

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def query(sql):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(input=sql.encode('utf-8'))
    return (out or b'').decode('utf-8', errors='replace'), err.decode('utf-8', errors='replace')

def exec_sql(sql):
    out, err = query(sql)
    if err and 'ERROR' in err.upper():
        print('  FAIL:', err.strip()[:200])
        return False
    print('  OK:', (out or '(no output)').strip()[:200])
    return True

print("=== Checking existing columns ===")
out, _ = query("SHOW COLUMNS FROM jobs LIKE 'counter_%';")
print("counter_* columns in jobs:", out or "(none)")

out, _ = query("SHOW COLUMNS FROM jobs LIKE 'assignment_status';")
print("assignment_status:", out)

out, _ = query("SHOW TABLES LIKE 'job_counter_proposals';")
print("job_counter_proposals table:", out or "(not exists)")

print("\n=== Running migration ===")

MIGRATIONS = [
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS counter_proposed_start DATETIME NULL",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS counter_proposed_end DATETIME NULL",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS counter_proposed_note VARCHAR(500) NULL",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS counter_proposed_at DATETIME NULL",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS counter_proposed_by INT NULL",
    """ALTER TABLE jobs MODIFY COLUMN assignment_status ENUM(
        'none','pending','accepted','declined','negotiating','cancelled'
    ) NOT NULL DEFAULT 'none'""",
    """CREATE TABLE IF NOT EXISTS job_counter_proposals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        proposed_by_company_id INT NOT NULL,
        proposed_by_user_id INT NOT NULL,
        proposed_start DATETIME NOT NULL,
        proposed_end DATETIME NOT NULL,
        note VARCHAR(500) NULL,
        status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME NULL,
        INDEX idx_job_id (job_id),
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )""",
]

all_ok = True
for sql in MIGRATIONS:
    label = sql[:60].replace('\n', ' ')
    print(f"  Running: {label}...")
    if not exec_sql(sql):
        all_ok = False

if all_ok:
    print("\n✅ Migration complete")
else:
    print("\n⚠️ Some steps failed — see errors above")
    sys.exit(1)
