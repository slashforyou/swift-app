import subprocess

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def query(sql):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(input=sql.encode('utf-8'))
    return (out or b'ERROR: ' + err).decode('utf-8', errors='replace')

print("=== Jobs around March 13 / recently created ===")
print(query(
    "SELECT id, code, assignment_status, contractor_company_id, contractee_company_id, "
    "DATE(start_window_start) as job_date, created_at "
    "FROM jobs WHERE DATE(start_window_start) >= '2026-03-10' OR created_at > '2026-03-01' "
    "ORDER BY created_at DESC LIMIT 15;"
))

print("=== All job_transfers ===")
print(query(
    "SELECT jt.id, jt.job_id, jt.status, jt.sender_company_id, jt.recipient_company_id, "
    "jt.created_at, j.code, j.assignment_status "
    "FROM job_transfers jt JOIN jobs j ON j.id = jt.job_id "
    "ORDER BY jt.created_at DESC LIMIT 10;"
))

print("=== Companies ===")
print(query("SELECT id, name, company_code FROM companies ORDER BY id LIMIT 10;"))
