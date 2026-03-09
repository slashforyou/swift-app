"""Verify the new JOIN works and ensure transfer has test data for job 33"""
import subprocess

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def sql(query):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(query.encode())
    return out.decode(), err.decode()

# Check current state
out, err = sql("SELECT id, job_id, status, requested_drivers, requested_offsiders, pricing_amount, message FROM job_transfers WHERE job_id = 33;")
print("Current transfer record:")
print(out or err)

# Update with meaningful test values if fields are null
out2, err2 = sql("""
UPDATE job_transfers
SET requested_drivers = 1,
    requested_offsiders = 1,
    pricing_amount = 450.00,
    message = 'Demenagement 3 pieces, presence obligatoire a 8h. Acces difficile (4eme etage sans ascenseur).'
WHERE job_id = 33 AND status = 'pending'
  AND (requested_drivers IS NULL OR requested_drivers = 0);
""")
print("Update (if needed):", err2.strip() if err2.strip() else "OK")

# Verify final JOIN
out3, err3 = sql("""
SELECT j.id, j.assignment_status,
       jtrans.requested_drivers, jtrans.requested_offsiders,
       jtrans.pricing_amount, jtrans.message
FROM jobs j
LEFT JOIN job_transfers jtrans ON jtrans.job_id = j.id
  AND jtrans.status IN ('pending','accepted','negotiating')
WHERE j.id = 33;
""")
print("\nFinal JOIN result:")
print(out3 or err3)
