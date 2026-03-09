import subprocess, sys

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def query(sql):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(input=sql.encode('utf-8'))
    return (out or b'').decode('utf-8', errors='replace'), err.decode('utf-8', errors='replace')

def exec_sql(sql, label=""):
    out, err = query(sql)
    if 'ERROR' in err.upper():
        print(f"  FAIL [{label}]:", err.strip()[:200])
        return False
    print(f"  OK [{label}]:", (out or '(done)').strip()[:100])
    return True

JOB_ID         = 33
SENDER_COMPANY = 2   # Test Frontend (contractee / owner)
RECIPIENT_CO   = 1   # Nerd-Test (contractor / prestataire)
SENDER_USER    = 15  # Romain Giovanni

print("=== Creating transfer for job 33 → Nerd-Test ===")

# Guard: check no pending transfer already exists
out, _ = query(f"SELECT id FROM job_transfers WHERE job_id = {JOB_ID} AND status = 'pending';")
if out.strip() and 'id' not in out.lower():
    # there's a row
    pass
lines = [l for l in out.strip().splitlines() if l and 'id' not in l.lower()]
if lines:
    print(f"  Already has a pending transfer (id={lines[0].strip()}), updating it instead.")
    transfer_id = lines[0].strip()
    exec_sql(
        f"UPDATE job_transfers SET recipient_company_id = {RECIPIENT_CO} WHERE id = {transfer_id};",
        "update transfer"
    )
else:
    exec_sql(
        f"""INSERT INTO job_transfers
            (job_id, sender_company_id, recipient_type, recipient_company_id,
             delegated_role, pricing_type, pricing_amount, created_by_user_id,
             requested_drivers, requested_offsiders, status)
            VALUES ({JOB_ID}, {SENDER_COMPANY}, 'company', {RECIPIENT_CO},
                    'full_job', 'flat', 250.00, {SENDER_USER},
                    1, 0, 'pending');""",
        "insert transfer"
    )

# Update job: contractor_company_id + assignment_status = pending
exec_sql(
    f"UPDATE jobs SET contractor_company_id = {RECIPIENT_CO}, assignment_status = 'pending' WHERE id = {JOB_ID};",
    "set contractor_company_id"
)

# Confirm
print("\n=== Verification ===")
out, _ = query(
    f"SELECT j.id, j.code, j.assignment_status, j.contractor_company_id, "
    f"jt.id as transfer_id, jt.status as transfer_status, jt.recipient_company_id "
    f"FROM jobs j LEFT JOIN job_transfers jt ON jt.job_id = j.id WHERE j.id = {JOB_ID};"
)
print(out)
print("✅ Done — job 33 should now appear in Nerd-Test calendar on March 13.")
